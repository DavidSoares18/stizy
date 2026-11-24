package com.stizy.relatorio;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * EXTRA-05: atendimentos e faturamento do período (datas locais, inclusive).
 * faturamento = soma dos CONCLUIDOS; previsto = soma dos CONFIRMADOS (ainda não atendidos);
 * taxaComparecimento = concluídos / (concluídos + faltas), em %.
 */
public record RelatorioResponse(
        LocalDate inicio,
        LocalDate fim,
        long totalAgendamentos,
        long confirmados,
        long concluidos,
        long cancelados,
        long faltas,
        BigDecimal faturamento,
        BigDecimal previsto,
        BigDecimal ticketMedio,
        BigDecimal taxaComparecimento,
        List<PorServico> porServico,
        List<PorDia> porDia
) {
    public record PorServico(UUID servicoId, String nome, long atendimentos, BigDecimal faturamento) {
    }

    public record PorDia(LocalDate data, long atendimentos, BigDecimal faturamento) {
    }
}
