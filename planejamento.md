# Planejamento do Projeto — STIZY

> **STIZY — Seu horário, sem complicação.**  
> Sistema web de agendamento para pequenos negócios.  
> **Disciplina:** Gerência de Projetos de Software  
> **Equipe:** David, João e Ian  
> **Período de desenvolvimento:** 19/10/2026 a 18/12/2026  
> **Organização:** 9 semanas, com revisão e entrega de acompanhamento às sextas-feiras.  
> **Situação:** Planejamento inicial — funcionalidades ainda não implementadas.

## 1. Visão geral

O **STIZY** é um sistema web que permite a clientes marcar atendimentos de forma autônoma e a profissionais de pequenos negócios administrar serviços, horários e agendamentos em um painel.

O projeto busca substituir o controle informal de atendimentos por mensagens ou anotações, reduzindo conflitos de horário, retrabalho e dificuldades de organização.

**Objetivo do MVP:** permitir que um profissional cadastre serviços e horários de funcionamento, um cliente consulte a disponibilidade e faça uma reserva, e ambos possam acompanhar ou gerenciar o agendamento de acordo com suas permissões.

### 1.1 Perfis de usuário

| Perfil | Necessidades principais |
| --- | --- |
| **Profissional / dono do negócio** | Cadastrar serviços, definir horários, consultar agenda e gerenciar agendamentos. |
| **Cliente** | Criar conta, consultar horários livres, reservar, cancelar e remarcar atendimentos. |

## 2. Escopo

### 2.1 Funcionalidades obrigatórias — MVP

- [ ] Cadastro e login de clientes e profissionais.
- [ ] Cadastro e gerenciamento de serviços, com nome, duração e preço.
- [ ] Configuração de horários de funcionamento por profissional.
- [ ] Consulta de serviços, datas e horários disponíveis.
- [ ] Criação e confirmação de agendamentos.
- [ ] Bloqueio automático de horários ocupados, evitando reservas sobrepostas.
- [ ] Painel profissional com visualização da agenda diária e semanal.
- [ ] Cancelamento e remarcação de agendamentos, observadas as permissões e regras do sistema.

### 2.2 Melhorias opcionais — somente após a conclusão do MVP

1. Bloqueio de dias de folga e férias.
2. Link público de agendamento do profissional.
3. Histórico de atendimentos por cliente.
4. Lembretes de agendamento por e-mail.
5. Relatórios de atendimentos e faturamento.

**Fora do escopo deste projeto:** pagamentos online e integração com WhatsApp.

> **Regra de escopo:** nenhuma melhoria opcional deve comprometer os testes, a documentação ou a entrega das funcionalidades obrigatórias.

## 3. Equipe e responsabilidades

| Integrante | Área principal | Responsabilidades |
| --- | --- | --- |
| **David** | Back-end e integração de APIs | Arquitetura do servidor; regras de negócio; autenticação e autorização; rotas e contratos de API; cálculo de disponibilidade; criação, cancelamento e remarcação; integração entre front-end e persistência; documentação e testes de API. |
| **João** | Front-end | Identidade visual; protótipos; páginas e componentes; formulários; calendário e painel; integração da interface com APIs; estados de carregamento e erro; responsividade e testes de interface. |
| **Ian** | Banco de dados e persistência | Modelo entidade-relacionamento; criação de tabelas; migrações; conexão com o banco; relacionamentos, consultas e integridade; transações; testes de persistência e concorrência; documentação do esquema. |

**Responsabilidades compartilhadas:** decisões arquiteturais, revisão de Pull Requests, testes ponta a ponta, correção de erros de integração, documentação e apresentação final.

### 3.1 Limites de atuação e colaboração

- **David** define o comportamento e o contrato dos endpoints; **João** utiliza esse contrato para desenvolver a interface, inicialmente com dados simulados quando necessário.
- **Ian** define e implementa a camada de persistência em conjunto com David, evitando duplicar regras de negócio em dois lugares.
- Regras como *quais horários podem ser oferecidos* são validadas pelo **back-end**; a integridade dos dados e o tratamento de concorrência também precisam ser garantidos pelo **banco de dados**.
- As integrações são validadas por pelo menos dois integrantes envolvidos na funcionalidade.

