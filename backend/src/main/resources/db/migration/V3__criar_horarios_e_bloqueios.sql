-- STIZY / RF04 e RF14: grade semanal de atendimento e bloqueios de agenda do profissional.
-- Horas da grade na hora local do negócio (America/Recife); instantes em TIMESTAMPTZ (UTC, RNF07).

-- Permite usar "=" com UUID e INTEGER dentro de uma EXCLUDE USING gist.
-- Vem junto com o PostgreSQL; aqui ela só é ativada no banco.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Uma linha por faixa de atendimento. Pausa para o almoço = duas faixas no mesmo dia.
CREATE TABLE horarios_funcionamento (
    id UUID PRIMARY KEY,
    profissional_id UUID NOT NULL REFERENCES usuarios(id),
    dia_semana INTEGER NOT NULL, -- 1 = segunda ... 7 = domingo, igual a java.time.DayOfWeek.getValue()
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    CONSTRAINT chk_horarios_funcionamento_dia_semana CHECK (dia_semana BETWEEN 1 AND 7),
    CONSTRAINT chk_horarios_funcionamento_intervalo CHECK (hora_fim > hora_inicio),
    -- Duas faixas do mesmo profissional no mesmo dia não podem se cruzar.
    -- O PostgreSQL não tem um tipo "faixa de horas", então as horas vão para uma data fixa
    -- só para comparar. '[)' = o fim não conta: 08:00-12:00 e 12:00-14:00 podem existir juntas.
    CONSTRAINT ex_horarios_funcionamento_sem_sobreposicao EXCLUDE USING gist (
        profissional_id WITH =,
        dia_semana WITH =,
        tsrange(DATE '2000-01-01' + hora_inicio, DATE '2000-01-01' + hora_fim, '[)') WITH &&
    )
);

-- Folgas, férias e ausências. Durante o período, a API não oferece horários do profissional.
CREATE TABLE bloqueios (
    id UUID PRIMARY KEY,
    profissional_id UUID NOT NULL REFERENCES usuarios(id),
    inicio TIMESTAMPTZ NOT NULL,
    fim TIMESTAMPTZ NOT NULL,
    motivo VARCHAR(255), -- opcional
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_bloqueios_intervalo CHECK (fim > inicio)
);

CREATE INDEX idx_bloqueios_profissional_inicio ON bloqueios (profissional_id, inicio);
