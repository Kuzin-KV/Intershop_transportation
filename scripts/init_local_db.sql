DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'logistics_user') THEN
        CREATE ROLE logistics_user LOGIN PASSWORD 'logistics_pass';
    END IF;
END
$$;

SELECT 'CREATE DATABASE logistics_local OWNER logistics_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'logistics_local')
\gexec