## 4. Decisões técnicas da primeira semana

A apresentação do projeto e o README inicial não fixam uma stack. Portanto, as escolhas abaixo devem ser registradas até **23/10/2026**, antes de consolidar as implementações:

| Decisão pendente | Responsáveis pela definição | Status |
| --- | --- | --- |
| Framework e linguagem do front-end | João, com equipe | A definir |
| Framework e linguagem do back-end | David, com equipe | A definir |
| Sistema gerenciador de banco de dados | Ian, com equipe | A definir |
| Estratégia de autenticação e autorização | David, com equipe | A definir |
| Formato dos endpoints, erros e documentação da API | David e João | A definir |
| Ambiente de hospedagem e publicação | Equipe | A definir |
| Regras de fuso horário, antecedência e cancelamento | Equipe | A definir |

### 4.1 Contrato de integração — princípio inicial

O sistema terá três partes principais: **interface web → API/back-end → camada de persistência/banco de dados**. O contrato da API deverá identificar os endpoints, os métodos HTTP, os dados de entrada e saída, os códigos de erro e as permissões de acesso. Os nomes finais das rotas serão definidos na Issue correspondente.

### 4.2 Regras críticas para agendamentos

- Um atendimento ocupa um intervalo de tempo, conforme o horário de início e a duração do serviço.
- O intervalo deve respeitar os horários de funcionamento cadastrados.
- Horários já ocupados ou sobrepostos não podem ser oferecidos como disponíveis.
- Mesmo que duas pessoas tentem reservar ao mesmo tempo, o sistema não pode confirmar atendimentos conflitantes para o mesmo profissional.
- As verificações precisam acontecer no servidor; a interface, isoladamente, não é proteção suficiente.
- Datas, horários e fuso deverão ter um padrão consistente na API e no banco.
- Apenas usuários autorizados podem alterar dados e agendamentos que não lhes pertencem.

## 5. Cronograma — 19 de outubro a 18 de dezembro de 2026

As semanas começam na **segunda-feira** e terminam na **sexta-feira**. O período corresponde a dois meses de calendário, abrangendo **nove semanas de trabalho**. As entregas semanais são metas de acompanhamento; ajustes deverão ser registrados nas Issues quando necessários.

### 5.1 Resumo executivo

| Semana | Período | Foco | Entrega de sexta-feira |
| --- | --- | --- | --- |
| **1** | 19 a 23/10 | Requisitos e arquitetura | Requisitos, protótipos, modelo de dados e contrato inicial da API. |
| **2** | 26 a 30/10 | Fundação e autenticação | Projetos configurados e fluxo de cadastro/login integrado. |
| **3** | 02 a 06/11 | Serviços e funcionamento | Profissional cadastra serviços e seus horários. |
| **4** | 09 a 13/11 | Disponibilidade | Cliente consulta serviços, datas e horários livres. |
| **5** | 16 a 20/11 | Reserva e integridade | Cliente cria um agendamento sem permitir conflitos. |
| **6** | 23 a 27/11 | Painel e gestão | Agenda diária/semanal, cancelamento e remarcação. |
| **7** | 30/11 a 04/12 | Testes e MVP | MVP integrado, validado e sem falhas bloqueadoras conhecidas. |
| **8** | 07 a 11/12 | Deploy e documentação | Ambiente demonstrável e documentação revisada. |
| **9** | 14 a 18/12 | Revisão e entrega | Release v1.0.0, demonstração e apresentação final. |

**Meta interna:** concluir o MVP até **04/12/2026**. Reservar as semanas 8 e 9 para estabilização, publicação, documentação, testes finais e apresentação.

> **Atenção à disponibilidade da equipe:** 02/11 e 20/11 são feriados nacionais no Brasil. Ajustar o esforço das semanas 3 e 5 conforme a rotina acadêmica e os horários reais dos integrantes, sem empurrar decisões críticas para a última semana.

### 5.2 Semana 1 — Planejamento e arquitetura (19 a 23/10)

