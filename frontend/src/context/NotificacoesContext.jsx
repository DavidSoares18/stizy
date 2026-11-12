import { createContext, useContext, useState } from 'react';

const NotificacoesContext = createContext({});

/**
 * Controla o modal de notificações, aberto pelo sino do cabeçalho
 * (desktop e mobile) e pelos atalhos do perfil.
 */
export function NotificacoesProvider({ children }) {
    const [aberto, setAberto] = useState(false);

    return (
        <NotificacoesContext.Provider
            value={{ aberto, abrir: () => setAberto(true), fechar: () => setAberto(false) }}
        >
            {children}
        </NotificacoesContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotificacoes() {
    return useContext(NotificacoesContext);
}
