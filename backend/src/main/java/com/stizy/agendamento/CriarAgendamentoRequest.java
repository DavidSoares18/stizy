package com.stizy.agendamento;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

/**
 * Corpo de POST /api/agendamentos: { "negocioId", "servicoId", "inicioUtc": "2026-12-01T12:00:00Z" }.
 * Também aceita "inicio" (nome usado hoje em Pagamento.jsx). Campos extras como "pagamento" são ignorados:
 * pagamento online está fora do MVP e todo agendamento é presencial.
 */
public record CriarAgendamentoRequest(
        @NotNull(message = "negocioId é obrigatório") UUID negocioId,
        @NotNull(message = "servicoId é obrigatório") UUID servicoId,
        @NotNull(message = "inicioUtc é obrigatório") @JsonAlias("inicio") Instant inicioUtc
) {}
