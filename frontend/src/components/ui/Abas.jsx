/**
 * Abas em formato de "pílulas" (Serviços | Avaliações, Dia | Mês | Ano...).
 * O Figma prefere abas a seções empilhadas (regra: tela sem rolagem).
 *
 * abas: [{ id, rotulo }]
 */
function Abas({ abas, ativa, onMudar, rotulo = 'Abas' }) {
    return (
        <div className="abas" role="tablist" aria-label={rotulo} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {abas.map((aba) => (
                <button
                    key={aba.id}
                    type="button"
                    role="tab"
                    aria-selected={ativa === aba.id}
                    className={`chip ${ativa === aba.id ? 'ativo' : ''}`}
                    onClick={() => onMudar(aba.id)}
                >
                    {aba.rotulo}
                </button>
            ))}
        </div>
    );
}

export default Abas;
