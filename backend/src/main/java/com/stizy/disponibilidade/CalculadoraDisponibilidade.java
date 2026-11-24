package com.stizy.disponibilidade;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * STZ-18: cálculo de horários livres, sem acesso ao banco (fácil de testar).
 *
 * Regras:
 * - Os horários candidatos começam no início de cada faixa da grade e andam de "passo" em "passo" minutos.
 * - Um horário só é oferecido se início + duração do serviço couber inteiro dentro da mesma faixa.
 * - Intervalos são [inicio, fim): 09:00-09:30 e 09:30-10:00 não se cruzam.
 * - Prioridade da situação: PASSADO > BLOQUEADO > OCUPADO > LIVRE.
 */
public final class CalculadoraDisponibilidade {

    private CalculadoraDisponibilidade() {
    }

    /** Faixa da grade na hora local do negócio. */
    public record Faixa(LocalTime inicio, LocalTime fim) {
    }

    /** Intervalo de tempo em UTC; o fim não conta. */
    public record Intervalo(Instant inicio, Instant fim) {
        public boolean cruza(Instant outroInicio, Instant outroFim) {
            return inicio.isBefore(outroFim) && fim.isAfter(outroInicio);
        }
    }

    public enum Situacao { LIVRE, OCUPADO, BLOQUEADO, PASSADO }

    public record Horario(LocalTime hora, Instant inicio, Instant fim, Situacao situacao) {
        public boolean livre() {
            return situacao == Situacao.LIVRE;
        }
    }

    public static List<Horario> calcular(LocalDate data,
                                         ZoneId fuso,
                                         List<Faixa> faixasDoDia,
                                         int duracaoMinutos,
                                         int passoMinutos,
                                         List<Intervalo> ocupados,
                                         List<Intervalo> bloqueios,
                                         Instant inicioMinimo) {
        if (duracaoMinutos <= 0 || passoMinutos <= 0) {
            throw new IllegalArgumentException("Duração e passo precisam ser positivos");
        }
        List<Horario> horarios = new ArrayList<>();
        List<Faixa> ordenadas = faixasDoDia.stream().sorted(Comparator.comparing(Faixa::inicio)).toList();
        for (Faixa faixa : ordenadas) {
            int fimFaixa = minutos(faixa.fim());
            for (int m = minutos(faixa.inicio()); m + duracaoMinutos <= fimFaixa; m += passoMinutos) {
                LocalTime hora = LocalTime.of(m / 60, m % 60);
                Instant inicio = data.atTime(hora).atZone(fuso).toInstant();
                Instant fim = inicio.plusSeconds(duracaoMinutos * 60L);
                horarios.add(new Horario(hora, inicio, fim, situacao(inicio, fim, ocupados, bloqueios, inicioMinimo)));
            }
        }
        return horarios;
    }

    /** O atendimento inteiro [inicio, inicio + duração) cabe numa faixa do dia (hora local)? */
    public static boolean cabeNaGrade(Instant inicio, int duracaoMinutos, ZoneId fuso, List<Faixa> faixasDoDia) {
        ZonedDateTime local = inicio.atZone(fuso);
        ZonedDateTime localFim = local.plusMinutes(duracaoMinutos);
        if (!localFim.toLocalDate().equals(local.toLocalDate())) {
            return false;
        }
        LocalTime horaInicio = local.toLocalTime();
        LocalTime horaFim = localFim.toLocalTime();
        return faixasDoDia.stream().anyMatch(f -> !horaInicio.isBefore(f.inicio()) && !horaFim.isAfter(f.fim()));
    }

    private static Situacao situacao(Instant inicio, Instant fim, List<Intervalo> ocupados,
                                     List<Intervalo> bloqueios, Instant inicioMinimo) {
        if (inicio.isBefore(inicioMinimo)) {
            return Situacao.PASSADO;
        }
        if (bloqueios.stream().anyMatch(b -> b.cruza(inicio, fim))) {
            return Situacao.BLOQUEADO;
        }
        if (ocupados.stream().anyMatch(o -> o.cruza(inicio, fim))) {
            return Situacao.OCUPADO;
        }
        return Situacao.LIVRE;
    }

    private static int minutos(LocalTime hora) {
        return hora.getHour() * 60 + hora.getMinute();
    }
}
