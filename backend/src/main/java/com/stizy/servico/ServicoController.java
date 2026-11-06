package com.stizy.servico;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/servicos")
public class ServicoController {

    private final ServicoService service;

    public ServicoController(ServicoService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ServicoResponse> criar(@AuthenticationPrincipal Jwt jwt,
                                                  @Valid @RequestBody ServicoRequest request) {
        ServicoResponse resposta = service.criar(usuarioId(jwt), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(resposta);
    }

    @GetMapping
    public List<ServicoResponse> listar(@AuthenticationPrincipal Jwt jwt) {
        return service.listar(usuarioId(jwt));
    }

    @GetMapping("/{id}")
    public ServicoResponse buscar(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.buscar(usuarioId(jwt), id);
    }

    @PutMapping("/{id}")
    public ServicoResponse atualizar(@AuthenticationPrincipal Jwt jwt,
                                    @PathVariable UUID id,
                                    @Valid @RequestBody ServicoRequest request) {
        return service.atualizar(usuarioId(jwt), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desativar(@AuthenticationPrincipal Jwt jwt,
                                          @PathVariable UUID id) {
        service.desativar(usuarioId(jwt), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/ativar")
    public ServicoResponse reativar(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.reativar(usuarioId(jwt), id);
    }

    private UUID usuarioId(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token obrigatório");
        }
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token inválido");
        }
    }
}