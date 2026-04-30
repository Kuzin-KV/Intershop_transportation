$ErrorActionPreference = "Stop"

$pgBin = "C:\Program Files\PostgreSQL\16\bin"
$psql = Join-Path $pgBin "psql.exe"

if (-not (Test-Path $psql)) {
  throw "PostgreSQL client not found: $psql"
}

$env:PGPASSWORD = "postgres"

& $psql -h localhost -U postgres -d postgres -v ON_ERROR_STOP=1 -f "scripts/init_local_db.sql"
& $psql -h localhost -U postgres -d logistics_local -v ON_ERROR_STOP=1 -c "CREATE SCHEMA IF NOT EXISTS t_p68114469_cross_platform_logis AUTHORIZATION logistics_user; ALTER SCHEMA t_p68114469_cross_platform_logis OWNER TO logistics_user;"

$tableExists = & $psql -h localhost -U postgres -d logistics_local -t -A -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 't_p68114469_cross_platform_logis' AND table_name = 'users');"
if ($tableExists.Trim() -ne "t") {
  $files = Get-ChildItem "db_migrations\V*.sql" | Sort-Object Name
  foreach ($f in $files) {
    & $psql -h localhost -U postgres -d logistics_local -v ON_ERROR_STOP=1 -f $f.FullName
  }
}

& $psql -h localhost -U postgres -d logistics_local -v ON_ERROR_STOP=1 -c "GRANT USAGE ON SCHEMA t_p68114469_cross_platform_logis TO logistics_user; GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA t_p68114469_cross_platform_logis TO logistics_user; GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA t_p68114469_cross_platform_logis TO logistics_user; ALTER DEFAULT PRIVILEGES IN SCHEMA t_p68114469_cross_platform_logis GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO logistics_user; ALTER DEFAULT PRIVILEGES IN SCHEMA t_p68114469_cross_platform_logis GRANT USAGE, SELECT ON SEQUENCES TO logistics_user;"

Write-Host "Local DB is ready."
