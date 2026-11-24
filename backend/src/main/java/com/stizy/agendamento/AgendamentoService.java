package com.stizy.agendamento;

import com.stizy.disponibilidade.DisponibilidadeService;
import com.stizy.negocio.Negocio;
import com.stizy.negocio.NegocioService;
import com.stizy.servico.Servico;
import com.stizy.servico.ServicoRepository;
import com.stizy.usuario.Usuario;
import com.stizy.usuario.UsuarioRepository;
import com.stizy.usuario.UsuarioService;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * STZ-23: criação e confirmação de reservas. STZ-29: cancelamento e remarcação.
 *
 * Proteção contra reservas simultâneas, em duas camadas:
 * 1. A linha do profissional é travada (SELECT ... FOR UPDATE): reservas do mesmo profissional entram em fila
 *    e a disponibilidade é revalidada já com a fila resolvida (mensagem clara: 409 "Horário indisponível").
 * 2. Se algum caminho escapar, a restrição EXCLUDE da V4 recusa a sobreposição (23P01 -> 409 no ApiExceptionHandler).
 */
@Service
public class AgendamentoService {

    private final AgendamentoRepository agendamentoRepository;
    private final ServicoRepository servicoRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;
    private final NegocioService negocioService;
    private final DisponibilidadeService disponibilidadeService;
    private final AgendamentoMapper mapper;
    private final ZoneId fuso;
    private final Clock relogio;
    private final int antecedenciaCancelamentoMinutos;

    public AgendamentoService(AgendamentoRepository agendamentoRepository,
                              ServicoRepository servicoRepository,
                              UsuarioRepository usuarioRepository,
                              UsuarioService usuarioService,
                              NegocioService negocioService,
                              DisponibilidadeService disponibilidadeService,
                              AgendamentoMapper mapper,
                              ZoneId fusoDoNegocio,
                              Clock relogio,
                              @Value("${stizy.agenda.antecedencia-cancelamento-minutos:0}")
                              int antecedenciaCancelamentoMinutos) {
        this.agendamentoRepository = agendamentoRepository;
        this.servicoRepository = servicoRepository;
        this.usuarioRepository = usuarioRepository;
        this.usuarioService = usuarioService;
        this.negocioService = negocioService;
        this.disponibilidadeService = disponibilidadeService;
        this.mapper = mapper;
        this.fuso = fusoDoNegocio;
        this.relogio = relogio;
        this.antecedenciaCancelamentoMinutos = antecedenciaCancelamentoMinutos;
    }

    // ---------- Cliente (qualquer usuário logado pode agendar; profissional também, com outro profissional) ----------

