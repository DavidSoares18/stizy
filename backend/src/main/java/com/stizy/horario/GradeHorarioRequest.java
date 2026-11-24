package com.stizy.horario;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/** PUT substitui a grade inteira. Lista vazia = profissional sem horários (agenda fechada). */
public record GradeHorarioRequest(
        @NotNull(message = "Informe a lista de faixas (pode ser vazia)")
        @Size(max = 50, message = "No máximo 50 faixas por semana")
        List<@Valid @NotNull FaixaHorarioRequest> faixas
) {}
