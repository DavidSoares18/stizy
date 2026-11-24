import { useEffect, useRef } from 'react';
import './Modal.css';

/**
 * Modal padrão do STIZY (o Figma usa modal para confirmar ações: pagar taxa,
 * produto esgotado, editar perfil etc. - nunca uma tela nova).
 *
 * Props:
 *  - aberto / onFechar : controle de visibilidade (Esc e clique fora também fecham)
 *  - titulo            : título (também usado para acessibilidade)
 *  - icone             : ícone dentro do círculo escuro/roxo do topo (opcional)
 *  - corIcone          : 'tinta' (padrão) | 'roxo'
 *  - alinharTitulo     : 'centro' (padrão, com ícone) | 'esquerda' (formulários)
 */
function Modal({ aberto, onFechar, titulo, icone, corIcone = 'tinta', alinharTitulo, children }) {
    const cartaoRef = useRef(null);
    const alinhamento = alinharTitulo || (icone ? 'centro' : 'esquerda');

    useEffect(() => {
        if (!aberto) return undefined;

        const aoTeclar = (e) => {
            if (e.key === 'Escape') onFechar?.();
        };
        document.addEventListener('keydown', aoTeclar);

        // Foco vai para dentro do modal ao abrir
        const primeiro = cartaoRef.current?.querySelector('input, textarea, button');
        primeiro?.focus();

        return () => document.removeEventListener('keydown', aoTeclar);
    }, [aberto, onFechar]);

    if (!aberto) return null;

    return (
        <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar?.()}>
            <div
                className="modal-cartao"
                role="dialog"
                aria-modal="true"
                aria-label={titulo}
                ref={cartaoRef}
            >
                {icone && <span className={`modal-icone ${corIcone}`}>{icone}</span>}
                {titulo && <h2 className={`modal-titulo ${alinhamento}`}>{titulo}</h2>}
                {children}
            </div>
        </div>
    );
}

export default Modal;
