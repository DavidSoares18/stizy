import './Avatar.css';

/**
 * Círculo amarelo com as iniciais (negócios e usuário).
 * Sem "iniciais" aparece vazio (card sem dados).
 * BACKEND: se o provedor/cliente tiver foto (RF01), passe "foto" com a URL.
 */
function Avatar({ iniciais = '', tamanho = 48, foto }) {
    return (
        <span
            className={`avatar ${iniciais || foto ? '' : 'vazio'}`}
            style={{ width: tamanho, height: tamanho, fontSize: Math.round(tamanho * 0.36) }}
            aria-hidden="true"
        >
            {foto ? <img src={foto} alt="" /> : iniciais}
        </span>
    );
}

export default Avatar;
