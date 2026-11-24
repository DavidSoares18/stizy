package com.stizy;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;

/**
 * STZ-19 (disponibilidade), STZ-23 (reserva), STZ-26 (agenda), STZ-29 (cancelar/remarcar)
 * e STZ-34 (jornada ponta a ponta pela API).
 */
class AgendamentoApiTest extends ApiTeste {

    private Resposta reservar(Conta cliente, Conta profissional, UUID servicoId, LocalDate dia, String hora) {
        return post("/api/agendamentos", cliente.token(), Map.of(
                "negocioId", profissional.negocioId(), "servicoId", servicoId,
                "inicioUtc", utc(dia, hora), "pagamento", "presencial"));
    }

    private JsonNode horarios(Conta profissional, UUID servicoId, LocalDate dia) {
        Resposta r = get("/api/negocios/" + profissional.negocioId() + "/horarios?data=" + dia
                + "&servicoId=" + servicoId, null);
        assertEquals(200, r.status(), () -> r.corpo().toString());
        return r.corpo();
    }

    private static JsonNode horario(JsonNode horarios, String hora) {
        for (JsonNode h : horarios) {
            if (h.get("hora").asString().equals(hora)) {
                return h;
            }
        }
        throw new AssertionError("Horário " + hora + " não encontrado em " + horarios);
    }

    @Test
    @DisplayName("Jornada completa: consultar horários, reservar, conflito, agenda, remarcar e cancelar")
    void jornadaCompleta() {
        Conta profissional = novoProfissionalComNegocio();
        Conta cliente = novoCliente();
        Conta outroCliente = novoCliente();
        UUID corte = novoServico(profissional, "Corte", 60, "40.00");
        LocalDate dia = hojeRecife().plusDays(2);

        // Disponibilidade: serviço de 60 min, passo de 30, faixas 08-12 e 13-18 => 7 + 9 = 16 horários
        JsonNode livres = horarios(profissional, corte, dia);
        assertEquals(16, livres.size());
        assertEquals("08:00", livres.get(0).get("hora").asString());
        assertEquals(utc(dia, "08:00"), livres.get(0).get("inicioUtc").asString());
        assertTrue(horario(livres, "11:00").get("livre").asBoolean());
        assertThrowsNoHorario(livres, "11:30"); // terminaria 12:30, dentro da pausa

        // Reserva confirmada (201), com preço copiado e fim calculado
        Resposta reserva = reservar(cliente, profissional, corte, dia, "09:00");
        assertEquals(201, reserva.status(), () -> reserva.corpo().toString());
        assertEquals("confirmado", reserva.texto("status"));
        assertEquals(utc(dia, "10:00"), reserva.texto("fimUtc"));
        assertEquals(40.0, reserva.corpo().get("valor").asDouble());
        assertEquals(profissional.negocioId().toString(), reserva.texto("negocioId"));
        String agendamentoId = reserva.texto("id");

        // Mesmo horário ou horário que se cruza: 409. Horário que só encosta: 201.
        assertEquals(409, reservar(outroCliente, profissional, corte, dia, "09:00").status());
        assertEquals(409, reservar(outroCliente, profissional, corte, dia, "09:30").status());
        assertEquals(409, reservar(outroCliente, profissional, corte, dia, "08:30").status());
        assertEquals(201, reservar(outroCliente, profissional, corte, dia, "10:00").status());

        // A consulta passa a mostrar os horários como ocupados
        JsonNode depois = horarios(profissional, corte, dia);
        assertFalse(horario(depois, "09:00").get("livre").asBoolean());
        assertEquals("ocupado", horario(depois, "09:00").get("situacao").asString());
        assertFalse(horario(depois, "08:30").get("livre").asBoolean());
        assertTrue(horario(depois, "08:00").get("livre").asBoolean());

        // Agenda diária e semanal do profissional
        Resposta agendaDia = get("/api/provedor/agenda?data=" + dia, profissional.token());
        assertEquals(200, agendaDia.status());
        assertEquals(2, agendaDia.corpo().get("resumo").get("atendimentos").asInt());
        assertEquals(80.0, agendaDia.corpo().get("resumo").get("previsto").asDouble());
        JsonNode linha0900 = horario(agendaDia.corpo().get("horarios"), "09:00");
        assertEquals(agendamentoId, linha0900.get("agendamentoId").asString());
        assertEquals("Corte", linha0900.get("servico").asString());
        assertEquals(agendamentoId, agendaDia.corpo().get("proximo").get("id").asString());
        Resposta semana = get("/api/provedor/agenda/semana?data=" + dia, profissional.token());
        assertEquals(7, semana.corpo().get("dias").size());
        assertEquals(2, semana.corpo().get("atendimentos").asInt());

        // Agenda do cliente
        Resposta minha = get("/api/agendamentos", cliente.token());
        assertEquals(1, minha.corpo().get("proximos").size());

        // Remarcar para 14:00: o horário antigo fica livre
        Resposta remarcada = put("/api/agendamentos/" + agendamentoId + "/remarcar", cliente.token(),
                Map.of("inicioUtc", utc(dia, "14:00")));
        assertEquals(200, remarcada.status(), () -> remarcada.corpo().toString());
        assertEquals(utc(dia, "15:00"), remarcada.texto("fimUtc"));
        assertTrue(horario(horarios(profissional, corte, dia), "09:00").get("livre").asBoolean());
        // Remarcar para cima de outro agendamento: 409
        assertEquals(409, put("/api/agendamentos/" + agendamentoId + "/remarcar", cliente.token(),
                Map.of("inicioUtc", utc(dia, "10:30"))).status());

        // Outro cliente não vê nem cancela (404); o dono cancela; cancelar de novo = 409
        assertEquals(404, get("/api/agendamentos/" + agendamentoId, outroCliente.token()).status());
        assertEquals(404, delete("/api/agendamentos/" + agendamentoId, outroCliente.token()).status());
        Resposta cancelada = delete("/api/agendamentos/" + agendamentoId, cliente.token());
        assertEquals(200, cancelada.status());
        assertEquals("cancelado", cancelada.texto("status"));
        assertEquals(409, delete("/api/agendamentos/" + agendamentoId, cliente.token()).status());
        assertEquals(409, put("/api/agendamentos/" + agendamentoId + "/remarcar", cliente.token(),
                Map.of("inicioUtc", utc(dia, "16:00"))).status());

        // Cancelar libera o horário: outro cliente reserva 14:00
        assertEquals(201, reservar(outroCliente, profissional, corte, dia, "14:00").status());
        Resposta historicoCliente = get("/api/agendamentos", cliente.token());
        assertEquals(0, historicoCliente.corpo().get("proximos").size());
        assertEquals(1, historicoCliente.corpo().get("anteriores").size());
    }

