package com.stizy;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * STZ-25: N clientes tentam reservar o mesmo horário no mesmo instante.
 * Esperado: exatamente 1 reserva (201) e todas as outras recusadas com 409, nunca 500.
 */
class ReservasSimultaneasTest extends ApiTeste {

    private static final int PEDIDOS = 20;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    @DisplayName("20 reservas simultâneas no mesmo horário: 1 confirmada, 19 recusadas com 409")
    void mesmoHorario() throws Exception {
        Conta profissional = novoProfissionalComNegocio();
        UUID servico = novoServico(profissional, "Corte", 30, "30.00");
        LocalDate dia = hojeRecife().plusDays(4);
        List<Conta> clientes = new ArrayList<>();
        for (int i = 0; i < PEDIDOS; i++) {
            clientes.add(novoCliente());
        }
        List<Integer> status = disparar(clientes, cliente -> Map.of("negocioId", profissional.negocioId(),
                "servicoId", servico, "inicioUtc", utc(dia, "10:00")));

        assertEquals(1, status.stream().filter(s -> s == 201).count(), () -> "status: " + status);
        assertEquals(PEDIDOS - 1, status.stream().filter(s -> s == 409).count(), () -> "status: " + status);
        assertEquals(1, ativosDoProfissional(profissional.id()));
    }

    @Test
    @DisplayName("Reservas simultâneas em horários que se cruzam (09:30, 10:00, 10:30 de 60 min): sem sobreposição")
    void horariosQueSeCruzam() throws Exception {
        Conta profissional = novoProfissionalComNegocio();
        UUID servico = novoServico(profissional, "Corte longo", 60, "50.00");
        LocalDate dia = hojeRecife().plusDays(5);
        String[] horas = {"09:30", "10:00", "10:30"};
        List<Conta> clientes = new ArrayList<>();
        for (int i = 0; i < 15; i++) {
            clientes.add(novoCliente());
        }
        int[] i = {0};
        List<Integer> status = disparar(clientes, cliente -> Map.of("negocioId", profissional.negocioId(),
                "servicoId", servico, "inicioUtc", utc(dia, horas[i[0]++ % horas.length])));

        assertEquals(0, status.stream().filter(s -> s != 201 && s != 409).count(), () -> "status: " + status);
        // 09:30-10:30 e 10:30-11:30 podem coexistir; 10:00 cruza os dois. No máximo 2 gravados, sem sobreposição.
        Integer sobrepostos = jdbc.queryForObject("""
                select count(*) from agendamentos a join agendamentos b
                  on a.profissional_id = b.profissional_id and a.id < b.id
                 and tstzrange(a.inicio, a.fim, '[)') && tstzrange(b.inicio, b.fim, '[)')
                where a.profissional_id = ? and a.status <> 'CANCELADO' and b.status <> 'CANCELADO'
                """, Integer.class, profissional.id());
        assertEquals(0, sobrepostos);
        assertEquals(status.stream().filter(s -> s == 201).count(), ativosDoProfissional(profissional.id()));
    }

    private interface Corpo {
        Map<String, Object> de(Conta cliente);
    }

    /** Monta todos os pedidos antes e solta todos juntos com um CountDownLatch. */
    private List<Integer> disparar(List<Conta> clientes, Corpo corpo) throws Exception {
        List<Map<String, Object>> corpos = clientes.stream().map(corpo::de).toList();
        ExecutorService pool = Executors.newFixedThreadPool(clientes.size());
        CountDownLatch largada = new CountDownLatch(1);
        try {
            List<Future<Integer>> futuros = new ArrayList<>();
            for (int i = 0; i < clientes.size(); i++) {
                Conta cliente = clientes.get(i);
                Map<String, Object> c = corpos.get(i);
                futuros.add(pool.submit(() -> {
                    largada.await();
                    return post("/api/agendamentos", cliente.token(), c).status();
                }));
            }
            largada.countDown();
            List<Integer> status = new ArrayList<>();
            for (Future<Integer> f : futuros) {
                status.add(f.get());
            }
            return status;
        } finally {
            pool.shutdownNow();
        }
    }

    private long ativosDoProfissional(UUID profissionalId) {
        Long total = jdbc.queryForObject(
                "select count(*) from agendamentos where profissional_id = ? and status <> 'CANCELADO'",
                Long.class, profissionalId);
        return total == null ? 0 : total;
    }
}
