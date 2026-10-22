package com.stizy.autenticacao;

import jakarta.validation.constraints.*;

public record LoginRequest(

    @NotBlank
    @Email
    String email,

    @NotBlank
    String senha

) {}