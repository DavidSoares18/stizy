# 📅 STIZY

**Seu horário, sem complicação.**

> Sistema web de agendamento para pequenos negócios, desenvolvido como projeto acadêmico da disciplina de **Gerência de Projetos de Software**.

## 📖 Sobre o projeto

O **STIZY** tem como objetivo facilitar o agendamento de serviços para pequenos negócios e profissionais autônomos, como barbeiros, manicures e personal trainers.

Em vez de depender de mensagens, cadernos ou planilhas, o profissional poderá cadastrar seus serviços e definir os horários de atendimento. Os clientes poderão consultar os horários disponíveis e realizar agendamentos diretamente pelo sistema.

O projeto busca reduzir conflitos de horários, simplificar o gerenciamento da agenda e melhorar a experiência de clientes e profissionais.

## 🎯 Objetivos

- Permitir que clientes agendem serviços de forma simples e autônoma.
- Oferecer aos profissionais uma visão organizada da agenda diária e semanal.
- Evitar reservas duplicadas ou sobrepostas.
- Possibilitar o cancelamento e a remarcação de atendimentos.
- Centralizar as informações de serviços, horários e agendamentos.

## 👥 Público-alvo

- **Profissionais e donos de pequenos negócios:** cadastram serviços, definem sua disponibilidade e gerenciam os atendimentos.
- **Clientes:** consultam horários livres, agendam, cancelam e remarcam serviços.

## ✅ Funcionalidades planejadas (MVP)

- [ ] Cadastro e login de clientes e profissionais.
- [ ] Cadastro e gerenciamento de serviços (nome, duração e preço).
- [ ] Configuração dos horários de funcionamento dos profissionais.
- [ ] Consulta de serviços, datas e horários disponíveis.
- [ ] Criação e confirmação de agendamentos.
- [ ] Bloqueio automático de horários ocupados, evitando conflitos.
- [ ] Painel profissional com agenda do dia e da semana.
- [ ] Cancelamento e remarcação de agendamentos.

### 💡 Melhorias futuras

Estas funcionalidades **não fazem parte do compromisso inicial do MVP** e poderão ser desenvolvidas se houver tempo:

- Lembretes de agendamento por e-mail.
- Histórico de atendimentos por cliente.
- Relatórios de atendimentos e faturamento.
- Link público do profissional para agendamentos.
- Bloqueio de dias de folga e férias.

**Fora do escopo atual:** pagamentos online e integração com WhatsApp.

## 🛠️ Tecnologias

As tecnologias do projeto serão definidas pela equipe na etapa inicial de planejamento.

| Camada | Tecnologia |
| --- | --- |
| Front-end | A definir |
| Back-end e APIs | A definir |
| Banco de dados | A definir |
| Hospedagem / deploy | A definir |

## 👨‍💻 Equipe e responsabilidades

| Integrante | Área | Responsabilidades |
| --- | --- | --- |
| **David** | Back-end e integração de APIs | Regras de negócio, autenticação, endpoints, validações e integração entre os componentes. |
| **João** | Front-end | Protótipos, interfaces de clientes e profissionais, responsividade e consumo das APIs. |
| **Ian** | Banco de dados | Modelagem, tabelas, relacionamentos, persistência, consultas e integridade dos dados. |

A integração e os testes completos do sistema são responsabilidades compartilhadas pela equipe.

## 🗓️ Cronograma

**Período:** 19 de outubro a 18 de dezembro de 2026.  
**Organização:** 9 semanas, com entregas de acompanhamento às sextas-feiras.

| Semana | Período | Entrega planejada |
| --- | --- | --- |
| 1 | 19 a 23/10 | Requisitos, arquitetura inicial, protótipos e modelagem do banco. |
| 2 | 26 a 30/10 | Estrutura do projeto, cadastro e autenticação. |
| 3 | 02 a 06/11 | Cadastro de serviços e horários de funcionamento. |
| 4 | 09 a 13/11 | Consulta e cálculo de horários disponíveis. |
| 5 | 16 a 20/11 | Criação de agendamentos e prevenção de conflitos. |
| 6 | 23 a 27/11 | Painel da agenda, cancelamento e remarcação. |
| 7 | 30/11 a 04/12 | Integração completa, testes e validação do MVP. |
| 8 | 07 a 11/12 | Publicação, documentação e ajustes. |
| 9 | 14 a 18/12 | Revisão, demonstração e entrega final. |

> **Meta interna:** concluir o MVP até **04/12/2026**, reservando as duas últimas semanas para estabilização, documentação e apresentação.

## 📋 Gestão do projeto

O desenvolvimento será organizado por meio do **GitHub Issues**, **GitHub Projects**, **Milestones** e **Pull Requests**.

Fluxo sugerido do quadro Kanban:

`A fazer → Em andamento → Em revisão → Concluído`

Cada funcionalidade terá uma Issue com responsável, descrição, critérios de aceitação e semana de entrega. As alterações serão desenvolvidas em branches próprias e integradas por Pull Requests.

### 🌿 Padrão de branches (sugestão)

```text
main
feature/backend/nome-da-funcionalidade
feature/frontend/nome-da-funcionalidade
feature/database/nome-da-funcionalidade
fix/descricao-do-erro
```

### 💬 Padrão de commits (sugestão)

```text
feat: implementa cadastro de serviços
fix: corrige validação de horários disponíveis
docs: atualiza documentação da API
test: adiciona testes de agendamento
```

## 🚀 Como executar

O projeto está em fase inicial de planejamento. As instruções de instalação, configuração do banco de dados, variáveis de ambiente e execução local serão adicionadas assim que a equipe definir as tecnologias e implementar a estrutura inicial.

## 📌 Status

**🟡 Planejamento inicial — desenvolvimento previsto a partir de 19/10/2026.**

As funcionalidades descritas neste README representam o **escopo planejado** e ainda não devem ser consideradas implementadas.

## 🎓 Contexto acadêmico

Projeto desenvolvido por **David, João e Ian** para a disciplina de **Gerência de Projetos de Software**, com foco em planejamento, divisão de responsabilidades, desenvolvimento colaborativo, acompanhamento de entregas e construção de um produto mínimo viável.

---

**STIZY** — Seu horário, sem complicação.