import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import TopoMobile from '../../components/layout/TopoMobile';
import CardNegocio from '../../components/ui/CardNegocio';
import { lerBuscasRecentes } from '../../utils/buscasRecentes';
import useDados from '../../hooks/useDados';
import { buscarNegocios } from '../../services/negociosService';
import { ROTAS } from '../../constants/rotas';
import './Busca.css';

/**
 * Resultados da busca do cabeçalho: /busca?q=termo (RF05).
 * Mostra as buscas recentes (guardadas no navegador) e a lista de resultados.
 * BACKEND: negociosService.buscarNegocios(termo)
 */
function Busca() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const termo = params.get('q') || '';

    const { dados, carregando, erro, recarregar } = useDados(() => buscarNegocios(termo), [termo], []);
    const lista = dados || [];
    const cards = lista.length > 0 ? lista : [null, null];
    const recentes = lerBuscasRecentes();

    return (
        <>
            <TopoMobile variante="home" />

            <div className="pagina">
                <div className="pagina-principal">
                    <h1 className="pagina-titulo">
                        {termo ? <>Resultados para “{termo}”</> : 'Buscar serviço ou produto'}
                    </h1>

                    {recentes.length > 0 && (
                        <section aria-labelledby="buscas-recentes">
                            <h2 id="buscas-recentes" className="busca-subtitulo">Buscas recentes</h2>
                            <div className="chips-linha">
                                {recentes.map((r) => (
                                    <button key={r} type="button" className="chip"
                                        onClick={() => navigate(`${ROTAS.BUSCA}?q=${encodeURIComponent(r)}`)}>{r}</button>
                                ))}
                            </div>
                        </section>
                    )}

                    <section aria-labelledby="busca-resultados">
                        <h2 id="busca-resultados" className="busca-subtitulo">Resultados</h2>
                        {erro && (
                            <div className="aviso-erro" role="alert">
                                Não foi possível buscar agora.{' '}
                                <button type="button" className="link-roxo" onClick={recarregar}>Tentar novamente</button>
                            </div>
                        )}
                        <div className={`busca-lista ${carregando ? 'carregando' : ''}`}>
                            {cards.map((negocio, i) => (
                                <CardNegocio key={negocio?.id ?? `vazio-${i}`} negocio={negocio} variante="lista" />
                            ))}
                        </div>
                    </section>
                </div>

                <aside className="pagina-lateral">
                    <section className="dica-busca">
                        <span className="selo selo-amarelo">Dica</span>
                        <p>Busque por serviço, produto ou provedor perto de você.</p>
                        <Link to={ROTAS.INICIO} className="btn btn-amarelo btn-bloco">Voltar ao início</Link>
                    </section>
                </aside>
            </div>
        </>
    );
}

export default Busca;
