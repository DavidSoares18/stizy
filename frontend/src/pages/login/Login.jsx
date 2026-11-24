import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CalendarDays, CreditCard, Lock, Mail, ShoppingBag, User } from 'lucide-react';
import logo from '../../assets/logo-branca.png';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { entrar } from '../../services/authService';
import { ROTAS } from '../../constants/rotas';
import './Login.css';

const BENEFICIOS = [
    { icone: CalendarDays, texto: 'Horários livres em tempo real' },
    { icone: CreditCard, texto: 'Pague pelo STIZY ou no local' },
    { icone: ShoppingBag, texto: 'Compre produtos com estoque confirmado' },
];

/**
 * Tela de login única (RF01): o BACKEND identifica pelo e-mail e senha
 * se a conta é de cliente ou de provedor.
 */
function Login() {
    const navigate = useNavigate();
    const { usuario, login } = useAuth();

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [escolhendoPerfil, setEscolhendoPerfil] = useState(false);

    // Já logado: vai direto para a tela inicial do perfil
    if (usuario) {
        return <Navigate to={usuario.perfil === 'provedor' ? ROTAS.PROVEDOR_AGENDA : ROTAS.INICIO} replace />;
    }

    const enviar = async (e) => {
        e.preventDefault();

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setErro('Digite um e-mail válido.');
            return;
        }
        if (senha.length < 1) {
            setErro('Digite sua senha.');
            return;
        }

        setCarregando(true);
        setErro('');
        try {
            const resposta = await entrar(email.trim(), senha);
            login(resposta);
            navigate(resposta.usuario.perfil === 'provedor' ? ROTAS.PROVEDOR_AGENDA : ROTAS.INICIO);
        } catch (e2) {
            setErro(e2.status === 401 ? 'E-mail ou senha incorretos.' : 'Não foi possível entrar agora. Tente novamente.');
        } finally {
            setCarregando(false);
        }
    };

    // Botões de protótipo: só preenchem o formulário com uma conta de teste
    const preencher = (tipo) => {
        setEmail(`${tipo}@teste.com`);
        setSenha('12345678');
        setErro('');
    };

    return (
        <div className="login">
            <section className="login-marca">
                <img src={logo} alt="STIZY" className="login-logo" />
                <h1>Seu horário, sem complicação</h1>
                <p className="login-descricao">
                    Reserve horários e compre de provedores perto de você, sem fila e sem rolar por telas intermináveis.
                </p>
                <ul className="login-beneficios">
                    {BENEFICIOS.map((beneficio) => {
                        const Icone = beneficio.icone;
                        return (
                            <li key={beneficio.texto}>
                                <span className="login-beneficio-icone"><Icone size={22} /></span>
                                {beneficio.texto}
                            </li>
                        );
                    })}
                </ul>
            </section>

            <section className="login-formulario">
                <form onSubmit={enviar} noValidate>
                    <h2>Entrar</h2>
                    <p className="login-sub">Acesse sua conta para agendar e comprar.</p>

                    <div className="campo">
                        <label htmlFor="login-email">E-mail</label>
                        <div className="campo-entrada">
                            <Mail />
                            <input
                                id="login-email" type="email" value={email} autoComplete="email"
                                placeholder="voce@email.com" onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="campo">
                        <label htmlFor="login-senha">Senha</label>
                        <div className="campo-entrada">
                            <Lock />
                            <input
                                id="login-senha" type="password" value={senha} autoComplete="current-password"
                                placeholder="••••••••" onChange={(e) => setSenha(e.target.value)}
                            />
                        </div>
                    </div>

                    {erro && <p className="campo-erro" role="alert">{erro}</p>}

                    <button type="submit" className="btn btn-primario btn-bloco login-entrar" disabled={carregando}>
                        {carregando ? 'Entrando...' : 'Entrar'}
                    </button>

                    <div className="login-prototipo">
                        <span>Protótipo · preencher com uma conta de teste</span>
                        <div>
                            <button type="button" className="chip" onClick={() => preencher('cliente')}>Conta de cliente</button>
                            <button type="button" className="chip" onClick={() => preencher('provedor')}>Conta de provedor</button>
                        </div>
                    </div>

                    <p className="login-cadastro">
                        Não tem conta na STIZY?{' '}
                        <button type="button" className="link-roxo" onClick={() => setEscolhendoPerfil(true)}>
                            Cadastre-se agora
                        </button>
                    </p>
                </form>
            </section>

            {/* Modal: cliente ou provedor? (RF01 - fluxos de cadastro distintos) */}
            <Modal
                aberto={escolhendoPerfil}
                onFechar={() => setEscolhendoPerfil(false)}
                titulo="Como você quer usar o STIZY?"
                icone={<User />}
            >
                <p className="modal-texto centro">
                    Escolha o tipo de conta para continuar. Cliente compra e agenda; provedor oferece serviços e produtos.
                </p>
                <div className="modal-acoes coluna">
                    <button type="button" className="btn btn-primario" onClick={() => navigate(ROTAS.CADASTRO_CLIENTE)}>
                        Quero comprar e agendar
                    </button>
                    <button type="button" className="btn btn-contorno" onClick={() => navigate(ROTAS.CADASTRO_PROVEDOR)}>
                        Quero oferecer meus serviços
                    </button>
                </div>
            </Modal>
        </div>
    );
}

export default Login;
