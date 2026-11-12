import { Star } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import useDados from '../../hooks/useDados';
import { listarAvaliacoes } from '../../services/negociosService';
import { formatarDataHora, iniciais } from '../../utils/formatters';

/**
 * Aba "Avaliações" do negócio.
 * BACKEND: negociosService.listarAvaliacoes(id) -> { id, autor, nota, texto, criadoEm }[]
 * Sem dados: 3 cartões vazios.
 */
function Avaliacoes({ negocioId }) {
    const { dados, carregando } = useDados(() => listarAvaliacoes(negocioId), [negocioId], []);
    const lista = dados || [];
    const cards = lista.length > 0 ? lista : [null, null, null];

    return (
        <ul className={`avaliacoes-lista ${carregando ? 'carregando' : ''}`}>
            {cards.map((a, i) => (
                <li key={a?.id ?? `vazio-${i}`} className="avaliacao-card">
                    <Avatar iniciais={a ? iniciais(a.autor) : ''} tamanho={40} />
                    <div className="avaliacao-corpo">
                        {a ? (
                            <>
                                <div className="avaliacao-topo">
                                    <strong>{a.autor}</strong>
                                    <span className="selo selo-nota"><Star size={11} /> {a.nota}</span>
                                </div>
                                <p>{a.texto}</p>
                                <small>{formatarDataHora(a.criadoEm, { day: '2-digit', month: 'short', year: 'numeric' })}</small>
                            </>
                        ) : (
                            <>
                                <span className="esqueleto" style={{ width: 140, height: 14 }} />
                                <span className="esqueleto" style={{ width: '90%', height: 12 }} />
                                <span className="esqueleto" style={{ width: '60%', height: 12 }} />
                            </>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}

export default Avaliacoes;
