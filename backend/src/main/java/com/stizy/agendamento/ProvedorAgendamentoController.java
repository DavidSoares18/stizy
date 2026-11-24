package com.stizy.agendamento;

import com.stizy.comum.UsuarioAutenticado;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Agendamentos vistos pelo profissional logado. Cancelar e remarcar usam as rotas de /api/agendamentos. */
@RestController
@RequestMapping("/api/provedor/agendamentos")
public class ProvedorAgendamentoController {

    private final AgendamentoService service;

    public ProvedorAgendamentoController(AgendamentoService service) {
        this.service = service;
    }

    /** GET /api/provedor/agendamentos?inicio=2026-12-01&fim=2026-12-31 (datas locais, inclusive). */
    @GetMapping
    public List<AgendamentoResponse> listar(@AuthenticationPrincipal Jwt jwt,
                                            @RequestParam LocalDate inicio,
                                            @RequestParam LocalDate fim) {
        return service.listarDoProfissional(UsuarioAutenticado.id(jwt), inicio, fim);
    }

    @GetMapping("/{id}")
    public AgendamentoResponse buscar(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.buscarDoProfissional(UsuarioAutenticado.id(jwt), id);
    }

    @PutMapping("/{id}/concluir")
    public AgendamentoResponse concluir(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.concluir(UsuarioAutenticado.id(jwt), id);
    }

    @PutMapping("/{id}/faltou")
    public AgendamentoResponse faltou(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.registrarFalta(UsuarioAutenticado.id(jwt), id);
    }
}
