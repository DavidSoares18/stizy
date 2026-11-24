package com.stizy.disponibilidade;

import java.time.Instant;

/**
 * Um horário da tela "Agendar".
 * hora: hora local do negócio (HH:mm) | inicioUtc/fimUtc: instantes em UTC para enviar na reserva.
 * livre = false aparece riscado; situacao diz o motivo (ocupado, bloqueado, passado).
 */
public record HorarioDisponivelResponse(
        String hora,
        Instant inicioUtc,
        Instant fimUtc,
        boolean livre,
        String situacao
) {
}
