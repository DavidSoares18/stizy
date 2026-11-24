import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Lock, Plus, Trash2 } from 'lucide-react';
import CadastroLayout from '../../components/cadastro/CadastroLayout';
import FotoUpload from '../../components/cadastro/FotoUpload';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { cadastrarProvedor, salvarRascunhoProvedor } from '../../services/authService';
import { STORAGE_KEYS } from '../../constants/storage';
import { ROTAS } from '../../constants/rotas';
import { mascaraCep, mascaraCnpj, mascaraCpf } from '../../utils/formatters';
import './CadastroProvedor.css';

const PASSOS = [
    { titulo: 'Identidade do negócio', descricao: 'Como seus clientes vão ver você' },
    { titulo: 'O que você oferece', descricao: 'Serviços ou produtos' },
    { titulo: 'Seus serviços e produtos', descricao: 'Preços, durações e estoque' },
    { titulo: 'Dias e horários', descricao: 'Quando você atende' },
    { titulo: 'Atendimento e pagamentos', descricao: 'Como você atende e recebe' },
    { titulo: 'Localização', descricao: 'Onde você atende' },
    { titulo: 'CPF ou CNPJ', descricao: 'Verificação do cadastro' },
];

const TITULOS = [
    ['Identidade do negócio', 'Como seus clientes vão ver você'],
    ['O que você oferece', 'Serviços ou produtos'],
    ['Seus serviços e produtos', 'Preços, durações e estoque'],
    ['Dias e horários', 'Quando você atende'],
    ['Atendimento e pagamentos', 'Como você atende e recebe'],
    ['Localização', 'Onde você atende'],
    ['CPF ou CNPJ', 'Verificação do cadastro'],
];

const TIPOS_SERVICO = ['Barbeiro', 'Salão de beleza', 'Encanador', 'Eletricista', 'Marido de aluguel', 'Manicure e estética', 'Mecânico', 'Limpeza e diarista', 'Outro'];
const TIPOS_PRODUTO = ['Mercado', 'Padaria', 'Gás e água', 'Comida e bebida', 'Farmácia', 'Pet shop', 'Outro'];
const DIAS = [['seg', 'Seg'], ['ter', 'Ter'], ['qua', 'Qua'], ['qui', 'Qui'], ['sex', 'Sex'], ['sab', 'Sáb'], ['dom', 'Dom']];
const DURACOES = ['15 min', '20 min', '30 min', '45 min', '1 hora', 'Outro'];

let proximoId = 1;
const novoItem = () => ({ id: proximoId++, nome: '', duracao: '', duracaoACombinar: false, preco: '', precoACombinar: false, estoque: '' });

const DADOS_INICIAIS = {
    nomeNegocio: '', descricao: '',
    oferece: 'servicos', tipoNegocio: '',
    itens: [novoItem()],
    dias: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'], abre: '08:00', fecha: '18:00',
    temIntervalo: true, intervaloDe: '12:00', intervaloAte: '13:00',
    atendimento: 'marcado', duracaoPadrao: '30 min',
    pagamentoStizy: true,
    localTipo: 'fixo', cep: '', rua: '', bairro: '', cidade: '', complemento: '',
    documentoTipo: 'cpf', documento: '',
};

/** Recupera o rascunho salvo em "Salvar e continuar depois" */
function lerRascunho() {
    try {
        const salvo = JSON.parse(localStorage.getItem(STORAGE_KEYS.RASCUNHO_PROVEDOR));
        if (salvo?.dados) {
            // garante que os próximos ids de item não repitam
            proximoId = Math.max(proximoId, ...salvo.dados.itens.map((i) => i.id + 1));
            return { dados: { ...DADOS_INICIAIS, ...salvo.dados }, passo: salvo.passo || 0 };
        }
    } catch { /* sem rascunho */ }
    return { dados: DADOS_INICIAIS, passo: 0 };
}

/** Cartão de opção com "bolinha" (rádio) usado nas escolhas do cadastro */
function OpcaoCartao({ ativo, onClick, titulo, descricao }) {
    return (
        <button type="button" className={`opcao-cartao ${ativo ? 'ativo' : ''}`} role="radio" aria-checked={ativo} onClick={onClick}>
            <span className="opcao-radio" />
            <span><strong>{titulo}</strong>{descricao && <small>{descricao}</small>}</span>
        </button>
    );
}

function Interruptor({ ligado, onMudar, rotulo }) {
    return <button type="button" role="switch" aria-checked={ligado} aria-label={rotulo} className="interruptor" onClick={() => onMudar(!ligado)} />;
}

