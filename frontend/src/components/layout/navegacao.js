import { Home, Calendar, MessageSquare, User, Package, Receipt } from 'lucide-react';
import { ROTAS } from '../../constants/rotas';

/**
 * Descobre qual menu mostrar:
 *  - cliente, ou provedor no modo "Comprar" -> menu do cliente (RF02)
 *  - provedor no modo "Meu negócio"          -> menu do provedor
 */
export function usaMenuProvedor(usuario, modo) {
    return usuario?.perfil === 'provedor' && modo === 'negocio';
}

export function rotaPerfil(usuario) {
    return usuario?.perfil === 'provedor' ? ROTAS.PROVEDOR_PERFIL : ROTAS.PERFIL;
}

/** Links do cabeçalho (desktop) */
export function linksDesktop(menuProvedor) {
    return menuProvedor
        ? [
            { rotulo: 'Agenda', para: ROTAS.PROVEDOR_AGENDA },
            { rotulo: 'Produtos e estoque', para: ROTAS.PROVEDOR_PRODUTOS },
            { rotulo: 'Folha de pagamento', para: ROTAS.PROVEDOR_FOLHA },
        ]
        : [
            { rotulo: 'Início', para: ROTAS.INICIO },
            { rotulo: 'Agenda', para: ROTAS.AGENDA },
            { rotulo: 'Conversas', para: ROTAS.CONVERSAS },
        ];
}

/** Itens da barra inferior (mobile) */
export function itensMobile(menuProvedor, usuario) {
    return menuProvedor
        ? [
            { rotulo: 'Agenda', para: ROTAS.PROVEDOR_AGENDA, icone: Calendar },
            { rotulo: 'Produtos', para: ROTAS.PROVEDOR_PRODUTOS, icone: Package },
            { rotulo: 'Folha', para: ROTAS.PROVEDOR_FOLHA, icone: Receipt },
            { rotulo: 'Perfil', para: rotaPerfil(usuario), icone: User },
        ]
        : [
            { rotulo: 'Início', para: ROTAS.INICIO, icone: Home },
            { rotulo: 'Agenda', para: ROTAS.AGENDA, icone: Calendar },
            { rotulo: 'Conversas', para: ROTAS.CONVERSAS, icone: MessageSquare },
            { rotulo: 'Perfil', para: rotaPerfil(usuario), icone: User },
        ];
}