- **David:** criar e configurar o repositório STIZY; estruturar GitHub Project, labels e milestones; consolidar requisitos; propor arquitetura; definir o contrato inicial das APIs.
- **João:** definir diretrizes de identidade visual; criar wireframes das telas de login, cadastro, escolha de serviço, disponibilidade e painel profissional.
- **Ian:** identificar entidades e relacionamentos; criar diagrama entidade-relacionamento; discutir regras de persistência e sobreposição de horários com David.
- **Entrega em 23/10:** planejamento aprovado pela equipe, protótipo navegável ou wireframes revisados, modelo inicial do banco, contrato da API e stack decidida.

### 5.3 Semana 2 — Estrutura e autenticação (26 a 30/10)

- **David:** criar estrutura do back-end; implementar rotas de cadastro/login; tratar senhas com segurança, validações e papéis de usuário.
- **João:** iniciar front-end; configurar navegação; implementar interfaces de cadastro/login e conectar ao contrato da API.
- **Ian:** provisionar banco para desenvolvimento; criar conexão e migrações; implementar tabelas de usuários e perfis.
- **Entrega em 30/10:** aplicação inicial executável e fluxo de cadastro/login integrado e testado.

### 5.4 Semana 3 — Cadastro de serviços e horários (02 a 06/11)

- **David:** criar CRUD de serviços; desenvolver endpoints para configurar horários de funcionamento; validar posse e permissões.
- **João:** implementar telas de cadastro/listagem/edição de serviços e formulário de horários.
- **Ian:** implementar tabelas de serviços, dados de duração/preço e disponibilidade recorrente do profissional.
- **Entrega em 06/11:** profissional cadastra serviços e configura seu funcionamento com persistência real.

### 5.5 Semana 4 — Horários disponíveis (09 a 13/11)

- **David:** desenvolver cálculo de horários livres considerando funcionamento, duração e reservas; criar endpoint de consulta; testar limites de horários e datas.
- **João:** desenvolver fluxo de seleção de serviço, data e horário; exibir lista de horários retornada pela API.
- **Ian:** criar tabelas e consultas de agendamentos para sustentar o cálculo de disponibilidade.
- **Entrega em 13/11:** o cliente visualiza somente horários livres de acordo com as regras definidas.

### 5.6 Semana 5 — Criação de agendamentos (16 a 20/11)

- **David:** implementar reserva e confirmação de agendamento; revalidar disponibilidade na confirmação; tratar erros e permissões.
- **João:** desenvolver etapa de confirmação; apresentar mensagens de sucesso, indisponibilidade e falha.
- **Ian:** garantir transações e integridade para impedir que requisições simultâneas confirmem intervalos conflitantes.
- **Entrega em 20/11:** cliente confirma um agendamento real; tentativas concorrentes conflitantes são tratadas corretamente.

### 5.7 Semana 6 — Agenda, cancelamento e remarcação (23 a 27/11)

- **David:** criar consultas da agenda diária/semanal; implementar regras de cancelamento e remarcação.
- **João:** construir painel com visualização da agenda e ações de cancelamento/remarcação para usuários autorizados.
- **Ian:** persistir alterações de estado e horário; testar atualizações e consultas da agenda.
- **Entrega em 27/11:** agenda operacional e fluxos de cancelamento/remarcação integrados.

### 5.8 Semana 7 — Qualidade e conclusão do MVP (30/11 a 04/12)

- **David:** testar endpoints, autenticação, permissões, disponibilidade e agendamentos; corrigir falhas do servidor.
- **João:** validar navegação, mensagens de erro, responsividade e acessibilidade básica.
- **Ian:** testar consultas, integridade e concorrência; revisar migrações e dados de teste.
- **Todos:** executar cenários ponta a ponta e registrar/corrigir bugs bloqueadores.
- **Entrega em 04/12:** MVP completo, integrado e aprovado no checklist de aceite.

### 5.9 Semana 8 — Publicação e documentação (07 a 11/12)

