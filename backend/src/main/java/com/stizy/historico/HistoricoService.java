package com.stizy.historico;

import com.stizy.agendamento.Agendamento;
import com.stizy.agendamento.AgendamentoMapper;
import com.stizy.agendamento.AgendamentoRepository;
import com.stizy.agendamento.StatusAgendamento;
import com.stizy.usuario.Usuario;
import com.stizy.usuario.UsuarioService;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * EXTRA-03: histórico de atendimentos por cliente, visto pelo profissional.
 * O profissional só vê clientes que já agendaram com ele.
 */
@Service
public class HistoricoService {

    private final AgendamentoRepository agendamentoRepository;
    private final AgendamentoMapper mapper;
    private final UsuarioService usuarioService;
    private final Clock relogio;

    public HistoricoService(AgendamentoRepository agendamentoRepository, AgendamentoMapper mapper,
                            UsuarioService usuarioService, Clock relogio) {
        this.agendamentoRepository = agendamentoRepository;
        this.mapper = mapper;
        this.usuarioService = usuarioService;
        this.relogio = relogio;
    }

    @Transactional(readOnly = true)
    public List<ClienteResumoResponse> clientes(UUID usuarioId) {
        usuarioService.obterProfissional(usuarioId);
        Map<UUID, List<Agendamento>> porCliente = new LinkedHashMap<>();
        for (Agendamento a : agendamentoRepository.todosDoProfissional(usuarioId)) {
            porCliente.computeIfAbsent(a.getCliente().getId(), id -> new java.util.ArrayList<>()).add(a);
        }
        return porCliente.values().stream()
                .map(this::resumo)
                .sorted(Comparator.comparing(ClienteResumoResponse::nome, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Transactional(readOnly = true)
    public HistoricoClienteResponse historico(UUID usuarioId, UUID clienteId) {
        usuarioService.obterProfissional(usuarioId);
        List<Agendamento> agendamentos = agendamentoRepository.doClienteComProfissional(usuarioId, clienteId);
        if (agendamentos.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente sem agendamentos com você");
        }
        return new HistoricoClienteResponse(resumo(agendamentos), mapper.respostas(agendamentos));
    }

    private ClienteResumoResponse resumo(List<Agendamento> agendamentos) {
        Usuario cliente = agendamentos.getFirst().getCliente();
        Instant agora = Instant.now(relogio);
        List<Agendamento> concluidos = filtrar(agendamentos, StatusAgendamento.CONCLUIDO);
        return new ClienteResumoResponse(
                cliente.getId(),
                cliente.getNome(),
                cliente.getEmail(),
                agendamentos.size(),
                concluidos.size(),
                filtrar(agendamentos, StatusAgendamento.FALTOU).size(),
                filtrar(agendamentos, StatusAgendamento.CANCELADO).size(),
                concluidos.stream().map(Agendamento::getPreco).reduce(BigDecimal.ZERO, BigDecimal::add),
                concluidos.stream().map(Agendamento::getInicio).max(Comparator.naturalOrder()).orElse(null),
                filtrar(agendamentos, StatusAgendamento.CONFIRMADO).stream()
                        .map(Agendamento::getInicio)
                        .filter(inicio -> inicio.isAfter(agora))
                        .min(Comparator.naturalOrder())
                        .orElse(null));
    }

    private static List<Agendamento> filtrar(List<Agendamento> agendamentos, StatusAgendamento status) {
        return agendamentos.stream().filter(a -> a.getStatus() == status).toList();
    }
}
