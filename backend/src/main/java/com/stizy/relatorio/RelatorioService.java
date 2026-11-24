package com.stizy.relatorio;

import com.stizy.agendamento.Agendamento;
import com.stizy.agendamento.AgendamentoRepository;
import com.stizy.agendamento.StatusAgendamento;
import com.stizy.usuario.UsuarioService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** EXTRA-05: relatório de atendimentos e faturamento do profissional logado. */
@Service
public class RelatorioService {

    private final AgendamentoRepository agendamentoRepository;
    private final UsuarioService usuarioService;
    private final ZoneId fuso;

    public RelatorioService(AgendamentoRepository agendamentoRepository, UsuarioService usuarioService,
                            ZoneId fusoDoNegocio) {
        this.agendamentoRepository = agendamentoRepository;
        this.usuarioService = usuarioService;
        this.fuso = fusoDoNegocio;
    }

    @Transactional(readOnly = true)
    public RelatorioResponse gerar(UUID usuarioId, LocalDate inicio, LocalDate fim) {
        usuarioService.obterProfissional(usuarioId);
        if (fim.isBefore(inicio)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Data final antes da inicial");
        }
        if (ChronoUnit.DAYS.between(inicio, fim) > 366) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Período máximo de 1 ano");
        }
        List<Agendamento> todos = agendamentoRepository.doProfissionalNoPeriodo(usuarioId,
                inicio.atStartOfDay(fuso).toInstant(), fim.plusDays(1).atStartOfDay(fuso).toInstant());

        List<Agendamento> concluidos = comStatus(todos, StatusAgendamento.CONCLUIDO);
        long faltas = comStatus(todos, StatusAgendamento.FALTOU).size();
        BigDecimal faturamento = soma(concluidos);
        BigDecimal ticketMedio = concluidos.isEmpty() ? BigDecimal.ZERO
                : faturamento.divide(BigDecimal.valueOf(concluidos.size()), 2, RoundingMode.HALF_UP);
        long compareceramOuFaltaram = concluidos.size() + faltas;
        BigDecimal taxaComparecimento = compareceramOuFaltaram == 0 ? null
                : BigDecimal.valueOf(concluidos.size() * 100L)
                        .divide(BigDecimal.valueOf(compareceramOuFaltaram), 1, RoundingMode.HALF_UP);

        List<RelatorioResponse.PorServico> porServico = concluidos.stream()
                .collect(Collectors.groupingBy(a -> a.getServico().getId()))
                .values().stream()
                .map(lista -> new RelatorioResponse.PorServico(lista.getFirst().getServico().getId(),
                        lista.getFirst().getServico().getNome(), lista.size(), soma(lista)))
                .sorted(Comparator.comparing(RelatorioResponse.PorServico::faturamento).reversed())
                .toList();

        Map<LocalDate, List<Agendamento>> concluidosPorDia = concluidos.stream()
                .collect(Collectors.groupingBy(a -> a.getInicio().atZone(fuso).toLocalDate(), TreeMap::new,
                        Collectors.toList()));
        List<RelatorioResponse.PorDia> porDia = concluidosPorDia.entrySet().stream()
                .map(e -> new RelatorioResponse.PorDia(e.getKey(), e.getValue().size(), soma(e.getValue())))
                .toList();

        return new RelatorioResponse(inicio, fim, todos.size(),
                comStatus(todos, StatusAgendamento.CONFIRMADO).size(),
                concluidos.size(),
                comStatus(todos, StatusAgendamento.CANCELADO).size(),
                faltas,
                faturamento,
                soma(comStatus(todos, StatusAgendamento.CONFIRMADO)),
                ticketMedio,
                taxaComparecimento,
                porServico,
                porDia);
    }

    private static List<Agendamento> comStatus(List<Agendamento> agendamentos, StatusAgendamento status) {
        return agendamentos.stream().filter(a -> a.getStatus() == status).toList();
    }

    private static BigDecimal soma(List<Agendamento> agendamentos) {
        return agendamentos.stream().map(Agendamento::getPreco).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
