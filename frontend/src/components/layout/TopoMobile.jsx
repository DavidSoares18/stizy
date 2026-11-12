import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronLeft } from 'lucide-react';
import logo from '../../assets/logo-branca.png';
import CampoBusca from './CampoBusca';
import ModoSwitch from './ModoSwitch';
import { useAuth } from '../../context/AuthContext';
import { useNotificacoes } from '../../context/NotificacoesContext';
import { usaMenuProvedor } from './navegacao';
import { ROTAS } from '../../constants/rotas';
import './Layout.css';

/**
 * Topo roxo do MOBILE (390px). Só aparece em telas <= 900px.
 *
 * variante="home"   : logo + sino, e abaixo a busca (cliente) ou o alternador
 *                     "Meu negócio/Comprar" (provedor). Usado em Início e Agenda do provedor.
 * variante="titulo" : [seta voltar] + título + ação opcional à direita.
 *
 * Props de "titulo": voltar = true (history -1), um caminho ou uma função; acao = nó React (ex.: ícone de chat)
 */
function TopoMobile({ variante = 'titulo', titulo, voltar, acao }) {
    const navigate = useNavigate();
    const { usuario, modo } = useAuth();
    const { abrir: abrirNotificacoes } = useNotificacoes();

    if (variante === 'home') {
        const menuProvedor = usaMenuProvedor(usuario, modo);
        const ehProvedor = usuario?.perfil === 'provedor';

        return (
            <div className="topo-mobile home">
                <div className="topo-mobile-linha">
                    <Link to={menuProvedor ? ROTAS.PROVEDOR_AGENDA : ROTAS.INICIO} aria-label="STIZY">
                        <img src={logo} alt="STIZY" className="topo-mobile-logo" />
                    </Link>
                    <button type="button" className="topo-mobile-sino" onClick={abrirNotificacoes} aria-label="Notificações">
                        <Bell size={24} />
                    </button>
                </div>
                {!menuProvedor && <CampoBusca className="topo-busca" />}
                {ehProvedor && <ModoSwitch />}
            </div>
        );
    }

    // voltar pode ser: true (volta no histórico), um caminho (string) ou uma função
    const aoVoltar = () => {
        if (typeof voltar === 'function') return voltar();
        return typeof voltar === 'string' ? navigate(voltar) : navigate(-1);
    };

    return (
        <div className="topo-mobile titulo">
            {voltar && (
                <button type="button" className="topo-mobile-voltar" onClick={aoVoltar} aria-label="Voltar">
                    <ChevronLeft size={26} />
                </button>
            )}
            <h1 className="topo-mobile-titulo">{titulo}</h1>
            {acao && <div className="topo-mobile-acao">{acao}</div>}
        </div>
    );
}

export default TopoMobile;
