package com.stizy.comum;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Regras de data e hora da agenda.
 * - Instantes (agendamentos, bloqueios) ficam em UTC no banco e na API (RNF07).
 * - A grade semanal fica na hora local do negócio (stizy.agenda.fuso, padrão America/Recife).
 */
@Configuration
public class ConfiguracaoAgenda {

    @Bean
    public ZoneId fusoDoNegocio(@Value("${stizy.agenda.fuso:America/Recife}") String fuso) {
        return ZoneId.of(fuso);
    }

    /** Relógio injetável: facilita testar regras que dependem de "agora". */
    @Bean
    public Clock relogio() {
        return Clock.systemUTC();
    }
}
