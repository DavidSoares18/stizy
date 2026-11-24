package com.stizy.negocio;

import java.util.UUID;

/**
 * linkPublico (EXTRA-02): página do negócio no front, que abre sem login.
 * tipo = "horario" porque o MVP só tem serviços com hora marcada.
 */
public record NegocioResponse(
        UUID id,
        UUID profissionalId,
        String nome,
        String descricao,
        String categoria,
        String tipo,
        String cep,
        String endereco,
        String complemento,
        String bairro,
        String cidade,
        String linkPublico
) {
    public static NegocioResponse de(Negocio negocio, String urlFront) {
        return new NegocioResponse(
                negocio.getId(),
                negocio.getProfissional().getId(),
                negocio.getNome(),
                negocio.getDescricao(),
                negocio.getCategoria(),
                "horario",
                negocio.getCep(),
                negocio.getEndereco(),
                negocio.getComplemento(),
                negocio.getBairro(),
                negocio.getCidade(),
                urlFront + "/estabelecimento/" + negocio.getId() + "?tipo=horario"
        );
    }
}
