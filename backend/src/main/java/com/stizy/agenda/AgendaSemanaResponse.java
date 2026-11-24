package com.stizy.agenda;

import com.stizy.agendamento.AgendamentoResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** GET /api/provedor/agenda/semana?data=...: segunda a domingo da semana da data informada. */
public record AgendaSemanaResponse(
        LocalDate inicio,
        LocalDate fim,
        long atendimentos,
        BigDecimal previsto,
        List<Dia> dias
) {
    public record Dia(
            LocalDate data,
            int diaSemana,
            String diaNome,
            long atendimentos,
            BigDecimal previsto,
            List<AgendamentoResponse> agendamentos
    ) {
    }
}
