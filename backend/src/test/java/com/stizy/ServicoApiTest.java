package com.stizy;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** STZ-13 (CRUD de serviços), STZ-14 (grade) e negócio. */
class ServicoApiTest extends ApiTeste {

    @Test
    @DisplayName("CRUD completo: criar, listar, buscar, editar, desativar e reativar")
    void crud() {
        Conta p = novoProfissionalComNegocio();
        UUID id = novoServico(p, "  Corte masculino  ", 30, "35.00");

        Resposta lista = get("/api/servicos", p.token());
        assertEquals(200, lista.status());
        assertEquals(1, lista.corpo().size());
        assertEquals("Corte masculino", lista.corpo().get(0).get("nome").asString()); // nome sem espaços

        Resposta editado = put("/api/servicos/" + id, p.token(),
                Map.of("nome", "Corte e barba", "duracaoMinutos", 60, "preco", 65.00));
        assertEquals(200, editado.status());
        assertEquals(60, editado.corpo().get("duracaoMinutos").asInt());

        assertEquals(204, delete("/api/servicos/" + id, p.token()).status());
        Resposta desativado = get("/api/servicos/" + id, p.token());
        assertFalse(desativado.corpo().get("ativo").asBoolean());
        // Catálogo público não mostra serviço desativado
        assertEquals(0, get("/api/negocios/" + p.negocioId() + "/servicos", null).corpo().size());

        Resposta reativado = chamar("PATCH", "/api/servicos/" + id + "/ativar", p.token(), null);
        assertEquals(200, reativado.status());
        assertTrue(reativado.corpo().get("ativo").asBoolean());
        assertEquals(1, get("/api/negocios/" + p.negocioId() + "/servicos", null).corpo().size());
    }

    @Test
    @DisplayName("Validação: nome vazio, duração 0, preço negativo ou com 3 casas = 400")
    void validacao() {
        Conta p = novoProfissionalComNegocio();
        assertEquals(400, post("/api/servicos", p.token(), Map.of("nome", " ", "duracaoMinutos", 30, "preco", 10)).status());
        assertEquals(400, post("/api/servicos", p.token(), Map.of("nome", "X", "duracaoMinutos", 0, "preco", 10)).status());
        assertEquals(400, post("/api/servicos", p.token(), Map.of("nome", "X", "duracaoMinutos", 30, "preco", -1)).status());
        assertEquals(400, post("/api/servicos", p.token(), "{\"nome\":\"X\",\"duracaoMinutos\":30,\"preco\":1.234}").status());
        assertEquals(400, post("/api/servicos", p.token(), "{json quebrado").status());
    }

    @Test
    @DisplayName("Um profissional não vê nem edita serviço de outro (404)")
    void isolamentoEntreProfissionais() {
        Conta a = novoProfissionalComNegocio();
        Conta b = novoProfissionalComNegocio();
        UUID servicoDeA = novoServico(a, "Corte", 30, "30.00");
        assertEquals(404, get("/api/servicos/" + servicoDeA, b.token()).status());
        assertEquals(404, put("/api/servicos/" + servicoDeA, b.token(),
                Map.of("nome", "Invadido", "duracaoMinutos", 10, "preco", 1)).status());
        assertEquals(404, delete("/api/servicos/" + servicoDeA, b.token()).status());
        assertEquals(0, get("/api/servicos", b.token()).corpo().size());
    }

    @Test
    @DisplayName("Grade: substitui tudo, recusa sobreposição e fim antes do início")
    void gradeDeHorarios() {
        Conta p = novoProfissionalComNegocio();
        assertEquals(14, get("/api/provedor/horarios", p.token()).corpo().size());

        Resposta sobreposta = put("/api/provedor/horarios", p.token(), Map.of("faixas", List.of(
                Map.of("diaSemana", 1, "horaInicio", "08:00", "horaFim", "12:00"),
                Map.of("diaSemana", 1, "horaInicio", "11:00", "horaFim", "14:00"))));
        assertEquals(400, sobreposta.status());

        Resposta invertida = put("/api/provedor/horarios", p.token(), Map.of("faixas", List.of(
                Map.of("diaSemana", 1, "horaInicio", "12:00", "horaFim", "08:00"))));
        assertEquals(400, invertida.status());

        Resposta diaInvalido = put("/api/provedor/horarios", p.token(), Map.of("faixas", List.of(
                Map.of("diaSemana", 8, "horaInicio", "08:00", "horaFim", "12:00"))));
        assertEquals(400, diaInvalido.status());

        Resposta nova = put("/api/provedor/horarios", p.token(), Map.of("faixas", List.of(
                Map.of("diaSemana", 2, "horaInicio", "09:00", "horaFim", "17:00"))));
        assertEquals(200, nova.status());
        assertEquals(1, nova.corpo().size());
        assertEquals("terça-feira", nova.corpo().get(0).get("diaNome").asString());
        assertEquals(1, get("/api/negocios/" + p.negocioId() + "/funcionamento", null).corpo().size());
    }

    @Test
    @DisplayName("Negócio: um por profissional, CEP sem máscara, link público e busca")
    void negocio() {
        Conta p = novoProfissionalComNegocio();
        Resposta meu = get("/api/provedor/negocio", p.token());
        assertEquals("55150000", meu.texto("cep"));
        assertTrue(meu.texto("linkPublico").endsWith("/estabelecimento/" + p.negocioId() + "?tipo=horario"));

        Resposta atualizado = put("/api/provedor/negocio", p.token(),
                Map.of("nome", "Nome Novo Unico " + p.id(), "categoria", "salao"));
        assertEquals(p.negocioId().toString(), atualizado.texto("id")); // atualizou, não criou outro

        assertEquals(1, get("/api/negocios?categoria=salao&q=" + p.id(), null).corpo().size());
        novoServico(p, "Escova especial " + p.id(), 45, "50.00");
        assertEquals(1, get("/api/negocios/busca?q=escova%20especial%20" + p.id(), null).corpo().size());
        assertEquals(400, put("/api/provedor/negocio", p.token(),
                Map.of("nome", "X", "categoria", "Categoria Inválida")).status());
        assertEquals(404, get("/api/negocios/" + UUID.randomUUID(), null).status());
    }
}
