import { createContext, useContext, useState } from 'react';

const PedidoContext = createContext({});

/**
 * Guarda o pedido em andamento enquanto o cliente percorre o fluxo:
 *   Estabelecimento -> (Agendar) -> Pagamento -> (QR Code) -> Confirmado
 *
 * Formato:
 *   {
 *     tipo: 'agendamento' | 'compra',
 *     negocioId, negocio,            // dados do negócio (vindos do backend)
 *     itens: [...],                  // serviços escolhidos ou produtos + quantidade
 *     entrega: 'retirar' | 'entregar',   // só para compras
 *     dia, horario,                  // só para agendamentos
 *     pagamento: 'online' | 'presencial',
 *     total
 *   }
 */
export function PedidoProvider({ children }) {
    const [pedido, setPedido] = useState({});

    const atualizarPedido = (parcial) => setPedido((atual) => ({ ...atual, ...parcial }));
    const limparPedido = () => setPedido({});

    return (
        <PedidoContext.Provider value={{ pedido, atualizarPedido, limparPedido }}>
            {children}
        </PedidoContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePedido() {
    return useContext(PedidoContext);
}
