import { STORAGE_KEYS } from '../constants/storage';

/**
 * Cliente HTTP base do STIZY.
 *
 * BACKEND: defina a URL da API no arquivo .env como VITE_API_URL
 * (ex.: VITE_API_URL=https://api.stizy.com.br). RNF03: sempre HTTPS em produção.
 *
 * Todas as telas chamam os arquivos de /services, e estes chamam esta função.
 * Assim, quem for integrar o backend só mexe na pasta /services.
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function requisicao(metodo, caminho, corpo) {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

    const resposta = await fetch(`${API_URL}${caminho}`, {
        method: metodo,
        headers: {
            'Content-Type': 'application/json',
            // RNF03: autenticação das requisições via JWT
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: corpo ? JSON.stringify(corpo) : undefined,
    });

    if (!resposta.ok) {
        const erro = new Error('Falha na requisição');
        erro.status = resposta.status;
        throw erro;
    }

    // Respostas sem corpo (204)
    if (resposta.status === 204) return null;
    return resposta.json();
}
