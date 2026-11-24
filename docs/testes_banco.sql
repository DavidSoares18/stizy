-- STIZY: testes das regras do banco (migrações V1 a V5).
--
-- Como rodar no Codespaces, com o PostgreSQL do docker compose ligado e as migrações aplicadas
-- (o Flyway aplica quando o back-end sobe com ./mvnw spring-boot:run):
--
--   docker exec -i stizy-postgres psql -U stizy -d stizy < docs/testes_banco.sql
--
-- Tudo roda numa transação desfeita no final (ROLLBACK): nenhum dado de teste fica no banco.
-- A saída é uma tabela com cada regra testada. Se algum teste falhar, o psql termina com erro.

\set ON_ERROR_STOP 1
\set QUIET 1
\pset footer off

BEGIN;

-- -----------------------------------------------------------------------------
-- Auxiliares (existem só durante o teste)
-- -----------------------------------------------------------------------------

CREATE TEMP TABLE resultado (
    n SERIAL,
    teste TEXT,
    esperado TEXT,
    obtido TEXT,
    passou BOOLEAN
);

-- O comando precisa ser aceito e alterar pelo menos uma linha.
CREATE PROCEDURE pg_temp.aceita(p_teste TEXT, p_comando TEXT)
LANGUAGE plpgsql AS $$
DECLARE
    v_linhas BIGINT;
    v_restricao TEXT;
BEGIN
    BEGIN
        EXECUTE p_comando;
        GET DIAGNOSTICS v_linhas = ROW_COUNT;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_restricao = CONSTRAINT_NAME;
        INSERT INTO resultado (teste, esperado, obtido, passou)
        VALUES (p_teste, 'aceitar', 'recusou: ' || coalesce(nullif(v_restricao, ''), SQLERRM), FALSE);
        RETURN;
    END;
    INSERT INTO resultado (teste, esperado, obtido, passou)
    VALUES (p_teste, 'aceitar',
            CASE WHEN v_linhas > 0 THEN 'aceitou' ELSE 'nenhuma linha alterada' END, v_linhas > 0);
END $$;

-- O comando precisa ser recusado exatamente pela restrição indicada
-- (ou pelo código de erro indicado, como 22001 = texto maior que a coluna).
CREATE PROCEDURE pg_temp.recusa(p_teste TEXT, p_restricao TEXT, p_comando TEXT)
LANGUAGE plpgsql AS $$
DECLARE
    v_restricao TEXT;
BEGIN
    BEGIN
        EXECUTE p_comando;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_restricao = CONSTRAINT_NAME;
        INSERT INTO resultado (teste, esperado, obtido, passou)
        VALUES (p_teste, 'recusar: ' || p_restricao,
                'recusou: ' || coalesce(nullif(v_restricao, ''), SQLSTATE || ' ' || SQLERRM),
                v_restricao = p_restricao OR SQLSTATE = p_restricao);
        RETURN;
    END;
    INSERT INTO resultado (teste, esperado, obtido, passou)
    VALUES (p_teste, 'recusar: ' || p_restricao, 'aceitou', FALSE);
END $$;

-- Atalhos para escrever os testes com nomes em vez de UUIDs.
CREATE FUNCTION pg_temp.usuario(p_nome TEXT) RETURNS UUID
LANGUAGE sql AS $$ SELECT id FROM usuarios WHERE nome = p_nome $$;

CREATE FUNCTION pg_temp.servico(p_nome TEXT) RETURNS UUID
LANGUAGE sql AS $$ SELECT id FROM servicos WHERE nome = p_nome $$;

CREATE FUNCTION pg_temp.faixa(p_profissional TEXT, p_dia INTEGER, p_inicio TIME, p_fim TIME)
RETURNS INTEGER LANGUAGE sql AS $$
    INSERT INTO horarios_funcionamento (id, profissional_id, dia_semana, hora_inicio, hora_fim)
    VALUES (gen_random_uuid(), pg_temp.usuario(p_profissional), p_dia, p_inicio, p_fim)
    RETURNING 1
$$;

