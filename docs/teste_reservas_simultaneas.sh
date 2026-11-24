#!/usr/bin/env bash
# STIZY: teste de reservas simultâneas (issues #22 e #25).
#
# Dispara 20 pedidos de reserva para o mesmo profissional e o mesmo horário, todos ao mesmo
# tempo, e conta quantos o banco aceitou. O esperado é 1 aceito e 19 recusados.
#
# São duas rodadas:
#   1. "só INSERT": cada pedido apenas tenta gravar o agendamento.
#   2. "com trava": cada pedido trava antes a linha do profissional (SELECT ... FOR UPDATE),
#      como sugerido para o back-end em docs/BANCO_DE_DADOS.md. Os pedidos entram em fila.
#
# Como rodar no Codespaces, com o PostgreSQL do docker compose ligado e as migrações aplicadas:
#   bash docs/teste_reservas_simultaneas.sh
# Para mudar a quantidade de pedidos (até uns 90; o PostgreSQL aceita 100 conexões por padrão):
#   PEDIDOS=50 bash docs/teste_reservas_simultaneas.sh
# Para usar outro psql:
#   PSQL="psql -h localhost -U stizy -d stizy" bash docs/teste_reservas_simultaneas.sh
#
# O script cria dados de teste (e-mails @teste-concorrencia.stizy) e apaga tudo no final.

set -euo pipefail

PEDIDOS=${PEDIDOS:-20}
PSQL=${PSQL:-"docker exec -i stizy-postgres psql -U stizy -d stizy"}
PROFISSIONAL=f0000000-0000-0000-0000-000000000001
SERVICO=f0000000-0000-0000-0000-000000000002
INICIO='2026-11-24 10:00-03'
FIM='2026-11-24 10:30-03'
LARGADA=424242 # número da trava que segura os pedidos até todos estarem prontos

TMP=$(mktemp -d)

sql() { $PSQL -X -q -v ON_ERROR_STOP=1 "$@"; }

apagar_dados() {
    sql >/dev/null <<SQL
DELETE FROM agendamentos WHERE profissional_id = '$PROFISSIONAL';
DELETE FROM servicos WHERE id = '$SERVICO';
DELETE FROM usuarios WHERE email LIKE '%@teste-concorrencia.stizy';
SQL
}

encerrar() {
    apagar_dados || true
    rm -rf "$TMP"
}
trap encerrar EXIT

cliente() { printf 'f0000000-0000-0000-0001-%012d' "$1"; }

# Quantos arquivos *.$2 da rodada contêm o texto $1.
contar() { { grep -l -- "$1" "$TMP"/*."$2" 2>/dev/null || true; } | wc -l | tr -d ' '; }

apagar_dados
sql >/dev/null <<SQL
INSERT INTO usuarios (id, nome, email, senha_hash, papel)
VALUES ('$PROFISSIONAL', 'Profissional (teste)', 'profissional@teste-concorrencia.stizy', 'x', 'PROFISSIONAL');

INSERT INTO usuarios (id, nome, email, senha_hash, papel)
SELECT ('f0000000-0000-0000-0001-' || lpad(i::text, 12, '0'))::uuid,
       'Cliente ' || i, 'cliente' || i || '@teste-concorrencia.stizy', 'x', 'CLIENTE'
  FROM generate_series(1, $PEDIDOS) AS i;

INSERT INTO servicos (id, profissional_id, nome, duracao_minutos, preco)
VALUES ('$SERVICO', '$PROFISSIONAL', 'Corte (teste)', 30, 40.00);
SQL

rodada() {
    local nome=$1 trava=""
    if [ "$nome" = "com trava" ]; then
        trava="SELECT id FROM usuarios WHERE id = '$PROFISSIONAL' FOR UPDATE;"
    fi
    sql -c "DELETE FROM agendamentos WHERE profissional_id = '$PROFISSIONAL'" >/dev/null
    rm -f "$TMP"/*

    # A largada: uma sessão segura a trava por 3 segundos. Os pedidos conectam e esperam;
    # quando ela solta, todos tentam gravar no mesmo instante.
    sql -c "SELECT pg_advisory_lock($LARGADA), pg_sleep(3)" >/dev/null &
    sleep 1

    for i in $(seq 1 "$PEDIDOS"); do
        (
            if sql -v VERBOSITY=verbose >/dev/null 2>"$TMP/$i.erro" <<SQL
SELECT pg_advisory_lock_shared($LARGADA);
BEGIN;
$trava
INSERT INTO agendamentos (id, cliente_id, profissional_id, servico_id, inicio, fim, preco)
VALUES (gen_random_uuid(), '$(cliente "$i")', '$PROFISSIONAL', '$SERVICO', '$INICIO', '$FIM', 40.00);
SELECT pg_sleep(0.2); -- o tempo que o back-end leva até confirmar
COMMIT;
SQL
            then
                echo aceito >"$TMP/$i.res"
            else
                echo recusado >"$TMP/$i.res"
            fi
        ) &
    done
    wait

    local aceitos conflito deadlock outros gravados
    aceitos=$(contar '^aceito$' res)
    conflito=$(contar 'ERROR: *23P01' erro)
    deadlock=$(contar 'ERROR: *40P01' erro)
    outros=$((PEDIDOS - aceitos - conflito - deadlock))
    gravados=$(sql -At -c "SELECT count(*) FROM agendamentos
                            WHERE profissional_id = '$PROFISSIONAL' AND status <> 'CANCELADO'")

    echo "Rodada \"$nome\": $PEDIDOS pedidos ao mesmo tempo para $INICIO"
    echo "  aceitos: $aceitos"
    echo "  recusados por conflito de horário (23P01): $conflito"
    echo "  recusados por deadlock (40P01): $deadlock"
    if [ "$outros" -ne 0 ]; then
        echo "  outros erros: $outros"
        cat "$TMP"/*.erro | grep -E 'ERROR|FATAL|rror' | grep -v -E '23P01|40P01' | sort | uniq -c || true
    fi
    echo "  agendamentos gravados nesse horário: $gravados"
    echo

    [ "$aceitos" -eq 1 ] && [ "$gravados" -eq 1 ] && [ "$outros" -eq 0 ]
}

resultado=0
rodada "só INSERT" || resultado=1
rodada "com trava" || resultado=1

if [ "$resultado" -eq 0 ]; then
    echo "OK: nas duas rodadas o banco gravou só 1 agendamento."
else
    echo "FALHOU: veja os números acima."
fi
exit "$resultado"
