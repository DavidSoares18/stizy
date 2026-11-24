package com.stizy;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** STZ-31: autenticação e permissões por papel. */
class AutenticacaoApiTest extends ApiTeste {

    @Test
    @DisplayName("Cadastro, login e /me; senha nunca volta na resposta")
    void cadastroELogin() {
        Conta cliente = novoCliente();
        Resposta me = get("/api/auth/me", cliente.token());
        assertEquals(200, me.status());
        assertEquals(cliente.email(), me.texto("email"));
        assertEquals("CLIENTE", me.texto("papel"));
        assertFalse(me.corpo().has("senhaHash"));
    }

    @Test
    @DisplayName("E-mail repetido = 409; senha errada = 401; dados inválidos = 400")
    void errosDeCadastroELogin() {
        Conta cliente = novoCliente();
        assertEquals(409, post("/api/auth/cadastro", null, Map.of("nome", "Outro nome", "email",
                cliente.email().toUpperCase(), "senha", "senha-de-teste-123", "papel", "CLIENTE")).status());
        assertEquals(401, post("/api/auth/login", null,
                Map.of("email", cliente.email(), "senha", "senha-errada-123")).status());
        Resposta invalido = post("/api/auth/cadastro", null,
                Map.of("nome", "A", "email", "nao-e-email", "senha", "123", "papel", "CLIENTE"));
        assertEquals(400, invalido.status());
        assertEquals(3, invalido.corpo().get("campos").size());
    }

    @Test
    @DisplayName("Sem token = 401; token adulterado = 401")
    void semTokenOuTokenInvalido() {
        assertEquals(401, get("/api/servicos", null).status());
        assertEquals(401, get("/api/agendamentos", null).status());
        assertEquals(401, get("/api/auth/me", "token.falso.123").status());
    }

    @Test
    @DisplayName("Cliente não acessa a área do profissional (403)")
    void clienteNaoEhProfissional() {
        Conta cliente = novoCliente();
        assertEquals(403, get("/api/servicos", cliente.token()).status());
        assertEquals(403, get("/api/provedor/agenda", cliente.token()).status());
        assertEquals(403, put("/api/provedor/horarios", cliente.token(), Map.of("faixas", java.util.List.of())).status());
        assertEquals(403, get("/api/provedor/relatorios", cliente.token()).status());
    }

    @Test
    @DisplayName("Catálogo é público (link de agendamento), mas reservar exige login")
    void catalogoPublico() {
        Conta profissional = novoProfissionalComNegocio();
        assertEquals(200, get("/api/negocios/" + profissional.negocioId(), null).status());
        assertEquals(200, get("/api/negocios/" + profissional.negocioId() + "/servicos", null).status());
        assertEquals(401, post("/api/agendamentos", null, Map.of()).status());
    }

    @Test
    @DisplayName("CORS libera o front em localhost:5173")
    void cors() throws Exception {
        java.net.http.HttpResponse<String> preflight = java.net.http.HttpClient.newHttpClient().send(
                java.net.http.HttpRequest.newBuilder(java.net.URI.create("http://localhost:" + porta + "/api/agendamentos"))
                        .method("OPTIONS", java.net.http.HttpRequest.BodyPublishers.noBody())
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "authorization,content-type")
                        .build(),
                java.net.http.HttpResponse.BodyHandlers.ofString());
        assertEquals(200, preflight.statusCode());
        assertEquals("http://localhost:5173",
                preflight.headers().firstValue("Access-Control-Allow-Origin").orElse(null));
    }
}