/**
 * Cadastro do provedor em 7 passos (RF01, RF03, RF04, RF11).
 * "Salvar e continuar depois" guarda um rascunho (localStorage hoje;
 * BACKEND: PUT /provedores/rascunho via authService.salvarRascunhoProvedor).
 */
function CadastroProvedor() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [inicial] = useState(lerRascunho);
    const [passo, setPasso] = useState(inicial.passo);
    const [dados, setDados] = useState(inicial.dados);
    const [, setFoto] = useState(null); // BACKEND: enviar o File (logo) em multipart/form-data
    const [erros, setErros] = useState({});
    const [enviando, setEnviando] = useState(false);
    const [modal, setModal] = useState(null); // 'rascunho' | 'concluido' | null
    const [erroGeral, setErroGeral] = useState('');

    const atualizar = (campo, valor) => {
        setDados((d) => ({ ...d, [campo]: valor }));
        setErros((e) => ({ ...e, [campo]: undefined }));
    };
    const erro = (campo) => (erros[campo] ? <span className="campo-erro" role="alert">{erros[campo]}</span> : null);

    const atualizarItem = (id, campo, valor) => {
        setDados((d) => ({ ...d, itens: d.itens.map((i) => (i.id === id ? { ...i, [campo]: valor } : i)) }));
        setErros((e) => ({ ...e, itens: undefined }));
    };
    const adicionarItem = () => setDados((d) => ({ ...d, itens: [...d.itens, novoItem()] }));
    const removerItem = (id) => setDados((d) => ({ ...d, itens: d.itens.filter((i) => i.id !== id) }));

    const alternarDia = (dia) => {
        const dias = dados.dias.includes(dia) ? dados.dias.filter((d) => d !== dia) : [...dados.dias, dia];
        atualizar('dias', dias);
    };

    const ehProduto = dados.oferece === 'produtos';

    // ----- Validação por passo -----
    const validar = () => {
        const novos = {};
        switch (passo) {
            case 0:
                if (!dados.nomeNegocio.trim()) novos.nomeNegocio = 'Informe o nome do seu serviço ou negócio.';
                break;
            case 1:
                if (!dados.tipoNegocio) novos.tipoNegocio = 'Escolha o tipo de negócio.';
                break;
            case 2: {
                const validos = dados.itens.filter((i) => i.nome.trim());
                const incompleto = validos.some((i) => (ehProduto
                    ? i.preco === '' || i.estoque === ''
                    : (!i.duracaoACombinar && !i.duracao.trim()) || (!i.precoACombinar && i.preco === '')));
                if (validos.length === 0) novos.itens = `Cadastre pelo menos um ${ehProduto ? 'produto' : 'serviço'}.`;
                else if (incompleto) novos.itens = 'Preencha preço, duração/estoque ou marque "A combinar".';
                break;
            }
            case 3:
                if (dados.dias.length === 0) novos.dias = 'Escolha pelo menos um dia.';
                if (dados.abre >= dados.fecha) novos.fecha = 'O horário de fechamento deve ser depois da abertura.';
                if (dados.temIntervalo && (dados.intervaloDe >= dados.intervaloAte
                    || dados.intervaloDe < dados.abre || dados.intervaloAte > dados.fecha)) {
                    novos.intervalo = 'O intervalo deve estar dentro do horário de funcionamento.';
                }
                break;
            case 4:
                // nada obrigatório além das escolhas já preenchidas
                break;
            case 5:
                if (dados.localTipo === 'fixo') {
                    if (dados.cep.replace(/\D/g, '').length !== 8) novos.cep = 'CEP com 8 dígitos.';
                    if (!dados.rua.trim()) novos.rua = 'Informe rua e número.';
                    if (!dados.bairro.trim()) novos.bairro = 'Informe o bairro.';
                    if (!dados.cidade.trim()) novos.cidade = 'Informe cidade e UF.';
                }
                break;
            case 6: {
                const tamanho = dados.documento.replace(/\D/g, '').length;
                if (dados.documentoTipo === 'cpf' && tamanho !== 11) novos.documento = 'CPF deve ter 11 dígitos.';
                if (dados.documentoTipo === 'cnpj' && tamanho !== 14) novos.documento = 'CNPJ deve ter 14 dígitos.';
                break;
            }
            default:
        }
        setErros(novos);
        return Object.keys(novos).length === 0;
    };

    const continuar = async () => {
        if (!validar()) return;
        if (passo < PASSOS.length - 1) { setPasso(passo + 1); return; }

        setEnviando(true);
        setErroGeral('');
        try {
            await cadastrarProvedor(dados);
            localStorage.removeItem(STORAGE_KEYS.RASCUNHO_PROVEDOR);
            // BACKEND: o cadastro deve devolver token + usuário. Aqui é só protótipo.
            login({
                token: 'token-de-prototipo',
                usuario: { nome: dados.nomeNegocio.trim(), email: '', perfil: 'provedor' },
            });
            setModal('concluido');
        } catch {
            setErroGeral('Não foi possível concluir o cadastro agora. Tente novamente.');
        } finally {
            setEnviando(false);
        }
    };

    const salvarEContinuarDepois = async () => {
        try {
            localStorage.setItem(STORAGE_KEYS.RASCUNHO_PROVEDOR, JSON.stringify({ dados, passo }));
            await salvarRascunhoProvedor(dados);
        } catch { /* mesmo sem storage, avisa o usuário */ }
        setModal('rascunho');
    };

    const [titulo, subtitulo] = TITULOS[passo];

    return (
        <>
            <CadastroLayout
                selo="Primeiro acesso"
                tituloLateral="Cadastro do provedor"
                subtituloLateral="Configure seu negócio para começar a receber clientes pelo STIZY."
                passos={PASSOS}
                passoAtual={passo}
                tituloPasso={titulo}
                subtituloPasso={subtitulo}
                rotuloContinuar={passo === PASSOS.length - 1 ? 'Concluir cadastro' : 'Continuar'}
                linkSecundario={{ rotulo: 'Salvar e continuar depois', onClick: salvarEContinuarDepois }}
                onVoltar={passo === 0 ? () => navigate(ROTAS.LOGIN) : () => setPasso(passo - 1)}
                onContinuar={continuar}
                enviando={enviando}
            >
                {/* ---------- 1. Identidade ---------- */}
                {passo === 0 && (
                    <>
                        <FotoUpload
                            titulo="Foto da logo do negócio ou do prestador"
                            descricao="PNG ou JPG, até 5 MB. Ela aparece no seu card para os clientes."
                            onEscolher={setFoto}
                        />
                        <div className="campo">
                            <label htmlFor="cp-nome">Nome do serviço ou negócio</label>
                            <input id="cp-nome" value={dados.nomeNegocio} placeholder="Ex.: Seu Zé Barbeiro"
                                onChange={(e) => atualizar('nomeNegocio', e.target.value)} />
                            {erro('nomeNegocio')}
                        </div>
                        <div className="campo">
                            <label htmlFor="cp-desc">Detalhe o que você faz</label>
                            <textarea id="cp-desc" maxLength={300} value={dados.descricao}
                                placeholder="Ex.: Corte masculino, barba e sobrancelha. Atendo no centro da cidade desde 1998."
                                onChange={(e) => atualizar('descricao', e.target.value)} />
                            <span className="campo-ajuda contador">{dados.descricao.length}/300</span>
                        </div>
                    </>
                )}

                {/* ---------- 2. O que oferece ---------- */}
                {passo === 1 && (
                    <>
                        <p className="titulo-grupo">O que você oferece?</p>
                        <div className="opcoes-linha" role="radiogroup" aria-label="O que você oferece">
                            <OpcaoCartao ativo={!ehProduto} onClick={() => { atualizar('oferece', 'servicos'); atualizar('tipoNegocio', ''); }}
                                titulo="Serviços" descricao="Mão de obra: corte, reparo, instalação, atendimento..." />
                            <OpcaoCartao ativo={ehProduto} onClick={() => { atualizar('oferece', 'produtos'); atualizar('tipoNegocio', ''); }}
                                titulo="Produtos" descricao="Comida, bebida, gás, mercearia, roupas..." />
                        </div>
                        <p className="titulo-grupo">Tipo de negócio</p>
                        <div className="chips-linha">
                            {(ehProduto ? TIPOS_PRODUTO : TIPOS_SERVICO).map((tipo) => (
                                <button key={tipo} type="button" className={`chip ${dados.tipoNegocio === tipo ? 'ativo' : ''}`}
                                    aria-pressed={dados.tipoNegocio === tipo} onClick={() => atualizar('tipoNegocio', tipo)}>
                                    {tipo}
                                </button>
                            ))}
                        </div>
                        {erro('tipoNegocio')}
                    </>
                )}

                {/* ---------- 3. Serviços e produtos ---------- */}
                {passo === 2 && (
                    <>
                        <p className="campo-ajuda">
                            {ehProduto
                                ? 'Liste cada produto com preço e quantidade em estoque. Com estoque 0 a venda é bloqueada.'
                                : 'Liste cada serviço. Se o preço ou a duração dependem do caso, ative "A combinar".'}
                        </p>
                        <div className="itens-lista">
                            {dados.itens.map((item) => (
                                <div key={item.id} className={`item-linha ${ehProduto ? 'produto' : 'servico'}`}>
                                    <div className="campo">
                                        <label htmlFor={`it-nome-${item.id}`}>{ehProduto ? 'Nome do produto' : 'Nome do serviço'}</label>
                                        <input id={`it-nome-${item.id}`} value={item.nome} placeholder={ehProduto ? 'Ex.: Galão de água 20 L' : 'Ex.: Corte masculino'}
                                            onChange={(e) => atualizarItem(item.id, 'nome', e.target.value)} />
                                    </div>
                                    {!ehProduto && (
                                        <div className="campo">
                                            <div className="campo-topo">
                                                <label htmlFor={`it-dur-${item.id}`}>Duração</label>
                                                <span className="a-combinar">A combinar
                                                    <Interruptor ligado={item.duracaoACombinar} rotulo="Duração a combinar"
                                                        onMudar={(v) => atualizarItem(item.id, 'duracaoACombinar', v)} />
                                                </span>
                                            </div>
                                            <input id={`it-dur-${item.id}`} value={item.duracaoACombinar ? '' : item.duracao} placeholder="Ex.: 20 min"
                                                disabled={item.duracaoACombinar} onChange={(e) => atualizarItem(item.id, 'duracao', e.target.value)} />
                                        </div>
                                    )}
                                    <div className="campo">
                                        <div className="campo-topo">
                                            <label htmlFor={`it-preco-${item.id}`}>Preço (R$)</label>
                                            {!ehProduto && (
                                                <span className="a-combinar">A combinar
                                                    <Interruptor ligado={item.precoACombinar} rotulo="Preço a combinar"
                                                        onMudar={(v) => atualizarItem(item.id, 'precoACombinar', v)} />
                                                </span>
                                            )}
                                        </div>
                                        <input id={`it-preco-${item.id}`} inputMode="decimal" value={item.precoACombinar ? '' : item.preco} placeholder="R$ 0,00"
                                            disabled={item.precoACombinar} onChange={(e) => atualizarItem(item.id, 'preco', e.target.value.replace(/[^\d,.]/g, ''))} />
                                    </div>
                                    {ehProduto && (
                                        <div className="campo">
                                            <label htmlFor={`it-est-${item.id}`}>Estoque</label>
                                            <input id={`it-est-${item.id}`} inputMode="numeric" value={item.estoque} placeholder="Qtd."
                                                onChange={(e) => atualizarItem(item.id, 'estoque', e.target.value.replace(/\D/g, ''))} />
                                        </div>
                                    )}
                                    {dados.itens.length > 1 && (
                                        <button type="button" className="item-remover" onClick={() => removerItem(item.id)} aria-label="Remover item">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {erro('itens')}
                        <button type="button" className="btn btn-contorno forte btn-pequeno adicionar-item" onClick={adicionarItem}>
                            <Plus size={16} /> {ehProduto ? 'Adicionar produto' : 'Adicionar serviço'}
                        </button>
                    </>
                )}

                {/* ---------- 4. Dias e horários ---------- */}
                {passo === 3 && (
                    <>
                        <p className="titulo-grupo">Dias em que você atende</p>
                        <div className="chips-linha">
                            {DIAS.map(([id, rotulo]) => (
                                <button key={id} type="button" className={`chip ${dados.dias.includes(id) ? 'ativo' : ''}`}
                                    aria-pressed={dados.dias.includes(id)} onClick={() => alternarDia(id)}>{rotulo}</button>
                            ))}
                        </div>
                        {erro('dias')}
                        <div className="linha">
                            <div className="campo">
                                <label htmlFor="cp-abre">Abre às</label>
                                <input id="cp-abre" type="time" value={dados.abre} onChange={(e) => atualizar('abre', e.target.value)} />
                            </div>
                            <div className="campo">
                                <label htmlFor="cp-fecha">Fecha às</label>
                                <input id="cp-fecha" type="time" value={dados.fecha} onChange={(e) => atualizar('fecha', e.target.value)} />
                                {erro('fecha')}
                            </div>
                        </div>
                        <div className="intervalo-topo">
                            <div>
                                <strong>Tenho intervalo (almoço)</strong>
                                <small>Os horários dentro do intervalo não ficam disponíveis.</small>
                            </div>
                            <Interruptor ligado={dados.temIntervalo} rotulo="Tenho intervalo" onMudar={(v) => atualizar('temIntervalo', v)} />
                        </div>
                        {dados.temIntervalo && (
                            <div className="linha">
                                <div className="campo">
                                    <label htmlFor="cp-int-de">Intervalo das</label>
                                    <input id="cp-int-de" type="time" value={dados.intervaloDe} onChange={(e) => atualizar('intervaloDe', e.target.value)} />
                                </div>
                                <div className="campo">
                                    <label htmlFor="cp-int-ate">às</label>
                                    <input id="cp-int-ate" type="time" value={dados.intervaloAte} onChange={(e) => atualizar('intervaloAte', e.target.value)} />
                                </div>
                            </div>
                        )}
                        {erro('intervalo')}
                    </>
                )}

                {/* ---------- 5. Atendimento e pagamentos ---------- */}
                {passo === 4 && (
                    <div className="opcoes-linha duas-colunas">
                        <div className="coluna-opcoes">
                            <p className="titulo-grupo">Como você atende</p>
                            <OpcaoCartao ativo={dados.atendimento === 'marcado'} onClick={() => atualizar('atendimento', 'marcado')}
                                titulo="Horário marcado" descricao="Atendimento em blocos de tempo, como barbeiro ou serviços padronizados." />
                            <OpcaoCartao ativo={dados.atendimento === 'consulta'} onClick={() => atualizar('atendimento', 'consulta')}
                                titulo="Sob consulta" descricao="A duração depende do cliente: salão que combina o serviço, encanador, eletricista." />
                            {dados.atendimento === 'marcado' && (
                                <>
                                    <p className="campo-rotulo">Duração de cada atendimento</p>
                                    <div className="chips-linha">
                                        {DURACOES.map((d) => (
                                            <button key={d} type="button" className={`chip ${dados.duracaoPadrao === d ? 'ativo' : ''}`}
                                                aria-pressed={dados.duracaoPadrao === d} onClick={() => atualizar('duracaoPadrao', d)}>{d}</button>
                                        ))}
                                    </div>
                                    <p className="campo-ajuda">Os clientes verão apenas os horários livres dentro do funcionamento informado.</p>
                                </>
                            )}
                        </div>
                        <div className="coluna-opcoes">
                            <p className="titulo-grupo">Pagamentos pelo STIZY</p>
                            <OpcaoCartao ativo={dados.pagamentoStizy} onClick={() => atualizar('pagamentoStizy', true)}
                                titulo="Aceito pagamentos pelo STIZY" descricao="O cliente paga online ao finalizar o pedido." />
                            <OpcaoCartao ativo={!dados.pagamentoStizy} onClick={() => atualizar('pagamentoStizy', false)}
                                titulo="Prefiro receber presencialmente" descricao="Pagamento direto com você, fora da plataforma." />
                            <p className="caixa-aviso"><Lock size={16} />
                                Você recebe um aviso a cada pagamento confirmado. O cliente segue a regra de pagamento que você definir.
                            </p>
                        </div>
                    </div>
                )}

                {/* ---------- 6. Localização ---------- */}
                {passo === 5 && (
                    <>
                        <p className="titulo-grupo">Onde você atende?</p>
                        <div className="opcoes-linha" role="radiogroup" aria-label="Onde você atende">
                            <OpcaoCartao ativo={dados.localTipo === 'fixo'} onClick={() => atualizar('localTipo', 'fixo')}
                                titulo="Tenho endereço fixo" descricao="Barbearia, salão, loja, bar..." />
                            <OpcaoCartao ativo={dados.localTipo === 'freelancer'} onClick={() => atualizar('localTipo', 'freelancer')}
                                titulo="Sou freelancer" descricao="Atendo na casa do cliente ou em locais variados, sem endereço fixo." />
                        </div>
                        {dados.localTipo === 'fixo' && (
                            <>
                                <div className="linha linha-cep">
                                    <div className="campo">
                                        <label htmlFor="cp-cep">CEP</label>
                                        <input id="cp-cep" value={dados.cep} placeholder="00000-000" inputMode="numeric"
                                            onChange={(e) => atualizar('cep', mascaraCep(e.target.value))} />
                                        {erro('cep')}
                                    </div>
                                    <div className="campo">
                                        <label htmlFor="cp-rua">Rua e número</label>
                                        <input id="cp-rua" value={dados.rua} placeholder="Ex.: Rua das Flores, 120"
                                            onChange={(e) => atualizar('rua', e.target.value)} />
                                        {erro('rua')}
                                    </div>
                                </div>
                                <div className="linha tres">
                                    <div className="campo">
                                        <label htmlFor="cp-bairro">Bairro</label>
                                        <input id="cp-bairro" value={dados.bairro} placeholder="Ex.: Centro"
                                            onChange={(e) => atualizar('bairro', e.target.value)} />
                                        {erro('bairro')}
                                    </div>
                                    <div className="campo">
                                        <label htmlFor="cp-cidade">Cidade / UF</label>
                                        <input id="cp-cidade" value={dados.cidade} placeholder="Ex.: Belo Jardim, PE"
                                            onChange={(e) => atualizar('cidade', e.target.value)} />
                                        {erro('cidade')}
                                    </div>
                                    <div className="campo">
                                        <label htmlFor="cp-comp">Complemento (opcional)</label>
                                        <input id="cp-comp" value={dados.complemento} placeholder="Ex.: Sala 2"
                                            onChange={(e) => atualizar('complemento', e.target.value)} />
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* ---------- 7. CPF ou CNPJ ---------- */}
                {passo === 6 && (
                    <>
                        <p className="titulo-grupo">Você é pessoa física ou empresa?</p>
                        <div className="opcoes-linha" role="radiogroup" aria-label="Tipo de documento">
                            <OpcaoCartao ativo={dados.documentoTipo === 'cpf'} onClick={() => { atualizar('documentoTipo', 'cpf'); atualizar('documento', ''); }}
                                titulo="CPF" descricao="Pessoa física: autônomo ou prestador individual." />
                            <OpcaoCartao ativo={dados.documentoTipo === 'cnpj'} onClick={() => { atualizar('documentoTipo', 'cnpj'); atualizar('documento', ''); }}
                                titulo="CNPJ" descricao="Empresa ou MEI." />
                        </div>
                        <div className="campo documento">
                            <label htmlFor="cp-doc">Número do {dados.documentoTipo === 'cpf' ? 'CPF' : 'CNPJ'}</label>
                            <input id="cp-doc" inputMode="numeric" value={dados.documento}
                                placeholder={dados.documentoTipo === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                                onChange={(e) => atualizar('documento', dados.documentoTipo === 'cpf' ? mascaraCpf(e.target.value) : mascaraCnpj(e.target.value))} />
                            {erro('documento')}
                        </div>
                        <p className="campo-ajuda">Usamos o documento para verificar o cadastro. Ele não aparece para os clientes.</p>
                        {erroGeral && <p className="campo-erro" role="alert">{erroGeral}</p>}
                    </>
                )}
            </CadastroLayout>

            {/* Modal: cadastro concluído */}
            <Modal aberto={modal === 'concluido'} onFechar={() => navigate(ROTAS.PROVEDOR_AGENDA)} titulo="Cadastro concluído" icone={<Check />}>
                <p className="modal-texto centro">
                    Seu negócio já está no STIZY e pode receber clientes. Ajuste serviços, horários e pagamentos quando quiser, no seu perfil.
                </p>
                <div className="modal-acoes empilhar-mobile">
                    <button type="button" className="btn btn-contorno" onClick={() => { setModal(null); setPasso(0); }}>Revisar cadastro</button>
                    <button type="button" className="btn btn-primario" onClick={() => navigate(ROTAS.PROVEDOR_AGENDA)}>Ir para minha agenda</button>
                </div>
            </Modal>

            {/* Modal: rascunho salvo */}
            <Modal aberto={modal === 'rascunho'} onFechar={() => setModal(null)} titulo="Rascunho salvo" icone={<Check />}>
                <p className="modal-texto centro">
                    Guardamos tudo o que você preencheu até aqui. No próximo acesso, o cadastro continua de onde parou.
                </p>
                <div className="modal-acoes">
                    <button type="button" className="btn btn-contorno" onClick={() => navigate(ROTAS.LOGIN)}>Sair</button>
                    <button type="button" className="btn btn-primario" onClick={() => setModal(null)}>Voltar ao cadastro</button>
                </div>
            </Modal>
        </>
    );
}

export default CadastroProvedor;
