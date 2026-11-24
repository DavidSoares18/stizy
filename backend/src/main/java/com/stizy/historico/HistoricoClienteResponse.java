package com.stizy.historico;

import com.stizy.agendamento.AgendamentoResponse;
import java.util.List;

public record HistoricoClienteResponse(ClienteResumoResponse cliente, List<AgendamentoResponse> agendamentos) {
}
