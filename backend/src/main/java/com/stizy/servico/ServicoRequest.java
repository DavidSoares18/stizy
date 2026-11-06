package com.stizy.servico;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ServicoRequest(
        @NotBlank(message = "Nome do serviço é obrigatório")
        @Size(max = 120, message = "Nome deve ter no máximo 120 caracteres")
        String nome,

        @NotNull(message = "Duração é obrigatória")
        @Min(value = 1, message = "Duração mínima é de 1 minuto")
        @Max(value = 1440, message = "Duração máxima é de 1440 minutos")
        Integer duracaoMinutos,

        @NotNull(message = "Preço é obrigatório")
        @DecimalMin(value = "0.00", message = "Preço não pode ser negativo")
        @Digits(integer = 10, fraction = 2,
                message = "Preço deve ter no máximo 10 inteiros e 2 decimais")
        BigDecimal preco
) {}