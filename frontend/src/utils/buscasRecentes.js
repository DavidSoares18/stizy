import { STORAGE_KEYS } from '../constants/storage';

/** Guarda a busca nas "Buscas recentes" (máximo de 5) */
export function salvarBuscaRecente(termo) {
    try {
        const atuais = JSON.parse(localStorage.getItem(STORAGE_KEYS.BUSCAS_RECENTES) || '[]');
        const novas = [termo, ...atuais.filter((t) => t.toLowerCase() !== termo.toLowerCase())].slice(0, 5);
        localStorage.setItem(STORAGE_KEYS.BUSCAS_RECENTES, JSON.stringify(novas));
    } catch { /* localStorage indisponível: ignora */ }
}

export function lerBuscasRecentes() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.BUSCAS_RECENTES) || '[]');
    } catch {
        return [];
    }
}
