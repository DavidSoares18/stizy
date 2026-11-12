/**
 * Chat interno entre cliente e provedor (RF09, RF16) e notificações.
 */

/**
 * Lista de conversas do usuário (coluna da esquerda).
 * BACKEND: GET /conversas
 * Resposta: { id, interlocutorNome, ultimaMensagem, ultimaEmUtc, naoLidas: number }[]
 */
export async function listarConversas() {
    // BACKEND: return requisicao('GET', '/conversas');
    return [];
}

/**
 * Mensagens de uma conversa.
 * BACKEND: GET /conversas/:id/mensagens
 * Resposta: { id, texto, enviadaPorMim: boolean, enviadaEmUtc }[]
 * Sugestão: usar WebSocket/SSE para receber mensagens em tempo real.
 */
export async function listarMensagens(conversaId) {
    // BACKEND: return requisicao('GET', `/conversas/${conversaId}/mensagens`);
    void conversaId;
    return [];
}

/**
 * Envia uma mensagem.
 * BACKEND: POST /conversas/:id/mensagens   body: { texto }
 */
export async function enviarMensagem(conversaId, texto) {
    // BACKEND: return requisicao('POST', `/conversas/${conversaId}/mensagens`, { texto });
    void conversaId;
    return { id: `local-${Date.now()}`, texto, enviadaPorMim: true, enviadaEmUtc: new Date().toISOString() };
}

/**
 * Notificações (modal do sino).
 * BACKEND: GET /notificacoes
 * Resposta: { id, tipo: 'agendamento' | 'pedido' | 'mensagem', titulo, descricao, lida: boolean }[]
 */
export async function listarNotificacoes() {
    // BACKEND: return requisicao('GET', '/notificacoes');
    return [];
}
