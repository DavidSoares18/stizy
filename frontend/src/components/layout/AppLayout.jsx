import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import ModalNotificacoes from '../modais/ModalNotificacoes';
import './Layout.css';

/**
 * "Casca" das telas logadas.
 *
 * Regra do Figma: telas com viewport FIXO (390x844 e 1920x1080), sem rolagem
 * da página. Por isso a casca ocupa 100% da altura e só a área de conteúdo
 * rola - e apenas se o backend trouxer mais itens do que cabe na tela.
 *
 * navInferior=false : esconde a barra inferior mobile (telas de fluxo, como
 * agendar/pagamento, onde o rodapé tem a ação principal).
 */
function AppLayout({ navInferior = true }) {
    return (
        <div className="app">
            <Header />
            <main className="app-conteudo">
                <Outlet />
            </main>
            {navInferior && <BottomNav />}
            <ModalNotificacoes />
        </div>
    );
}

export default AppLayout;
