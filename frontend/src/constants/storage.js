/**
 * Constantes para chaves de armazenamento local.
 * Centraliza todas as chaves do localStorage para evitar strings mágicas.
 */
export const STORAGE_KEYS = {
    // BACKEND: o token JWT (RNF03) é guardado aqui após o login
    TOKEN: '@Stizy:token',
    USUARIO: '@Stizy:usuario',
    // Provedor alterna entre "Meu negócio" e "Comprar" (RF02)
    MODO: '@Stizy:modo',
    BUSCAS_RECENTES: '@Stizy:buscasRecentes',
    RASCUNHO_PROVEDOR: '@Stizy:rascunhoProvedor',
    PEDIDO: '@Stizy:pedido',
};
