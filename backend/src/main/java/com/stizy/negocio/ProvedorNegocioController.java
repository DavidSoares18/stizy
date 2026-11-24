package com.stizy.negocio;

import com.stizy.comum.UsuarioAutenticado;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Negócio do profissional logado. PUT cria na primeira vez e atualiza depois. */
@RestController
@RequestMapping("/api/provedor/negocio")
public class ProvedorNegocioController {

    private final NegocioService service;

    public ProvedorNegocioController(NegocioService service) {
        this.service = service;
    }

    @GetMapping
    public NegocioResponse meuNegocio(@AuthenticationPrincipal Jwt jwt) {
        return service.doProfissional(UsuarioAutenticado.id(jwt));
    }

    @PutMapping
    public NegocioResponse salvar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody NegocioRequest request) {
        return service.salvar(UsuarioAutenticado.id(jwt), request);
    }
}
