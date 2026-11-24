package com.stizy.historico;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Resumo de um cliente para o profissional. valorGasto conta só atendimentos concluídos. */
public record ClienteResumoResponse(
        UUID clienteId,
        String nome,
        String email,
        long agendamentos,
        long concluidos,
        long faltas,
        long cancelados,
        BigDecimal valorGasto,
        Instant ultimoAtendimento,
        Instant proximoAgendamento
) {
}
