/**
 * Agendamentos e pedidos do cliente (RF05, RF07, RF08, RF13).
 */

/**
 * Agendamentos futuros e anteriores do cliente (tela Agenda).
 * BACKEND: GET /agendamentos
 * Resposta: {
 *   proximos:  Agendamento[],
 *   anteriores: Agendamento[]
 * }
 * Agendamento: {
 *   id, titulo (nome do serviço/produto), negocioId, negocioNome,
 *   inicioUtc (ISO 8601 em UTC - o front converte para o fuso local),
 *   valor, pagamento: 'online' | 'presencial', tipo: 'servico' | 'entrega',
 *   status: 'confirmado' | 'cancelado' | 'concluido'
 * }
 */
export async function listarAgendamentos() {
    // BACKEND: return requisicao('GET', '/agendamentos');
    return { proximos: [], anteriores: [] };
}

/**
 * Confirma o agendamento e BLOQUEIA o horário (RF07, RNF05).
 * BACKEND: POST /agendamentos
 * body: { negocioId, servicoId, inicioUtc, pagamento: 'online' | 'presencial' }
 * Em caso de concorrência (duas pessoas no mesmo horário) a API responde 409
 * e a tela deve avisar e voltar para a escolha de horário.
 */
export async function criarAgendamento(dados) {
    // BACKEND: return requisicao('POST', '/agendamentos', dados);
    return { ok: true, dados };
}

/**
 * Compra de produtos (retirar/entregar).
 * BACKEND: POST /pedidos
 * body: { negocioId, itens: [{ produtoId, quantidade }], entrega: 'retirar' | 'entregar', pagamento }
 * A API valida estoque (RF19) e responde 409 com { produtoId } se algo esgotou.
 */
export async function criarPedido(dados) {
    // BACKEND: return requisicao('POST', '/pedidos', dados);
    return { ok: true, dados };
}

/**
 * Cancelar / remarcar (RF08).
 * BACKEND: DELETE /agendamentos/:id            (cancelar)
 *          PUT    /agendamentos/:id/remarcar   body: { inicioUtc }
 */
export async function cancelarAgendamento(id) {
    // BACKEND: return requisicao('DELETE', `/agendamentos/${id}`);
    void id;
    return { ok: true };
}

/**
 * Solicitação de serviço "a combinar" (RF16) - abre contato pelo WhatsApp/chat.
 * BACKEND: POST /solicitacoes   body: { negocioId, servicosIds: string[] }
 */
export async function solicitarServico(dados) {
    // BACKEND: return requisicao('POST', '/solicitacoes', dados);
    return { ok: true, dados };
}

/**
 * Dados do pagamento pelo STIZY (QR Code / Pix).
 * BACKEND: POST /pagamentos   body: { pedidoId | agendamentoId }
 * Resposta: { qrCodeImagem (base64/URL) | qrCodePayload (string), valor, status: 'aguardando' | 'pago' }
 */
export async function iniciarPagamentoOnline(dados) {
    // BACKEND: return requisicao('POST', '/pagamentos', dados);
    void dados;
    return null;
}

/**
 * Confirma que o pagamento foi feito (botão "Já fiz o pagamento").
 * BACKEND: GET /pagamentos/:id  (consultar status até virar 'pago')
 */
export async function consultarPagamento(id) {
    // BACKEND: return requisicao('GET', `/pagamentos/${id}`);   (status: 'aguardando' | 'pago')
    void id;
    // PROTÓTIPO: sem backend, considera pago para a tela de confirmação poder ser vista.
    // Remova esta linha ao integrar.
    return { status: 'pago' };
}
