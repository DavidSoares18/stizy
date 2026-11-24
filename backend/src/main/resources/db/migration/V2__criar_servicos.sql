-- STIZY / RF03: cada serviço pertence a um profissional.
-- Se já existir uma V2 aplicada, usar o próximo número de migração livre.
CREATE TABLE servicos (
    id UUID PRIMARY KEY,
    profissional_id UUID NOT NULL REFERENCES usuarios(id),
    nome VARCHAR(120) NOT NULL,
    duracao_minutos INTEGER NOT NULL,
    preco NUMERIC(12,2) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_servicos_nome_nao_vazio CHECK (length(trim(nome)) > 0),
    CONSTRAINT chk_servicos_duracao CHECK (duracao_minutos BETWEEN 1 AND 1440),
    CONSTRAINT chk_servicos_preco CHECK (preco >= 0)
);

CREATE INDEX idx_servicos_profissional_id ON servicos (profissional_id);
CREATE INDEX idx_servicos_profissional_ativo ON servicos (profissional_id, ativo);
