import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { ROTAS } from '../../constants/rotas';
import { salvarBuscaRecente } from '../../utils/buscasRecentes';

/**
 * Campo "Buscar serviço ou produto" (cabeçalho desktop e topo mobile).
 * Ao enviar, vai para /busca?q=termo.
 */
function CampoBusca({ className = '' }) {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [termo, setTermo] = useState(params.get('q') || '');

    const enviar = (e) => {
        e.preventDefault();
        const limpo = termo.trim();
        if (!limpo) return;
        salvarBuscaRecente(limpo);
        navigate(`${ROTAS.BUSCA}?q=${encodeURIComponent(limpo)}`);
    };

    return (
        <form className={`campo-busca ${className}`} onSubmit={enviar} role="search">
            <Search size={20} aria-hidden="true" />
            <input
                type="search"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Buscar serviço ou produto"
                aria-label="Buscar serviço ou produto"
            />
        </form>
    );
}

export default CampoBusca;
