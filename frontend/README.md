# STIZY — Front-end (React + Vite)

Interface do STIZY (agendamentos e compras com provedores perto de você), baseada no Figma
**Página 3 · "Como eu faria"** (390×844 mobile e 1920×1080 desktop). Responsabilidade deste repositório: **apenas o front-end**.

> **Back-end e Banco de dados:** leia [`docs/INTEGRACAO.md`](docs/INTEGRACAO.md) — explica como ligar a API,
> o contrato esperado de cada endpoint e as entidades que a interface precisa.

## Como rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera /dist
npm run lint
```

Na tela de login há os botões **Conta de cliente** / **Conta de provedor** (só preenchem o formulário).
A rota `/telas` lista todas as telas para navegar direto (apoio ao desenvolvimento; pode ser apagada).

## Organização

```
src/
  assets/        logo
  components/
    layout/      Header (desktop), TopoMobile, BottomNav, AppLayout, busca, alternador Meu negócio/Comprar
    ui/          Modal, Avatar, CardNegocio, SecaoNegocios, Resumo, Passos, Abas
    cadastro/    CadastroLayout (passos) e FotoUpload
    modais/      Notificações, Editar perfil
    PrivateRoute.jsx
  constants/     rotas, categorias, storage (chaves do localStorage)
  context/       AuthContext, NotificacoesContext, PedidoContext (fluxo de agendamento/compra)
  hooks/         useDados (loading / erro / dados)
  pages/         uma pasta por tela (Tela.jsx + Tela.css)
  services/      >>> PONTO DE INTEGRAÇÃO COM O BACKEND <<<
  utils/         formatadores, máscaras, buscas recentes
```

## Integração com o backend (para quem for preencher os dados)

Todos os dados reais entram **somente** pela pasta `src/services/`. Cada função tem, em comentário,
o endpoint esperado e o formato de resposta (`// BACKEND: ...`). Hoje elas devolvem listas vazias e as
telas mostram **cards vazios** (barras cinzas) até os dados chegarem.

| Arquivo | O que preencher |
| --- | --- |
| `api.js` | `VITE_API_URL` (arquivo `.env`) e envio do JWT |
| `authService.js` | login, cadastro de cliente/provedor, rascunho, editar perfil |
| `negociosService.js` | listas do início, busca, detalhe do negócio, serviços, produtos/estoque, avaliações, horários livres |
| `agendamentosService.js` | agenda do cliente, criar/cancelar agendamento, pedido, solicitação "a combinar", pagamento/QR |
| `conversasService.js` | conversas, mensagens, notificações |
| `provedorService.js` | agenda do dia, bloqueios, ausência, produtos, folha de pagamento e taxa de 8% |

Trechos marcados como **PROTÓTIPO** (ex.: `entrar()` deduz o perfil pelo e-mail; `consultarPagamento()` devolve "pago")
devem ser removidos ao integrar.

## Decisões de interface (do Figma)

- Paleta: roxo `#56067F`, roxo 2 `#9F4BF2`, amarelo `#FFD352`, ouro `#D5AA2A`, tinta `#1E0A2E` (tokens em `src/index.css`).
- Viewport fixo, sem rolagem da página: a casca ocupa 100% da altura; só a área de conteúdo rola se o backend trouxer mais itens do que cabe.
- Breakpoint mobile/desktop: `900px`. Mobile usa barra inferior e botão de ação fixo no rodapé.
- Confirmações (pagar taxa, produto esgotado, cancelar etc.) abrem **modal**, não uma tela nova.
- Datas chegam em UTC e são convertidas para o fuso do usuário no front (RNF07).
