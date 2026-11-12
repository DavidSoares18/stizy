/**
 * Todas as rotas do sistema em um só lugar, para evitar strings soltas.
 */
export const ROTAS = {
    LOGIN: '/',
    CADASTRO_CLIENTE: '/cadastro',
    CADASTRO_PROVEDOR: '/cadastro-provedor',

    // Cliente (o provedor também usa estas telas no modo "Comprar" - RF02)
    INICIO: '/inicio',
    BUSCA: '/busca',
    RESULTADOS: (secao) => `/resultados/${secao}`,
    ESTABELECIMENTO: (id, tipo) => `/estabelecimento/${id}${tipo ? `?tipo=${tipo}` : ''}`,
    AGENDAR: (id) => `/agendar/${id}`,
    PAGAMENTO: '/pagamento',
    PAGAMENTO_QR: '/pagamento/qr',
    CONFIRMADO: '/confirmado',
    AGENDA: '/agenda',
    CONVERSAS: '/conversas',
    CONVERSA: (id) => `/conversas/${id}`,
    PERFIL: '/perfil',

    // Provedor - modo "Meu negócio"
    PROVEDOR_AGENDA: '/provedor/agenda',
    PROVEDOR_PRODUTOS: '/provedor/produtos',
    PROVEDOR_FOLHA: '/provedor/folha',
    PROVEDOR_PERFIL: '/provedor/perfil',

    // Apoio ao desenvolvimento: índice com todas as telas do protótipo
    TELAS: '/telas',
};
