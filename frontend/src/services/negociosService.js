/**
 * Negócios (provedores) vistos pelo cliente: listas, busca, detalhe,
 * serviços, produtos e avaliações.
 *
 * Todas as funções devolvem listas VAZIAS por enquanto. As telas mostram
 * cards vazios até o backend preencher.
 *
 * Formato esperado de um "negócio" (card):
 *   {
 *     id, nome, categoria, distanciaKm, nota, aberto: boolean,
 *     tipo: 'horario' | 'combinar' | 'produtos'
 *   }
 */

/**
 * Lista de negócios de uma seção da tela de início ou de uma categoria.
 * BACKEND: GET /negocios?secao=:slug     (slug: perto-de-voce | de-acordo-com-o-que-voce-pediu | alimentos | mao-de-obra)
 *          GET /negocios?categoria=:slug (slug: barbearia | salao | gas-e-agua | ...)
 * Resposta: Negocio[]   (ordenados por distância; o total vira "26 negócios")
 */
export async function listarNegocios(slug) {
    // BACKEND: return requisicao('GET', `/negocios?secao=${slug}`);
    void slug;
    return [];
}

/**
 * Busca por serviço, produto ou provedor (campo de busca do cabeçalho).
 * BACKEND: GET /negocios/busca?q=:termo     Resposta: Negocio[]
 */
export async function buscarNegocios(termo) {
    // BACKEND: return requisicao('GET', `/negocios/busca?q=${encodeURIComponent(termo)}`);
    void termo;
    return [];
}

/**
 * Detalhe do negócio (cabeçalho da página do estabelecimento).
 * BACKEND: GET /negocios/:id
 * Resposta: {
 *   id, nome, nota, totalAvaliacoes, aberto, horarioFechamento,
 *   endereco, distanciaKm, aceitaPagamentoStizy: boolean,
 *   tempoEntregaMin?, retiradaNaLoja?, tipo
 * }
 * Retornar null enquanto não houver backend deixa o cabeçalho vazio.
 */
export async function obterNegocio(id) {
    // BACKEND: return requisicao('GET', `/negocios/${id}`);
    void id;
    return null;
}

/**
 * Serviços do negócio (RF03).
 * BACKEND: GET /negocios/:id/servicos
 * Resposta: { id, nome, duracaoMin | null, preco | null, aCombinar: boolean }[]
 */
export async function listarServicos(id) {
    // BACKEND: return requisicao('GET', `/negocios/${id}/servicos`);
    void id;
    return [];
}

/**
 * Produtos do negócio com estoque (RF19).
 * BACKEND: GET /negocios/:id/produtos
 * Resposta: { id, nome, descricao, preco, estoque: number, feitoNaHora: boolean }[]
 * O front bloqueia a compra quando estoque === 0 e abre o modal "Produto esgotado".
 */
export async function listarProdutos(id) {
    // BACKEND: return requisicao('GET', `/negocios/${id}/produtos`);
    void id;
    return [];
}

/**
 * Avaliações do negócio (aba "Avaliações").
 * BACKEND: GET /negocios/:id/avaliacoes
 * Resposta: { id, autor, nota, texto, criadoEm (UTC) }[]
 */
export async function listarAvaliacoes(id) {
    // BACKEND: return requisicao('GET', `/negocios/${id}/avaliacoes`);
    void id;
    return [];
}

/**
 * Horários livres de um dia, respeitando a duração do serviço (RF05, RNF02).
 * BACKEND: GET /negocios/:id/horarios?data=AAAA-MM-DD&servicoId=:servicoId
 * Resposta: { hora: 'HH:mm' (já no fuso do usuário), livre: boolean }[]
 *   - livre=false aparece riscado (ocupado/bloqueado - RF07, RF14, RF17)
 */
export async function listarHorarios(id, data, servicoId) {
    // BACKEND: return requisicao('GET', `/negocios/${id}/horarios?data=${data}&servicoId=${servicoId}`);
    void id; void data; void servicoId;
    return [];
}

/**
 * Buscas recentes do usuário.
 * BACKEND (opcional): GET /usuarios/me/buscas-recentes -> string[]
 * Hoje fica no localStorage (ver STORAGE_KEYS.BUSCAS_RECENTES).
 */
