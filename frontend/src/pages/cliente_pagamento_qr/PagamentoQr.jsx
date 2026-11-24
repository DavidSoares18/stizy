import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import TopoMobile from '../../components/layout/TopoMobile';
import useDados from '../../hooks/useDados';
import { usePedido } from '../../context/PedidoContext';
import { consultarPagamento, criarAgendamento, criarPedido, iniciarPagamentoOnline } from '../../services/agendamentosService';
import { formatarMoeda } from '../../utils/formatters';
import { ROTAS } from '../../constants/rotas';
import './PagamentoQr.css';

/**
 * Pagamento pelo STIZY: mostra o QR Code (RF11).
 *
 * BACKEND: iniciarPagamentoOnline() devolve { qrCodeImagem | qrCodePayload, valor, status }.
 *   - Se vier "qrCodeImagem" (URL/base64), ela é exibida no quadrado.
 *   - Se vier só o "qrCodePayload" (Pix copia e cola), gere o QR com uma biblioteca.
 * O botão "Já fiz o pagamento" consulta o status; quando for "pago", cria o
 * agendamento/pedido e vai para a confirmação.
 */
function PagamentoQr() {
    const navigate = useNavigate();
    const { pedido } = usePedido();
    const [verificando, setVerificando] = useState(false);
    const [erro, setErro] = useState('');

    const ehCompra = pedido.tipo === 'compra';
    const pagamento = useDados(() => iniciarPagamentoOnline({ pedido }), [], null);
    const nomeItens = pedido.itens?.filter((i) => !i.vazio).map((i) => i.nome).join(', ') || '—';

    const jaPaguei = async () => {
        setVerificando(true);
        setErro('');
        try {
            const { status } = await consultarPagamento(pagamento.dados?.id);
            if (status !== 'pago') {
                setErro('Ainda não identificamos o pagamento. Aguarde alguns instantes e tente de novo.');
                return;
            }
            if (ehCompra) {
                await criarPedido({ negocioId: pedido.negocioId, itens: pedido.itens, entrega: pedido.entrega, pagamento: 'online' });
            } else {
                await criarAgendamento({ negocioId: pedido.negocioId, servicoId: pedido.itens?.[0]?.id, inicio: pedido.horario, pagamento: 'online' });
            }
            navigate(ROTAS.CONFIRMADO);
        } catch {
            setErro('Não conseguimos confirmar o pagamento ainda. Tente novamente em instantes.');
        } finally {
            setVerificando(false);
        }
    };

    return (
        <>
            <TopoMobile titulo="Pagamento" voltar />

            <div className="pagina coluna-unica">
                <section className="qr">
                    <div className="qr-caixa" aria-label="QR Code para pagamento">
                        {pagamento.dados?.qrCodeImagem ? (
                            <img src={pagamento.dados.qrCodeImagem} alt="QR Code de pagamento" />
                        ) : (
                            // BACKEND: aqui entra o QR Code real. Enquanto isso, quadro vazio.
                            <QrCode size={150} strokeWidth={1.2} />
                        )}
                    </div>

                    <div className="qr-detalhes">
                        <h1>Pague com o STIZY</h1>
                        <p className="qr-sub">Escaneie o QR Code para pagar</p>

                        <div className="qr-resumo">
                            <div><span>Pedido</span><strong>{nomeItens}{pedido.negocio?.nome ? ` · ${pedido.negocio.nome}` : ''}</strong></div>
                            <div className="qr-total"><span>Total</span><strong>{formatarMoeda(pedido.total || 0)}</strong></div>
                        </div>

                        <p className="qr-status">
                            <span className="selo selo-amarelo">Aguardando pagamento</span>
                            <small>QR Code ilustrativo</small>
                        </p>

                        {erro && <p className="campo-erro" role="alert">{erro}</p>}

                        <button type="button" className="btn btn-primario btn-bloco" onClick={jaPaguei} disabled={verificando}>
                            {verificando ? 'Verificando...' : 'Já fiz o pagamento'}
                        </button>
                        <button type="button" className="btn btn-contorno forte btn-bloco" onClick={() => navigate(ROTAS.PAGAMENTO)}>
                            Escolher outra forma de pagamento
                        </button>
                    </div>
                </section>
            </div>
        </>
    );
}

export default PagamentoQr;
