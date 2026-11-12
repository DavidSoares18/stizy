import { Link, NavLink } from 'react-router-dom';
import { Bell } from 'lucide-react';
import logo from '../../assets/logo-branca.png';
import Avatar from '../ui/Avatar';
import CampoBusca from './CampoBusca';
import ModoSwitch from './ModoSwitch';
import { useAuth } from '../../context/AuthContext';
import { useNotificacoes } from '../../context/NotificacoesContext';
import { iniciais } from '../../utils/formatters';
import { linksDesktop, rotaPerfil, usaMenuProvedor } from './navegacao';
import './Layout.css';

/**
 * Cabeçalho do desktop (barra roxa de 72px).
 * No mobile ele some: cada tela usa o <TopoMobile /> + a barra inferior.
 */
function Header() {
    const { usuario, modo } = useAuth();
    const { abrir: abrirNotificacoes } = useNotificacoes();

    const menuProvedor = usaMenuProvedor(usuario, modo);
    const ehProvedor = usuario?.perfil === 'provedor';
    const links = linksDesktop(menuProvedor);

    return (
        <header className="header">
            <Link to={links[0].para} className="header-logo" aria-label="STIZY - ir para o início">
                <img src={logo} alt="STIZY" />
            </Link>

            <nav className="header-menu" aria-label="Principal">
                {links.map((link) => (
                    <NavLink
                        key={link.para}
                        to={link.para}
                        className={({ isActive }) => `header-link ${isActive ? 'ativo' : ''}`}
                    >
                        {link.rotulo}
                    </NavLink>
                ))}
            </nav>

            <div className="header-direita">
                {ehProvedor && <ModoSwitch />}
                {/* O provedor em "Meu negócio" não busca serviços de outros */}
                {!menuProvedor && <CampoBusca className="header-busca" />}

                <button type="button" className="header-sino" onClick={abrirNotificacoes} aria-label="Notificações">
                    <Bell size={24} />
                </button>
                <Link to={rotaPerfil(usuario)} aria-label="Meu perfil" className="header-avatar">
                    <Avatar iniciais={iniciais(usuario?.nome)} tamanho={38} />
                </Link>
            </div>
        </header>
    );
}

export default Header;
