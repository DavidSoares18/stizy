import { useNavigate } from 'react-router-dom';
import { Package, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROTAS } from '../../constants/rotas';

/**
 * Alternador do provedor: "Meu negócio" | "Comprar" (RF02).
 * No modo "Comprar" o provedor usa a plataforma como cliente.
 */
function ModoSwitch() {
    const { modo, setModo } = useAuth();
    const navigate = useNavigate();

    const trocar = (novo) => {
        if (novo === modo) return;
        setModo(novo);
        navigate(novo === 'negocio' ? ROTAS.PROVEDOR_AGENDA : ROTAS.INICIO);
    };

    return (
        <div className="modo-switch" role="group" aria-label="Modo de uso">
            <button
                type="button"
                className={modo === 'negocio' ? 'ativo' : ''}
                aria-pressed={modo === 'negocio'}
                onClick={() => trocar('negocio')}
            >
                <Package size={15} /> Meu negócio
            </button>
            <button
                type="button"
                className={modo === 'comprar' ? 'ativo' : ''}
                aria-pressed={modo === 'comprar'}
                onClick={() => trocar('comprar')}
            >
                <ShoppingBag size={15} /> Comprar
            </button>
        </div>
    );
}

export default ModoSwitch;
