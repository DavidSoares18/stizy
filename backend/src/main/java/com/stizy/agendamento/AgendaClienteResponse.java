package com.stizy.agendamento;

import java.util.List;

/** Tela "Agenda" do cliente: próximos (confirmados e futuros) e anteriores (o resto, mais recente primeiro). */
public record AgendaClienteResponse(List<AgendamentoResponse> proximos, List<AgendamentoResponse> anteriores) {
}
