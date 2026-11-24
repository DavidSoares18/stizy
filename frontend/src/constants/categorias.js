import {
    Scissors, Sparkles, Flame, ShoppingCart, Utensils, Zap,
    Pill, PawPrint, Hammer, Car, Laptop, GraduationCap,
} from 'lucide-react';

/**
 * As 12 categorias da tela de início (rolam na horizontal).
 * São opções fixas da interface, não dependem do backend.
 *
 * tipoPadrao define qual modelo de tela de negócio abrir:
 *  - 'horario'  : serviço com horário e valor fixos (ex.: Barbearia)
 *  - 'combinar' : serviço a combinar, contato prévio por WhatsApp (RF16)
 *  - 'produtos' : loja de produtos com estoque (RF19)
 */
export const CATEGORIAS = [
    { slug: 'barbearia', nome: 'Barbearia', icone: Scissors, tipoPadrao: 'horario' },
    { slug: 'salao', nome: 'Salão', icone: Sparkles, tipoPadrao: 'combinar' },
    { slug: 'gas-e-agua', nome: 'Gás e água', icone: Flame, tipoPadrao: 'produtos' },
    { slug: 'mercado', nome: 'Mercado', icone: ShoppingCart, tipoPadrao: 'produtos' },
    { slug: 'comida', nome: 'Comida', icone: Utensils, tipoPadrao: 'produtos' },
    { slug: 'eletrica', nome: 'Elétrica', icone: Zap, tipoPadrao: 'combinar' },
    { slug: 'farmacia', nome: 'Farmácia', icone: Pill, tipoPadrao: 'produtos' },
    { slug: 'pet-shop', nome: 'Pet shop', icone: PawPrint, tipoPadrao: 'horario' },
    { slug: 'reformas', nome: 'Reformas', icone: Hammer, tipoPadrao: 'combinar' },
    { slug: 'automotivo', nome: 'Automotivo', icone: Car, tipoPadrao: 'combinar' },
    { slug: 'tecnologia', nome: 'Tecnologia', icone: Laptop, tipoPadrao: 'combinar' },
    { slug: 'aulas', nome: 'Aulas', icone: GraduationCap, tipoPadrao: 'combinar' },
];

/** As 4 seções (carrosséis) da tela de início. "Ver todos" abre /resultados/:slug */
export const SECOES_INICIO = [
    { slug: 'perto-de-voce', titulo: 'Perto de você' },
    { slug: 'de-acordo-com-o-que-voce-pediu', titulo: 'De acordo com o que você pediu' },
    { slug: 'alimentos', titulo: 'Alimentos' },
    { slug: 'mao-de-obra', titulo: 'Mão de obra' },
];

/** Descobre o título da tela de resultados a partir do slug da seção ou da categoria */
export function tituloDaSecao(slug) {
    const secao = SECOES_INICIO.find((s) => s.slug === slug);
    if (secao) return secao.titulo;
    const categoria = CATEGORIAS.find((c) => c.slug === slug);
    return categoria ? categoria.nome : 'Resultados';
}

/** Tipo padrão de tela de negócio para uma seção/categoria */
export function tipoDaSecao(slug) {
    const categoria = CATEGORIAS.find((c) => c.slug === slug);
    return categoria ? categoria.tipoPadrao : 'horario';
}
