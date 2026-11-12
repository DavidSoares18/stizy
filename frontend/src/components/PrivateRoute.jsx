import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROTAS } from '../constants/rotas';

/**
 * Protege rotas que exigem login (RNF04 - controle de acesso).
 * Se "perfil" for informado, só deixa entrar quem tem aquele perfil
 * (ex.: as telas /provedor/* são só para provedores).
 * Atenção: a regra REAL de autorização é do backend; isto só organiza a interface.
 */
function PrivateRoute({ perfil }) {
    const { usuario } = useAuth();

    // Sem sessão: volta para o login
    if (!usuario) return <Navigate to={ROTAS.LOGIN} replace />;

    // Perfil errado: manda para a tela inicial do perfil dele
    if (perfil && usuario.perfil !== perfil) {
        const destino = usuario.perfil === 'provedor' ? ROTAS.PROVEDOR_AGENDA : ROTAS.INICIO;
        return <Navigate to={destino} replace />;
    }

    return <Outlet />;
}

export default PrivateRoute;
