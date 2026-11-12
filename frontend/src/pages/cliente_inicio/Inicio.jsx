import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import TopoMobile from '../../components/layout/TopoMobile';
import SecaoNegocios from '../../components/ui/SecaoNegocios';
import useDados from '../../hooks/useDados';
import { CATEGORIAS, SECOES_INICIO } from '../../constants/categorias';
import { ROTAS } from '../../constants/rotas';
import { listarNegocios } from '../../services/negociosService';
import { listarAgendamentos } from '../../services/agendamentosService';
import { formatarDataHora } from '../../utils/formatters';
import './Inicio.css';

/**
 * Tela de início do cliente (e do provedor no modo "Comprar" - RF02).
 *
 * 1 objetivo: encontrar um serviço ou produto.
 * - 12 categorias rolando na horizontal
 * - 4 seções com 3 negócios cada (o "Ver todos" abre a tela de resultados)
 * - coluna lateral: próximo horário + destaque
 */
function Inicio() {
    // BACKEND: uma lista de negócios por seção (negociosService.listarNegocios)
    const negocios = useDados(
        async () => {
            const listas = await Promise.all(SECOES_INICIO.map((s) => listarNegocios(s.slug)));
            return Object.fromEntries(SECOES_INICIO.map((s, i) => [s.slug, listas[i]]));
        },
        [],
        {},
    );

    // BACKEND: próximo agendamento do cliente (agendamentosService.listarAgendamentos)
    const agenda = useDados(listarAgendamentos, [], { proximos: [], anteriores: [] });
    const proximo = agenda.dados?.proximos?.[0];

    return (
        <>
            <TopoMobile variante="home" />

            <div className="pagina">
                <div className="pagina-principal inicio-principal">
                    {negocios.erro && (
                        <div className="aviso-erro" role="alert">
                            Não foi possível carregar os negócios agora.{' '}
                            <button type="button" className="link-roxo" onClick={negocios.recarregar}>Tentar novamente</button>
                        </div>
                    )}

                    <section aria-labelledby="titulo-categorias">
                        <h1 id="titulo-categorias" className="pagina-titulo inicio-titulo">
                            <span className="so-desktop">O que você precisa hoje?</span>
                            <span className="so-mobile">Categorias</span>
                        </h1>
                        <ul className="categorias">
                            {CATEGORIAS.map((categoria) => {
                                const Icone = categoria.icone;
                                return (
                                    <li key={categoria.slug}>
                                        <Link to={ROTAS.RESULTADOS(categoria.slug)} className="categoria">
                                            <span className="categoria-icone"><Icone size={26} /></span>
                                            <span className="categoria-nome">{categoria.nome}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>

                    {SECOES_INICIO.map((secao) => (
                        <SecaoNegocios
                            key={secao.slug}
                            slug={secao.slug}
                            titulo={secao.titulo}
                            negocios={negocios.dados?.[secao.slug] || []}
                            carregando={negocios.carregando}
                        />
                    ))}
                </div>

                <aside className="pagina-lateral inicio-lateral">
                    <section className="cartao proximo-horario">
                        <h2>Seu próximo horário</h2>
                        {proximo ? (
                            <p className="proximo-dados">
                                <strong>{proximo.titulo}</strong><br />
                                {proximo.negocioNome} · {formatarDataHora(proximo.inicioUtc)}
                            </p>
                        ) : (
                            <p>Você ainda não tem horários marcados.</p>
                        )}
                        <Link to={ROTAS.RESULTADOS('perto-de-voce')} className="btn btn-primario btn-bloco">
                            <CalendarDays size={18} /> Agendar agora
                        </Link>
                    </section>

                    <section className="destaque-stizy">
                        <span className="selo selo-amarelo">NOVO</span>
                        <p>Pague pelo STIZY e acompanhe tudo em um só lugar.</p>
                    </section>
                </aside>
            </div>
        </>
    );
}

export default Inicio;
