package com.stizy.agendamento;

import com.stizy.comum.UsuarioAutenticado;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Agendamentos do usuário logado como cliente (STZ-23, STZ-29, EXTRA-03). */
@RestController
@RequestMapping("/api/agendamentos")
public class AgendamentoController {

    private final AgendamentoService service;

    public AgendamentoController(AgendamentoService service) {
        this.service = service;
    }

    /** 201 = confirmado. 409 = horário ocupado/bloqueado (inclusive em reservas simultâneas). */
    @PostMapping
    public ResponseEntity<AgendamentoResponse> criar(@AuthenticationPrincipal Jwt jwt,
                                                     @Valid @RequestBody CriarAgendamentoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(UsuarioAutenticado.id(jwt), request));
    }

    @GetMapping
    public AgendaClienteResponse listar(@AuthenticationPrincipal Jwt jwt) {
        return service.listarDoCliente(UsuarioAutenticado.id(jwt));
    }

    @GetMapping("/{id}")
    public AgendamentoResponse buscar(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.buscar(UsuarioAutenticado.id(jwt), id);
    }

    /** Cancela (não apaga). Cliente ou profissional do agendamento. */
    @DeleteMapping("/{id}")
    public AgendamentoResponse cancelar(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.cancelar(UsuarioAutenticado.id(jwt), id);
    }

    @PutMapping("/{id}/remarcar")
    public AgendamentoResponse remarcar(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
                                        @Valid @RequestBody RemarcarAgendamentoRequest request) {
        return service.remarcar(UsuarioAutenticado.id(jwt), id, request);
    }
}
