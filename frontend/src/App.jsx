import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificacoesProvider } from './context/NotificacoesContext';
import { PedidoProvider } from './context/PedidoContext';
import PrivateRoute from './components/PrivateRoute';
import AppLayout from './components/layout/AppLayout';
import { ROTAS } from './constants/rotas';

import Login from './pages/login/Login';
import CadastroCliente from './pages/cadastro_cliente/CadastroCliente';
import CadastroProvedor from './pages/cadastro_provedor/CadastroProvedor';

import Inicio from './pages/cliente_inicio/Inicio';
import Resultados from './pages/cliente_resultados/Resultados';
import Busca from './pages/cliente_busca/Busca';
import Estabelecimento from './pages/cliente_estabelecimento/Estabelecimento';
import Agendar from './pages/cliente_agendar/Agendar';
import Pagamento from './pages/cliente_pagamento/Pagamento';
import PagamentoQr from './pages/cliente_pagamento_qr/PagamentoQr';
import Confirmado from './pages/cliente_confirmado/Confirmado';
import Agenda from './pages/cliente_agenda/Agenda';
import Conversas from './pages/cliente_conversas/Conversas';
import Perfil from './pages/perfil/Perfil';

import ProvedorAgenda from './pages/provedor_agenda/ProvedorAgenda';
import ProvedorProdutos from './pages/provedor_produtos/ProvedorProdutos';
import ProvedorFolha from './pages/provedor_folha/ProvedorFolha';

import Telas from './pages/telas/Telas';

function App() {
    return (
        <Router>
            <AuthProvider>
                <NotificacoesProvider>
                    <PedidoProvider>
                        <Routes>
                            {/* Públicas */}
                            <Route path={ROTAS.LOGIN} element={<Login />} />
                            <Route path={ROTAS.CADASTRO_CLIENTE} element={<CadastroCliente />} />
                            <Route path={ROTAS.CADASTRO_PROVEDOR} element={<CadastroProvedor />} />

                            {/* Logado (cliente ou provedor). O provedor usa estas telas no modo "Comprar" (RF02) */}
                            <Route element={<PrivateRoute />}>
                                {/* Telas com barra inferior no mobile */}
                                <Route element={<AppLayout />}>
                                    <Route path={ROTAS.INICIO} element={<Inicio />} />
                                    <Route path="/resultados/:secao" element={<Resultados />} />
                                    <Route path={ROTAS.BUSCA} element={<Busca />} />
                                    <Route path="/estabelecimento/:id" element={<Estabelecimento />} />
                                    <Route path={ROTAS.AGENDA} element={<Agenda />} />
                                    <Route path={ROTAS.CONVERSAS} element={<Conversas />} />
                                    <Route path={ROTAS.PERFIL} element={<Perfil />} />
                                    <Route path={ROTAS.TELAS} element={<Telas />} />
                                </Route>

                                {/* Telas de fluxo: no mobile o rodapé tem a ação principal, sem barra inferior */}
                                <Route element={<AppLayout navInferior={false} />}>
                                    <Route path="/agendar/:id" element={<Agendar />} />
                                    <Route path={ROTAS.PAGAMENTO} element={<Pagamento />} />
                                    <Route path={ROTAS.PAGAMENTO_QR} element={<PagamentoQr />} />
                                    <Route path={ROTAS.CONFIRMADO} element={<Confirmado />} />
                                    <Route path="/conversas/:id" element={<Conversas />} />
                                </Route>
                            </Route>

                            {/* Só provedor */}
                            <Route element={<PrivateRoute perfil="provedor" />}>
                                <Route element={<AppLayout />}>
                                    <Route path={ROTAS.PROVEDOR_AGENDA} element={<ProvedorAgenda />} />
                                    <Route path={ROTAS.PROVEDOR_PRODUTOS} element={<ProvedorProdutos />} />
                                    <Route path={ROTAS.PROVEDOR_FOLHA} element={<ProvedorFolha />} />
                                    <Route path={ROTAS.PROVEDOR_PERFIL} element={<Perfil />} />
                                </Route>
                            </Route>

                            <Route path="*" element={<Navigate to={ROTAS.LOGIN} replace />} />
                        </Routes>
                    </PedidoProvider>
                </NotificacoesProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