CREATE FUNCTION pg_temp.bloquear(p_profissional TEXT, p_inicio TIMESTAMPTZ, p_fim TIMESTAMPTZ, p_motivo TEXT)
RETURNS INTEGER LANGUAGE sql AS $$
    INSERT INTO bloqueios (id, profissional_id, inicio, fim, motivo)
    VALUES (gen_random_uuid(), pg_temp.usuario(p_profissional), p_inicio, p_fim, p_motivo)
    RETURNING 1
$$;

-- Cria um agendamento como a API vai fazer: fim = início + duração do serviço,
-- preço copiado do serviço.
CREATE FUNCTION pg_temp.agendar(p_cliente TEXT, p_profissional TEXT, p_servico TEXT, p_inicio TIMESTAMPTZ)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    v_linhas BIGINT;
BEGIN
    INSERT INTO agendamentos (id, cliente_id, profissional_id, servico_id, inicio, fim, preco)
    SELECT gen_random_uuid(), pg_temp.usuario(p_cliente), pg_temp.usuario(p_profissional), s.id,
           p_inicio, p_inicio + s.duracao_minutos * INTERVAL '1 minute', s.preco
      FROM servicos s
     WHERE s.nome = p_servico;
    GET DIAGNOSTICS v_linhas = ROW_COUNT;
    IF v_linhas <> 1 THEN
        RAISE EXCEPTION 'serviço % não encontrado', p_servico;
    END IF;
    RETURN 1;
END $$;

-- -----------------------------------------------------------------------------
-- Dados de teste: Ana, Bruno e Edu atendem; Carla e Diego são clientes.
-- -----------------------------------------------------------------------------

INSERT INTO usuarios (id, nome, email, senha_hash, papel) VALUES
    (gen_random_uuid(), 'Ana', 'ana@teste.stizy', 'x', 'PROFISSIONAL'),
    (gen_random_uuid(), 'Bruno', 'bruno@teste.stizy', 'x', 'PROFISSIONAL'),
    (gen_random_uuid(), 'Edu', 'edu@teste.stizy', 'x', 'PROFISSIONAL'),
    (gen_random_uuid(), 'Carla', 'carla@teste.stizy', 'x', 'CLIENTE'),
    (gen_random_uuid(), 'Diego', 'diego@teste.stizy', 'x', 'CLIENTE');

INSERT INTO servicos (id, profissional_id, nome, duracao_minutos, preco) VALUES
    (gen_random_uuid(), pg_temp.usuario('Ana'), 'Corte', 30, 40.00),
    (gen_random_uuid(), pg_temp.usuario('Ana'), 'Coloração', 90, 120.00),
    (gen_random_uuid(), pg_temp.usuario('Bruno'), 'Barba', 20, 25.00);

-- -----------------------------------------------------------------------------
-- V3: grade semanal (dia_semana: 1 = segunda ... 7 = domingo)
-- -----------------------------------------------------------------------------

CALL pg_temp.aceita('Ana: terça das 08:00 às 12:00',
    $$ SELECT pg_temp.faixa('Ana', 2, '08:00', '12:00') $$);
CALL pg_temp.aceita('Ana: terça das 13:00 às 18:00 (pausa para o almoço)',
    $$ SELECT pg_temp.faixa('Ana', 2, '13:00', '18:00') $$);
CALL pg_temp.recusa('Ana: terça das 11:00 às 14:00 (cruza as duas faixas)',
    'ex_horarios_funcionamento_sem_sobreposicao',
    $$ SELECT pg_temp.faixa('Ana', 2, '11:00', '14:00') $$);
CALL pg_temp.aceita('Ana: terça das 18:00 às 20:00 (começa quando a outra termina)',
    $$ SELECT pg_temp.faixa('Ana', 2, '18:00', '20:00') $$);
CALL pg_temp.aceita('Ana: quarta das 08:00 às 12:00 (mesma faixa, outro dia)',
    $$ SELECT pg_temp.faixa('Ana', 3, '08:00', '12:00') $$);
CALL pg_temp.aceita('Bruno: terça das 08:00 às 12:00 (mesma faixa, outro profissional)',
    $$ SELECT pg_temp.faixa('Bruno', 2, '08:00', '12:00') $$);
