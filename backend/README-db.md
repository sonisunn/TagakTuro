TagakTuro — Database setup and reproducible dump

This document explains how to recreate the local MySQL database used by the backend, how to import the schema, and how to create a SQL dump for sharing.

1) Create the database and schema

From a shell with MySQL available (XAMPP ships `mysql`):

```powershell
# Import schema (runs CREATE DATABASE + CREATE TABLE statements)
mysql -u root -p < backend\db\schema.sql
```

Replace `root` with your MySQL admin account or a created user with CREATE privileges.

2) Seed the database (recommended via API)

It's recommended to use the backend API to create users so passwords are hashed correctly:

```bash
# Example (use PowerShell or bash). This hits your running backend locally:
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"secret123"}'
```

Alternatively, if you prefer SQL inserts, see `backend/db/seed.sql` for a template; ensure the `password` column contains a BCrypt hash (the application will not re-hash if you manually insert an already-encoded value).

3) Create a SQL dump to share or commit (one-time snapshot)

From the machine that hosts MySQL / XAMPP:

```powershell
# Export entire database to a file
"C:\\xampp\\mysql\\bin\\mysqldump.exe" -u tagak_user -p tagakturo > backend\db\tagakturo_dump.sql
# You will be prompted for the password for tagak_user.
```

Notes:
- Avoid committing `tagakturo_dump.sql` if it contains real or sensitive data.
- If you must commit a dump for onboarding, sanitize it first (remove real emails, passwords, tokens).

4) Optional: Use Flyway or Liquibase for proper migrations

For a robust reproducible setup, add Flyway to the Maven `pom.xml` and place versioned SQL migrations under `src/main/resources/db/migration/V1__init.sql`. Flyway will run migrations automatically on app startup.

Example Flyway SQL file path:
```
src/main/resources/db/migration/V1__init.sql
```

5) Security and Git

- Do NOT commit `application.properties` containing real DB passwords or JWT secrets. Use `application.properties.example` with placeholders and set real credentials via environment variables or your IDE.
- If you accidentally pushed secrets to GitHub, rotate those credentials immediately.

If you want, I can:
- Add a Flyway migration script and modify `pom.xml` to include Flyway (small, safe change for local dev).
- Generate a sanitized SQL dump from your running DB (I can provide the command; I can't run it on your machine without permission).
- Add a sample `application.properties.example` and update `.gitignore` to exclude the real `application.properties`.

Which would you like next?