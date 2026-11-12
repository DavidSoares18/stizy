import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Calendar, ChevronLeft, Clock, MessageSquare, ShoppingBag, Package } from 'lucide-react';
import TopoMobile from '../../components/layout/TopoMobile';
import Abas from '../../components/ui/Abas';
import Modal from '../../components/ui/Modal';
import Resumo, { LinhaResumo } from '../../components/ui/Resumo';
import CabecalhoNegocio from './CabecalhoNegocio';
import ListaServicos from './ListaServicos';
import GradeProdutos from './GradeProdutos';
import Avaliacoes from './Avaliacoes';
import useDados from '../../hooks/useDados';
import { usePedido } from '../../context/PedidoContext';
import { listarProdutos, listarServicos, obterNegocio } from '../../services/negociosService';
import { solicitarServico } from '../../services/agendamentosService';
import { formatarMoeda } from '../../utils/formatters';
import { ROTAS } from '../../constants/rotas';
import './Estabelecimento.css';

const TIPOS = ['horario', 'combinar', 'produtos'];
const QUANTIDADE_VAZIOS = { horario: 3, combinar: 4, produtos: 6 };

/**
 * Página de um negócio. Rota: /estabelecimento/:id?tipo=horario|combinar|produtos
 *
 * Um único componente atende os 3 modelos do Figma:
 *  - horario  : serviços com duração e preço -> escolhe 1 -> "Escolher horário" -> agendar
 *  - combinar : serviços "a combinar"        -> escolhe N -> "Solicitar pelo WhatsApp" (RF16)
 *  - produtos : loja com estoque             -> adiciona   -> "Comprar" (RF19)
 *
 * BACKEND: o tipo deve vir de obterNegocio(id).tipo. O "?tipo=" na URL existe só
 * para navegar entre os modelos enquanto não há dados reais.
 */
