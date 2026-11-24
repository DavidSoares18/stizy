package com.stizy.servico;

import java.math.BigDecimal;
import java.util.UUID;

public record ServicoResponse(
        UUID id,
        String nome,
        Integer duracaoMinutos,
        BigDecimal preco,
        boolean ativo,
        UUID profissionalId
) {
    public static ServicoResponse from(Servico servico) {
        return new ServicoResponse(
                servico.getId(),
                servico.getNome(),
                servico.getDuracaoMinutos(),
                servico.getPreco(),
                servico.isAtivo(),
                servico.getProfissional().getId()
        );
    }
}
