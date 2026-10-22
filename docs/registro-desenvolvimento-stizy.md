# STIZY — Registro de desenvolvimento

> **Projeto:** STIZY — Seu horário, sem complicação  
> **Disciplina:** Gerência de Projetos de Software  
> **Equipe:** David (back-end e APIs), João (front-end), Ian (banco de dados)  
> **Período do projeto:** 19/10/2026 a 18/12/2026  
> **Data deste registro:** 22/10/2026  
> **Branch observada na conversa:** `chore/estrutura-inicial`  
> **Ambiente observado:** GitHub Codespaces, diretório `/workspaces/marcahora`

## 1. Objetivo deste registro

Documentar as decisões técnicas, a estrutura inicial, os arquivos e o código preparados durante as conversas de implementação do STIZY, com vínculo às Issues planejadas. **Este é um registro de desenvolvimento, não um relatório de testes aprovados.** Quando a execução, o commit ou o funcionamento não foram comprovados na conversa, isso é explicitamente indicado.

## 2. Decisões técnicas acordadas

| Área | Decisão |
| --- | --- |
| Back-end | Java + Spring Boot |
| Versão selecionada no planejamento | Spring Boot 4.1.1 |
| Versão-alvo de compilação | Java 21 |
| JDK disponível no Codespaces | Microsoft OpenJDK 25.0.4.1 LTS |
| Front-end | React + TypeScript + Vite |
| Banco de dados | PostgreSQL |
| Persistência | Spring Data JPA e Flyway |
| Segurança | Spring Security, BCrypt e JWT |
| API | REST, JSON e endpoints `/api/...` |
| Gerenciadores | Maven Wrapper e npm |
| Ambiente de desenvolvimento | GitHub Codespaces; Docker planejado para PostgreSQL |
| Formato de configuração | YAML (`application.yml`) |

Verificações de ferramentas relatadas no terminal: Node.js `v24.21.0`, npm `11.19.0`, Git `2.55.0`, Docker CLI `29.8.0`. A presença da CLI Docker **não comprova** que o daemon ou o PostgreSQL estavam em execução.

## 3. Estrutura e arquivos trabalhados

A estrutura prevista para o repositório é:

```text
STIZY (repositório local em /workspaces/marcahora)
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/stizy/
│       │   ├── StizyApplication.java               [gerado pelo Initializr]
│       │   ├── api/HealthController.java            [código fornecido]
│       │   ├── config/SecurityConfig.java           [código fornecido]
│       │   ├── usuario/
│       │   │   ├── Papel.java                        [código fornecido]
│       │   │   ├── Usuario.java                      [código fornecido]
│       │   │   └── UsuarioRepository.java           [código fornecido]
│       │   └── autenticacao/
│       │       ├── CadastroRequest.java             [código fornecido]
│       │       ├── LoginRequest.java                [código fornecido]
│       │       ├── UsuarioResponse.java             [código fornecido]
│       │       ├── TokenResponse.java               [código fornecido]
│       │       ├── AutenticacaoService.java         [usuário mostrou o arquivo]
│       │       └── AutenticacaoController.java      [código fornecido]
│       └── resources/
│           ├── application.yml                      [configuração proposta]
│           └── db/migration/
│               └── V1__criar_usuarios.sql           [script fornecido]
├── frontend/                                    [estrutura proposta; criação não confirmada]
├── docs/
├── docker-compose.yml                          [configuração proposta]
├── README.md
└── planejamento.md
```

**Legenda:** “código fornecido” significa que o conteúdo foi escrito nas orientações da conversa, não que seu salvamento, compilação, commit ou integração tenham sido comprovados. O arquivo `AutenticacaoService.java` foi explicitamente compartilhado pelo usuário com mensagens de erro.

## 4. Funcionalidades e decisões de implementação

### 4.1 Verificação da API

- Rota proposta: `GET /api/health`.
- Controller: `HealthController.java`.
- Retorno JSON de identificação e status da API.
- **Pendente:** comprovar resposta HTTP 200 no ambiente em execução.

