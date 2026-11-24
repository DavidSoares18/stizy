# Guia de integração do front-end — para Back-end e Banco de dados

Este guia explica **onde e como** ligar o back-end (David) e o banco de dados (Ian) ao front-end (João).
O front-end foi entregue **sem dados reais**: toda tela mostra cards vazios (barras cinzas) até a API responder.

> Regra de ouro: **os dados entram somente pela pasta `src/services/`**. Nenhuma página chama `fetch` direto.
> Quem integra mexe nos arquivos de `services` e nada mais.

---

## 1. Como rodar o front-end

```bash
cd frontend
cp .env.example .env     # ajuste VITE_API_URL se o back-end não estiver em localhost:8080
npm install
npm run dev              # http://localhost:5173
npm run lint && npm run build
```

- A rota `/telas` lista todas as telas para navegar direto (apoio; pode ser apagada junto com a rota em `App.jsx`).
- Hoje o login é um **protótipo**: qualquer e-mail/senha entra; e-mail começando com `provedor` vira conta de provedor.

---

## 2. Como funciona a ligação (mapa rápido)

```
Página (src/pages/*)  ->  hook useDados  ->  função de src/services/*  ->  requisicao() em services/api.js  ->  API
```

- `src/services/api.js`: `requisicao(metodo, caminho, corpo)` — monta a URL (`VITE_API_URL`), envia o JWT
  (`Authorization: Bearer <token>`, guardado em `localStorage`) e lança `Error` com `.status` se a resposta não for 2xx.
- Em cada função de `services` há um comentário `// BACKEND:` com **o endpoint, o corpo e o formato de resposta esperados**
  e a linha pronta para descomentar. Hoje a função devolve vazio (`[]`, `null`).
- **Para integrar uma função:** apague o `return` de vazio e use a linha do comentário `// BACKEND:`.
  A tela passa a mostrar os dados sozinha (o estado "vazio" some quando a lista vem preenchida).
- Erros: a página mostra o aviso "não foi possível carregar" quando a função lança erro. Em 409 (conflito de horário
  ou estoque) veja os comentários de `criarAgendamento` e `criarPedido`.

| Arquivo | O que integrar |
| --- | --- |
| `api.js` | URL base, JWT, tratamento de erro |
| `authService.js` | login, cadastro de cliente e de provedor, rascunho, editar perfil |
| `negociosService.js` | listas do início, busca, detalhe, serviços, produtos, avaliações, horários livres |
| `agendamentosService.js` | agenda do cliente, criar/cancelar/remarcar, pedido, "a combinar", pagamento (QR) |
| `conversasService.js` | conversas, mensagens, notificações |
| `provedorService.js` | agenda do dia, bloqueios, ausência, produtos/estoque, folha e taxa de 8% |

Para achar tudo de uma vez: `grep -rn "BACKEND" src/` (cada ocorrência é um ponto a preencher) e
`grep -rn "PROTÓTIPO" src/` (trechos de mentira que **devem ser removidos** ao integrar).

---

## 3. Para o BACK-END

### 3.1 O que já existe no back-end e como o front deve falar com ele

O back-end atual (`backend/`, Spring Boot, porta 8080) expõe:

| Método | Caminho | Corpo | Resposta |
| --- | --- | --- | --- |
| POST | `/api/auth/cadastro` | `{ nome, email, senha (8–72), papel }` | `201` + `{ id, nome, email, papel }` |
| POST | `/api/auth/login` | `{ email, senha }` | `{ token, tipo, expiraEmSegundos, usuario }` |
| GET | `/api/auth/me` | — (JWT) | `{ id, nome, email, papel }` |
| GET | `/api/health` | — | público |

### 3.2 Diferenças a resolver (o front foi escrito antes do contrato fechar)

| Assunto | Front-end hoje | Back-end hoje | Decisão necessária |
| --- | --- | --- | --- |
| Prefixo das rotas | `/auth/login`, `/negocios`, … | `/api/auth/...` | Ajustar `API_URL` em `api.js` para terminar em `/api` **ou** usar `/api` em cada caminho. Sugestão: `const API_URL = (VITE_API_URL) + '/api'` em um único lugar. |
| Nome do perfil | `usuario.perfil`: `'cliente'` \| `'provedor'` | `papel`: `CLIENTE` \| `PROFISSIONAL` | Mapear no `authService.js` (`PROFISSIONAL` -> `'provedor'`) ou alinhar o enum. O restante do front usa `'cliente'`/`'provedor'`. |
| Cadastro do provedor | 6 passos (negócio, endereço, serviços, horários…) e **sem e-mail/senha** no Figma | `CadastroRequest` só tem nome, e-mail, senha, papel | Definir se a conta é criada antes (`/api/auth/cadastro`) e os demais dados vão em `POST /provedores`, ou tudo em uma chamada. |
| CORS | Front em `http://localhost:5173` | `SecurityConfig` não libera CORS | Adicionar `CorsConfigurationSource` liberando a origem do front (ou proxy no Vite). Sem isso o navegador bloqueia as chamadas. |
| Expiração do token | Guarda o token e não renova | Expira em 120 min | Tratar `401`: o front deve voltar ao login (ponto a implementar em `api.js` quando houver a regra). |

