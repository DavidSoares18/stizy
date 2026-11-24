package com.stizy;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Base dos testes de integração: sobe a API numa porta aleatória, usa o banco stizy_test
 * (perfil "test") e conversa por HTTP de verdade, com JWT, como o front faz.
 * Cada teste cria usuários com e-mail único, então os testes não dependem uns dos outros.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public abstract class ApiTeste {

    protected static final ZoneId RECIFE = ZoneId.of("America/Recife");
    protected static final JsonMapper JSON = JsonMapper.builder().build();
    private static final HttpClient HTTP = HttpClient.newHttpClient();

    @Value("${local.server.port}")
    protected int porta;

    protected record Resposta(int status, JsonNode corpo) {
        public String texto(String campo) {
            return corpo.get(campo).asString();
        }
    }

    /** Usuário logado: id, token e (para profissionais) id do negócio. */
    protected record Conta(UUID id, String token, String email, UUID negocioId) {
    }

    protected Resposta chamar(String metodo, String caminho, String token, Object corpo) {
        try {
            HttpRequest.Builder req = HttpRequest.newBuilder(URI.create("http://localhost:" + porta + caminho))
                    .header("Content-Type", "application/json");
            if (token != null) {
                req.header("Authorization", "Bearer " + token);
            }
            String json = corpo == null ? null : (corpo instanceof String s ? s : JSON.writeValueAsString(corpo));
            req.method(metodo, json == null ? HttpRequest.BodyPublishers.noBody()
                    : HttpRequest.BodyPublishers.ofString(json));
            HttpResponse<String> resp = HTTP.send(req.build(), HttpResponse.BodyHandlers.ofString());
            JsonNode no = resp.body() == null || resp.body().isBlank() ? JSON.nullNode() : JSON.readTree(resp.body());
            return new Resposta(resp.statusCode(), no);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    protected Resposta get(String caminho, String token) {
        return chamar("GET", caminho, token, null);
    }

    protected Resposta post(String caminho, String token, Object corpo) {
        return chamar("POST", caminho, token, corpo);
    }

    protected Resposta put(String caminho, String token, Object corpo) {
        return chamar("PUT", caminho, token, corpo);
    }

    protected Resposta delete(String caminho, String token) {
        return chamar("DELETE", caminho, token, null);
    }

    protected Conta novaConta(String papel) {
        String email = papel.toLowerCase() + "-" + UUID.randomUUID() + "@teste.stizy";
        String senha = "senha-de-teste-123";
        Resposta cadastro = post("/api/auth/cadastro", null, java.util.Map.of(
                "nome", (papel.equals("CLIENTE") ? "Cliente " : "Profissional ") + email.substring(0, 18),
                "email", email, "senha", senha, "papel", papel));
        assertEquals(201, cadastro.status(), () -> "cadastro: " + cadastro.corpo());
        Resposta login = post("/api/auth/login", null, java.util.Map.of("email", email, "senha", senha));
        assertEquals(200, login.status(), () -> "login: " + login.corpo());
        return new Conta(UUID.fromString(login.corpo().get("usuario").get("id").asString()),
                login.texto("token"), email, null);
    }

    protected Conta novoCliente() {
        return novaConta("CLIENTE");
    }

    /** Profissional com negócio e grade de segunda a domingo, 08:00-12:00 e 13:00-18:00. */
    protected Conta novoProfissionalComNegocio() {
        Conta conta = novaConta("PROFISSIONAL");
        Resposta negocio = put("/api/provedor/negocio", conta.token(), java.util.Map.of(
                "nome", "Barbearia Teste " + conta.id().toString().substring(0, 6),
                "categoria", "barbearia",
                "cep", "55150-000",
                "cidade", "Belo Jardim, PE"));
        assertEquals(200, negocio.status(), () -> "negócio: " + negocio.corpo());

        java.util.List<java.util.Map<String, Object>> faixas = new java.util.ArrayList<>();
        for (int dia = 1; dia <= 7; dia++) {
            faixas.add(java.util.Map.of("diaSemana", dia, "horaInicio", "08:00", "horaFim", "12:00"));
            faixas.add(java.util.Map.of("diaSemana", dia, "horaInicio", "13:00", "horaFim", "18:00"));
        }
        Resposta grade = put("/api/provedor/horarios", conta.token(), java.util.Map.of("faixas", faixas));
        assertEquals(200, grade.status(), () -> "grade: " + grade.corpo());
        return new Conta(conta.id(), conta.token(), conta.email(), UUID.fromString(negocio.texto("id")));
    }

    protected UUID novoServico(Conta profissional, String nome, int duracao, String preco) {
        Resposta servico = post("/api/servicos", profissional.token(), java.util.Map.of(
                "nome", nome, "duracaoMinutos", duracao, "preco", new java.math.BigDecimal(preco)));
        assertEquals(201, servico.status(), () -> "serviço: " + servico.corpo());
        return UUID.fromString(servico.texto("id"));
    }

    /** Instante UTC (ISO 8601) de uma hora local de Recife. */
    protected static String utc(LocalDate data, String horaLocal) {
        return data.atTime(LocalTime.parse(horaLocal)).atZone(RECIFE).toInstant().toString();
    }

    protected static LocalDate hojeRecife() {
        return LocalDate.now(RECIFE);
    }
}