### 4.2 Cadastro de usuários

- Rota proposta: `POST /api/auth/cadastro`.
- Perfis: `CLIENTE` e `PROFISSIONAL` (`Papel.java`).
- Validação de nome, e-mail, senha e papel via DTO (`CadastroRequest`).
- Normalização de e-mail; verificação de e-mail já cadastrado.
- Hash de senha com BCrypt (sem armazenamento da senha em texto puro).
- Repositório JPA e entidade `Usuario` usando UUID.
- Resposta sem exposição de hash de senha (`UsuarioResponse`).
- **Pendente:** teste real de cadastro, duplicidade e persistência.

### 4.3 Login e autenticação

- Rota proposta: `POST /api/auth/login`.
- Verificação de e-mail e senha; emissão de JWT assinado com HS256.
- Chave do JWT lida da variável de ambiente `JWT_SECRET` em base64.
- Prazo de token configurado inicialmente para 120 minutos.
- Rota autenticada proposta: `GET /api/auth/me`.
- Configuração de segurança com Spring Security e validação de JWT.
- **Pendente:** compilação e testes de login, token inválido, token expirado e autorização.

### 4.4 Banco de dados

- Banco escolhido: PostgreSQL.
- Configuração de conexão por variáveis de ambiente em `application.yml`.
- Migração SQL `V1__criar_usuarios.sql` proposta para tabela `usuarios`.
- Flyway gerencia scripts versionados; Hibernate configurado para validar o esquema (`ddl-auto: validate`).
- **Pendente:** revisão da migração por Ian, execução do PostgreSQL e confirmação de que a migração foi aplicada.

### 4.5 Front-end

- Escolhidos React, TypeScript e Vite.
- Foi fornecido um exemplo de tela para consultar `/api/health` e configuração de proxy no Vite.
- **Não há confirmação** de que o front-end foi gerado, executado ou integrado; a interface final pertence a João.

## 5. Problemas encontrados

| Ocorrência | Evidência | Situação conhecida |
| --- | --- | --- |
| Dependências de segurança ausentes no projeto inicial | Usuário informou a ausência dos starters de Spring Security e OAuth2 Resource Server | Foi orientada a inclusão no `pom.xml`; compilação ainda não confirmada |
| Erro de tipo em `AutenticacaoService.java` | VS Code apontou que `ResponseStatusException` não era reconhecida ao usar `orElseThrow(...)` | Foram sugeridas verificação de Spring Web MVC, sincronização Maven e limpeza do Java Language Server; causa ainda não confirmada |
| Execução do Maven Wrapper bloqueada | Terminal retornou `bash: ./mvnw: Permission denied` | Foi orientado executar `chmod +x mvnw`; usuário ainda não apresentou a saída da nova compilação |

**Atenção:** trocar `this::credenciaisInvalidas` por uma lambda é uma alternativa sintática, mas não corrige a ausência da classe `ResponseStatusException` no classpath, caso essa seja a causa.

## 6. Relação com as Issues do planejamento

Os IDs `STZ-...` são referências internas de `planejamento.md`, **não** números oficiais das Issues do GitHub. Os estados abaixo são uma avaliação baseada exclusivamente no que foi mostrado na conversa.

| Issue | Tarefa do planejamento | Estado documentado | Falta para fechar |
| --- | --- | --- | --- |
| **STZ-01** | Definir requisitos e histórias de usuário | **Parcial** — README e planejamento iniciais já existem, MVP descrito | Revisão formal das histórias de usuário e requisitos |
| **STZ-02** | Configurar repositório e GitHub Project | **Parcial** — diretório Git e branch observados | Comprovar Projects, labels, milestones e ajustes da organização |
| **STZ-05** | Definir contrato REST inicial | **Parcial** — quatro endpoints propostos | Contrato com exemplos, erros, permissões e revisão do front-end |
| **STZ-06** | Configurar estrutura do servidor | **Em andamento** — projeto Spring Boot criado e código-base preparado | `BUILD SUCCESS`, inicialização e documentação operacional |
| **STZ-08** | Configurar banco e migrações | **Em andamento / dependente de Ian** — Compose e Flyway propostos | Confirmar banco ativo, migração aplicada e execução reproduzível |
| **STZ-09** | Criar tabelas de usuários e perfis | **Em andamento / dependente de Ian** — V1 SQL e entidade propostas | Revisar esquema, executar migração e verificar integridade |
| **STZ-10** | Implementar cadastro e autenticação | **Em andamento** — códigos de entidade, DTOs, controller, service e segurança fornecidos | Corrigir erros, compilar, testar API e registrar PR |

