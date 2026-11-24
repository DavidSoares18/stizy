import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { usePedido } from '../../context/PedidoContext';
import { ROTAS } from '../../constants/rotas';
import './Confirmado.css';

/**
 * Confirmação final do agendamento ou da compra (RF07).
 * Os dados mostrados vêm do pedido guardado no PedidoContext durante o fluxo.
 */
function Confirmado() {
    const navigate = useNavigate();
    const { pedido, limparPedido } = usePedido();

    const ehCompra = pedido.tipo === 'compra';
    const nomeItens = pedido.itens?.filter((i) => !i.vazio).map((i) => i.nome).join(', ') || '—';
    const negocio = pedido.negocio?.nome;
    const quando = ehCompra
        ? (pedido.entrega === 'entregar' ? 'Entrega' : 'Retirada na loja')
        : (pedido.horario ? `${pedido.diaRotulo} · ${pedido.horario}` : '—');

    const voltar = () => {
        limparPedido();
        navigate(ROTAS.INICIO);
    };

    return (
        <div className="pagina coluna-unica">
            <section className="confirmado" aria-live="polite">
                <span className="confirmado-icone"><Check size={36} strokeWidth={3} /></span>
                <h1>Tudo certo!</h1>
                <p>
                    {ehCompra
                        ? 'Seu pedido foi confirmado e o provedor já foi avisado.'
                        : 'Seu horário foi reservado e o provedor já foi avisado.'}
                </p>
                <div className="confirmado-resumo">
                    <strong>{nomeItens}{negocio ? ` · ${negocio}` : ''}</strong>
                    <span>{quando}</span>
                </div>
                <button type="button" className="btn btn-primario btn-bloco" onClick={voltar}>Voltar ao início</button>
            </section>
        </div>
    );
}

export default Confirmado;