    @Test
    @DisplayName("Regras da reserva: grade, passado, limite de dias, próprio negócio e serviço inativo")
    void regrasDaReserva() {
        Conta profissional = novoProfissionalComNegocio();
        Conta cliente = novoCliente();
        UUID corte = novoServico(profissional, "Corte", 60, "40.00");
        LocalDate dia = hojeRecife().plusDays(3);

        assertEquals(400, reservar(cliente, profissional, corte, dia, "07:30").status());  // antes de abrir
        assertEquals(400, reservar(cliente, profissional, corte, dia, "11:30").status());  // atravessa o almoço
        assertEquals(400, reservar(cliente, profissional, corte, dia, "17:30").status());  // passa do fechamento
        assertEquals(400, reservar(cliente, profissional, corte, hojeRecife().minusDays(1), "09:00").status());
        assertEquals(400, reservar(cliente, profissional, corte, hojeRecife().plusDays(120), "09:00").status());
        assertEquals(400, reservar(profissional, profissional, corte, dia, "09:00").status()); // consigo mesmo
        assertEquals(404, reservar(cliente, profissional, UUID.randomUUID(), dia, "09:00").status());
        assertEquals(400, post("/api/agendamentos", cliente.token(), Map.of("negocioId", profissional.negocioId())).status());

        // Profissional também pode agendar como cliente de OUTRO profissional (RF02)
        Conta outroProfissional = novoProfissionalComNegocio();
        assertEquals(201, reservar(outroProfissional, profissional, corte, dia, "15:00").status());

        // Serviço desativado não aceita reserva nem consulta
        delete("/api/servicos/" + corte, profissional.token());
        assertEquals(404, reservar(cliente, profissional, corte, dia, "09:00").status());
        assertEquals(404, get("/api/negocios/" + profissional.negocioId() + "/horarios?data=" + dia
                + "&servicoId=" + corte, null).status());

        // "inicio" (nome usado hoje em Pagamento.jsx) também é aceito
        UUID barba = novoServico(profissional, "Barba", 30, "20.00");
        assertEquals(201, post("/api/agendamentos", cliente.token(), Map.of("negocioId", profissional.negocioId(),
                "servicoId", barba, "inicio", utc(dia, "08:00"))).status());
    }

    @Test
    @DisplayName("Concluir/faltou só depois do início; profissional cancela a qualquer momento")
    void finalizarAtendimento() {
        Conta profissional = novoProfissionalComNegocio();
        Conta cliente = novoCliente();
        UUID corte = novoServico(profissional, "Corte", 30, "40.00");
        Resposta futura = reservar(cliente, profissional, corte, hojeRecife().plusDays(1), "09:00");
        String id = futura.texto("id");

        assertEquals(409, put("/api/provedor/agendamentos/" + id + "/concluir", profissional.token(), null).status());
        assertEquals(403, put("/api/provedor/agendamentos/" + id + "/concluir", cliente.token(), null).status());
        assertEquals(200, get("/api/provedor/agendamentos/" + id, profissional.token()).status());
        Resposta cancelada = delete("/api/agendamentos/" + id, profissional.token());
        assertEquals("cancelado", cancelada.texto("status"));
    }

    private static void assertThrowsNoHorario(JsonNode horarios, String hora) {
        for (JsonNode h : horarios) {
            assertFalse(h.get("hora").asString().equals(hora), "Não deveria oferecer " + hora);
        }
    }
}
