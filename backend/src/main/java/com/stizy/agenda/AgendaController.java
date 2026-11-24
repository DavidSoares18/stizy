package com.stizy.agenda;

import com.stizy.comum.UsuarioAutenticado;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** STZ-26: agenda do profissional logado. Sem "data", usa o dia de hoje no fuso do negócio. */
@RestController
@RequestMapping("/api/provedor/agenda")
public class AgendaController {

    private final AgendaService service;
    private final ZoneId fuso;
    private final Clock relogio;

    public AgendaController(AgendaService service, ZoneId fusoDoNegocio, Clock relogio) {
        this.service = service;
        this.fuso = fusoDoNegocio;
        this.relogio = relogio;
    }

    @GetMapping
    public AgendaDiaResponse dia(@AuthenticationPrincipal Jwt jwt, @RequestParam(required = false) LocalDate data) {
        return service.dia(UsuarioAutenticado.id(jwt), data != null ? data : hoje());
    }

    @GetMapping("/semana")
    public AgendaSemanaResponse semana(@AuthenticationPrincipal Jwt jwt,
                                       @RequestParam(required = false) LocalDate data) {
        return service.semana(UsuarioAutenticado.id(jwt), data != null ? data : hoje());
    }

    private LocalDate hoje() {
        return LocalDate.now(relogio.withZone(fuso));
    }
}