- **David:** preparar ambiente de back-end, variáveis de configuração e documentação dos endpoints.
- **João:** preparar publicação do front-end, revisão visual e manual de uso.
- **Ian:** preparar persistência do ambiente de demonstração, migrações e documentação do esquema.
- **Todos:** validar a integração no ambiente publicado e realizar teste rápido com usuários.
- **Entrega em 11/12:** sistema demonstrável, documentação de instalação e uso, e bugs críticos tratados.

### 5.10 Semana 9 — Revisão e entrega final (14 a 18/12)

- **David:** revisar a estabilidade da API, preparar release e revisar instruções técnicas.
- **João:** revisar interface, finalizar roteiro de demonstração e materiais visuais da apresentação.
- **Ian:** conferir dados, migrações e consistência do ambiente final.
- **Todos:** ensaiar a apresentação, executar demonstração completa e verificar o repositório.
- **Entrega em 18/12:** versão **v1.0.0**, README atualizado, documentação, registro de testes e apresentação final.

## 6. Backlog de Issues para o GitHub

**Como utilizar:** os identificadores `STZ-01` a `STZ-40` são apenas referências internas deste documento. Os números reais (`#1`, `#2` etc.) serão atribuídos pelo GitHub conforme as Issues forem criadas. Para cada Issue, incluir descrição, critérios de aceitação, responsável, label e milestone.

### Milestone 1 — Planejamento (23/10)

| ID | Título sugerido | Responsável | Critério de aceite |
| --- | --- | --- | --- |
| STZ-01 | `[DOCS] Definir requisitos e histórias de usuário` | David (com todos) | Requisitos e jornadas principais registrados e revisados. |
| STZ-02 | `[CONFIG] Configurar repositório e GitHub Project` | David | Repositório, quadro, labels e milestones criados. |
| STZ-03 | `[FRONT] Criar protótipos das telas` | João | Protótipos cobrindo os fluxos obrigatórios do MVP. |
| STZ-04 | `[DB] Criar diagrama entidade-relacionamento` | Ian | Diagrama e relacionamentos validados pela equipe. |
| STZ-05 | `[API] Definir contrato REST inicial` | David | Endpoints, autenticação, respostas e erros documentados. |

### Milestone 2 — Autenticação (30/10)

| ID | Título sugerido | Responsável | Critério de aceite |
| --- | --- | --- | --- |
| STZ-06 | `[BACK] Configurar estrutura do servidor` | David | Servidor inicia e possui configuração documentada. |
| STZ-07 | `[FRONT] Configurar estrutura e rotas da aplicação` | João | Interface inicia e navega entre telas básicas. |
| STZ-08 | `[DB] Configurar banco e migrações` | Ian | Conexão e migrações reproduzíveis. |
| STZ-09 | `[DB] Criar tabelas de usuários e perfis` | Ian | Dados persistidos com integridade e papéis definidos. |
| STZ-10 | `[BACK] Implementar cadastro e autenticação` | David | Cadastro/login validados e senhas protegidas. |
| STZ-11 | `[FRONT] Desenvolver telas de cadastro e login` | João | Fluxo integrado ao back-end com tratamento de erros. |

### Milestone 3 — Serviços e horários (06/11)

| ID | Título sugerido | Responsável | Critério de aceite |
| --- | --- | --- | --- |
| STZ-12 | `[DB] Criar tabelas de serviços e funcionamento` | Ian | Persistência e vínculos implementados. |
| STZ-13 | `[BACK] Implementar CRUD de serviços` | David | Operações autorizadas e validadas. |
| STZ-14 | `[BACK] Implementar gestão de horários de funcionamento` | David | Horários podem ser consultados e atualizados. |
| STZ-15 | `[FRONT] Criar painel de serviços` | João | Formulários e listagem integrados. |
| STZ-16 | `[FRONT] Criar configuração de horários` | João | Interface permite salvar e visualizar funcionamento. |

### Milestone 4 — Disponibilidade (13/11)

