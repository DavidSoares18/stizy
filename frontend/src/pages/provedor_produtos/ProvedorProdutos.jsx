import { useState } from 'react';
import { Minus, Package, Plus } from 'lucide-react';
import TopoMobile from '../../components/layout/TopoMobile';
import Modal from '../../components/ui/Modal';
import useDados from '../../hooks/useDados';
import { listarProdutosDoProvedor, salvarProduto } from '../../services/provedorService';
import { formatarMoeda } from '../../utils/formatters';
import './ProvedorProdutos.css';

/** Estoque considerado "baixo" */
const ESTOQUE_BAIXO = 5;
const LINHAS_VAZIAS = 5;

/** Situação do produto a partir do estoque (RF19) */
function situacao(estoque) {
    if (estoque === 0) return { rotulo: 'Esgotado', classe: 'selo-tinta' };
    if (estoque <= ESTOQUE_BAIXO) return { rotulo: 'Estoque baixo', classe: 'selo-amarelo' };
    return { rotulo: 'Em estoque', classe: '' };
}

/** Número do resumo ou barra cinza enquanto não há dados */
const Contagem = ({ vazio, valor }) => (vazio ? <span className="esqueleto numero-vazio" /> : <strong>{valor}</strong>);

/**
 * Produtos e estoque do provedor (RF19).
 * O provedor informa a quantidade de cada item; ao chegar a zero o STIZY bloqueia
 * a venda e o cliente vê "Esgotado".
 * BACKEND: provedorService.listarProdutosDoProvedor() -> { id, nome, preco, estoque }[]
 */
