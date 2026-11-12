import './Resumo.css';

/**
 * Painel de resumo do pedido ("Seu pedido", "Resumo", "Sua solicitação").
 *
 * Desktop : card na coluna da direita.
 * Mobile  : vira uma barra fixa no rodapé (regra do Figma: "ação principal
 *           fixa, botão sempre visível no rodapé, sem procurar rolando").
 *
 * Props:
 *  - titulo         : título do card (desktop)
 *  - children       : linhas de detalhe (aparecem só no desktop)
 *  - total          : texto do total (ex.: "R$ 35,00" ou "A combinar")
 *  - legendaMobile  : texto pequeno em cima do total na barra mobile
 *  - botao          : o <button> da ação principal
 */
function Resumo({ titulo, children, total, rotuloTotal = 'Total', legendaMobile, botao, variante = 'claro' }) {
    return (
        <aside className={`resumo ${variante}`} aria-label={titulo}>
            <h2 className="resumo-titulo">{titulo}</h2>
            {children && <div className="resumo-corpo">{children}</div>}
            <div className="resumo-rodape">
                <div className="resumo-total">
                    {legendaMobile && <span className="resumo-legenda">{legendaMobile}</span>}
                    <span className="resumo-total-linha">
                        <span className="resumo-total-rotulo">{rotuloTotal}</span>
                        <strong className="resumo-total-valor">{total}</strong>
                    </span>
                </div>
                {botao}
            </div>
        </aside>
    );
}

/** Linha "rótulo ........ valor" dentro do resumo */
export function LinhaResumo({ rotulo, valor, forte }) {
    return (
        <div className={`resumo-linha ${forte ? 'forte' : ''}`}>
            <span>{rotulo}</span>
            <strong>{valor}</strong>
        </div>
    );
}

export default Resumo;
