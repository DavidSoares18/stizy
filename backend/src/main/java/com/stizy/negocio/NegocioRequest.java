package com.stizy.negocio;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** A máscara do CEP (00000-000) é aceita e removida antes de gravar. */
public record NegocioRequest(
        @NotBlank(message = "Nome do negócio é obrigatório")
        @Size(max = 120, message = "Nome deve ter no máximo 120 caracteres")
        String nome,

        @Size(max = 300, message = "Descrição deve ter no máximo 300 caracteres")
        String descricao,

        @NotBlank(message = "Categoria é obrigatória")
        @Size(max = 40, message = "Categoria deve ter no máximo 40 caracteres")
        @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$",
                message = "Categoria deve ser um slug, ex.: barbearia, gas-e-agua")
        String categoria,

        @Pattern(regexp = "^\\d{5}-?\\d{3}$", message = "CEP deve ter 8 dígitos")
        String cep,

        @Size(max = 150, message = "Endereço deve ter no máximo 150 caracteres") String endereco,
        @Size(max = 80, message = "Complemento deve ter no máximo 80 caracteres") String complemento,
        @Size(max = 80, message = "Bairro deve ter no máximo 80 caracteres") String bairro,
        @Size(max = 80, message = "Cidade deve ter no máximo 80 caracteres") String cidade
) {}
