import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import './FotoUpload.css';

const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB

/**
 * Escolha de foto (perfil do cliente ou logo do negócio). Opcional.
 * Aceita PNG ou JPG de até 5 MB, mostra a prévia e devolve o File em onEscolher.
 * BACKEND: envie o File por multipart/form-data (campo "foto") junto do cadastro.
 */
function FotoUpload({ titulo, descricao, onEscolher }) {
    const inputRef = useRef(null);
    const [previa, setPrevia] = useState('');
    const [erro, setErro] = useState('');

    const aoEscolher = (e) => {
        const arquivo = e.target.files?.[0];
        if (!arquivo) return;

        if (!['image/png', 'image/jpeg'].includes(arquivo.type)) {
            setErro('Use uma imagem PNG ou JPG.');
            return;
        }
        if (arquivo.size > TAMANHO_MAXIMO) {
            setErro('A imagem deve ter até 5 MB.');
            return;
        }

        setErro('');
        setPrevia(URL.createObjectURL(arquivo));
        onEscolher?.(arquivo);
    };

    return (
        <div className="foto-upload">
            <button type="button" className="foto-upload-circulo" onClick={() => inputRef.current?.click()} aria-label="Escolher foto">
                {previa ? <img src={previa} alt="Prévia da foto" /> : <Camera size={26} />}
            </button>
            <div className="foto-upload-texto">
                <strong>{titulo}</strong>
                <small>{descricao}</small>
                <button type="button" className="btn btn-contorno forte btn-pequeno" onClick={() => inputRef.current?.click()}>
                    Escolher foto
                </button>
                {erro && <span className="campo-erro" role="alert">{erro}</span>}
            </div>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg" onChange={aoEscolher} hidden />
        </div>
    );
}

export default FotoUpload;
