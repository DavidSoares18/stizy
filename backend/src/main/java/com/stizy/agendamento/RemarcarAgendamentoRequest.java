package com.stizy.agendamento;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

/** Corpo de PUT /api/agendamentos/{id}/remarcar: { "inicioUtc": "2026-12-01T13:00:00Z" }. */
public record RemarcarAgendamentoRequest(
        @NotNull(message = "inicioUtc é obrigatório") @JsonAlias("inicio") Instant inicioUtc
) {}
