package com.stizy.horario;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

/** STZ-21: validação da grade antes de chegar no banco. */
class HorarioFuncionamentoServiceTest {

    private static FaixaHorarioRequest faixa(int dia, String inicio, String fim) {
        return new FaixaHorarioRequest(dia, LocalTime.parse(inicio), LocalTime.parse(fim));
    }

    @Test
    void faixasQueSoEncostamSaoAceitas() {
        assertDoesNotThrow(() -> HorarioFuncionamentoService.validarSemSobreposicao(List.of(
                faixa(2, "08:00", "12:00"), faixa(2, "12:00", "18:00"))));
    }

    @Test
    void mesmoHorarioEmDiasDiferentesEhAceito() {
        assertDoesNotThrow(() -> HorarioFuncionamentoService.validarSemSobreposicao(List.of(
                faixa(1, "08:00", "12:00"), faixa(2, "08:00", "12:00"))));
    }

    @Test
    void faixasQueSeCruzamSaoRecusadas() {
        assertThrows(ResponseStatusException.class, () -> HorarioFuncionamentoService.validarSemSobreposicao(List.of(
                faixa(3, "13:00", "18:00"), faixa(3, "08:00", "13:30"))));
    }

    @Test
    void fimDepoisDoInicio() {
        org.junit.jupiter.api.Assertions.assertFalse(faixa(1, "10:00", "09:00").isIntervaloValido());
        org.junit.jupiter.api.Assertions.assertFalse(faixa(1, "10:00", "10:00").isIntervaloValido());
    }
}
