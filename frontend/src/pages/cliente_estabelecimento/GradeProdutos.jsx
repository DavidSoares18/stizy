import { Package, Plus } from 'lucide-react';
import { formatarMoeda } from '../../utils/formatters';

/** Estoque considerado "baixo" (selo amarelo "Restam N") */
const ESTOQUE_BAIXO = 5;

/**
 * Selo de situação do produto (RF19):
 *  - estoque 0         -> "Esgotado" (a compra é bloqueada)
 *  - estoque <= 5      -> "Restam N"
 *  - feito na hora     -> "Feito na hora"
 *  - senão             -> "N em estoque"
 */
function SeloEstoque({ produto }) {
    if (produto.estoque === 0) return <span className="selo selo-tinta">Esgotado</span>;
    if (produto.feitoNaHora) return <span className="selo">Feito na hora</span>;
    if (produto.estoque <= ESTOQUE_BAIXO) return <span className="selo selo-amarelo">Restam {produto.estoque}</span>;
    return <span className="selo">{produto.estoque} em estoque</span>;
}

/**
 * Grade de produtos (loja, gás e água, mercado, pastelaria...).
 * "itens": produtos reais ou placeholders vazios ({ id, vazio: true }).
 * Formato real: { id, nome, descricao, preco, estoque, feitoNaHora }
 */
function GradeProdutos({ itens, selecionados, onAlternar, onEsgotado }) {
    return (
        <ul className="produtos-grade">
            {itens.map((produto) => {
                const esgotado = !produto.vazio && produto.estoque === 0;
                const adicionado = selecionados.includes(produto.id);

                return (
                    <li key={produto.id} className={`produto-card ${esgotado ? 'esgotado' : ''}`}>
                        <div className="produto-imagem">
                            {/* BACKEND: se o produto tiver foto, exiba <img src={produto.fotoUrl} alt={produto.nome} /> */}
                            <Package size={34} />
                        </div>

                        {produto.vazio ? (
                            <>
                                <span className="esqueleto" style={{ width: '65%', height: 16 }} />
                                <span className="esqueleto" style={{ width: '40%', height: 12 }} />
                                <div className="produto-preco-linha">
                                    <span className="esqueleto" style={{ width: 70, height: 20 }} />
                                    <span className="esqueleto" style={{ width: 80, height: 22, borderRadius: 999 }} />
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="produto-nome">{produto.nome}</h3>
                                {produto.descricao && <p className="produto-descricao">{produto.descricao}</p>}
                                <div className="produto-preco-linha">
                                    <strong className="produto-preco">{formatarMoeda(produto.preco)}</strong>
                                    <SeloEstoque produto={produto} />
                                </div>
                            </>
                        )}

                        {esgotado ? (
                            <button type="button" className="btn btn-contorno forte btn-bloco produto-botao indisponivel"
                                onClick={() => onEsgotado(produto)}>Indisponível</button>
                        ) : (
                            <button type="button" className={`btn btn-bloco produto-botao ${adicionado ? 'btn-contorno forte' : 'btn-primario'}`}
                                aria-pressed={adicionado} onClick={() => onAlternar(produto.id)}>
                                {adicionado ? 'Adicionado' : <><Plus size={18} /> Adicionar</>}
                            </button>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

export default GradeProdutos;
