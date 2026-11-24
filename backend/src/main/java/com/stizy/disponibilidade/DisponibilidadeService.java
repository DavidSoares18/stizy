package com.stizy.disponibilidade;

import com.stizy.agendamento.Agendamento;
import com.stizy.agendamento.AgendamentoRepository;
import com.stizy.bloqueio.BloqueioRepository;
import com.stizy.disponibilidade.CalculadoraDisponibilidade.Faixa;
import com.stizy.disponibilidade.CalculadoraDisponibilidade.Horario;
import com.stizy.disponibilidade.CalculadoraDisponibilidade.Intervalo;
import com.stizy.horario.HorarioFuncionamentoRepository;
import com.stizy.negocio.Negocio;
import com.stizy.negocio.NegocioService;
import com.stizy.servico.Servico;
import com.stizy.servico.ServicoRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * STZ-18 / STZ-19: horários livres por data e serviço, e revalidação na hora de reservar (STZ-23).
 * A API cruza a grade e os bloqueios; a sobreposição entre agendamentos o banco também garante (V4).
 */
@Service
public class DisponibilidadeService {

    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    private final NegocioService negocioService;
    private final ServicoRepository servicoRepository;
    private final HorarioFuncionamentoRepository horarioRepository;
    private final BloqueioRepository bloqueioRepository;
    private final AgendamentoRepository agendamentoRepository;
    private final ZoneId fuso;
    private final Clock relogio;
    private final int passoMinutos;
    private final int antecedenciaMinutos;
    private final int diasMaximos;

    public DisponibilidadeService(NegocioService negocioService,
                                  ServicoRepository servicoRepository,
                                  HorarioFuncionamentoRepository horarioRepository,
                                  BloqueioRepository bloqueioRepository,
                                  AgendamentoRepository agendamentoRepository,
                                  ZoneId fusoDoNegocio,
                                  Clock relogio,
                                  @Value("${stizy.agenda.intervalo-minutos:30}") int passoMinutos,
                                  @Value("${stizy.agenda.antecedencia-minima-minutos:0}") int antecedenciaMinutos,
                                  @Value("${stizy.agenda.dias-maximos:90}") int diasMaximos) {
        this.negocioService = negocioService;
        this.servicoRepository = servicoRepository;
        this.horarioRepository = horarioRepository;
        this.bloqueioRepository = bloqueioRepository;
        this.agendamentoRepository = agendamentoRepository;
        this.fuso = fusoDoNegocio;
        this.relogio = relogio;
        this.passoMinutos = passoMinutos;
        this.antecedenciaMinutos = antecedenciaMinutos;
        this.diasMaximos = diasMaximos;
    }

    /** GET /api/negocios/{id}/horarios?data=AAAA-MM-DD&servicoId=... */
    @Transactional(readOnly = true)
    public List<HorarioDisponivelResponse> horarios(UUID negocioId, LocalDate data, UUID servicoId) {
        Negocio negocio = negocioService.obter(negocioId);
        UUID profissionalId = negocio.getProfissional().getId();
        Servico servico = servicoRepository.findByIdAndProfissional_Id(servicoId, profissionalId)
                .filter(Servico::isAtivo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado"));

        LocalDate hoje = LocalDate.now(relogio.withZone(fuso));
        if (data.isAfter(hoje.plusDays(diasMaximos))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Só é possível consultar até " + diasMaximos + " dias à frente");
        }
        return calcularDia(profissionalId, data, servico.getDuracaoMinutos(), passoMinutos).stream()
                .map(h -> new HorarioDisponivelResponse(h.hora().format(HH_MM), h.inicio(), h.fim(), h.livre(),
                        h.situacao().name().toLowerCase(Locale.ROOT)))
                .toList();
    }

    /** Também usado pela agenda do profissional (com duração = passo, um bloco por linha). */
    @Transactional(readOnly = true)
    public List<Horario> calcularDia(UUID profissionalId, LocalDate data, int duracaoMinutos, int passo) {
        Instant inicioDia = data.atStartOfDay(fuso).toInstant();
        Instant fimDia = data.plusDays(1).atStartOfDay(fuso).toInstant();
        List<Intervalo> ocupados = agendamentoRepository.ativosNoPeriodo(profissionalId, inicioDia, fimDia).stream()
                .map(a -> new Intervalo(a.getInicio(), a.getFim()))
                .toList();
        List<Intervalo> bloqueios = bloqueioRepository.noPeriodo(profissionalId, inicioDia, fimDia).stream()
                .map(b -> new Intervalo(b.getInicio(), b.getFim()))
                .toList();
        return CalculadoraDisponibilidade.calcular(data, fuso, faixasDoDia(profissionalId, data),
                duracaoMinutos, passo, ocupados, bloqueios, inicioMinimo());
    }

    /**
     * STZ-23 / STZ-29: revalida no servidor antes de gravar uma reserva ou remarcação.
     * Deve ser chamado com a linha do profissional travada (UsuarioRepository.buscarParaReserva).
     *
     * @param ignorar agendamento que está sendo remarcado (não conta como conflito consigo mesmo), ou null
     */
    public void validarReserva(UUID profissionalId, Instant inicio, int duracaoMinutos, Agendamento ignorar) {
        Instant fim = inicio.plusSeconds(duracaoMinutos * 60L);
        if (inicio.isBefore(inicioMinimo())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escolha um horário no futuro");
        }
        LocalDate data = inicio.atZone(fuso).toLocalDate();
        if (data.isAfter(LocalDate.now(relogio.withZone(fuso)).plusDays(diasMaximos))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Só é possível agendar até " + diasMaximos + " dias à frente");
        }
        if (!CalculadoraDisponibilidade.cabeNaGrade(inicio, duracaoMinutos, fuso, faixasDoDia(profissionalId, data))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Horário fora do funcionamento do profissional");
        }
        if (!bloqueioRepository.noPeriodo(profissionalId, inicio, fim).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Profissional indisponível nesse horário");
        }
        UUID ignorarId = ignorar != null ? ignorar.getId() : new UUID(0L, 0L);
        if (agendamentoRepository.existeConflito(profissionalId, inicio, fim, ignorarId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Horário indisponível");
        }
    }

    private List<Faixa> faixasDoDia(UUID profissionalId, LocalDate data) {
        return horarioRepository
                .findAllByProfissional_IdAndDiaSemanaOrderByHoraInicioAsc(profissionalId, data.getDayOfWeek().getValue())
                .stream()
                .map(h -> new Faixa(h.getHoraInicio(), h.getHoraFim()))
                .toList();
    }

    private Instant inicioMinimo() {
        return Instant.now(relogio).plus(antecedenciaMinutos, ChronoUnit.MINUTES);
    }
}
