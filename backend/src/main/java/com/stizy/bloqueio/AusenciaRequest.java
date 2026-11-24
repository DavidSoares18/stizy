package com.stizy.bloqueio;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * Folga ou férias de dias inteiros (RF14): { "dataInicio": "2026-12-24", "dataFim": "2026-12-26" }.
 * Vira um bloqueio da meia-noite do primeiro dia até a meia-noite do dia seguinte ao último.
 */
public record AusenciaRequest(
        @NotNull(message = "Data inicial é obrigatória") LocalDate dataInicio,
        @NotNull(message = "Data final é obrigatória") LocalDate dataFim,
        @Size(max = 255, message = "Motivo deve ter no máximo 255 caracteres") String motivo
) {
    @AssertTrue(message = "Data final não pode ser antes da inicial")
    public boolean isPeriodoValido() {
        return dataInicio == null || dataFim == null || !dataFim.isBefore(dataInicio);
    }
}
