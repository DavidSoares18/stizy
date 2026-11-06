# Testes manuais — CRUD de serviços do STIZY

## Pré-requisitos

- Back-end iniciado na porta `8080`.
- Banco PostgreSQL e migração Flyway executados.
- Conta `PROFISSIONAL` cadastrada e login realizado em `/api/auth/login`.
- JWT válido copiado para a variável de ambiente `TOKEN` **somente no terminal local** (não salvar tokens reais no GitHub).

```bash
export API=http://localhost:8080
export TOKEN='COLE_AQUI_O_JWT_DO_PROFISSIONAL'
```

## 1. Cadastrar serviço (201)

```bash
curl -i -X POST "$API/api/servicos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Corte masculino","duracaoMinutos":30,"preco":35.00}'
```

Copie o `id` retornado e defina `SERVICO_ID` (UUID real):

```bash
export SERVICO_ID='COLE_O_UUID_RETORNADO'
```

## 2. Listar serviços do profissional (200)

```bash
curl -i "$API/api/servicos" -H "Authorization: Bearer $TOKEN"
```

## 3. Buscar serviço por ID (200)

```bash
curl -i "$API/api/servicos/$SERVICO_ID" -H "Authorization: Bearer $TOKEN"
```

## 4. Atualizar serviço (200)

```bash
curl -i -X PUT "$API/api/servicos/$SERVICO_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Corte e barba","duracaoMinutos":60,"preco":65.00}'
```

## 5. Desativar serviço (204, não apaga o registro)

```bash
curl -i -X DELETE "$API/api/servicos/$SERVICO_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Depois consulte por ID: `ativo` deverá ser `false`.

## 6. Reativar serviço (200)

```bash
curl -i -X PATCH "$API/api/servicos/$SERVICO_ID/ativar" \
  -H "Authorization: Bearer $TOKEN"
```

## 7. Casos negativos para testar

- Sem JWT: `401`.
- Token de `CLIENTE` em qualquer endpoint de gestão: `403`.
- Profissional A consultando ou editando um serviço do profissional B: `404`.
- ID de serviço inexistente: `404`.
- Nome vazio, duração `0`, preço negativo ou mais de duas casas decimais: `400`.
- Serviços desativados continuam na listagem administrativa com `ativo: false`.

**Atenção:** o futuro catálogo público do cliente deve utilizar endpoints separados, que mostrem apenas serviços ativos.