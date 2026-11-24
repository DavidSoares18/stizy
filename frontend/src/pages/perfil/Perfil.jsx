import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Calendar, ChevronRight, LogOut, MessageSquare, Package, Pencil, Receipt } from 'lucide-react';
import TopoMobile from '../../components/layout/TopoMobile';
import Avatar from '../../components/ui/Avatar';
import ModalEditarPerfil from '../../components/modais/ModalEditarPerfil';
import { useAuth } from '../../context/AuthContext';
import { useNotificacoes } from '../../context/NotificacoesContext';
import { iniciais } from '../../utils/formatters';
import { ROTAS } from '../../constants/rotas';
import './Perfil.css';

/**
 * Perfil do usuário. Uma tela para os dois perfis:
 *  - cliente  : "Cliente STIZY", botão "Editar perfil", atalhos do cliente
 *  - provedor : "Provedor · categoria", botão "Editar dados", atalhos do negócio
 * (RNF06 - LGPD: a exclusão completa da conta será pedida aqui; BACKEND: DELETE /usuarios/me)
 */
function Perfil() {
    const navigate = useNavigate();
    const { usuario, logout } = useAuth();
    const { abrir: abrirNotificacoes } = useNotificacoes();
    const [editando, setEditando] = useState(false);

    const ehProvedor = usuario?.perfil === 'provedor';

    const atalhos = ehProvedor
        ? [
            { rotulo: 'Agenda do dia', icone: Calendar, para: ROTAS.PROVEDOR_AGENDA },
            { rotulo: 'Produtos e estoque', icone: Package, para: ROTAS.PROVEDOR_PRODUTOS },
            { rotulo: 'Folha de pagamento', icone: Receipt, para: ROTAS.PROVEDOR_FOLHA },
        ]
        : [
            { rotulo: 'Meus agendamentos', icone: Calendar, para: ROTAS.AGENDA },
            { rotulo: 'Conversas', icone: MessageSquare, para: ROTAS.CONVERSAS },
        ];

    const sair = () => {
        logout();
        navigate(ROTAS.LOGIN);
    };

    return (
        <>
            <TopoMobile titulo="Perfil" />

            <div className="pagina">
                <div className="pagina-principal">
                    <h1 className="pagina-titulo so-desktop">Perfil</h1>

                    <section className="perfil-cartao">
                        <Avatar iniciais={iniciais(usuario?.nome)} tamanho={64} />
                        <div className="perfil-dados">
                            <h2>{usuario?.nome}</h2>
                            {usuario?.email && <span>{usuario.email}</span>}
                            {/* BACKEND: para provedor, trocar por "Provedor · {categoria}" */}
                            <small>{ehProvedor ? 'Provedor' : 'Cliente STIZY'}</small>
                        </div>
                        <button type="button" className="btn btn-contorno forte btn-pequeno" onClick={() => setEditando(true)}>
                            <Pencil size={16} /> {ehProvedor ? 'Editar dados' : 'Editar perfil'}
                        </button>
                    </section>

                    <button type="button" className="btn btn-escuro perfil-sair" onClick={sair}>
                        <LogOut size={18} /> Sair da conta
                    </button>
                </div>

                <aside className="pagina-lateral">
                    <h2 className="perfil-atalhos-titulo">Atalhos</h2>
                    <ul className="perfil-atalhos">
                        {atalhos.map((atalho) => {
                            const Icone = atalho.icone;
                            return (
                                <li key={atalho.rotulo}>
                                    <Link to={atalho.para} className="perfil-atalho">
                                        <span className="perfil-atalho-icone"><Icone size={16} /></span>
                                        {atalho.rotulo}
                                        <ChevronRight size={18} />
                                    </Link>
                                </li>
                            );
                        })}
                        <li>
                            <button type="button" className="perfil-atalho" onClick={abrirNotificacoes}>
                                <span className="perfil-atalho-icone"><Bell size={16} /></span>
                                Notificações
                                <ChevronRight size={18} />
                            </button>
                        </li>
                    </ul>
                </aside>
            </div>

            {editando && (
                <ModalEditarPerfil
                    aberto
                    onFechar={() => setEditando(false)}
                    titulo={ehProvedor ? 'Editar dados' : 'Editar perfil'}
                />
            )}
        </>
    );
}

export default Perfil;
