import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import TopoMobile from '../../components/layout/TopoMobile';
import Avatar from '../../components/ui/Avatar';
import useDados from '../../hooks/useDados';
import { enviarMensagem, listarConversas, listarMensagens } from '../../services/conversasService';
import { formatarDataHora, iniciais } from '../../utils/formatters';
import { ROTAS } from '../../constants/rotas';
import './Conversas.css';

const hora = (utc) => formatarDataHora(utc, { hour: '2-digit', minute: '2-digit' });

/**
 * Chat entre cliente e provedor (RF09, RF16).
 *
 * Desktop : lista de conversas à esquerda + mensagens à direita (rota /conversas).
 * Mobile  : /conversas mostra a lista; /conversas/:id mostra o chat.
 *
 * BACKEND: conversasService (listarConversas, listarMensagens, enviarMensagem).
 * Para tempo real, use WebSocket/SSE e adicione as mensagens recebidas em "mensagens".
 */
function Conversas() {
    const { id } = useParams();
    const fimRef = useRef(null);

    const conversas = useDados(listarConversas, [], []);
    const lista = conversas.dados || [];

    const selecionadaId = id ?? lista[0]?.id;
    const selecionada = lista.find((c) => String(c.id) === String(selecionadaId));

    const mensagensApi = useDados(
        () => (selecionadaId ? listarMensagens(selecionadaId) : Promise.resolve([])),
        [selecionadaId],
        [],
    );
    // Mensagens enviadas agora (otimista), guardadas por conversa
    const [enviadas, setEnviadas] = useState({});
    const [texto, setTexto] = useState('');
    const [erro, setErro] = useState('');

    const mensagens = [...(mensagensApi.dados || []), ...(enviadas[selecionadaId] || [])];

    // Rola para a última mensagem
    useEffect(() => {
        fimRef.current?.scrollIntoView({ block: 'end' });
    }, [mensagens.length]);

    const enviar = async (e) => {
        e.preventDefault();
        const limpo = texto.trim();
        if (!limpo) return;
        setErro('');
        try {
            const nova = await enviarMensagem(selecionadaId, limpo);
            setEnviadas((atual) => ({ ...atual, [selecionadaId]: [...(atual[selecionadaId] || []), nova] }));
            setTexto('');
        } catch {
            setErro('Não foi possível enviar. Tente novamente.');
        }
    };

    return (
        <>
            {/* No mobile o topo muda: lista ("Conversas") ou chat (nome + voltar) */}
            <TopoMobile
                titulo={id ? (selecionada?.interlocutorNome || 'Conversa') : 'Conversas'}
                voltar={id ? ROTAS.CONVERSAS : undefined}
            />

            <div className={`conversas ${id ? 'com-chat' : ''}`}>
                <aside className={`conversas-lista-painel ${conversas.carregando ? 'carregando' : ''}`}>
                    <h1 className="pagina-titulo conversas-titulo">Conversas</h1>
                    <ul className="conversas-lista">
                        {lista.length === 0 && [0, 1].map((n) => (
                            <li key={n} className="conversa-item vazia">
                                <Avatar tamanho={36} />
                                <span className="conversa-texto">
                                    <span className="esqueleto" style={{ width: 120, height: 14 }} />
                                    <span className="esqueleto" style={{ width: 160, height: 12 }} />
                                </span>
                            </li>
                        ))}
                        {lista.map((c) => (
                            <li key={c.id}>
                                <Link to={ROTAS.CONVERSA(c.id)} className={`conversa-item ${String(c.id) === String(selecionadaId) ? 'ativa' : ''}`}>
                                    <Avatar iniciais={iniciais(c.interlocutorNome)} tamanho={36} />
                                    <span className="conversa-texto">
                                        <strong>{c.interlocutorNome}</strong>
                                        <span>{c.ultimaMensagem}</span>
                                    </span>
                                    <span className="conversa-meta">
                                        <small>{hora(c.ultimaEmUtc)}</small>
                                        {c.naoLidas > 0 && <b className="conversa-badge">{c.naoLidas}</b>}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </aside>

                <section className="chat" aria-label="Mensagens">
                    <h2 className="pagina-titulo chat-titulo">{selecionada?.interlocutorNome || 'Selecione uma conversa'}</h2>

                    <div className="chat-caixa">
                        <div className={`chat-mensagens ${mensagensApi.carregando ? 'carregando' : ''}`}>
                            {mensagens.length === 0 ? (
                                // Sem mensagens: 3 balões vazios
                                <>
                                    <span className="esqueleto balao-vazio esquerda" />
                                    <span className="esqueleto balao-vazio direita" />
                                    <span className="esqueleto balao-vazio esquerda curto" />
                                </>
                            ) : (
                                <>
                                    <span className="chat-dia">Hoje</span>
                                    {mensagens.map((m) => (
                                        <p key={m.id} className={`balao ${m.enviadaPorMim ? 'meu' : 'dele'}`}>{m.texto}</p>
                                    ))}
                                </>
                            )}
                            <span ref={fimRef} />
                        </div>

                        {erro && <p className="campo-erro chat-erro" role="alert">{erro}</p>}
                        <form className="chat-envio" onSubmit={enviar}>
                            <input
                                value={texto}
                                onChange={(e) => setTexto(e.target.value)}
                                placeholder="Escreva uma mensagem"
                                aria-label="Escreva uma mensagem"
                                disabled={!selecionadaId}
                            />
                            <button type="submit" className="chat-enviar" aria-label="Enviar mensagem" disabled={!texto.trim() || !selecionadaId}>
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </section>
            </div>
        </>
    );
}

export default Conversas;