    @Transactional
    public AgendamentoResponse criar(UUID usuarioId, CriarAgendamentoRequest request) {
        Usuario cliente = usuarioService.obter(usuarioId);
        Negocio negocio = negocioService.obter(request.negocioId());
        UUID profissionalId = negocio.getProfissional().getId();
        if (profissionalId.equals(usuarioId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Você não pode agendar no seu próprio negócio");
        }

        Usuario profissional = usuarioRepository.buscarParaReserva(profissionalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profissional não encontrado"));
        Servico servico = servicoRepository.findByIdAndProfissional_Id(request.servicoId(), profissionalId)
                .filter(Servico::isAtivo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado"));

        Instant inicio = request.inicioUtc().truncatedTo(ChronoUnit.MINUTES);
        disponibilidadeService.validarReserva(profissionalId, inicio, servico.getDuracaoMinutos(), null);

        Agendamento salvo = agendamentoRepository.saveAndFlush(new Agendamento(cliente, profissional, servico, inicio));
        return mapper.resposta(salvo);
    }

    /** EXTRA-03 (lado do cliente): histórico completo dividido em próximos e anteriores. */
    @Transactional(readOnly = true)
    public AgendaClienteResponse listarDoCliente(UUID usuarioId) {
        usuarioService.obter(usuarioId);
        Instant agora = Instant.now(relogio);
        List<AgendamentoResponse> todos = mapper.respostas(agendamentoRepository.doCliente(usuarioId));
        List<AgendamentoResponse> proximos = todos.stream()
                .filter(a -> "confirmado".equals(a.status()) && a.fimUtc().isAfter(agora))
                .sorted(Comparator.comparing(AgendamentoResponse::inicioUtc))
                .toList();
        List<AgendamentoResponse> anteriores = todos.stream().filter(a -> !proximos.contains(a)).toList();
        return new AgendaClienteResponse(proximos, anteriores);
    }

    @Transactional(readOnly = true)
    public AgendamentoResponse buscar(UUID usuarioId, UUID agendamentoId) {
        return mapper.resposta(obterComoParticipante(usuarioId, agendamentoId));
    }

    /** Cliente ou profissional do agendamento. Não apaga: marca CANCELADO e libera o horário. */
    @Transactional
    public AgendamentoResponse cancelar(UUID usuarioId, UUID agendamentoId) {
        Agendamento agendamento = obterComoParticipante(usuarioId, agendamentoId);
        exigirConfirmado(agendamento, "cancelar");
        Instant agora = Instant.now(relogio);
        boolean ehProfissional = agendamento.getProfissional().getId().equals(usuarioId);
        if (!ehProfissional && agendamento.getInicio()
                .isBefore(agora.plus(antecedenciaCancelamentoMinutos, ChronoUnit.MINUTES))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O prazo para cancelar este agendamento já passou");
        }
        Usuario quem = ehProfissional ? agendamento.getProfissional() : agendamento.getCliente();
        agendamento.cancelar(quem, agora);
        agendamentoRepository.flush();
        return mapper.resposta(agendamento);
    }

    /** Muda o horário do mesmo agendamento, revalidando grade, bloqueios e conflitos. */
    @Transactional
    public AgendamentoResponse remarcar(UUID usuarioId, UUID agendamentoId, RemarcarAgendamentoRequest request) {
        Agendamento agendamento = obterComoParticipante(usuarioId, agendamentoId);
        exigirConfirmado(agendamento, "remarcar");
        Instant agora = Instant.now(relogio);
        boolean ehProfissional = agendamento.getProfissional().getId().equals(usuarioId);
        if (!ehProfissional && agendamento.getInicio()
                .isBefore(agora.plus(antecedenciaCancelamentoMinutos, ChronoUnit.MINUTES))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O prazo para remarcar este agendamento já passou");
        }

        UUID profissionalId = agendamento.getProfissional().getId();
        usuarioRepository.buscarParaReserva(profissionalId);
        Instant novoInicio = request.inicioUtc().truncatedTo(ChronoUnit.MINUTES);
        int duracao = (int) Duration.between(agendamento.getInicio(), agendamento.getFim()).toMinutes();
        disponibilidadeService.validarReserva(profissionalId, novoInicio, duracao, agendamento);

        agendamento.remarcar(novoInicio);
        agendamentoRepository.flush();
        return mapper.resposta(agendamento);
    }

    // ---------- Profissional ----------

    @Transactional(readOnly = true)
    public AgendamentoResponse buscarDoProfissional(UUID usuarioId, UUID agendamentoId) {
        return mapper.resposta(obterComoProfissional(usuarioId, agendamentoId));
    }

    /** Lista do profissional por período de datas locais [inicio, fim] (inclusive). */
    @Transactional(readOnly = true)
    public List<AgendamentoResponse> listarDoProfissional(UUID usuarioId, LocalDate inicio, LocalDate fim) {
        usuarioService.obterProfissional(usuarioId);
        if (fim.isBefore(inicio)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Data final antes da inicial");
        }
        if (ChronoUnit.DAYS.between(inicio, fim) > 366) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Período máximo de 1 ano");
        }
        return mapper.respostas(agendamentoRepository.doProfissionalNoPeriodo(usuarioId,
                inicio.atStartOfDay(fuso).toInstant(), fim.plusDays(1).atStartOfDay(fuso).toInstant()));
    }

    @Transactional
    public AgendamentoResponse concluir(UUID usuarioId, UUID agendamentoId) {
        return finalizar(usuarioId, agendamentoId, StatusAgendamento.CONCLUIDO);
    }

    @Transactional
    public AgendamentoResponse registrarFalta(UUID usuarioId, UUID agendamentoId) {
        return finalizar(usuarioId, agendamentoId, StatusAgendamento.FALTOU);
    }

    private AgendamentoResponse finalizar(UUID usuarioId, UUID agendamentoId, StatusAgendamento novoStatus) {
        Agendamento agendamento = obterComoProfissional(usuarioId, agendamentoId);
        exigirConfirmado(agendamento, "finalizar");
        if (agendamento.getInicio().isAfter(Instant.now(relogio))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O atendimento ainda não começou");
        }
        agendamento.finalizar(novoStatus);
        agendamentoRepository.flush();
        return mapper.resposta(agendamento);
    }

    // ---------- Permissões (RNF04): quem não participa recebe 404, sem revelar que o agendamento existe ----------

    private Agendamento obterComoParticipante(UUID usuarioId, UUID agendamentoId) {
        return agendamentoRepository.buscarCompleto(agendamentoId)
                .filter(a -> a.getCliente().getId().equals(usuarioId) || a.getProfissional().getId().equals(usuarioId))
                .orElseThrow(AgendamentoService::naoEncontrado);
    }

    private Agendamento obterComoProfissional(UUID usuarioId, UUID agendamentoId) {
        usuarioService.obterProfissional(usuarioId);
        return agendamentoRepository.buscarCompleto(agendamentoId)
                .filter(a -> a.getProfissional().getId().equals(usuarioId))
                .orElseThrow(AgendamentoService::naoEncontrado);
    }

    private static void exigirConfirmado(Agendamento agendamento, String acao) {
        if (agendamento.getStatus() != StatusAgendamento.CONFIRMADO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, String.format(
                    "Não é possível %s um agendamento com status %s", acao,
                    agendamento.getStatus().name().toLowerCase()));
        }
    }

    private static ResponseStatusException naoEncontrado() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Agendamento não encontrado");
    }
}
