package com.stizy;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

/** Sobe a aplicação inteira (Flyway V1..V6 + validação das entidades) contra o banco de testes. */
class StizyApplicationTests extends ApiTeste {

    @Test
    void contextLoads() {
        Resposta health = get("/api/health", null);
        assertEquals(200, health.status());
        assertEquals("UP", health.texto("status"));
    }
}
