package com.stizy.horario;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;

/** Uma faixa da grade: { "diaSemana": 2, "horaInicio": "08:00", "horaFim": "12:00" }. */
public record FaixaHorarioRequest(
        @NotNull(message = "Dia da semana é obrigatório")
        @Min(value = 1, message = "Dia da semana vai de 1 (segunda) a 7 (domingo)")
        @Max(value = 7, message = "Dia da semana vai de 1 (segunda) a 7 (domingo)")
        Integer diaSemana,

        @NotNull(message = "Hora de início é obrigatória")
        LocalTime horaInicio,

        @NotNull(message = "Hora de fim é obrigatória")
        LocalTime horaFim
) {
    @AssertTrue(message = "Hora de fim deve ser depois da hora de início")
    public boolean isIntervaloValido() {
        return horaInicio == null || horaFim == null || horaFim.isAfter(horaInicio);
    }
}
