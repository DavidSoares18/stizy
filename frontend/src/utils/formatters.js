/**
 * Utilitários de formatação compartilhados.
 */

/** Formata um número como moeda brasileira. Ex.: 35 -> "R$ 35,00" */
export const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(valor ?? 0);
};

/**
 * Formata data/hora no fuso do usuário (RNF07).
 * BACKEND: as datas chegam em UTC (ISO 8601). A conversão para o fuso local
 * (ex.: America/Recife) é feita AQUI, no front-end.
 */
export const formatarDataHora = (dataUtc, opcoes = { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) => {
    if (!dataUtc) return '';
    const fuso = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Intl.DateTimeFormat('pt-BR', { ...opcoes, timeZone: fuso }).format(new Date(dataUtc));
};

/** Iniciais para o avatar. Ex.: "João Lucas" -> "JL" */
export const iniciais = (nome = '') => {
    const partes = nome.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
};

/** Gera os próximos 7 dias a partir de hoje (usado no seletor de dia do agendamento) */
export const proximosSeteDias = () => {
    const nomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const hoje = new Date();
    return Array.from({ length: 7 }, (_, i) => {
        const data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
        return {
            iso: data.toISOString().slice(0, 10),
            diaSemana: nomes[data.getDay()],
            dia: data.getDate(),
            data,
        };
    });
};

const primeiraMaiuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

/** "Qua, 12 nov" - rótulo curto de um dia (no fuso do usuário) */
export const rotuloDiaCurto = (data) => {
    const dia = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(data).replace('.', '');
    const mes = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(data).replace('.', '');
    return `${primeiraMaiuscula(dia)}, ${data.getDate()} ${mes}`;
};

/** "Hoje · Quarta, 12 de novembro" - título da agenda do provedor */
export const tituloDiaAgenda = (data) => {
    const hoje = new Date();
    const mesmoDia = data.toDateString() === hoje.toDateString();
    const texto = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(data);
    const formatado = primeiraMaiuscula(texto.replace(/-feira/, ''));
    return mesmoDia ? `Hoje · ${formatado}` : formatado;
};

/** "outubro de 2026" */
export const mesPorExtenso = (data) =>
    new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(data);

/** Máscaras simples para formulários de cadastro */
export const mascaraCelular = (v = '') =>
    v.replace(/\D/g, '').slice(0, 11)
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{1,4})$/, '$1-$2');

export const mascaraCep = (v = '') =>
    v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d{1,3})$/, '$1-$2');
