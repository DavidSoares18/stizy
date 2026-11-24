package com.stizy.agendamento;

import com.stizy.negocio.Negocio;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

/**
 * Formato combinado com o front (agendamentosService.js): status em minúsculas,
 * datas em UTC, "valor" = preço copiado na reserva, pagamento sempre "presencial" no MVP.
 */
public record AgendamentoResponse(
        UUID id,
        String titulo,
        UUID servicoId,
        UUID negocioId,
        String negocioNome,
        UUID clienteId,
        String clienteNome,
        UUID profissionalId,
        String profissionalNome,
        Instant inicioUtc,
        Instant fimUtc,
        BigDecimal valor,
        String pagamento,
        String tipo,
        String status,
        Instant canceladoEm
) {
    public static AgendamentoResponse de(Agendamento a, Negocio negocio) {
        return new AgendamentoResponse(
                a.getId(),
                a.getServico().getNome(),
                a.getServico().getId(),
                negocio != null ? negocio.getId() : null,
                negocio != null ? negocio.getNome() : a.getProfissional().getNome(),
                a.getCliente().getId(),
                a.getCliente().getNome(),
                a.getProfissional().getId(),
                a.getProfissional().getNome(),
                a.getInicio(),
                a.getFim(),
                a.getPreco(),
                "presencial",
                "servico",
                a.getStatus().name().toLowerCase(Locale.ROOT),
                a.getCanceladoEm());
    }
}
