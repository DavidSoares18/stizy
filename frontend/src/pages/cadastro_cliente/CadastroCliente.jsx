import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import CadastroLayout from '../../components/cadastro/CadastroLayout';
import FotoUpload from '../../components/cadastro/FotoUpload';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { cadastrarCliente } from '../../services/authService';
import { mascaraCelular } from '../../utils/formatters';
import { ROTAS } from '../../constants/rotas';

const PASSOS = [
    { titulo: 'Seus dados', descricao: 'Nome e contato' },
    { titulo: 'Acesso e segurança', descricao: 'Senha e endereço' },
];

const DADOS_INICIAIS = {
    nome: '', celular: '', email: '',
    bairro: '', cidade: '', senha: '', confirmarSenha: '', aceitouTermos: false,
};

/**
 * Cadastro de cliente em 2 passos (RF01).
 * RNF06 (LGPD): só pedimos o essencial para o agendamento. A foto é opcional.
 */
function CadastroCliente() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [passo, setPasso] = useState(0);
    const [dados, setDados] = useState(DADOS_INICIAIS);
    const [foto, setFoto] = useState(null);
    const [erros, setErros] = useState({});
    const [enviando, setEnviando] = useState(false);
    const [erroGeral, setErroGeral] = useState('');
    const [contaCriada, setContaCriada] = useState(false);

    const atualizar = (campo, valor) => {
        setDados((d) => ({ ...d, [campo]: valor }));
        setErros((e) => ({ ...e, [campo]: undefined }));
    };

    // ----- Validação por passo -----
    const validar = () => {
        const novos = {};
        if (passo === 0) {
            if (dados.nome.trim().split(/\s+/).length < 2) novos.nome = 'Informe nome e sobrenome.';
            if (dados.celular.replace(/\D/g, '').length < 10) novos.celular = 'Informe DDD e número.';
            if (!/^\S+@\S+\.\S+$/.test(dados.email)) novos.email = 'Digite um e-mail válido.';
        } else {
            if (!dados.bairro.trim()) novos.bairro = 'Informe seu bairro.';
            if (!dados.cidade.trim()) novos.cidade = 'Informe sua cidade.';
            if (dados.senha.length < 8 || !/[A-Za-z]/.test(dados.senha) || !/\d/.test(dados.senha)) {
                novos.senha = 'Use 8 ou mais caracteres, com letras e números.';
            }
            if (dados.confirmarSenha !== dados.senha) novos.confirmarSenha = 'As senhas não conferem.';
            if (!dados.aceitouTermos) novos.aceitouTermos = 'Aceite os termos para continuar.';
        }
        setErros(novos);
        return Object.keys(novos).length === 0;
    };

    const continuar = async () => {
        if (!validar()) return;
        if (passo === 0) { setPasso(1); return; }

        setEnviando(true);
        setErroGeral('');
        try {
            // BACKEND: enviar também "foto" (File) em multipart/form-data
            await cadastrarCliente({ ...dados, foto });
            // BACKEND: se a API devolver token/usuário no cadastro, use essa resposta aqui.
            login({
                token: 'token-de-prototipo',
                usuario: { nome: dados.nome.trim(), email: dados.email.trim(), perfil: 'cliente' },
            });
            setContaCriada(true);
        } catch {
            setErroGeral('Não foi possível criar a conta agora. Tente novamente.');
        } finally {
            setEnviando(false);
        }
    };

    // Mensagem de erro de um campo (aparece abaixo do input)
    const erro = (campo) => (erros[campo] ? <span className="campo-erro" role="alert">{erros[campo]}</span> : null);

    return (
        <>
            <CadastroLayout
                selo="Novo por aqui"
                tituloLateral="Criar sua conta"
                subtituloLateral="Compre e agende com quem é do seu bairro."
                passos={PASSOS}
                passoAtual={passo}
                tituloPasso={passo === 0 ? 'Seus dados' : 'Acesso e segurança'}
                subtituloPasso={passo === 0 ? 'Como o STIZY e os provedores vão te conhecer' : 'Defina sua senha e onde você mora'}
                rotuloContinuar={passo === 0 ? 'Continuar' : 'Criar conta'}
                linkSecundario={{ rotulo: 'Já tenho conta · Entrar', para: ROTAS.LOGIN }}
                onVoltar={passo === 0 ? () => navigate(ROTAS.LOGIN) : () => setPasso(0)}
                onContinuar={continuar}
                enviando={enviando}
            >
                {passo === 0 ? (
                    <>
                        <FotoUpload
                            titulo="Foto de perfil (opcional)"
                            descricao="PNG ou JPG, até 5 MB. Ajuda os provedores a reconhecerem você."
                            onEscolher={setFoto}
                        />
                        <div className="campo">
                            <label htmlFor="cc-nome">Nome completo</label>
                            <input id="cc-nome" value={dados.nome} placeholder="Ex.: Maria da Silva" autoComplete="name"
                                onChange={(e) => atualizar('nome', e.target.value)} />
                            {erro('nome')}
                        </div>
                        <div className="campo">
                            <label htmlFor="cc-celular">Celular (WhatsApp)</label>
                            <input id="cc-celular" value={dados.celular} placeholder="(81) 90000-0000" inputMode="tel" autoComplete="tel"
                                onChange={(e) => atualizar('celular', mascaraCelular(e.target.value))} />
                            {erro('celular')}
                        </div>
                        <div className="campo">
                            <label htmlFor="cc-email">E-mail</label>
                            <input id="cc-email" type="email" value={dados.email} placeholder="voce@email.com" autoComplete="email"
                                onChange={(e) => atualizar('email', e.target.value)} />
                            {erro('email')}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="linha">
                            <div className="campo">
                                <label htmlFor="cc-bairro">Bairro</label>
                                <input id="cc-bairro" value={dados.bairro} placeholder="Ex.: Centro"
                                    onChange={(e) => atualizar('bairro', e.target.value)} />
                                {erro('bairro')}
                            </div>
                            <div className="campo">
                                <label htmlFor="cc-cidade">Cidade</label>
                                <input id="cc-cidade" value={dados.cidade} placeholder="Belo Jardim, PE"
                                    onChange={(e) => atualizar('cidade', e.target.value)} />
                                {erro('cidade')}
                            </div>
                        </div>
                        <div className="linha">
                            <div className="campo">
                                <label htmlFor="cc-senha">Senha</label>
                                <input id="cc-senha" type="password" value={dados.senha} placeholder="Mínimo de 8 caracteres" autoComplete="new-password"
                                    onChange={(e) => atualizar('senha', e.target.value)} />
                                {erro('senha')}
                            </div>
                            <div className="campo">
                                <label htmlFor="cc-confirmar">Confirmar senha</label>
                                <input id="cc-confirmar" type="password" value={dados.confirmarSenha} placeholder="Repita a senha" autoComplete="new-password"
                                    onChange={(e) => atualizar('confirmarSenha', e.target.value)} />
                                {erro('confirmarSenha')}
                            </div>
                        </div>
                        <p className="campo-ajuda">Use 8 ou mais caracteres, com letras e números.</p>
                        <label className="cadastro-termos">
                            <input type="checkbox" checked={dados.aceitouTermos}
                                onChange={(e) => atualizar('aceitouTermos', e.target.checked)} />
                            <span className="cadastro-termos-caixa"><Check size={14} strokeWidth={3} /></span>
                            Li e aceito os Termos de uso e a Política de privacidade do STIZY
                        </label>
                        {erro('aceitouTermos')}
                        {erroGeral && <p className="campo-erro" role="alert">{erroGeral}</p>}
                    </>
                )}
            </CadastroLayout>

            <Modal aberto={contaCriada} onFechar={() => navigate(ROTAS.INICIO)} titulo="Conta criada!" icone={<Check />}>
                <p className="modal-texto centro">
                    Bem-vindo ao STIZY. Agora é só escolher um serviço ou produto perto de você.
                </p>
                <div className="modal-acoes empilhar-mobile">
                    <button type="button" className="btn btn-contorno" onClick={() => navigate(ROTAS.PERFIL)}>Ver meu perfil</button>
                    <button type="button" className="btn btn-primario" onClick={() => navigate(ROTAS.INICIO)}>Ir para o início</button>
                </div>
            </Modal>
        </>
    );
}

export default CadastroCliente;
