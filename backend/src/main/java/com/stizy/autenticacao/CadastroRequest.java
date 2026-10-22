package com.stizy.autenticacao;

import com.stizy.usuario.Papel;
import jakarta.validation.constraints.*;

public record CadastroRequest(

    @NotBlank
    @Size(min = 3, max = 120)
    String nome,

    @NotBlank
    @Email
    @Size(max = 180)
    String email,

    @NotBlank
    @Size(min = 8, max = 72)
    String senha,

    @NotNull
    Papel papel

) {}