CALL pg_temp.recusa('Dia da semana 0',
    'chk_horarios_funcionamento_dia_semana',
    $$ SELECT pg_temp.faixa('Ana', 0, '08:00', '12:00') $$);
CALL pg_temp.recusa('Dia da semana 8',
    'chk_horarios_funcionamento_dia_semana',
    $$ SELECT pg_temp.faixa('Ana', 8, '08:00', '12:00') $$);
CALL pg_temp.recusa('Faixa que termina antes de começar (14:00 às 13:00)',
    'chk_horarios_funcionamento_intervalo',
    $$ SELECT pg_temp.faixa('Ana', 4, '14:00', '13:00') $$);

-- -----------------------------------------------------------------------------
-- V3: bloqueios (folgas e férias)
-- -----------------------------------------------------------------------------

CALL pg_temp.aceita('Ana: férias de 21/12 a 04/01',
    $$ SELECT pg_temp.bloquear('Ana', '2026-12-21 00:00-03', '2027-01-05 00:00-03', 'Férias') $$);
CALL pg_temp.aceita('Bruno: bloqueio sem motivo (o motivo é opcional)',
    $$ SELECT pg_temp.bloquear('Bruno', '2026-11-24 14:00-03', '2026-11-24 16:00-03', NULL) $$);
CALL pg_temp.recusa('Bloqueio que termina antes de começar',
    'chk_bloqueios_intervalo',
    $$ SELECT pg_temp.bloquear('Ana', '2026-11-27 12:00-03', '2026-11-27 08:00-03', 'Erro') $$);

-- -----------------------------------------------------------------------------
-- V4: agendamentos em 24/11/2026, hora de Recife (-03)
-- -----------------------------------------------------------------------------

CALL pg_temp.aceita('Carla marca Corte com a Ana às 10:00 (10:00-10:30)',
    $$ SELECT pg_temp.agendar('Carla', 'Ana', 'Corte', '2026-11-24 10:00-03') $$);
CALL pg_temp.recusa('Diego no mesmo horário com a Ana',
    'ex_agendamentos_sem_sobreposicao',
    $$ SELECT pg_temp.agendar('Diego', 'Ana', 'Corte', '2026-11-24 10:00-03') $$);
CALL pg_temp.recusa('Diego às 10:15 (cruza o fim do horário da Carla)',
    'ex_agendamentos_sem_sobreposicao',
    $$ SELECT pg_temp.agendar('Diego', 'Ana', 'Corte', '2026-11-24 10:15-03') $$);
CALL pg_temp.recusa('Diego às 09:45 (cruza o começo do horário da Carla)',
    'ex_agendamentos_sem_sobreposicao',
    $$ SELECT pg_temp.agendar('Diego', 'Ana', 'Corte', '2026-11-24 09:45-03') $$);
CALL pg_temp.recusa('Diego: Coloração das 09:30 às 11:00 (cobre o horário da Carla)',
    'ex_agendamentos_sem_sobreposicao',
    $$ SELECT pg_temp.agendar('Diego', 'Ana', 'Coloração', '2026-11-24 09:30-03') $$);
CALL pg_temp.aceita('Diego às 10:30 (começa quando o da Carla termina)',
    $$ SELECT pg_temp.agendar('Diego', 'Ana', 'Corte', '2026-11-24 10:30-03') $$);
CALL pg_temp.aceita('Diego às 09:30 (termina quando o da Carla começa)',
    $$ SELECT pg_temp.agendar('Diego', 'Ana', 'Corte', '2026-11-24 09:30-03') $$);
CALL pg_temp.aceita('Diego com o Bruno às 10:00 (mesmo horário, outro profissional)',
    $$ SELECT pg_temp.agendar('Diego', 'Bruno', 'Barba', '2026-11-24 10:00-03') $$);
CALL pg_temp.recusa('Mesmo horário da Carla escrito em UTC (13:00Z = 10:00 em Recife)',
    'ex_agendamentos_sem_sobreposicao',
    $$ SELECT pg_temp.agendar('Diego', 'Ana', 'Corte', '2026-11-24 13:00+00') $$);
