-- STIZY / RF05 a RF08 e RNF05: agendamentos.
-- Regra principal: o mesmo profissional nunca tem dois agendamentos ativos que se cruzam.
-- Quem garante é o próprio banco, mesmo com duas reservas chegando ao mesmo tempo.

-- Permite a chave estrangeira composta de agendamentos ("o serviço é deste profissional").
-- O id já é único; isto só deixa a dupla (id, profissional_id) ser referenciada.
ALTER TABLE servicos
    ADD CONSTRAINT uq_servicos_id_profissional UNIQUE (id, profissional_id);

CREATE TABLE agendamentos (
    id UUID PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES usuarios(id),
    profissional_id UUID NOT NULL REFERENCES usuarios(id),
    servico_id UUID NOT NULL,
    inicio TIMESTAMPTZ NOT NULL,
    fim TIMESTAMPTZ NOT NULL, -- inicio + duração do serviço, calculado pela API
    preco NUMERIC(12,2) NOT NULL, -- cópia do preço do serviço na hora da reserva
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMADO',
    cancelado_em TIMESTAMPTZ,
    cancelado_por_id UUID REFERENCES usuarios(id),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_agendamentos_servico_do_profissional
        FOREIGN KEY (servico_id, profissional_id) REFERENCES servicos (id, profissional_id),
    CONSTRAINT chk_agendamentos_intervalo CHECK (fim > inicio),
    CONSTRAINT chk_agendamentos_preco CHECK (preco >= 0),
    CONSTRAINT chk_agendamentos_status
        CHECK (status IN ('CONFIRMADO', 'CANCELADO', 'CONCLUIDO', 'FALTOU')),
    -- RF02: o profissional pode agendar com outro profissional, mas não consigo mesmo.
    CONSTRAINT chk_agendamentos_cliente_diferente CHECK (cliente_id <> profissional_id),
    -- Cancelado <=> tem data de cancelamento. Quem cancela é o cliente ou o profissional (RF08).
    CONSTRAINT chk_agendamentos_cancelamento
        CHECK ((status = 'CANCELADO') = (cancelado_em IS NOT NULL)),
    CONSTRAINT chk_agendamentos_cancelado_por
        CHECK (cancelado_por_id IS NULL
               OR (status = 'CANCELADO' AND cancelado_por_id IN (cliente_id, profissional_id))),
    -- RF07 / RNF05: sem sobreposição para o mesmo profissional. Cancelados não contam,
    -- então cancelar libera o horário. Conflito = erro 23P01 (a API responde 409).
    -- '[)' = o fim não conta: 09:00-09:30 e 09:30-10:00 podem existir juntos.
    CONSTRAINT ex_agendamentos_sem_sobreposicao EXCLUDE USING gist (
        profissional_id WITH =,
        tstzrange(inicio, fim, '[)') WITH &&
    ) WHERE (status <> 'CANCELADO')
);

-- Agenda do profissional por dia e por semana (RF06).
CREATE INDEX idx_agendamentos_profissional_inicio ON agendamentos (profissional_id, inicio);
-- Próximos agendamentos e histórico do cliente (RF13).
CREATE INDEX idx_agendamentos_cliente_inicio ON agendamentos (cliente_id, inicio);
