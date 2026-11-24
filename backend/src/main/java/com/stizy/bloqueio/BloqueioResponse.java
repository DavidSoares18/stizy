package com.stizy.bloqueio;

import java.time.Instant;
import java.util.UUID;

public record BloqueioResponse(UUID id, Instant inicio, Instant fim, String motivo) {

    public static BloqueioResponse de(Bloqueio bloqueio) {
        return new BloqueioResponse(bloqueio.getId(), bloqueio.getInicio(), bloqueio.getFim(), bloqueio.getMotivo());
    }
}
