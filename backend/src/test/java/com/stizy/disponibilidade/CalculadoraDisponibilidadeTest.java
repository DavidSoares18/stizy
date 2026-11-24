package com.stizy.disponibilidade;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.stizy.disponibilidade.CalculadoraDisponibilidade.Faixa;
import com.stizy.disponibilidade.CalculadoraDisponibilidade.Horario;
import com.stizy.disponibilidade.CalculadoraDisponibilidade.Intervalo;
import com.stizy.disponibilidade.CalculadoraDisponibilidade.Situacao;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** STZ-21: datas, intervalos e casos-limite do cálculo de horários livres. */
class CalculadoraDisponibilidadeTest {

    private static final ZoneId RECIFE = ZoneId.of("America/Recife");
    private static final LocalDate DIA = LocalDate.of(2026, 12, 1); // terça
    private static final Instant MUITO_ANTES = Instant.parse("2026-01-01T00:00:00Z");
    private static final List<Faixa> MANHA = List.of(new Faixa(LocalTime.of(8, 0), LocalTime.of(10, 0)));

    private static List<Horario> calcular(List<Faixa> faixas, int duracao, int passo,
                                          List<Intervalo> ocupados, List<Intervalo> bloqueios, Instant minimo) {
        return CalculadoraDisponibilidade.calcular(DIA, RECIFE, faixas, duracao, passo, ocupados, bloqueios, minimo);
    }

    private static Instant recife(int hora, int minuto) {
        return DIA.atTime(hora, minuto).atZone(RECIFE).toInstant();
    }

    private static List<String> horas(List<Horario> horarios) {
        return horarios.stream().map(h -> h.hora().toString()).toList();
    }

    @Test
    @DisplayName("Gera horários de passo em passo e só oferece os que cabem inteiros na faixa")
    void respeitaDuracaoDoServico() {
        List<Horario> horarios = calcular(MANHA, 60, 30, List.of(), List.of(), MUITO_ANTES);
        // 08:00-09:00, 08:30-09:30, 09:00-10:00. 09:30 não cabe (terminaria 10:30).
        assertEquals(List.of("08:00", "08:30", "09:00"), horas(horarios));
        assertTrue(horarios.stream().allMatch(Horario::livre));
    }

    @Test
    @DisplayName("Serviço que termina exatamente no fim da faixa é aceito")
    void terminaNoFimDaFaixa() {
        List<Horario> horarios = calcular(MANHA, 120, 30, List.of(), List.of(), MUITO_ANTES);
        assertEquals(List.of("08:00"), horas(horarios));
    }

    @Test
    @DisplayName("Serviço maior que a faixa não gera nenhum horário")
    void servicoMaiorQueFaixa() {
        assertTrue(calcular(MANHA, 121, 30, List.of(), List.of(), MUITO_ANTES).isEmpty());
    }

    @Test
    @DisplayName("Pausa para almoço: duas faixas no dia, nenhum horário atravessa a pausa")
    void pausaAlmoco() {
        List<Faixa> faixas = List.of(
                new Faixa(LocalTime.of(13, 0), LocalTime.of(14, 0)),
                new Faixa(LocalTime.of(11, 0), LocalTime.of(12, 0)));
        List<Horario> horarios = calcular(faixas, 60, 30, List.of(), List.of(), MUITO_ANTES);
        assertEquals(List.of("11:00", "13:00"), horas(horarios));
    }

    @Test
    @DisplayName("Dia sem grade não tem horários")
    void diaSemGrade() {
        assertTrue(calcular(List.of(), 30, 30, List.of(), List.of(), MUITO_ANTES).isEmpty());
    }

    @Test
    @DisplayName("Hora local de Recife vira UTC (+3h)")
    void converteFusoParaUtc() {
        Horario primeiro = calcular(MANHA, 30, 30, List.of(), List.of(), MUITO_ANTES).getFirst();
        assertEquals(Instant.parse("2026-12-01T11:00:00Z"), primeiro.inicio());
        assertEquals(Instant.parse("2026-12-01T11:30:00Z"), primeiro.fim());
    }

