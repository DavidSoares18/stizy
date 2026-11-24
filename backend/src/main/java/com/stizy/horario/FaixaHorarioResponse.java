package com.stizy.horario;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.Locale;
import java.util.UUID;

public record FaixaHorarioResponse(
        UUID id,
        Integer diaSemana,
        String diaNome,
        LocalTime horaInicio,
        LocalTime horaFim
) {
    private static final Locale PT_BR = Locale.of("pt", "BR");

    public static FaixaHorarioResponse de(HorarioFuncionamento faixa) {
        return new FaixaHorarioResponse(
                faixa.getId(),
                faixa.getDiaSemana(),
                DayOfWeek.of(faixa.getDiaSemana()).getDisplayName(TextStyle.FULL, PT_BR),
                faixa.getHoraInicio(),
                faixa.getHoraFim());
    }
}
