import { Link } from 'react-router-dom';
import CardNegocio from './CardNegocio';
import { ROTAS } from '../../constants/rotas';
import './SecaoNegocios.css';

/**
 * Uma seção da tela de início: título + "Ver todos" + 3 cards.
 * No desktop são 3 cards lado a lado; no mobile vira carrossel horizontal.
 * (Regra do Figma: no máximo 3 itens e "Ver todos" abre a tela de resultados.)
 *
 * BACKEND: "negocios" é a lista vinda de negociosService.listarNegocios(slug).
 * Enquanto estiver vazia, aparecem 3 cards vazios.
 */
function SecaoNegocios({ slug, titulo, negocios = [], carregando, tipoPadrao }) {
    const cards = negocios.length > 0 ? negocios.slice(0, 6) : [null, null, null];

    return (
        <section className={`secao-negocios ${carregando ? 'carregando' : ''}`} aria-label={titulo}>
            <header className="secao-negocios-topo">
                <h2>{titulo}</h2>
                <Link to={ROTAS.RESULTADOS(slug)} className="link-roxo">Ver todos</Link>
            </header>
            <div className="secao-negocios-fila">
                {cards.map((negocio, i) => (
                    <CardNegocio key={negocio?.id ?? `vazio-${i}`} negocio={negocio} tipoPadrao={tipoPadrao} />
                ))}
            </div>
        </section>
    );
}

export default SecaoNegocios;