CALL pg_temp.aceita('Ana agenda como cliente do Bruno (RF02)',
    $$ SELECT pg_temp.agendar('Ana', 'Bruno', 'Barba', '2026-11-24 11:00-03') $$);
CALL pg_temp.recusa('Profissional agenda consigo mesma',
    'chk_agendamentos_cliente_diferente',
    $$ SELECT pg_temp.agendar('Ana', 'Ana', 'Corte', '2026-11-25 10:00-03') $$);
CALL pg_temp.recusa('Serviço de outro profissional (Barba do Bruno marcada com a Ana)',
    'fk_agendamentos_servico_do_profissional',
    $$ SELECT pg_temp.agendar('Carla', 'Ana', 'Barba', '2026-11-25 10:00-03') $$);
CALL pg_temp.recusa('Fim antes do início',
    'chk_agendamentos_intervalo',
    $$ INSERT INTO agendamentos (id, cliente_id, profissional_id, servico_id, inicio, fim, preco)
       VALUES (gen_random_uuid(), pg_temp.usuario('Carla'), pg_temp.usuario('Ana'), pg_temp.servico('Corte'),
               '2026-11-25 10:30-03', '2026-11-25 10:00-03', 40.00) $$);
CALL pg_temp.recusa('Preço negativo',
    'chk_agendamentos_preco',
    $$ INSERT INTO agendamentos (id, cliente_id, profissional_id, servico_id, inicio, fim, preco)
       VALUES (gen_random_uuid(), pg_temp.usuario('Carla'), pg_temp.usuario('Ana'), pg_temp.servico('Corte'),
               '2026-11-25 10:00-03', '2026-11-25 10:30-03', -1.00) $$);
CALL pg_temp.recusa('Status fora da lista (PENDENTE)',
    'chk_agendamentos_status',
    $$ INSERT INTO agendamentos (id, cliente_id, profissional_id, servico_id, inicio, fim, preco, status)
       VALUES (gen_random_uuid(), pg_temp.usuario('Carla'), pg_temp.usuario('Ana'), pg_temp.servico('Corte'),
               '2026-11-25 10:00-03', '2026-11-25 10:30-03', 40.00, 'PENDENTE') $$);
CALL pg_temp.recusa('Cliente que não existe',
    'agendamentos_cliente_id_fkey',
    $$ INSERT INTO agendamentos (id, cliente_id, profissional_id, servico_id, inicio, fim, preco)
       VALUES (gen_random_uuid(), gen_random_uuid(), pg_temp.usuario('Ana'), pg_temp.servico('Corte'),
               '2026-11-25 10:00-03', '2026-11-25 10:30-03', 40.00) $$);

-- -----------------------------------------------------------------------------
-- V4: cancelamento, remarcação e status
-- -----------------------------------------------------------------------------

CALL pg_temp.recusa('Cancelar sem preencher a data de cancelamento',
    'chk_agendamentos_cancelamento',
    $$ UPDATE agendamentos SET status = 'CANCELADO'
        WHERE cliente_id = pg_temp.usuario('Carla') AND inicio = '2026-11-24 10:00-03' $$);
CALL pg_temp.recusa('Cancelamento feito por quem não é do agendamento (Bruno)',
    'chk_agendamentos_cancelado_por',
    $$ UPDATE agendamentos
          SET status = 'CANCELADO', cancelado_em = now(), cancelado_por_id = pg_temp.usuario('Bruno')
        WHERE cliente_id = pg_temp.usuario('Carla') AND inicio = '2026-11-24 10:00-03' $$);
CALL pg_temp.aceita('Carla cancela o agendamento das 10:00',
    $$ UPDATE agendamentos
          SET status = 'CANCELADO', cancelado_em = now(), cancelado_por_id = pg_temp.usuario('Carla')
        WHERE cliente_id = pg_temp.usuario('Carla') AND inicio = '2026-11-24 10:00-03' $$);
CALL pg_temp.aceita('Diego pega o horário das 10:00 que a Carla liberou',
    $$ SELECT pg_temp.agendar('Diego', 'Ana', 'Corte', '2026-11-24 10:00-03') $$);
