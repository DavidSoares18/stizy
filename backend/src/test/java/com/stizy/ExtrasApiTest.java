package com.stizy;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.JsonNode;

/** EXTRA-01 (bloqueios/férias), EXTRA-03 (histórico por cliente) e EXTRA-05 (relatórios). */
class ExtrasApiTest extends ApiTeste {

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    @DisplayName("Férias bloqueiam a agenda; não dá para bloquear por cima de agendamento")
    void bloqueiosEAusencias() {
        Conta p = novoProfissionalComNegocio();
        Conta cliente = novoCliente();
        UUID corte = novoServico(p, "Corte", 30, "30.00");
        LocalDate ferias = hojeRecife().plusDays(6);

        Resposta ausencia = post("/api/provedor/ausencias", p.token(),
                Map.of("dataInicio", ferias.toString(), "dataFim", ferias.plusDays(1).toString(), "motivo", "Férias"));
        assertEquals(201, ausencia.status(), () -> ausencia.corpo().toString());
        assertEquals(utc(ferias, "00:00"), ausencia.texto("inicio"));
        assertEquals(utc(ferias.plusDays(2), "00:00"), ausencia.texto("fim"));

        JsonNode horarios = get("/api/negocios/" + p.negocioId() + "/horarios?data=" + ferias
                + "&servicoId=" + corte, null).corpo();
        assertTrue(horarios.size() > 0);
        for (JsonNode h : horarios) {
            assertEquals("bloqueado", h.get("situacao").asString());
        }
        assertEquals(409, post("/api/agendamentos", cliente.token(), Map.of("negocioId", p.negocioId(),
                "servicoId", corte, "inicioUtc", utc(ferias.plusDays(1), "09:00"))).status());

        // Bloquear um horário que já tem agendamento: 409
        LocalDate dia = hojeRecife().plusDays(2);
        assertEquals(201, post("/api/agendamentos", cliente.token(), Map.of("negocioId", p.negocioId(),
                "servicoId", corte, "inicioUtc", utc(dia, "09:00"))).status());
        assertEquals(409, post("/api/provedor/bloqueios", p.token(),
                Map.of("inicio", utc(dia, "08:00"), "fim", utc(dia, "12:00"))).status());
        // Bloqueio de um horário livre (RF17) e remoção
        Resposta bloqueio = post("/api/provedor/bloqueios", p.token(),
                Map.of("inicio", utc(dia, "15:00"), "fim", utc(dia, "15:30"), "motivo", "Dentista"));
        assertEquals(201, bloqueio.status());
        assertEquals(400, post("/api/provedor/bloqueios", p.token(),
                Map.of("inicio", utc(dia, "16:00"), "fim", utc(dia, "15:00"))).status());
        assertEquals(2, get("/api/provedor/bloqueios", p.token()).corpo().size());
        assertEquals(204, delete("/api/provedor/bloqueios/" + bloqueio.texto("id"), p.token()).status());
        assertEquals(1, get("/api/provedor/bloqueios", p.token()).corpo().size());
    }

    @Test
    @DisplayName("Histórico por cliente e relatório de faturamento com atendimentos passados")
    void historicoERelatorio() {
        Conta p = novoProfissionalComNegocio();
        Conta ana = novoCliente();
        Conta bruno = novoCliente();
        UUID corte = novoServico(p, "Corte", 30, "40.00");
        UUID barba = novoServico(p, "Barba", 30, "25.50");

        // Atendimentos que já aconteceram (a API não deixa reservar no passado, então entram direto no banco)
        Instant ontem = Instant.now().minus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        UUID a1 = inserirPassado(ana, p, corte, ontem, "40.00");
        UUID a2 = inserirPassado(ana, p, barba, ontem.plus(1, ChronoUnit.HOURS), "25.50");
        UUID b1 = inserirPassado(bruno, p, corte, ontem.plus(2, ChronoUnit.HOURS), "40.00");

        assertEquals("concluido", put("/api/provedor/agendamentos/" + a1 + "/concluir", p.token(), null).texto("status"));
        assertEquals("concluido", put("/api/provedor/agendamentos/" + a2 + "/concluir", p.token(), null).texto("status"));
        assertEquals("faltou", put("/api/provedor/agendamentos/" + b1 + "/faltou", p.token(), null).texto("status"));
        assertEquals(409, put("/api/provedor/agendamentos/" + a1 + "/concluir", p.token(), null).status());

        // EXTRA-03
        JsonNode clientes = get("/api/provedor/clientes", p.token()).corpo();
        assertEquals(2, clientes.size());
        Resposta historicoAna = get("/api/provedor/clientes/" + ana.id() + "/historico", p.token());
        assertEquals(200, historicoAna.status());
        assertEquals(2, historicoAna.corpo().get("cliente").get("concluidos").asInt());
        assertEquals(0, new BigDecimal("65.50").compareTo(historicoAna.corpo().get("cliente").get("valorGasto").decimalValue()));
        assertEquals(2, historicoAna.corpo().get("agendamentos").size());
        // Outro profissional não vê o histórico desses clientes
        Conta outro = novoProfissionalComNegocio();
        assertEquals(404, get("/api/provedor/clientes/" + ana.id() + "/historico", outro.token()).status());

        // EXTRA-05
        LocalDate dia = ontem.atZone(RECIFE).toLocalDate();
        Resposta relatorio = get("/api/provedor/relatorios?inicio=" + dia.minusDays(1) + "&fim=" + dia.plusDays(1),
                p.token());
        assertEquals(200, relatorio.status(), () -> relatorio.corpo().toString());
        JsonNode r = relatorio.corpo();
        assertEquals(3, r.get("totalAgendamentos").asInt());
        assertEquals(2, r.get("concluidos").asInt());
        assertEquals(1, r.get("faltas").asInt());
        assertEquals(0, new BigDecimal("65.50").compareTo(r.get("faturamento").decimalValue()));
        assertEquals(0, new BigDecimal("32.75").compareTo(r.get("ticketMedio").decimalValue()));
        assertEquals(0, new BigDecimal("66.7").compareTo(r.get("taxaComparecimento").decimalValue()));
        assertEquals("Corte", r.get("porServico").get(0).get("nome").asString());
        assertEquals(400, get("/api/provedor/relatorios?inicio=2026-12-10&fim=2026-12-01", p.token()).status());
    }

    private UUID inserirPassado(Conta cliente, Conta profissional, UUID servico, Instant inicio, String preco) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                insert into agendamentos (id, cliente_id, profissional_id, servico_id, inicio, fim, preco)
                values (?, ?, ?, ?, ?, ?, ?)
                """, id, cliente.id(), profissional.id(), servico, Timestamp.from(inicio),
                Timestamp.from(inicio.plus(30, ChronoUnit.MINUTES)), new BigDecimal(preco));
        return id;
    }
}
