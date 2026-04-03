<#
Reset TagakTuro database for local development.

This script will:
- Drop the existing `tagakturo` database (if it exists)
- Recreate the `tagakturo` database with utf8mb4 charset
- Create/grant the `tagak_user`@`localhost` user with password `tagakturo2025`
- Import `backend\db\schema.sql` and `src\main\resources\data.sql` into the new DB

Usage: run from the project root or from `backend` directory in PowerShell:
  cd backend
  .\scripts\reset-db.ps1

You will be prompted for the MySQL root password when needed.
#>

Write-Host "=== TagakTuro DB reset script ==="

# Ask for MySQL root username and password (defaults)
$mysqlUser = Read-Host "MySQL admin user (default: root)"
if ([string]::IsNullOrWhiteSpace($mysqlUser)) { $mysqlUser = 'root' }

Write-Host "You will be prompted for the MySQL password for user: $mysqlUser"

# Helper to run a mysql -e command interactively (will prompt for password)
function Run-MySqlCommand([string]$cmd) {
    & mysql -u $mysqlUser -p -e $cmd
    if ($LASTEXITCODE -ne 0) {
        throw "mysql command failed: $cmd"
    }
}

try {
    Write-Host "Dropping database if exists and recreating 'tagakturo'..."
    $cmd = "DROP DATABASE IF EXISTS tagakturo; CREATE DATABASE tagakturo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    Run-MySqlCommand $cmd

    Write-Host "Creating/granting user 'tagak_user'@'localhost'..."
    $cmd = "CREATE USER IF NOT EXISTS 'tagak_user'@'localhost' IDENTIFIED BY 'tagakturo2025'; GRANT ALL PRIVILEGES ON tagakturo.* TO 'tagak_user'@'localhost'; FLUSH PRIVILEGES;"
    Run-MySqlCommand $cmd

    # Import schema and seed files
    $cwd = Get-Location
    $schemaPath = Join-Path $cwd "db\schema.sql"
    $dataPath = Join-Path $cwd "src\main\resources\data.sql"

    if (-not (Test-Path $schemaPath)) {
        Write-Error "schema.sql not found at: $schemaPath"
        exit 1
    }
    if (-not (Test-Path $dataPath)) {
        Write-Error "data.sql not found at: $dataPath"
        exit 1
    }

    Write-Host "Importing schema from: $schemaPath"
    & mysql -u $mysqlUser -p tagakturo < $schemaPath
    if ($LASTEXITCODE -ne 0) { throw "Failed to import schema.sql" }

    Write-Host "Importing seed/data from: $dataPath"
    & mysql -u $mysqlUser -p tagakturo < $dataPath
    if ($LASTEXITCODE -ne 0) { throw "Failed to import data.sql" }

    Write-Host "Database reset and seed import completed successfully."
} catch {
    Write-Error "ERROR: $_"
    exit 1
}
