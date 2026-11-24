package com.stizy.bloqueio;

import com.stizy.comum.UsuarioAutenticado;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** EXTRA-01 / RF14 / RF17: bloqueios e ausências do profissional logado. */
@RestController
@RequestMapping("/api/provedor")
public class BloqueioController {

    private final BloqueioService service;

    public BloqueioController(BloqueioService service) {
        this.service = service;
    }

    @GetMapping("/bloqueios")
    public List<BloqueioResponse> listar(@AuthenticationPrincipal Jwt jwt,
                                         @RequestParam(required = false) Instant inicio,
                                         @RequestParam(required = false) Instant fim) {
        return service.listar(UsuarioAutenticado.id(jwt), inicio, fim);
    }

    @PostMapping("/bloqueios")
    public ResponseEntity<BloqueioResponse> bloquear(@AuthenticationPrincipal Jwt jwt,
                                                     @Valid @RequestBody BloqueioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.bloquear(UsuarioAutenticado.id(jwt), request));
    }

    @PostMapping("/ausencias")
    public ResponseEntity<BloqueioResponse> registrarAusencia(@AuthenticationPrincipal Jwt jwt,
                                                              @Valid @RequestBody AusenciaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.registrarAusencia(UsuarioAutenticado.id(jwt), request));
    }

    @DeleteMapping("/bloqueios/{id}")
    public ResponseEntity<Void> remover(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        service.remover(UsuarioAutenticado.id(jwt), id);
        return ResponseEntity.noContent().build();
    }
}
