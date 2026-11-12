import { createContext, useContext, useState } from 'react';
import { STORAGE_KEYS } from '../constants/storage';

const AuthContext = createContext({});

/** Lê com segurança do localStorage (pode estar bloqueado em alguns navegadores) */
function lerStorage(chave) {
    try {
        return localStorage.getItem(chave);
    } catch {
        return null;
    }
}

function lerUsuario() {
    const salvo = lerStorage(STORAGE_KEYS.USUARIO);
    return salvo ? JSON.parse(salvo) : null;
}

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(lerUsuario);

    // Provedor alterna entre "negocio" (Meu negócio) e "comprar" (RF02)
    const [modo, setModoState] = useState(() => lerStorage(STORAGE_KEYS.MODO) || 'negocio');

    /**
     * Salva a sessão. "resposta" vem do authService.entrar():
     * { token, usuario: { nome, email, perfil: 'cliente' | 'provedor' } }
     */
    const login = (resposta) => {
        setUsuario(resposta.usuario);
        // Ao entrar, o provedor sempre começa em "Meu negócio"
        setModoState('negocio');
        try {
            localStorage.setItem(STORAGE_KEYS.TOKEN, resposta.token);
            localStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(resposta.usuario));
            localStorage.setItem(STORAGE_KEYS.MODO, 'negocio');
        } catch { /* sem storage: a sessão vale só até recarregar */ }
    };

    const logout = () => {
        setUsuario(null);
        try {
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USUARIO);
            localStorage.removeItem(STORAGE_KEYS.MODO);
        } catch { /* ignora */ }
    };

    const setModo = (novoModo) => {
        setModoState(novoModo);
        try { localStorage.setItem(STORAGE_KEYS.MODO, novoModo); } catch { /* ignora */ }
    };

    /** Atualiza nome/e-mail depois de "Editar perfil" */
    const atualizarUsuario = (dados) => {
        const novo = { ...usuario, ...dados };
        setUsuario(novo);
        try { localStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(novo)); } catch { /* ignora */ }
    };

    return (
        <AuthContext.Provider value={{ usuario, modo, login, logout, setModo, atualizarUsuario }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    return useContext(AuthContext);
}
