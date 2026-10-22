package com.stizy.autenticacao;

public record TokenResponse(
    String token,
    String tipo,
    long expiraEmSegundos,
    UsuarioResponse usuario
) {}