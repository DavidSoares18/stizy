package com.stizy.agenda;

import com.stizy.agendamento.AgendamentoMapper;
import com.stizy.agendamento.AgendamentoRepository;
import com.stizy.agendamento.AgendamentoResponse;
import com.stizy.disponibilidade.CalculadoraDisponibilidade.Horario;
import com.stizy.disponibilidade.DisponibilidadeService;
import com.stizy.usuario.UsuarioService;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** STZ-26: agenda diária e semanal do profissional logado. */
@Service
public class AgendaService {

    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");
    private static final Locale PT_BR = Locale.of("pt", "BR");

    private final AgendamentoRepository agendamentoRepository;
    private final AgendamentoMapper mapper;
    private final DisponibilidadeService disponibilidadeService;
    private final UsuarioService usuarioService;
    private final ZoneId fuso;
    private final Clock relogio;
    private final int passoMinutos;

    public AgendaService(AgendamentoRepository agendamentoRepository,
                         AgendamentoMapper mapper,
                         DisponibilidadeService disponibilidadeService,
                         UsuarioService usuarioService,
                         ZoneId fusoDoNegocio,
                         Clock relogio,
                         @Value("${stizy.agenda.intervalo-minutos:30}") int passoMinutos) {
        this.agendamentoRepository = agendamentoRepository;
        this.mapper = mapper;
        this.disponibilidadeService = disponibilidadeService;
        this.usuarioService = usuarioService;
        this.fuso = fusoDoNegocio;
        this.relogio = relogio;
        this.passoMinutos = passoMinutos;
    }

    @Transactional(readOnly = true)
    public AgendaDiaResponse dia(UUID usuarioId, LocalDate data) {
        usuarioService.obterProfissional(usuarioId);
        List<AgendamentoResponse> agendamentos = doPeriodo(usuarioId, data, data.plusDays(1));
        List<AgendamentoResponse> ativos = agendamentos.stream().filter(AgendaService::ocupaHorario).toList();

        List<AgendaDiaResponse.Linha> linhas = new ArrayList<>();
        for (Horario bloco : disponibilidadeService.calcularDia(usuarioId, data, passoMinutos, passoMinutos)) {
            AgendamentoResponse dono = ativos.stream()
                    .filter(a -> a.inicioUtc().isBefore(bloco.fim()) && a.fimUtc().isAfter(bloco.inicio()))
                    .findFirst()
                    .orElse(null);
            linhas.add(new AgendaDiaResponse.Linha(
                    bloco.hora().format(HH_MM),
                    bloco.inicio(),
                    bloco.livre(),
                    bloco.situacao().name().toLowerCase(Locale.ROOT),
                    dono != null ? dono.id() : null,
                    dono != null ? dono.clienteNome() : null,
                    dono != null ? dono.titulo() : null,
                    dono != null ? dono.pagamento() : null,
                    dono != null ? dono.valor() : null));
        }

        Instant agora = Instant.now(relogio);
        AgendamentoResponse proximo = ativos.stream()
                .filter(a -> "confirmado".equals(a.status()) && a.inicioUtc().isAfter(agora))
                .findFirst()
                .orElse(null);
        long livres = linhas.stream().filter(AgendaDiaResponse.Linha::livre).count();
        return new AgendaDiaResponse(data, new AgendaDiaResponse.Resumo(ativos.size(), livres, soma(ativos)),
                proximo, linhas, agendamentos);
    }

    @Transactional(readOnly = true)
    public AgendaSemanaResponse semana(UUID usuarioId, LocalDate qualquerDiaDaSemana) {
        usuarioService.obterProfissional(usuarioId);
        LocalDate segunda = qualquerDiaDaSemana.with(DayOfWeek.MONDAY);
        LocalDate domingo = segunda.plusDays(6);
        List<AgendamentoResponse> semana = doPeriodo(usuarioId, segunda, domingo.plusDays(1));

        List<AgendaSemanaResponse.Dia> dias = new ArrayList<>();
        for (LocalDate d = segunda; !d.isAfter(domingo); d = d.plusDays(1)) {
            LocalDate dia = d;
            List<AgendamentoResponse> doDia = semana.stream()
                    .filter(a -> a.inicioUtc().atZone(fuso).toLocalDate().equals(dia))
                    .toList();
            List<AgendamentoResponse> ativos = doDia.stream().filter(AgendaService::ocupaHorario).toList();
            dias.add(new AgendaSemanaResponse.Dia(dia, dia.getDayOfWeek().getValue(),
                    dia.getDayOfWeek().getDisplayName(TextStyle.FULL, PT_BR),
                    ativos.size(), soma(ativos), doDia));
        }
        List<AgendamentoResponse> ativosSemana = semana.stream().filter(AgendaService::ocupaHorario).toList();
        return new AgendaSemanaResponse(segunda, domingo, ativosSemana.size(), soma(ativosSemana), dias);
    }

    private List<AgendamentoResponse> doPeriodo(UUID profissionalId, LocalDate inicio, LocalDate fimExclusivo) {
        return mapper.respostas(agendamentoRepository.doProfissionalNoPeriodo(profissionalId,
                inicio.atStartOfDay(fuso).toInstant(), fimExclusivo.atStartOfDay(fuso).toInstant()));
    }

    private static boolean ocupaHorario(AgendamentoResponse a) {
        return !"cancelado".equals(a.status());
    }

    private static BigDecimal soma(List<AgendamentoResponse> agendamentos) {
        return agendamentos.stream().map(AgendamentoResponse::valor).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