| ID | Título sugerido | Responsável | Critério de aceite |
| --- | --- | --- | --- |
| STZ-17 | `[DB] Criar estrutura de agendamentos` | Ian | Dados de reserva, intervalo e status persistidos. |
| STZ-18 | `[BACK] Implementar cálculo de horários livres` | David | Disponibilidade considera funcionamento, duração e reservas. |
| STZ-19 | `[API] Criar endpoint de consulta de disponibilidade` | David | Consulta retorna horários coerentes por data e serviço. |
| STZ-20 | `[FRONT] Criar seleção de serviço, data e horário` | João | Cliente escolhe um horário retornado pela API. |
| STZ-21 | `[TEST] Validar datas e intervalos de horários` | David | Casos-limite e horários inválidos testados. |

### Milestone 5 — Agendamento (20/11)

| ID | Título sugerido | Responsável | Critério de aceite |
| --- | --- | --- | --- |
| STZ-22 | `[DB] Garantir integridade de reservas concorrentes` | Ian | Transações impedem agendamentos conflitantes. |
| STZ-23 | `[BACK] Implementar criação e confirmação de reservas` | David | Reserva revalidada e persistida com segurança. |
| STZ-24 | `[FRONT] Desenvolver confirmação de agendamento` | João | Confirmação e erros exibidos corretamente. |
| STZ-25 | `[TEST] Testar conflitos de reservas simultâneas` | Ian (com David) | Cenários concorrentes aprovados. |

### Milestone 6 — Gerenciamento da agenda (27/11)

| ID | Título sugerido | Responsável | Critério de aceite |
| --- | --- | --- | --- |
| STZ-26 | `[BACK] Implementar agenda diária e semanal` | David | Consultas por período retornam dados autorizados. |
| STZ-27 | `[FRONT] Desenvolver painel de agendamentos` | João | Agenda navegável e legível. |
| STZ-28 | `[DB] Implementar persistência de status e remarcações` | Ian | Atualizações mantêm dados consistentes. |
| STZ-29 | `[BACK] Implementar cancelamento e remarcação` | David | Regras, permissões e disponibilidade validadas. |
| STZ-30 | `[FRONT] Integrar ações de cancelamento e remarcação` | João | Usuário autorizado consegue executar os fluxos. |

### Milestone 7 — MVP validado (04/12)

| ID | Título sugerido | Responsável | Critério de aceite |
| --- | --- | --- | --- |
| STZ-31 | `[TEST] Testar autenticação e APIs` | David | Testes principais aprovados. |
| STZ-32 | `[TEST] Testar persistência e concorrência` | Ian | Integridade e reservas simultâneas verificadas. |
| STZ-33 | `[FRONT] Revisar responsividade e acessibilidade` | João | Fluxos principais funcionam em desktop e celular. |
| STZ-34 | `[INTEGRATION] Executar testes ponta a ponta` | Todos | Jornada completa executada sem erros bloqueadores. |

### Milestone 8 — Publicação e documentação (11/12)

| ID | Título sugerido | Responsável | Critério de aceite |
| --- | --- | --- | --- |
| STZ-35 | `[DEPLOY] Publicar sistema para demonstração` | David (com todos) | Interface, API e banco conectados no ambiente final. |
| STZ-36 | `[DOCS] Documentar arquitetura, API e banco` | David e Ian | README e instruções técnicas atualizados. |
| STZ-37 | `[QA] Validar sistema com usuários de teste` | João (com todos) | Feedback registrado e problemas priorizados. |

### Milestone 9 — Entrega final (18/12)

| ID | Título sugerido | Responsável | Critério de aceite |
| --- | --- | --- | --- |
| STZ-38 | `[FIX] Corrigir bugs finais` | Todos | Nenhum erro bloqueador conhecido permanece. |
| STZ-39 | `[DOCS] Preparar apresentação e demonstração` | João (com todos) | Roteiro revisado e apresentação ensaiada. |
| STZ-40 | `[RELEASE] Publicar versão v1.0.0` | David (com todos) | Release criada e pacote de entrega revisado. |

### 6.1 Issues opcionais — backlog futuro

