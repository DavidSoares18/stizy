/**
 * Área do provedor: agenda, produtos/estoque e folha de pagamento.
 */

/**
 * Agenda do dia (RF06).
 * BACKEND: GET /provedor/agenda?data=AAAA-MM-DD
 * Resposta: {
 *   resumo: { atendimentos, horariosLivres, previsto },
 *   proximo: { clienteNome, hora, servico, pagamento } | null,
 *   horarios: {
 *     hora: 'HH:mm', livre: boolean,
 *     agendamentoId?, clienteNome?, servico?, pagamento?: 'online' | 'presencial', valor?
 *   }[]
 * Os horários chegam já no fuso do provedor (ou em UTC, convertendo no front - RNF07).
 * }
 */
export async function obterAgendaDoDia(dataIso) {
    // BACKEND: return requisicao('GET', `/provedor/agenda?data=${dataIso}`);
    void dataIso;
    return { resumo: { atendimentos: null, horariosLivres: null, previsto: null }, proximo: null, horarios: [] };
}

/**
 * Detalhes de um atendimento (modal "Detalhes do atendimento").
 * BACKEND: GET /provedor/agendamentos/:id
 * Resposta: { clienteNome, servico, hora, pagamento, valor }
 */
export async function obterAtendimento(id) {
    // BACKEND: return requisicao('GET', `/provedor/agendamentos/${id}`);
    void id;
    return null;
}

/** BACKEND: PUT /provedor/agendamentos/:id/concluir  */
export async function concluirAtendimento(id) {
    // BACKEND: return requisicao('PUT', `/provedor/agendamentos/${id}/concluir`);
    void id;
    return { ok: true };
}

/**
 * Cliente não compareceu: marca o agendamento como FALTOU.
 * BACKEND (rota futura): PUT /provedor/agendamentos/:id/faltou
 * Enquanto a rota não existir, a chamada real falha e a tela mostra o erro; no modo protótipo (stub) responde ok.
 */
export async function marcarFalta(id) {
    // BACKEND: return requisicao('PUT', `/provedor/agendamentos/${id}/faltou`);
    void id;
    return { ok: true };
}

/** Bloquear um horário livre (RF17). BACKEND: POST /provedor/bloqueios  body: { data, hora } */
export async function bloquearHorario(dataIso, hora) {
    // BACKEND: return requisicao('POST', '/provedor/bloqueios', { data: dataIso, hora });
    void dataIso; void hora;
    return { ok: true };
}

/**
 * Registrar ausência/férias (RF14) - bloqueia a agenda no período.
 * BACKEND: POST /provedor/ausencias   body: { inicio, fim, motivo? }
 */
export async function registrarAusencia(dados) {
    // BACKEND: return requisicao('POST', '/provedor/ausencias', dados);
    return { ok: true, dados };
}

/**
 * Produtos e estoque (RF19).
 * BACKEND: GET /provedor/produtos
 * Resposta: { id, nome, preco, estoque }[]
 *   Situação (calculada no front): estoque 0 = Esgotado | estoque <= 5 = Estoque baixo | senão Em estoque
 */
export async function listarProdutosDoProvedor() {
    // BACKEND: return requisicao('GET', '/provedor/produtos');
    return [];
}

/**
 * Salvar produto (novo ou editado).
 * BACKEND: POST /provedor/produtos        (novo)
 *          PUT  /provedor/produtos/:id    (editar)   body: { nome, preco, estoque }
 */
export async function salvarProduto(produto) {
    // BACKEND: return requisicao(produto.id ? 'PUT' : 'POST', `/provedor/produtos${produto.id ? `/${produto.id}` : ''}`, produto);
    return { ok: true, produto };
}

/**
 * Folha de pagamento (RF15, RF18).
 * BACKEND: GET /provedor/folha?periodo=dia|mes|ano&referencia=AAAA-MM
 * Resposta: {
 *   referenciaTitulo: 'outubro de 2026',
 *   ganhos, taxaStizy (8% - calculada pelo servidor), liquido,
 *   porServico: { nome, atendimentos?, valor }[],        // inclui "Produtos vendidos"
 *   porFormaPagamento: { online, presencial },
 *   taxa: { valor, vencimento (UTC), paga: boolean }
 * }
 */
export async function obterFolha(periodo) {
    // BACKEND: return requisicao('GET', `/provedor/folha?periodo=${periodo}`);
    void periodo;
    return null;
}

/**
 * Pagar a taxa mensal de 8% à plataforma.
 * BACKEND: POST /provedor/folha/pagar-taxa   body: { referencia }
 */
export async function pagarTaxa(referencia) {
    // BACKEND: return requisicao('POST', '/provedor/folha/pagar-taxa', { referencia });
    void referencia;
    return { ok: true };
}