**Nenhuma dessas Issues pode ser considerada comprovadamente concluída apenas pelas evidências disponíveis.** Se algo já tiver sido testado, o status deve ser atualizado com links para commits, Pull Requests e resultados.

As Issues **STZ-04** (diagrama ER), **STZ-07** (estrutura e rotas do front-end) e **STZ-11** (telas de cadastro/login) seguem sem confirmação de entrega na conversa.

## 7. Próximas verificações — ordem recomendada

1. Na pasta `backend`, executar `chmod +x mvnw` e `./mvnw clean compile` e registrar o resultado.
2. Se a compilação falhar, corrigir as dependências e mensagens de erro antes de adicionar mais funcionalidades.
3. Conferir com `docker compose ps` o estado do PostgreSQL e executar a migração V1.
4. Definir a chave JWT por variável de ambiente local, nunca em commit.
5. Executar `./mvnw spring-boot:run` e testar `GET /api/health`.
6. Testar cadastro, duplicidade de e-mail, login, acesso com/sem token e persistência após reinício.
7. Solicitar a Ian a revisão do esquema e a João a revisão do contrato da API.
8. Registrar evidências, abrir Pull Request e fechar apenas as Issues com critérios de aceite comprovados.

## 8. Estratégia de documentação no GitHub

**Recomendação: manter um único `README.md` principal**, que explique o projeto, instalação e execução. Não criar um README diferente para cada branch: isso gera duplicação, risco de documentação desatualizada e conflitos de merge.

Usar em conjunto:

- **`README.md` (raiz):** apresentação do STIZY, tecnologias atuais, como executar e links para docs.
- **`planejamento.md`:** cronograma, responsáveis, backlog e critérios de aceite.
- **`docs/registro-desenvolvimento.md`:** histórico cronológico de decisões, implementações, testes e pendências (este arquivo pode ser movido para esse caminho).
- **Descrição de cada Pull Request:** o que mudou naquela branch, Issues relacionadas, testes executados e evidências.
- **`CHANGELOG.md` (opcional):** novidades das versões e releases; não é necessário detalhar cada commit.

### Modelo de descrição para o Pull Request desta branch

```md
## Objetivo
Preparar a estrutura inicial do back-end do STIZY e o módulo inicial de autenticação.

## Alterações
- Configuração Spring Boot / Maven e `application.yml`.
- Estrutura inicial de API REST.
- Entidade e repositório de usuários.
- Migração de usuários e configuração de PostgreSQL/Flyway.
- Segurança, cadastro, login e consulta do usuário (sujeitos à validação).

## Issues relacionadas
STZ-06, STZ-08, STZ-09 e STZ-10 (substituir pelos números reais do GitHub).

## Testes
- [ ] Maven compila sem erros
- [ ] Banco inicia e migração é aplicada
- [ ] GET /api/health responde 200
- [ ] Cadastro e login funcionam
- [ ] Acesso sem token retorna 401
- [ ] Revisão por outro integrante

## Pendências
Registrar erros encontrados, decisões e eventuais itens ainda não integrados.
```

## 9. Registro de alterações deste documento

| Data | Registro |
| --- | --- |
| 22/10/2026 | Consolidação da definição da stack, estrutura e códigos fornecidos; registro dos erros observados; mapeamento das Issues e próximos testes. |

---

> **Critério de honestidade do projeto:** "código escrito" ≠ "código compilado" ≠ "funcionalidade testada" ≠ "Issue concluída". Atualizar cada estágio com evidências no GitHub.