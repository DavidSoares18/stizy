package com.stizy.historico;

import com.stizy.comum.UsuarioAutenticado;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** EXTRA-03. O histórico do próprio cliente fica em GET /api/agendamentos. */
@RestController
@RequestMapping("/api/provedor/clientes")
public class HistoricoController {

    private final HistoricoService service;

    public HistoricoController(HistoricoService service) {
        this.service = service;
    }

    @GetMapping
    public List<ClienteResumoResponse> clientes(@AuthenticationPrincipal Jwt jwt) {
        return service.clientes(UsuarioAutenticado.id(jwt));
    }

    @GetMapping("/{clienteId}/historico")
    public HistoricoClienteResponse historico(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID clienteId) {
        return service.historico(UsuarioAutenticado.id(jwt), clienteId);
    }
}
