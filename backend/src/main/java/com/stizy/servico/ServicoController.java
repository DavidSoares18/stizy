package com.stizy.servico;

import com.stizy.comum.UsuarioAutenticado;
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

/** STZ-13: gestão dos serviços do profissional logado. O catálogo público fica em /api/negocios/{id}/servicos. */
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
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.criar(UsuarioAutenticado.id(jwt), request));
    }

    @GetMapping
    public List<ServicoResponse> listar(@AuthenticationPrincipal Jwt jwt) {
        return service.listar(UsuarioAutenticado.id(jwt));
    }

    @GetMapping("/{id}")
    public ServicoResponse buscar(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.buscar(UsuarioAutenticado.id(jwt), id);
    }

    @PutMapping("/{id}")
    public ServicoResponse atualizar(@AuthenticationPrincipal Jwt jwt,
                                     @PathVariable UUID id,
                                     @Valid @RequestBody ServicoRequest request) {
        return service.atualizar(UsuarioAutenticado.id(jwt), id, request);
    }

    /** Desativação lógica: o registro continua no banco com ativo = false. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desativar(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        service.desativar(UsuarioAutenticado.id(jwt), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/ativar")
    public ServicoResponse reativar(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.reativar(UsuarioAutenticado.id(jwt), id);
    }
}