CALL pg_temp.recusa('Reativar o agendamento cancelado da Carla (o horário agora é do Diego)',
    'ex_agendamentos_sem_sobreposicao',
    $$ UPDATE agendamentos SET status = 'CONFIRMADO', cancelado_em = NULL, cancelado_por_id = NULL
        WHERE cliente_id = pg_temp.usuario('Carla') AND inicio = '2026-11-24 10:00-03' $$);
CALL pg_temp.recusa('Agendamento confirmado com data de cancelamento',
    'chk_agendamentos_cancelamento',
    $$ UPDATE agendamentos SET cancelado_em = now()
        WHERE cliente_id = pg_temp.usuario('Diego') AND inicio = '2026-11-24 10:00-03'
          AND profissional_id = pg_temp.usuario('Ana') $$);
CALL pg_temp.aceita('Remarcar no mesmo registro: Diego 10:30 para 10:45 (cruza o próprio horário antigo)',
    $$ UPDATE agendamentos SET inicio = '2026-11-24 10:45-03', fim = '2026-11-24 11:15-03'
        WHERE cliente_id = pg_temp.usuario('Diego') AND inicio = '2026-11-24 10:30-03' $$);
CALL pg_temp.recusa('Remarcar para cima de outro agendamento: Diego 09:30 para 10:15',
    'ex_agendamentos_sem_sobreposicao',
    $$ UPDATE agendamentos SET inicio = '2026-11-24 10:15-03', fim = '2026-11-24 10:45-03'
        WHERE cliente_id = pg_temp.usuario('Diego') AND inicio = '2026-11-24 09:30-03' $$);
CALL pg_temp.aceita('Agendamento das 10:00 do Diego marcado como CONCLUIDO',
    $$ UPDATE agendamentos SET status = 'CONCLUIDO'
        WHERE cliente_id = pg_temp.usuario('Diego') AND inicio = '2026-11-24 10:00-03'
          AND profissional_id = pg_temp.usuario('Ana') $$);
CALL pg_temp.recusa('Horário de agendamento concluído continua ocupado',
    'ex_agendamentos_sem_sobreposicao',
    $$ SELECT pg_temp.agendar('Carla', 'Ana', 'Corte', '2026-11-24 10:00-03') $$);

-- -----------------------------------------------------------------------------
-- V2 continua funcionando depois da V4 (que só acrescentou uma restrição em servicos)
-- -----------------------------------------------------------------------------

CALL pg_temp.aceita('Novo serviço da Ana depois da V4',
    $$ INSERT INTO servicos (id, profissional_id, nome, duracao_minutos, preco)
       VALUES (gen_random_uuid(), pg_temp.usuario('Ana'), 'Escova', 45, 50.00) $$);

-- -----------------------------------------------------------------------------
-- V5: negócio do provedor e dados do usuário
-- -----------------------------------------------------------------------------

CALL pg_temp.aceita('Ana cadastra o negócio dela, com endereço',
    $$ INSERT INTO negocios (id, profissional_id, nome, descricao, categoria, cep, endereco, bairro, cidade)
       VALUES (gen_random_uuid(), pg_temp.usuario('Ana'), 'Barbearia da Ana', 'Corte e coloração.',
               'barbearia', '55150000', 'Rua das Flores, 120', 'Centro', 'Belo Jardim, PE') $$);
CALL pg_temp.recusa('Ana tenta cadastrar um segundo negócio',
    'uq_negocios_profissional',
    $$ INSERT INTO negocios (id, profissional_id, nome, categoria)
       VALUES (gen_random_uuid(), pg_temp.usuario('Ana'), 'Outro negócio da Ana', 'salao') $$);
CALL pg_temp.aceita('Bruno, freelancer, cadastra o negócio sem endereço',
    $$ INSERT INTO negocios (id, profissional_id, nome, categoria)
       VALUES (gen_random_uuid(), pg_temp.usuario('Bruno'), 'Bruno Barbeiro em Domicílio', 'barbearia') $$);
