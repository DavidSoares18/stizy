import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, Flame, MessageSquare } from 'lucide-react';
import Modal from '../ui/Modal';
import { useNotificacoes } from '../../context/NotificacoesContext';
import { useAuth } from '../../context/AuthContext';
import { usaMenuProvedor } from '../layout/navegacao';
import { listarNotificacoes } from '../../services/conversasService';
import { ROTAS } from '../../constants/rotas';
import './ModalNotificacoes.css';

// Ícone por tipo de notificação (o backend envia "tipo")
const ICONES = { agendamento: Calendar, pedido: Flame, mensagem: MessageSquare };

/**
 * Modal "Notificações" (sino do cabeçalho).
 * BACKEND: as linhas vêm de conversasService.listarNotificacoes().
 * Sem dados, aparecem 3 linhas vazias.
 */
function ModalNotificacoes() {
    const { aberto, fechar } = useNotificacoes();
    const { usuario, modo } = useAuth();
    const navigate = useNavigate();
    const [lista, setLista] = useState([]);

    // Busca ao abrir o modal
    useEffect(() => {
        if (!aberto) return;
        let cancelado = false;
        listarNotificacoes().then((dados) => !cancelado && setLista(dados)).catch(() => {});
        return () => { cancelado = true; };
    }, [aberto]);

    const linhas = lista.length > 0 ? lista : [null, null, null];

    const verAgenda = () => {
        fechar();
        navigate(usaMenuProvedor(usuario, modo) ? ROTAS.PROVEDOR_AGENDA : ROTAS.AGENDA);
    };

    return (
        <Modal aberto={aberto} onFechar={fechar} titulo="Notificações">
            <ul className="notificacoes-lista">
                {linhas.map((n, i) => {
                    const Icone = n ? ICONES[n.tipo] || Bell : [Calendar, Flame, MessageSquare][i];
                    return (
                        <li key={n?.id ?? i} className="notificacao">
                            <span className="notificacao-icone"><Icone size={18} /></span>
                            <span className="notificacao-texto">
                                {n ? (
                                    <>
                                        <strong>{n.titulo}</strong>
                                        <span>{n.descricao}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="esqueleto" style={{ width: '60%', height: 14 }} />
                                        <span className="esqueleto" style={{ width: '85%', height: 12 }} />
                                    </>
                                )}
                            </span>
                        </li>
                    );
                })}
            </ul>
            <div className="modal-acoes coluna">
                <button type="button" className="btn btn-primario" onClick={verAgenda}>Ver agenda</button>
                <button type="button" className="btn btn-contorno" onClick={fechar}>Fechar</button>
            </div>
        </Modal>
    );
}

export default ModalNotificacoes;