### 3.3 Endpoints que o front espera (contrato completo)

Todos em **JSON**, datas em **UTC (ISO 8601)** — o front converte para o fuso do usuário (RNF07).
Os formatos exatos de cada resposta estão nos comentários de `src/services/*.js`; este é o resumo:

**Cliente**

| Método | Caminho | Função no front | Observação |
| --- | --- | --- | --- |
| GET | `/negocios?secao=:slug` / `?categoria=:slug` | `listarNegocios` | slugs em `src/constants/categorias.js`; ordenar por distância |
| GET | `/negocios/busca?q=` | `buscarNegocios` | serviço, produto ou provedor |
| GET | `/negocios/:id` | `obterNegocio` | cabeçalho da página do negócio |
| GET | `/negocios/:id/servicos` | `listarServicos` | `aCombinar: true` quando não há preço/duração |
| GET | `/negocios/:id/produtos` | `listarProdutos` | `estoque === 0` bloqueia a compra |
| GET | `/negocios/:id/avaliacoes` | `listarAvaliacoes` | |
| GET | `/negocios/:id/horarios?data=&servicoId=` | `listarHorarios` | respeitar a duração do serviço (RF05, RNF02); `livre:false` aparece riscado |
| GET | `/agendamentos` | `listarAgendamentos` | `{ proximos[], anteriores[] }` |
| POST | `/agendamentos` | `criarAgendamento` | **bloquear o horário de forma atômica (RF07, RNF05)**; responder `409` em conflito |
| DELETE | `/agendamentos/:id` | `cancelarAgendamento` | RF08 |
| PUT | `/agendamentos/:id/remarcar` | (a ligar na tela Agenda) | `{ inicioUtc }` |
| POST | `/pedidos` | `criarPedido` | validar estoque (RF19); `409` com `{ produtoId }` se esgotou |
| POST | `/solicitacoes` | `solicitarServico` | serviço "a combinar" (RF16) |
| POST | `/pagamentos` | `iniciarPagamentoOnline` | retorna QR/Pix `{ qrCodeImagem \| qrCodePayload, valor, status }` |
| GET | `/pagamentos/:id` | `consultarPagamento` | a tela só avança com `status: 'pago'` |
| GET | `/conversas` · `/conversas/:id/mensagens` | `listarConversas`, `listarMensagens` | |
| POST | `/conversas/:id/mensagens` | `enviarMensagem` | `{ texto }`; sugestão: WebSocket/SSE para tempo real |
| GET | `/notificacoes` | `listarNotificacoes` | |
| PUT | `/usuarios/me` | `atualizarPerfil` | `{ nome, email }` |

**Provedor**

| Método | Caminho | Função no front |
| --- | --- | --- |
| GET | `/provedor/agenda?data=AAAA-MM-DD` | `obterAgendaDoDia` |
| GET | `/provedor/agendamentos/:id` | `obterAtendimento` |
| PUT | `/provedor/agendamentos/:id/concluir` | `concluirAtendimento` |
| PUT | `/provedor/agendamentos/:id/faltou` | `marcarFalta` (status `FALTOU`; rota futura) |
| POST | `/provedor/bloqueios` | `bloquearHorario` (RF17) |
| POST | `/provedor/ausencias` | `registrarAusencia` (RF14) |
| GET | `/provedor/produtos` | `listarProdutosDoProvedor` |
| POST / PUT | `/provedor/produtos` · `/provedor/produtos/:id` | `salvarProduto` |
| GET | `/provedor/folha?periodo=dia\|mes\|ano` | `obterFolha` (RF15, RF18) |
| POST | `/provedor/folha/pagar-taxa` | `pagarTaxa` (taxa de 8%, calculada **no servidor**) |
| POST | `/clientes` · `/provedores` · `PUT /provedores/rascunho` | cadastros e "Salvar e continuar depois" |

