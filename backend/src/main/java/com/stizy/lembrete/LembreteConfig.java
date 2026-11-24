package com.stizy.lembrete;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Liga o agendador só quando stizy.lembretes.habilitado=true (variável LEMBRETES_HABILITADOS). */
@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "stizy.lembretes.habilitado", havingValue = "true")
public class LembreteConfig {
}