| ID | Título | Responsável sugerido | Prioridade entre extras |
| --- | --- | --- | --- |
| EXTRA-01 | `[EXTRA] Implementar bloqueio de folgas e férias` | Todos | Alta |
| EXTRA-02 | `[EXTRA] Gerar link público de agendamento` | David e João | Alta |
| EXTRA-03 | `[EXTRA] Criar histórico de atendimentos por cliente` | Todos | Média |
| EXTRA-04 | `[EXTRA] Enviar lembretes por e-mail` | David | Média |
| EXTRA-05 | `[EXTRA] Gerar relatórios de atendimentos e faturamento` | Todos | Baixa |

Estas Issues não integram os critérios obrigatórios de conclusão do MVP.

## 7. Dependências principais entre tarefas

| Dependência | Por quê? |
| --- | --- |
| STZ-04 + STZ-05 → STZ-08 a STZ-11 | Modelo e contrato devem orientar banco, autenticação e telas. |
| STZ-12 + STZ-13 + STZ-14 → STZ-18 a STZ-20 | Disponibilidade exige serviços com duração e horários configurados. |
| STZ-17 + STZ-18 + STZ-22 → STZ-23 | Confirmação exige persistência, cálculo e proteção contra conflitos. |
| STZ-23 → STZ-26 a STZ-30 | Painel, cancelamento e remarcação dependem de agendamentos reais. |
| STZ-31 a STZ-34 → STZ-35 | Publicação demonstrável depende de um MVP funcional. |
| STZ-35 a STZ-39 → STZ-40 | Release final depende da validação, documentação e demonstração. |

**Estratégia para evitar bloqueios:** o front-end pode avançar com dados simulados e contratos da API; o banco pode evoluir com migrações versionadas. A substituição por integrações reais deve ocorrer nas semanas previstas, não apenas no fim.

## 8. Organização do GitHub

### 8.1 Repositório

- **Nome:** `STIZY`
- **Branch principal:** `main`
- **Gestão:** GitHub Issues + GitHub Projects (Kanban) + GitHub Milestones + Pull Requests.
- **Documentação:** `README.md` para apresentação e execução; `planejamento.md` para cronograma, tarefas e critérios de entrega.

### 8.2 Colunas do Kanban

1. **Backlog** — sugestões e tarefas ainda não priorizadas.
2. **A fazer** — pronta para começar na semana atribuída.
3. **Em andamento** — tarefa sendo implementada.
4. **Em revisão** — Pull Request ou entrega aguardando validação.
5. **Bloqueado** — dependência ou impedimento documentado.
6. **Concluído** — critérios de aceitação atendidos e alteração integrada.

### 8.3 Labels sugeridas

| Categoria | Labels |
| --- | --- |
| Área | `backend`, `frontend`, `database`, `integration`, `documentation` |
| Qualidade | `testing`, `bug` |
| Prioridade | `priority:high`, `priority:medium`, `priority:low` |
| Natureza | `enhancement`, `configuration`, `deployment` |

### 8.4 Padrão de branches

```text
main
feature/backend/autenticacao
feature/backend/agendamento
feature/frontend/tela-login
feature/frontend/painel-profissional
feature/database/modelo-usuarios
feature/database/agendamentos
fix/validacao-de-horarios
```

**Recomendação:** uma branch curta por Issue ou funcionalidade, sempre vinculada a uma Issue. Adaptar os exemplos às tarefas reais.

### 8.5 Commits e Pull Requests

Exemplos de commits:

```text
feat: implementa cadastro de serviços
fix: impede sobreposicao de agendamentos
docs: atualiza contrato da API
test: adiciona testes de horarios disponiveis
chore: configura ambiente de desenvolvimento
```

Toda alteração significativa deverá seguir o fluxo:

1. Selecionar uma Issue do milestone atual.
2. Criar uma branch específica.
3. Implementar e validar localmente.
4. Abrir Pull Request com resumo, evidências e referência da Issue.
5. Solicitar revisão de ao menos outro integrante.
6. Integrar à `main` após os testes pertinentes.
7. Mover a Issue para **Concluído**.

Em um PR que encerra uma Issue, usar `Closes #N`, substituindo `N` pelo número oficial gerado no GitHub.

### 8.6 Rotina semanal sugerida

