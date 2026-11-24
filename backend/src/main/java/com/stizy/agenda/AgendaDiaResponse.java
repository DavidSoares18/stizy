package com.stizy.agenda;

import com.stizy.agendamento.AgendamentoResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Formato de GET /api/provedor/agenda?data=..., combinado com provedorService.obterAgendaDoDia no front. */
public record AgendaDiaResponse(
        LocalDate data,
        Resumo resumo,
        AgendamentoResponse proximo,
        List<Linha> horarios,
        List<AgendamentoResponse> agendamentos
) {
    /** atendimentos = agendamentos que ocupam horário; previsto = soma dos valores deles. */
    public record Resumo(long atendimentos, long horariosLivres, BigDecimal previsto) {
    }

    /** Uma linha da grade do dia (blocos do tamanho de stizy.agenda.intervalo-minutos). */
    public record Linha(
            String hora,
            Instant inicioUtc,
            boolean livre,
            String situacao,
            UUID agendamentoId,
            String clienteNome,
            String servico,
            String pagamento,
            BigDecimal valor
    ) {
    }
}