function ProvedorProdutos() {
    const { dados, carregando, erro, recarregar } = useDados(listarProdutosDoProvedor, [], []);
    const produtos = dados || [];
    const [editando, setEditando] = useState(null); // null | produto | { novo: true }

    const esgotados = produtos.filter((p) => p.estoque === 0).length;
    const baixos = produtos.filter((p) => p.estoque > 0 && p.estoque <= ESTOQUE_BAIXO).length;

    const linhas = produtos.length > 0 ? produtos : Array.from({ length: LINHAS_VAZIAS }, (_, i) => ({ id: `vazio-${i}`, vazio: true }));

    return (
        <>
            <TopoMobile titulo="Produtos e estoque" acao={
                <button type="button" className="topo-add" onClick={() => setEditando({ novo: true })} aria-label="Adicionar produto"><Plus size={22} /></button>
            } />

            <div className={`pagina ${carregando ? 'carregando' : ''}`}>
                <div className="pagina-principal">
                    <h1 className="pagina-titulo so-desktop">Produtos e estoque</h1>

                    {esgotados > 0 && (
                        <p className="alerta-estoque" role="status">
                            <Package size={20} />
                            {esgotados} {esgotados === 1 ? 'produto esgotado' : 'produtos esgotados'}: o STIZY bloqueou novas vendas
                            {esgotados === 1 ? ' dele' : ' deles'} e já avisa os clientes. Reponha para liberar.
                        </p>
                    )}

                    {erro && (
                        <div className="aviso-erro" role="alert">
                            Não foi possível carregar os produtos.{' '}
                            <button type="button" className="link-roxo" onClick={recarregar}>Tentar novamente</button>
                        </div>
                    )}

                    <div className="tabela-produtos" role="table" aria-label="Produtos e estoque">
                        <div className="tabela-cabecalho" role="row">
                            <span role="columnheader">Produto</span>
                            <span role="columnheader">Preço</span>
                            <span role="columnheader">Estoque</span>
                            <span role="columnheader">Situação</span>
                            <span role="columnheader" className="sr-only">Ações</span>
                        </div>
                        {linhas.map((p) => {
                            if (p.vazio) {
                                return (
                                    <div key={p.id} className="tabela-linha" role="row">
                                        <span role="cell"><span className="esqueleto" style={{ width: 150, height: 16 }} /></span>
                                        <span role="cell"><span className="esqueleto" style={{ width: 70, height: 14 }} /></span>
                                        <span role="cell"><span className="esqueleto" style={{ width: 40, height: 14 }} /></span>
                                        <span role="cell"><span className="esqueleto" style={{ width: 80, height: 22, borderRadius: 999 }} /></span>
                                        <span role="cell"><span className="esqueleto" style={{ width: 84, height: 40, borderRadius: 10 }} /></span>
                                    </div>
                                );
                            }
                            const s = situacao(p.estoque);
                            return (
                                <div key={p.id} className="tabela-linha" role="row">
                                    <strong role="cell" className="produto-celula-nome">{p.nome}</strong>
                                    <span role="cell" className="produto-celula-preco">{formatarMoeda(p.preco)}</span>
                                    <strong role="cell">{p.estoque} un.</strong>
                                    <span role="cell"><span className={`selo ${s.classe}`}>{s.rotulo}</span></span>
                                    <span role="cell">
                                        <button type="button" className="btn btn-contorno btn-pequeno" onClick={() => setEditando(p)}>Editar</button>
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <aside className="pagina-lateral">
                    <section className="resumo-produtos">
                        <h2>Resumo</h2>
                        <div><span>Produtos</span><Contagem vazio={produtos.length === 0} valor={produtos.length} /></div>
                        <div><span>Esgotados</span><Contagem vazio={produtos.length === 0} valor={esgotados} /></div>
                        <div><span>Estoque baixo</span><Contagem vazio={produtos.length === 0} valor={baixos} /></div>
                    </section>
                    <button type="button" className="btn btn-primario btn-bloco adicionar-produto" onClick={() => setEditando({ novo: true })}>
                        <Plus size={18} /> Adicionar produto
                    </button>
                    <section className="como-funciona">
                        <h2>Como funciona</h2>
                        <p>Você informa a quantidade de cada item. Quando chega a zero, a venda é bloqueada e o cliente vê “Esgotado”.</p>
                    </section>
                </aside>
            </div>

            {editando && (
                <ModalProduto
                    produto={editando.novo ? null : editando}
                    onFechar={() => setEditando(null)}
                    onSalvo={() => { setEditando(null); recarregar(); }}
                />
            )}
        </>
    );
}

/** Modal "Editar produto" / "Novo produto" com quantidade em estoque (−/+) */
function ModalProduto({ produto, onFechar, onSalvo }) {
    const [nome, setNome] = useState(produto?.nome || '');
    const [preco, setPreco] = useState(produto?.preco != null ? String(produto.preco).replace('.', ',') : '');
    const [estoque, setEstoque] = useState(produto?.estoque ?? 0);
    const [erro, setErro] = useState('');
    const [salvando, setSalvando] = useState(false);

    const salvar = async (e) => {
        e.preventDefault();
        const valor = Number(preco.replace(',', '.'));
        if (!nome.trim() || Number.isNaN(valor) || valor < 0 || preco === '') {
            setErro('Informe o nome e um preço válido.');
            return;
        }
        setSalvando(true);
        try {
            await salvarProduto({ id: produto?.id, nome: nome.trim(), preco: valor, estoque });
            onSalvo();
        } catch {
            setErro('Não foi possível salvar agora. Tente novamente.');
        } finally {
            setSalvando(false);
        }
    };

    return (
        <Modal aberto onFechar={onFechar} titulo={produto ? 'Editar produto' : 'Novo produto'}>
            <form className="modal-form" onSubmit={salvar} noValidate>
                <div className="campo">
                    <label htmlFor="prod-nome">Nome do produto</label>
                    <input id="prod-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Galão de água 20 L" />
                </div>
                <div className="campo">
                    <label htmlFor="prod-preco">Preço (R$)</label>
                    <input id="prod-preco" inputMode="decimal" value={preco} placeholder="0,00"
                        onChange={(e) => setPreco(e.target.value.replace(/[^\d,]/g, ''))} />
                </div>
                <div className="campo">
                    <label htmlFor="prod-estoque">Quantidade em estoque</label>
                    <div className="estoque-controle">
                        <button type="button" className="estoque-botao" aria-label="Diminuir" onClick={() => setEstoque((q) => Math.max(0, q - 1))}><Minus size={18} /></button>
                        <input id="prod-estoque" inputMode="numeric" value={estoque}
                            onChange={(e) => setEstoque(Number(e.target.value.replace(/\D/g, '')) || 0)} />
                        <button type="button" className="estoque-botao cheio" aria-label="Aumentar" onClick={() => setEstoque((q) => q + 1)}><Plus size={18} /></button>
                    </div>
                </div>
                <p className="caixa-aviso"><Package size={16} /> Com 0 unidades o produto aparece como Esgotado e as vendas são bloqueadas.</p>
                {erro && <p className="campo-erro" role="alert">{erro}</p>}
                <div className="modal-acoes">
                    <button type="button" className="btn btn-contorno" onClick={onFechar}>Cancelar</button>
                    <button type="submit" className="btn btn-primario" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
                </div>
            </form>
        </Modal>
    );
}

export default ProvedorProdutos;
