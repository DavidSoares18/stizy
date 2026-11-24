package com.stizy.usuario;

import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Busca o usuário logado e confere o papel. Usado por todos os módulos. */
@Service
public class UsuarioService {

    private final UsuarioRepository repository;

    public UsuarioService(UsuarioRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Usuario obter(UUID usuarioId) {
        return repository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Usuário autenticado não encontrado"));
    }

    @Transactional(readOnly = true)
    public Usuario obterProfissional(UUID usuarioId) {
        Usuario usuario = obter(usuarioId);
        if (usuario.getPapel() != Papel.PROFISSIONAL) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Somente profissionais podem acessar este recurso");
        }
        return usuario;
    }
}
