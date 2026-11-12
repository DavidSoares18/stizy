import { Link } from 'react-router-dom';
import { ChevronRight, Star } from 'lucide-react';
import Avatar from './Avatar';
import { ROTAS } from '../../constants/rotas';
import { iniciais } from '../../utils/formatters';
import './CardNegocio.css';

const formatarNota = (n) => Number(n).toFixed(1).replace('.', ',');

/**
 * Card de um negócio (Início, Resultados e Busca).
 *
 * BACKEND: passe o objeto "negocio" vindo de /services/negociosService.js:
 *   { id, nome, categoria, distanciaKm, nota, aberto, tipo }
 * Sem "negocio" (lista ainda vazia) o card aparece VAZIO, com o mesmo tamanho.
 *
 * variante:
 *  - 'carrossel' : usado nas seções do Início (nota + "Aberto" embaixo no desktop)
 *  - 'lista'     : usado em Resultados/Busca (nota e seta à direita)
 *
 * tipoPadrao: modelo de tela do negócio quando o dado ainda não existe
 * ('horario' | 'combinar' | 'produtos'). Quando houver dados, vale negocio.tipo.
 */
function CardNegocio({ negocio, variante = 'carrossel', tipoPadrao = 'horario' }) {
    // ----- Card vazio (aguardando o backend) -----
    if (!negocio) {
        // O link usa o id "exemplo" só para o protótipo ser navegável.
        return (
            <Link
                to={ROTAS.ESTABELECIMENTO('exemplo', tipoPadrao)}
                className={`card-negocio ${variante} vazio`}
                aria-label="Negócio (aguardando dados do backend)"
            >
                <Avatar />
                <span className="card-negocio-texto">
                    <span className="esqueleto linha-nome" />
                    <span className="esqueleto linha-sub" />
                    <span className="card-negocio-selos">
                        <span className="esqueleto selo-vazio" />
                    </span>
                </span>
                <span className="esqueleto selo-vazio lateral" />
                {variante === 'lista' && <ChevronRight className="card-negocio-seta" size={20} />}
            </Link>
        );
    }

    // ----- Card preenchido -----
    const distancia = String(negocio.distanciaKm).replace('.', ',');

    return (
        <Link
            to={ROTAS.ESTABELECIMENTO(negocio.id, negocio.tipo)}
            className={`card-negocio ${variante}`}
        >
            <Avatar iniciais={iniciais(negocio.nome)} />
            <span className="card-negocio-texto">
                <strong className="card-negocio-nome">{negocio.nome}</strong>
                <span className="card-negocio-sub">{negocio.categoria} · {distancia} km</span>
                <span className="card-negocio-selos">
                    <span className="selo selo-nota"><Star size={11} /> {formatarNota(negocio.nota)}</span>
                    {negocio.aberto && <span className="selo">Aberto</span>}
                </span>
            </span>
            <span className="selo selo-nota lateral"><Star size={11} /> {formatarNota(negocio.nota)}</span>
            {variante === 'lista' && <ChevronRight className="card-negocio-seta" size={20} />}
        </Link>
    );
}

export default CardNegocio;
