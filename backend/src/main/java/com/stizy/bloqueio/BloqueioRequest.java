package com.stizy.bloqueio;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/** Bloqueio de um intervalo qualquer, em UTC: { "inicio": "2026-12-01T13:00:00Z", "fim": "...", "motivo": "..." }. */
public record BloqueioRequest(
        @NotNull(message = "Início é obrigatório") Instant inicio,
        @NotNull(message = "Fim é obrigatório") Instant fim,
        @Size(max = 255, message = "Motivo deve ter no máximo 255 caracteres") String motivo
) {
    @AssertTrue(message = "Fim deve ser depois do início")
    public boolean isIntervaloValido() {
        return inicio == null || fim == null || fim.isAfter(inicio);
    }
}