- **Segunda-feira:** selecionar Issues, verificar dependências e alinhar entregas.
- **Ao longo da semana:** desenvolver, abrir PRs pequenos e registrar impedimentos.
- **Quinta-feira:** revisar o andamento e preparar a integração.
- **Sexta-feira:** executar demonstração curta, validar critérios, fechar Issues e registrar o que passou para a semana seguinte.

## 9. Riscos e estratégias de mitigação

| Risco | Impacto | Estratégia |
| --- | --- | --- |
| Duas reservas no mesmo intervalo | Alto | Validação no servidor, integridade no banco e testes de concorrência. |
| Crescimento excessivo do escopo | Alto | Manter extras fora do MVP; só iniciar após aceite das funções essenciais. |
| Atraso de integração entre os integrantes | Alto | Definir contrato cedo; usar mocks; integrar a cada semana. |
| Erros com datas, durações e fusos | Médio/alto | Padronizar representação e testar intervalos e casos-limite. |
| Mudanças de disponibilidade ou feriados | Médio | Ajustar carga semanal e priorizar tarefas críticas nas semanas 3 e 5. |
| Dificuldades de hospedagem ou configuração | Médio | Provar deploy antecipadamente e documentar variáveis e migrações. |
| Pouco tempo para testes e apresentação | Alto | Congelar MVP em 04/12 e usar as últimas semanas para estabilização. |
| Falta de validação com usuários reais | Médio | Validar protótipos cedo e realizar testes simples na semana 8. |

## 10. Critérios de aceite do MVP

O MVP será considerado aprovado quando todos os itens abaixo estiverem atendidos:

- [ ] Cliente e profissional conseguem cadastrar uma conta e fazer login.
- [ ] O sistema diferencia permissões de cliente e profissional.
- [ ] O profissional consegue cadastrar e gerenciar serviços e seus horários.
- [ ] O cliente visualiza horários disponíveis conforme a duração do serviço.
- [ ] O cliente consegue confirmar uma reserva persistida no banco.
- [ ] Horários ocupados e intervalos sobrepostos não podem ser reservados novamente.
- [ ] Reservas simultâneas conflitantes não são confirmadas em duplicidade.
- [ ] O profissional visualiza agendamentos na agenda diária e semanal.
- [ ] Cancelamento e remarcação funcionam conforme permissões e disponibilidade.
- [ ] As informações continuam salvas após reinício da aplicação.
- [ ] Os principais fluxos foram testados de ponta a ponta.
- [ ] O sistema está executável e disponível para demonstração.

### 10.1 Definição de pronto (*Definition of Done*) de uma Issue

Uma Issue só deve ser fechada quando:

1. Seus critérios de aceitação estiverem cumpridos.
2. O código ou documento estiver no repositório.
3. Os testes aplicáveis tiverem sido realizados.
4. A funcionalidade tiver sido integrada, quando necessário.
5. O Pull Request tiver sido revisado e incorporado à branch principal.
6. A documentação pertinente tiver sido atualizada.

## 11. Entregáveis finais

Até **18/12/2026**, a equipe deverá disponibilizar:

- Código-fonte do STIZY no GitHub, com histórico organizado de commits e Pull Requests.
- **Release `v1.0.0`** com o MVP funcional.
- `README.md` atualizado, incluindo tecnologias e instruções de execução.
- `planejamento.md` atualizado conforme o andamento real do projeto.
- Modelo do banco e informações de migração/configuração.
- Documentação da API e principais decisões técnicas.
- Evidências de teste e de prevenção de conflitos de agendamento.
- Sistema acessível ou executável para demonstração.
- Apresentação final do projeto com participação dos três integrantes.

## 12. Acompanhamento e atualização do plano

Este documento registra o **planejamento**, não a confirmação de tarefas já executadas. As datas e entregas representam metas. O GitHub Projects deverá refletir o estado real das Issues.

Sempre que ocorrer uma alteração de prazo, responsabilidade ou escopo, registrar:

- **O que mudou.**
- **Por que mudou.**
- **Quais Issues e entregas foram afetadas.**
- **Qual é o novo plano acordado pela equipe.**

---

**STIZY — Seu horário, sem complicação.**  
*Planejamento inicial preparado para execução entre 19/10/2026 e 18/12/2026.*