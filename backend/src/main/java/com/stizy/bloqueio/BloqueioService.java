package com.stizy.bloqueio;

import com.stizy.agendamento.AgendamentoRepository;
import com.stizy.usuario.Usuario;
import com.stizy.usuario.UsuarioRepository;
import com.stizy.usuario.UsuarioService;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** EXTRA-01: bloqueio de horários, folgas e férias. A disponibilidade ignora os períodos bloqueados. */
@Service
public class BloqueioService {

    private final BloqueioRepository bloqueioRepository;
    private final AgendamentoRepository agendamentoRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;
    private final ZoneId fuso;
    private final Clock relogio;

    public BloqueioService(BloqueioRepository bloqueioRepository,
                           AgendamentoRepository agendamentoRepository,
                           UsuarioRepository usuarioRepository,
                           UsuarioService usuarioService,
                           ZoneId fusoDoNegocio,
                           Clock relogio) {
        this.bloqueioRepository = bloqueioRepository;
        this.agendamentoRepository = agendamentoRepository;
        this.usuarioRepository = usuarioRepository;
        this.usuarioService = usuarioService;
        this.fuso = fusoDoNegocio;
        this.relogio = relogio;
    }

    /** Sem período informado: bloqueios de agora em diante (até 1 ano). */
    @Transactional(readOnly = true)
    public List<BloqueioResponse> listar(UUID usuarioId, Instant inicio, Instant fim) {
        usuarioService.obterProfissional(usuarioId);
        Instant de = inicio != null ? inicio : Instant.now(relogio);
        Instant ate = fim != null ? fim : de.plus(366, ChronoUnit.DAYS);
        return bloqueioRepository.noPeriodo(usuarioId, de, ate).stream().map(BloqueioResponse::de).toList();
    }

    @Transactional
    public BloqueioResponse bloquear(UUID usuarioId, BloqueioRequest request) {
        return criar(usuarioId, request.inicio(), request.fim(), request.motivo());
    }

    @Transactional
    public BloqueioResponse registrarAusencia(UUID usuarioId, AusenciaRequest request) {
        Instant inicio = request.dataInicio().atStartOfDay(fuso).toInstant();
        Instant fim = request.dataFim().plusDays(1).atStartOfDay(fuso).toInstant();
        String motivo = request.motivo() == null || request.motivo().isBlank() ? "Ausência" : request.motivo();
        return criar(usuarioId, inicio, fim, motivo);
    }

    @Transactional
    public void remover(UUID usuarioId, UUID bloqueioId) {
        usuarioService.obterProfissional(usuarioId);
        Bloqueio bloqueio = bloqueioRepository.findByIdAndProfissional_Id(bloqueioId, usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bloqueio não encontrado"));
        bloqueioRepository.delete(bloqueio);
    }

    private BloqueioResponse criar(UUID usuarioId, Instant inicio, Instant fim, String motivo) {
        usuarioService.obterProfissional(usuarioId);
        // Mesma trava da reserva: evita bloquear um horário enquanto alguém o está reservando.
        Usuario profissional = usuarioRepository.buscarParaReserva(usuarioId).orElseThrow();
        long conflitos = agendamentoRepository.contarAtivosNoPeriodo(usuarioId, inicio, fim);
        if (conflitos > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, String.format(
                    "Existem %d agendamento(s) ativos nesse período. Cancele ou remarque antes de bloquear.",
                    conflitos));
        }
        String motivoLimpo = motivo == null || motivo.isBlank() ? null : motivo.trim();
        return BloqueioResponse.de(bloqueioRepository.saveAndFlush(new Bloqueio(profissional, inicio, fim, motivoLimpo)));
    }
}