    @Test
    @DisplayName("Agendamento existente ocupa os horários que se cruzam com ele, e só esses")
    void ocupado() {
        List<Intervalo> ocupados = List.of(new Intervalo(recife(8, 30), recife(9, 0)));
        List<Horario> horarios = calcular(MANHA, 30, 30, ocupados, List.of(), MUITO_ANTES);
        assertEquals(Situacao.LIVRE, horarios.get(0).situacao());   // 08:00-08:30 só encosta
        assertEquals(Situacao.OCUPADO, horarios.get(1).situacao()); // 08:30-09:00
        assertEquals(Situacao.LIVRE, horarios.get(2).situacao());   // 09:00-09:30 só encosta
    }

    @Test
    @DisplayName("Serviço longo fica indisponível se qualquer parte dele cruzar um agendamento")
    void servicoLongoCruzaAgendamento() {
        List<Intervalo> ocupados = List.of(new Intervalo(recife(9, 0), recife(9, 30)));
        List<Horario> horarios = calcular(MANHA, 60, 30, ocupados, List.of(), MUITO_ANTES);
        // 08:00-09:00 livre; 08:30-09:30 cruza; 09:00-10:00 cruza
        assertEquals(List.of(Situacao.LIVRE, Situacao.OCUPADO, Situacao.OCUPADO),
                horarios.stream().map(Horario::situacao).toList());
    }

    @Test
    @DisplayName("Bloqueio tem prioridade sobre ocupado, e passado sobre os dois")
    void prioridadeDasSituacoes() {
        List<Intervalo> periodo = List.of(new Intervalo(recife(8, 0), recife(10, 0)));
        assertTrue(calcular(MANHA, 30, 30, periodo, periodo, MUITO_ANTES).stream()
                .allMatch(h -> h.situacao() == Situacao.BLOQUEADO));
        assertTrue(calcular(MANHA, 30, 30, periodo, periodo, recife(12, 0)).stream()
                .allMatch(h -> h.situacao() == Situacao.PASSADO));
    }

    @Test
    @DisplayName("Horários que começam antes do mínimo (agora + antecedência) aparecem como passados")
    void passado() {
        List<Horario> horarios = calcular(MANHA, 30, 30, List.of(), List.of(), recife(9, 0));
        assertEquals(List.of(Situacao.PASSADO, Situacao.PASSADO, Situacao.LIVRE, Situacao.LIVRE),
                horarios.stream().map(Horario::situacao).toList());
    }

    @Test
    @DisplayName("Duração ou passo inválidos são recusados")
    void parametrosInvalidos() {
        assertThrows(IllegalArgumentException.class, () -> calcular(MANHA, 0, 30, List.of(), List.of(), MUITO_ANTES));
        assertThrows(IllegalArgumentException.class, () -> calcular(MANHA, 30, 0, List.of(), List.of(), MUITO_ANTES));
    }

    @Test
    @DisplayName("cabeNaGrade: dentro, no limite e fora da faixa")
    void cabeNaGrade() {
        assertTrue(CalculadoraDisponibilidade.cabeNaGrade(recife(8, 0), 120, RECIFE, MANHA));
        assertTrue(CalculadoraDisponibilidade.cabeNaGrade(recife(8, 15), 30, RECIFE, MANHA)); // fora do passo, mas dentro
        assertFalse(CalculadoraDisponibilidade.cabeNaGrade(recife(7, 30), 60, RECIFE, MANHA));
        assertFalse(CalculadoraDisponibilidade.cabeNaGrade(recife(9, 30), 60, RECIFE, MANHA));
        assertFalse(CalculadoraDisponibilidade.cabeNaGrade(recife(12, 0), 30, RECIFE, MANHA));
    }

    @Test
    @DisplayName("cabeNaGrade: atendimento que vira a meia-noite é recusado")
    void viraMeiaNoite() {
        List<Faixa> noite = List.of(new Faixa(LocalTime.of(22, 0), LocalTime.of(23, 59)));
        assertFalse(CalculadoraDisponibilidade.cabeNaGrade(recife(23, 30), 60, RECIFE, noite));
    }
}
