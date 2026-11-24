package com.stizy.relatorio;

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

/** EXTRA-05: GET /api/provedor/relatorios?inicio=2026-11-01&fim=2026-11-30 (padrão: mês atual). */
@RestController
@RequestMapping("/api/provedor/relatorios")
public class RelatorioController {

    private final RelatorioService service;
    private final ZoneId fuso;
    private final Clock relogio;

    public RelatorioController(RelatorioService service, ZoneId fusoDoNegocio, Clock relogio) {
        this.service = service;
        this.fuso = fusoDoNegocio;
        this.relogio = relogio;
    }

    @GetMapping
    public RelatorioResponse gerar(@AuthenticationPrincipal Jwt jwt,
                                   @RequestParam(required = false) LocalDate inicio,
                                   @RequestParam(required = false) LocalDate fim) {
        LocalDate hoje = LocalDate.now(relogio.withZone(fuso));
        LocalDate de = inicio != null ? inicio : hoje.withDayOfMonth(1);
        LocalDate ate = fim != null ? fim : de.withDayOfMonth(de.lengthOfMonth());
        return service.gerar(UsuarioAutenticado.id(jwt), de, ate);
    }
}