CALL pg_temp.recusa('Negócio com nome em branco',
    'chk_negocios_nome_nao_vazio',
    $$ INSERT INTO negocios (id, profissional_id, nome, categoria)
       VALUES (gen_random_uuid(), pg_temp.usuario('Edu'), '   ', 'eletrica') $$);
CALL pg_temp.recusa('Categoria com o nome de exibição (Elétrica) em vez do slug (eletrica)',
    'chk_negocios_categoria',
    $$ INSERT INTO negocios (id, profissional_id, nome, categoria)
       VALUES (gen_random_uuid(), pg_temp.usuario('Edu'), 'Eletricista Edu', 'Elétrica') $$);
CALL pg_temp.recusa('CEP com máscara (55150-000): maior que a coluna',
    '22001',
    $$ INSERT INTO negocios (id, profissional_id, nome, categoria, cep)
       VALUES (gen_random_uuid(), pg_temp.usuario('Edu'), 'Eletricista Edu', 'eletrica', '55150-000') $$);
CALL pg_temp.recusa('CEP com 7 dígitos',
    'chk_negocios_cep',
    $$ INSERT INTO negocios (id, profissional_id, nome, categoria, cep)
       VALUES (gen_random_uuid(), pg_temp.usuario('Edu'), 'Eletricista Edu', 'eletrica', '5515000') $$);
CALL pg_temp.aceita('As 12 categorias do front (categorias.js) são aceitas',
    $$ WITH novos AS (
           INSERT INTO usuarios (id, nome, email, senha_hash, papel)
           SELECT gen_random_uuid(), 'Teste ' || c, c || '@teste.stizy', 'x', 'PROFISSIONAL'
             FROM unnest(ARRAY['barbearia', 'salao', 'gas-e-agua', 'mercado', 'comida', 'eletrica',
                               'farmacia', 'pet-shop', 'reformas', 'automotivo', 'tecnologia', 'aulas']) AS c
           RETURNING id, nome
       )
       INSERT INTO negocios (id, profissional_id, nome, categoria)
       SELECT gen_random_uuid(), id, nome, substr(nome, 7) FROM novos $$);
CALL pg_temp.aceita('Carla informa celular, bairro, cidade e aceita os termos',
    $$ UPDATE usuarios
          SET celular = '81999998888', bairro = 'Centro', cidade = 'Belo Jardim, PE', termos_aceitos_em = now()
        WHERE nome = 'Carla' $$);
CALL pg_temp.recusa('Celular com máscara, (81) 99999-8888: maior que a coluna',
    '22001',
    $$ UPDATE usuarios SET celular = '(81) 99999-8888' WHERE nome = 'Diego' $$);
CALL pg_temp.recusa('Celular com dígitos a menos',
    'chk_usuarios_celular',
    $$ UPDATE usuarios SET celular = '9999888' WHERE nome = 'Diego' $$);
CALL pg_temp.recusa('Celular com traço: 81 9999-88',
    'chk_usuarios_celular',
    $$ UPDATE usuarios SET celular = '81 9999-88' WHERE nome = 'Diego' $$);
CALL pg_temp.aceita('Cadastro como o de hoje (só nome, e-mail, senha e papel) continua valendo',
    $$ INSERT INTO usuarios (id, nome, email, senha_hash, papel)
       VALUES (gen_random_uuid(), 'Fábio', 'fabio@teste.stizy', 'x', 'CLIENTE') $$);

-- -----------------------------------------------------------------------------
-- Resultado
-- -----------------------------------------------------------------------------

\echo
\echo 'STIZY - testes do banco (V1 a V5)'
SELECT n AS "#",
       teste AS "Teste",
       esperado AS "Esperado",
       CASE WHEN passou THEN 'ok' ELSE 'FALHOU (' || obtido || ')' END AS "Resultado"
  FROM resultado
 ORDER BY n;

SELECT count(*) FILTER (WHERE passou) || ' de ' || count(*) || ' testes passaram' AS "Resumo"
  FROM resultado;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM resultado WHERE NOT passou) THEN
        RAISE EXCEPTION 'Há testes que falharam (veja a tabela acima).';
    END IF;
END $$;

ROLLBACK;
