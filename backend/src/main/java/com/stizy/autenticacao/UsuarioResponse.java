package com.stizy.autenticacao;

import com.stizy.usuario.Papel;
import com.stizy.usuario.Usuario;

import java.util.UUID;

public record UsuarioResponse(
    UUID id,
    String nome,
    String email,
    Papel papel
) {
    public static UsuarioResponse de(Usuario usuario) {
        return new UsuarioResponse(
            usuario.getId(),
            usuario.getNome(),
            usuario.getEmail(),
            usuario.getPapel()
        );
    }
}