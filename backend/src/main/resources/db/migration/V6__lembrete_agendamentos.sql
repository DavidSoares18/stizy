-- STIZY / EXTRA-04: lembrete por e-mail.
-- Guarda quando o lembrete foi enviado, para o agendador não mandar o mesmo e-mail duas vezes.
-- Ao remarcar, a API limpa a coluna e o lembrete é enviado de novo para o novo horário.
ALTER TABLE agendamentos
    ADD COLUMN lembrete_enviado_em TIMESTAMPTZ;

-- Busca do agendador: confirmados que ainda não receberam lembrete, pela data de início.
CREATE INDEX idx_agendamentos_lembrete_pendente ON agendamentos (inicio)
    WHERE status = 'CONFIRMADO' AND lembrete_enviado_em IS NULL;
