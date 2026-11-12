import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { itensMobile, usaMenuProvedor } from './navegacao';
import './Layout.css';

/**
 * Barra de navegação inferior (só no mobile, <= 900px).
 * Cliente: Início, Agenda, Conversas, Perfil.
 * Provedor ("Meu negócio"): Agenda, Produtos, Folha, Perfil.
 */
function BottomNav() {
    const { usuario, modo } = useAuth();
    const itens = itensMobile(usaMenuProvedor(usuario, modo), usuario);

    return (
        <nav className="bottom-nav" aria-label="Navegação principal">
            {itens.map((item) => {
                const Icone = item.icone;
                return (
                    <NavLink
                        key={item.rotulo}
                        to={item.para}
                        className={({ isActive }) => `bottom-nav-item ${isActive ? 'ativo' : ''}`}
                    >
                        <span className="bottom-nav-icone"><Icone size={22} /></span>
                        <span className="bottom-nav-rotulo">{item.rotulo}</span>
                    </NavLink>
                );
            })}
        </nav>
    );
}

export default BottomNav;
