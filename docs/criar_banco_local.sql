-- STIZY: cria o usuário e os bancos para rodar SEM Docker, num PostgreSQL instalado na máquina.
-- Pode rodar mais de uma vez: o que já existe é mantido.
--
-- Windows (PowerShell), na raiz do repositório (vai pedir a senha do usuário postgres):
--   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -f docs\criar_banco_local.sql
-- Linux/macOS:
--   psql -U postgres -h localhost -f docs/criar_banco_local.sql
--
-- Com Docker não precisa deste arquivo: o docker-compose.yml já cria o usuário e o banco "stizy".
-- Senha "stizy_dev" é só de desenvolvimento (a mesma do docker-compose.yml e do application.yaml).

SELECT 'CREATE ROLE stizy LOGIN PASSWORD ''stizy_dev'''
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'stizy')\gexec

-- Banco usado ao rodar a API (./mvnw spring-boot:run)
SELECT 'CREATE DATABASE stizy OWNER stizy ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'stizy')\gexec

-- Banco usado pelos testes automatizados (./mvnw test), para não sujar o de desenvolvimento
SELECT 'CREATE DATABASE stizy_test OWNER stizy ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'stizy_test')\gexec

-- A V3 ativa a extensão btree_gist. Ela é "trusted", então o dono do banco consegue ativá-la sozinho.
