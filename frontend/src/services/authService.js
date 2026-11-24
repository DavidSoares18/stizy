/**
 * Autenticação e cadastro (RF01).
 *
 * Fluxo da tela de login: um único formulário. O BACKEND identifica se a conta
 * é de "cliente" ou "provedor" pelo e-mail e senha, e devolve o perfil.
 */

/**
 * Entrar na conta.
 * BACKEND: POST /auth/login   body: { email, senha }
 * Resposta esperada:
 *   { token: string, usuario: { id, nome, email, perfil: 'cliente' | 'provedor' } }
 * (o token é guardado em localStorage pelo AuthContext)
 */
export async function entrar(email, senha) {
    // BACKEND: troque o bloco abaixo por:  return requisicao('POST', '/auth/login', { email, senha });
    void senha; // (a senha só é usada quando a chamada real ao backend for ligada)
    //
    // ----- COMPORTAMENTO DE PROTÓTIPO (remover quando o backend existir) -----
    // Sem backend, o perfil é deduzido pelo e-mail: começando com "provedor" => provedor.
    // Os botões "Conta de cliente" / "Conta de provedor" da tela de login usam isso.
    const nome = email.split('@')[0] || 'Usuário';
    const perfil = email.toLowerCase().startsWith('provedor') ? 'provedor' : 'cliente';
    return {
        token: 'token-de-prototipo',
        usuario: { id: null, nome, email, perfil },
    };
}

/**
 * Cadastro de cliente (2 passos).
 * BACKEND: POST /clientes
 * body: { nome, celular, email, bairro, cidade, senha, aceitouTermos, foto? }
 * RNF06 (LGPD): coletar apenas o essencial (sem CPF); foto é opcional.
 */
export async function cadastrarCliente(dados) {
    // BACKEND: return requisicao('POST', '/clientes', dados);
    return { ok: true, dados };
}

/**
 * Cadastro de provedor (6 passos, com rascunho - "Salvar e continuar depois").
 * BACKEND: POST /provedores   (concluir)  |  PUT /provedores/rascunho (salvar rascunho)
 * body: veja o objeto "dados" montado em pages/cadastro_provedor/CadastroProvedor.jsx
 *   (sem cpf/documento - LGPD; "categoria" é o slug de src/constants/categorias.js, ex.: 'barbearia')
 */
export async function cadastrarProvedor(dados) {
    // BACKEND: return requisicao('POST', '/provedores', dados);
    return { ok: true, dados };
}

export async function salvarRascunhoProvedor(dados) {
    // BACKEND: return requisicao('PUT', '/provedores/rascunho', dados);
    return { ok: true, dados };
}

/**
 * Atualiza nome/e-mail do usuário logado (modal "Editar perfil").
 * BACKEND: PUT /usuarios/me   body: { nome, email }
 */
export async function atualizarPerfil(dados) {
    // BACKEND: return requisicao('PUT', '/usuarios/me', dados);
    return { ok: true, dados };
}
