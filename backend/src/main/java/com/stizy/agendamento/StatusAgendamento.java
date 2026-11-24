package com.stizy.agendamento;

/** Igual ao CHECK da V4. Só CANCELADO libera o horário. */
public enum StatusAgendamento {
    CONFIRMADO,
    CANCELADO,
    CONCLUIDO,
    FALTOU
}
