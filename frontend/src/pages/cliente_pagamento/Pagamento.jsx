import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, CreditCard, Lock, Wallet } from 'lucide-react';
import TopoMobile from '../../components/layout/TopoMobile';
import Passos from '../../components/ui/Passos';
import Resumo, { LinhaResumo } from '../../components/ui/Resumo';
import { usePedido } from '../../context/PedidoContext';
import { criarAgendamento, criarPedido } from '../../services/agendamentosService';
import { formatarMoeda } from '../../utils/formatters';
import { ROTAS } from '../../constants/rotas';
import './Pagamento.css';

/**
 * Passo 3: como pagar (RF11).
 * Serve para agendamentos (com o indicador de passos) e para compras de produtos.
 *
 * Regra do provedor: se ele não aceita pagamento pelo STIZY, só aparece
 * "Pagar no local". BACKEND: negocio.aceitaPagamentoStizy (obterNegocio).
 *
 * - "Pagar pelo STIZY" -> tela do QR Code -> confirmado
 * - "Pagar no local"   -> vai direto para a confirmação
 */
function Pagamento() {
    const navigate = useNavigate();
    const { pedido, atualizarPedido } = usePedido();
    const [forma, setForma] = useState('online');
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState('');

    const ehCompra = pedido.tipo === 'compra';
    const aceitaOnline = pedido.negocio?.aceitaPagamentoStizy !== false;
    const formaAtual = aceitaOnline ? forma : 'presencial';

    const nomeItens = pedido.itens?.filter((i) => !i.vazio).map((i) => i.nome).join(', ') || '—';
    const quando = ehCompra
        ? (pedido.entrega === 'entregar' ? 'Entrega' : 'Retirada')
        : (pedido.horario ? `${pedido.diaRotulo} · ${pedido.horario}` : '—');

    const confirmar = async () => {
        atualizarPedido({ pagamento: formaAtual });

        // Pagamento online: primeiro o QR Code; o agendamento/pedido é criado depois
        if (formaAtual === 'online') {
            navigate(ROTAS.PAGAMENTO_QR);
            return;
        }

        setEnviando(true);
        setErro('');
        try {
            // BACKEND: bloqueia o horário (RF07) / valida o estoque (RF19)
            if (ehCompra) {
                await criarPedido({ negocioId: pedido.negocioId, itens: pedido.itens, entrega: pedido.entrega, pagamento: 'presencial' });
            } else {
                await criarAgendamento({ negocioId: pedido.negocioId, servicoId: pedido.itens?.[0]?.id, inicio: pedido.horario, pagamento: 'presencial' });
            }
            navigate(ROTAS.CONFIRMADO);
        } catch (e) {
            setErro(e.status === 409
                ? 'Esse horário/produto acabou de ser reservado por outra pessoa. Escolha outro.'
                : 'Não foi possível confirmar agora. Tente novamente.');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <>
            <TopoMobile titulo="Pagamento" voltar />

            <div className="pagina com-barra">
                <div className="pagina-principal">
                    {!ehCompra ? (
                        <div className="pagamento-topo">
                            <button type="button" className="voltar-link" onClick={() => navigate(-1)}>
                                <ChevronLeft size={20} /> Voltar
                            </button>
                            <Passos atual={3} />
                        </div>
                    ) : (
                        <div className="pagamento-topo so-desktop">
                            <button type="button" className="voltar-link" onClick={() => navigate(-1)}>
                                <ChevronLeft size={20} /> Voltar
                            </button>
                        </div>
                    )}
                    {!ehCompra && <div className="so-mobile"><Passos atual={3} /></div>}

                    <h1 className="pagina-titulo">Como você quer pagar?</h1>

                    <div className="pagamento-opcoes" role="radiogroup" aria-label="Forma de pagamento">
                        {aceitaOnline && (
                            <button type="button" role="radio" aria-checked={formaAtual === 'online'}
                                className={`pagamento-opcao ${formaAtual === 'online' ? 'ativo' : ''}`} onClick={() => setForma('online')}>
                                <span className="pagamento-icone"><CreditCard size={22} /></span>
                                <span className="pagamento-marca">{formaAtual === 'online' && <Check size={14} strokeWidth={3} />}</span>
                                <strong>Pagar pelo STIZY</strong>
                                <span>Online, com cartão e Pix. O valor fica protegido até o atendimento.</span>
                            </button>
                        )}
                        <button type="button" role="radio" aria-checked={formaAtual === 'presencial'}
                            className={`pagamento-opcao ${formaAtual === 'presencial' ? 'ativo' : ''}`} onClick={() => setForma('presencial')}>
                            <span className="pagamento-icone"><Wallet size={22} /></span>
                            <span className="pagamento-marca">{formaAtual === 'presencial' && <Check size={14} strokeWidth={3} />}</span>
                            <strong>Pagar no local</strong>
                            <span>{ehCompra ? 'Você paga ao receber ou retirar o pedido.' : 'Você paga diretamente ao provedor quando for atendido.'}</span>
                        </button>
                    </div>

                    <p className="caixa-aviso">
                        <Lock size={16} />
                        O provedor define como recebe. Se ele aceitar só presencial, apenas “Pagar no local” aparece.
                    </p>
                    {erro && <p className="campo-erro" role="alert">{erro}</p>}
                </div>

                <div className="pagina-lateral">
                    <Resumo
                        titulo="Resumo do pedido"
                        total={formatarMoeda(pedido.total || 0)}
                        legendaMobile={ehCompra ? 'Seu pedido' : quando}
                        botao={
                            <button type="button" className="btn btn-primario" disabled={enviando} onClick={confirmar}>
                                {enviando ? 'Confirmando...' : ehCompra ? 'Confirmar pedido' : 'Confirmar agendamento'}
                            </button>
                        }
                    >
                        <LinhaResumo rotulo={ehCompra ? 'Pedido' : 'Serviço'} valor={nomeItens} />
                        <LinhaResumo rotulo={ehCompra ? 'Estabelecimento' : 'Profissional'} valor={pedido.negocio?.nome || '—'} />
                        <LinhaResumo rotulo={ehCompra ? 'Quando' : 'Data e hora'} valor={quando} />
                    </Resumo>
                </div>
            </div>
        </>
    );
}

export default Pagamento;