### 3.4 Regras que o front **não** faz (são do back-end)

- Cálculo da taxa de 8%, valores líquidos e totais; permissões por perfil (o front só esconde telas — a API deve negar).
- Bloqueio de horários concorrentes, validação de estoque, expiração do token, validação real de e-mail.
- O front valida só o formato (máscaras de celular, CEP etc.) para ajudar o usuário; **nunca confie nele**.

### 3.5 Checklist para integrar uma tela

1. Abra o `services/<arquivo>.js` da tela e leia o `// BACKEND:` da função.
2. Implemente/ajuste o endpoint com o formato descrito (ou atualize o comentário se o contrato mudar).
3. Troque o retorno vazio pelo `return requisicao(...)` e remova linhas `void ...` e `PROTÓTIPO`.
4. Rode `npm run dev`, abra a tela e confira (inclusive o estado de erro, desligando a API).
5. Rode `npm run lint` e `npm run build`.

---

## 4. Para o BANCO DE DADOS

O front não conhece tabelas — ele consome objetos da API. Abaixo, o que a interface **precisa exibir**, para
orientar a modelagem (nomes sugestivos; o modelo final é do Ian). Já existe a migração
`backend/src/main/resources/db/migration/V1__criar_usuarios.sql`; as demais devem seguir o padrão `V2__...`, `V3__...`.

| Entidade | Campos que a interface usa |
| --- | --- |
| **Usuário** (existe) | id, nome, email, senha (hash), papel (cliente/profissional), foto (opcional), celular, bairro, cidade, aceitou termos (LGPD, RNF06) |
| **Negócio / Provedor** | id, usuário, nome, categoria, tipo (`horario` / `combinar` / `produtos`), endereço, latitude/longitude (para "distância km"), aberto/horário de fechamento, aceita pagamento pelo STIZY, tempo de entrega, retirada na loja, nota média |
| **Serviço** | id, negócio, nome, duração (min, pode ser nula), preço (pode ser nulo), "a combinar" |
| **Produto** | id, negócio, nome, descrição, preço, **estoque** (inteiro ≥ 0), "feito na hora" |
| **Horário de atendimento** | negócio, dias da semana, abertura/fechamento (base do cálculo de horários livres) |
| **Bloqueio / Ausência** | negócio, data+hora ou período (início/fim), motivo (RF14, RF17) |
| **Agendamento** | id, cliente, negócio, serviço, início em **UTC**, valor, forma de pagamento (online/presencial), status (confirmado/cancelado/concluído), tipo (serviço/entrega). **Restrição única** em (negócio, início) para impedir reserva dupla (RNF05) |
| **Pedido + itens** | id, cliente, negócio, entrega (retirar/entregar), pagamento, itens (produto, quantidade, preço unitário) |
| **Pagamento** | id, referência (pedido/agendamento), valor, status (aguardando/pago), payload do QR/Pix |
| **Avaliação** | id, cliente, negócio, nota (1–5), texto, criada em (UTC) |
| **Conversa / Mensagem** | participantes, texto, enviada em (UTC), lida |
| **Notificação** | usuário, tipo (agendamento/pedido/mensagem), título, descrição, lida |
| **Taxa mensal (folha)** | negócio, referência (AAAA-MM), valor (8% dos ganhos), vencimento, paga |
| **Rascunho de cadastro** | usuário/e-mail, JSON do passo atual (cadastro de provedor em 6 passos) |

Pontos de atenção para o banco:

- Guardar **datas em UTC** (`timestamptz`); o front converte para o fuso local.
- Índices em (negócio, início) de agendamentos e em categoria/localização de negócios (busca e "perto de você").
- Transações ao criar agendamento/pedido (estoque e horário não podem ficar inconsistentes).
- Dados pessoais (celular, bairro, cidade) só o essencial e com proteção adequada (LGPD, RNF06). **O front não coleta nem envia CPF/CNPJ.**

---

## 5. Perguntas em aberto (alinhar em equipe)

1. Cadastro de provedor: a conta (e-mail/senha) é criada antes dos 6 passos ou junto? (o Figma não tem esses campos)
2. `papel`: manter `PROFISSIONAL` no back-end e mapear para `provedor` no front, ou renomear?
3. Chat em tempo real: WebSocket, SSE ou apenas consulta periódica?
4. Fluxo de pagamento por QR/Pix: qual provedor de pagamento e como o status chega (webhook + consulta)?
5. Renovação/expiração do token JWT (hoje 120 min): o front deve pedir novo login ou usar refresh token?