function Estabelecimento() {
    const { id } = useParams();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { atualizarPedido } = usePedido();

    const tipo = TIPOS.includes(params.get('tipo')) ? params.get('tipo') : 'horario';
    const ehProdutos = tipo === 'produtos';

    const negocio = useDados(() => obterNegocio(id), [id], null);
    const itens = useDados(() => (ehProdutos ? listarProdutos(id) : listarServicos(id)), [id, ehProdutos], []);

    const [aba, setAba] = useState('itens');
    const [escolha, setEscolha] = useState(null);
    const [entrega, setEntrega] = useState('retirar');
    const [modal, setModal] = useState(null); // 'esgotado' | 'solicitacao'
    const [produtoEsgotado, setProdutoEsgotado] = useState(null);
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState('');

    // ----- Lista exibida: dados reais ou placeholders vazios -----
    const reais = itens.dados || [];
    const lista = reais.length > 0
        ? reais
        : Array.from({ length: QUANTIDADE_VAZIOS[tipo] }, (_, i) => ({ id: `vazio-${i}`, vazio: true }));

    // Serviços já chegam com o primeiro marcado (como no Figma); produtos começam sem nada
    const padrao = ehProdutos ? [] : [lista[0].id];
    const marcados = (escolha ?? padrao).filter((chave) => lista.some((i) => i.id === chave));
    const selecionados = marcados.length > 0 || escolha !== null ? marcados : padrao;
    const itensSelecionados = lista.filter((i) => selecionados.includes(i.id));
    const total = itensSelecionados.reduce((soma, i) => soma + (i.preco || 0), 0);

    const alternar = (chave) => {
        if (tipo === 'horario') { setEscolha([chave]); return; }
        setEscolha(selecionados.includes(chave) ? selecionados.filter((k) => k !== chave) : [...selecionados, chave]);
    };

    const nomeNegocio = negocio.dados?.nome || 'Estabelecimento';

    // ----- Ações principais -----
    const escolherHorario = () => {
        atualizarPedido({ tipo: 'agendamento', negocioId: id, negocio: negocio.dados, itens: itensSelecionados, total, horario: null, dia: null });
        navigate(ROTAS.AGENDAR(id));
    };

    const comprar = () => {
        atualizarPedido({ tipo: 'compra', negocioId: id, negocio: negocio.dados, itens: itensSelecionados, entrega, total });
        navigate(ROTAS.PAGAMENTO);
    };

    const solicitar = async () => {
        setEnviando(true);
        setErro('');
        try {
            await solicitarServico({ negocioId: id, servicosIds: selecionados.filter((k) => !String(k).startsWith('vazio')) });
            setModal('solicitacao');
        } catch {
            setErro('Não foi possível enviar a solicitação. Tente novamente.');
        } finally {
            setEnviando(false);
        }
    };

    const abrirEsgotado = (produto) => { setProdutoEsgotado(produto); setModal('esgotado'); };
    const fecharModal = () => setModal(null);

    const quantidade = itensSelecionados.length;
    const rotuloItens = tipo === 'produtos'
        ? `${quantidade} ${quantidade === 1 ? 'item' : 'itens'}`
        : `${quantidade} ${quantidade === 1 ? 'serviço selecionado' : 'serviços selecionados'}`;

    const abas = [
        { id: 'itens', rotulo: ehProdutos ? 'Produtos' : 'Serviços' },
        { id: 'avaliacoes', rotulo: 'Avaliações' },
    ];

    // ----- Resumo (card lateral no desktop / barra fixa no mobile) -----
    let resumo;
    if (tipo === 'horario') {
        const servico = itensSelecionados[0];
        resumo = (
            <Resumo
                titulo="Seu pedido"
                total={formatarMoeda(total)}
                legendaMobile={rotuloItens}
                botao={<button type="button" className="btn btn-primario" disabled={!servico} onClick={escolherHorario}><Calendar size={18} /> Escolher horário</button>}
            >
                {servico && (
                    <>
                        <LinhaResumo rotulo={servico.vazio ? '—' : servico.nome} valor={servico.vazio ? '' : formatarMoeda(servico.preco)} forte />
                        <span className="resumo-duracao"><Clock size={14} /> {servico.duracaoMin ? `${servico.duracaoMin} min` : '—'}</span>
                    </>
                )}
            </Resumo>
        );
    } else if (tipo === 'combinar') {
        resumo = (
            <Resumo
                titulo="Sua solicitação"
                total="A combinar"
                legendaMobile={rotuloItens}
                botao={<button type="button" className="btn btn-primario" disabled={quantidade === 0 || enviando} onClick={solicitar}><MessageSquare size={18} /> Solicitar pelo WhatsApp</button>}
            >
                <LinhaResumo rotulo={rotuloItens} valor="A combinar" />
                <span className="resumo-duracao"><Clock size={14} /> Tempo a combinar</span>
            </Resumo>
        );
    } else {
        resumo = (
            <Resumo
                titulo="Seu pedido"
                total={formatarMoeda(total)}
                legendaMobile={rotuloItens}
                botao={<button type="button" className="btn btn-primario" disabled={quantidade === 0} onClick={comprar}><ShoppingBag size={18} /> Comprar</button>}
            >
                <EntregaChips valor={entrega} onMudar={setEntrega} />
                {itensSelecionados.map((p) => (
                    <LinhaResumo key={p.id} rotulo={`1 × ${p.vazio ? '—' : p.nome}`} valor={p.vazio ? '' : formatarMoeda(p.preco)} forte />
                ))}
            </Resumo>
        );
    }

    return (
        <>
            <TopoMobile
                titulo={nomeNegocio}
                voltar
                acao={<Link to={ROTAS.CONVERSAS} aria-label="Conversar com o provedor"><MessageSquare size={24} /></Link>}
            />

            <div className="pagina com-barra">
                <div className="pagina-principal">
                    <Link to="#" onClick={(e) => { e.preventDefault(); navigate(-1); }} className="voltar-link so-desktop">
                        <ChevronLeft size={20} /> Voltar
                    </Link>

                    <CabecalhoNegocio negocio={negocio.dados} tipo={tipo} />

                    <Abas abas={abas} ativa={aba} onMudar={setAba} rotulo="Seções do negócio" />

                    {aba === 'avaliacoes' ? (
                        <Avaliacoes negocioId={id} />
                    ) : (
                        <>
                            {ehProdutos && (
                                <div className="so-mobile"><EntregaChips valor={entrega} onMudar={setEntrega} /></div>
                            )}

                            <div className={itens.carregando ? 'carregando' : ''}>
                                {ehProdutos ? (
                                    <GradeProdutos itens={lista} selecionados={selecionados} onAlternar={alternar} onEsgotado={abrirEsgotado} />
                                ) : (
                                    <ListaServicos itens={lista} modo={tipo} selecionados={selecionados} onAlternar={alternar} />
                                )}
                            </div>

                            {itens.erro && (
                                <div className="aviso-erro" role="alert">
                                    Não foi possível carregar os itens.{' '}
                                    <button type="button" className="link-roxo" onClick={itens.recarregar}>Tentar novamente</button>
                                </div>
                            )}

                            <p className="negocio-nota-rodape">
                                {ehProdutos
                                    ? 'Quando o estoque chega a zero, o STIZY bloqueia a compra desse item e avisa você na hora.'
                                    : tipo === 'combinar'
                                        ? 'Cada atendimento tem tempo e valor próprios. Escolha os serviços e combine direto pelo WhatsApp.'
                                        : 'Escolha um serviço para ver os horários livres.'}
                            </p>
                            {erro && <p className="campo-erro" role="alert">{erro}</p>}
                        </>
                    )}
                </div>

                <div className="pagina-lateral">{resumo}</div>
            </div>

            {/* Modal: produto esgotado (RF19) */}
            <Modal aberto={modal === 'esgotado'} onFechar={fecharModal} titulo="Produto esgotado"
                icone={<Package className="destaque" />}>
                <p className="modal-texto centro">
                    O {produtoEsgotado?.nome || 'produto'} acabou no estoque do {negocio.dados?.nome || 'provedor'}.
                    Novas compras desse item ficam bloqueadas até o provedor repor.
                </p>
                <div className="modal-acoes empilhar-mobile">
                    <button type="button" className="btn btn-contorno" onClick={() => navigate(ROTAS.RESULTADOS('perto-de-voce'))}>Ver outros provedores</button>
                    <button type="button" className="btn btn-primario" onClick={fecharModal}>Entendi</button>
                </div>
            </Modal>

            {/* Modal: solicitação enviada (serviço a combinar - RF16) */}
            <Modal aberto={modal === 'solicitacao'} onFechar={fecharModal} titulo="Solicitação enviada"
                icone={<MessageSquare />}>
                <div className="solicitacao-resumo">
                    <strong>{negocio.dados?.nome || 'Estabelecimento'}</strong>
                    <span>{rotuloItens}</span>
                    <b>A combinar</b>
                </div>
                <p className="modal-texto centro">
                    Enviamos sua solicitação pelo WhatsApp. A resposta chega pelo chat em instantes.
                </p>
                <div className="modal-acoes empilhar-mobile">
                    <button type="button" className="btn btn-contorno" onClick={() => navigate(ROTAS.CONVERSAS)}>Abrir conversas</button>
                    <button type="button" className="btn btn-primario" onClick={fecharModal}>Entendi</button>
                </div>
            </Modal>
        </>
    );
}

/** Escolha entre "Retirar" e "Entregar" (compras de produtos) */
function EntregaChips({ valor, onMudar }) {
    return (
        <div className="entrega-chips" role="group" aria-label="Forma de recebimento">
            <button type="button" className={`chip ${valor === 'retirar' ? 'ativo' : ''}`} aria-pressed={valor === 'retirar'} onClick={() => onMudar('retirar')}>Retirar</button>
            <button type="button" className={`chip ${valor === 'entregar' ? 'ativo' : ''}`} aria-pressed={valor === 'entregar'} onClick={() => onMudar('entregar')}>Entregar</button>
        </div>
    );
}

export default Estabelecimento;
