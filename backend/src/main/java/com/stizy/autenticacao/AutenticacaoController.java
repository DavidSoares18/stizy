package com.stizy.autenticacao;

import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AutenticacaoController {

    private final AutenticacaoService service;

    public AutenticacaoController(
            AutenticacaoService service
    ) {
        this.service = service;
    }

    @PostMapping("/cadastro")
    public ResponseEntity<UsuarioResponse> cadastrar(
            @Valid @RequestBody CadastroRequest request
    ) {
        UsuarioResponse usuario = service.cadastrar(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(usuario);
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        return ResponseEntity.ok(service.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> meusDados(
            @AuthenticationPrincipal Jwt jwt
    ) {
        UUID id = UUID.fromString(jwt.getSubject());

        return ResponseEntity.ok(
            service.buscarUsuario(id)
        );
    }
}