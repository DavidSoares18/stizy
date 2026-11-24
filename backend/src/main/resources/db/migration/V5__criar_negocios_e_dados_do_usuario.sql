-- STIZY / RF01, RF05 e RNF06: negócio do provedor e dados de contato do usuário.
-- Decidido com o David em 23/11: um negócio por provedor, e as outras tabelas continuam
-- ligadas ao profissional (profissional_id). Do usuário, só o essencial (LGPD): sem CPF por enquanto.

-- Dados que o cadastro do front pede. Opcionais no banco: quem já tem conta continua válido,
-- e a API decide o que é obrigatório em cada cadastro.
ALTER TABLE usuarios
    ADD COLUMN celular VARCHAR(11), -- só dígitos, com DDD: 81999998888
    ADD COLUMN bairro VARCHAR(80),
    ADD COLUMN cidade VARCHAR(80),
    ADD COLUMN termos_aceitos_em TIMESTAMPTZ, -- quando aceitou os termos de uso (RNF06)
    ADD CONSTRAINT chk_usuarios_celular CHECK (celular ~ '^[0-9]{10,11}$');

-- Como o cliente vê o provedor: nome, descrição, categoria e endereço.
-- Freelancer, sem endereço fixo, deixa o endereço vazio.
CREATE TABLE negocios (
    id UUID PRIMARY KEY,
    profissional_id UUID NOT NULL REFERENCES usuarios(id),
    nome VARCHAR(120) NOT NULL,
    descricao VARCHAR(300),
    categoria VARCHAR(40) NOT NULL, -- slug de frontend/src/constants/categorias.js: barbearia, salao...
    cep VARCHAR(8), -- só dígitos
    endereco VARCHAR(150), -- rua e número
    complemento VARCHAR(80),
    bairro VARCHAR(80),
    cidade VARCHAR(80), -- cidade e UF: Belo Jardim, PE
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_negocios_profissional UNIQUE (profissional_id),
    CONSTRAINT chk_negocios_nome_nao_vazio CHECK (length(trim(nome)) > 0),
    CONSTRAINT chk_negocios_categoria CHECK (categoria ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT chk_negocios_cep CHECK (cep ~ '^[0-9]{8}$')
);

-- Listas e filtros por categoria na tela de início.
CREATE INDEX idx_negocios_categoria ON negocios (categoria);
