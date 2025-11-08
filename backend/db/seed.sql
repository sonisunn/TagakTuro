-- Optional seed data for development only.
-- IMPORTANT: Do NOT commit production credentials or real user data.
-- This file is a template. Two ways to create users for local dev:
-- 1) Use the backend API (recommended): POST /api/auth/register with JSON { name, email, password }
-- 2) Insert directly with an already-BCrypt-hashed password

-- Example insert with a placeholder hashed password (replace <BCRYPT_HASH>):
-- INSERT INTO `users` (name, studentId, courseProgram, email, phoneNumber, password)
-- VALUES ('Test User', 'S12345', 'Course', 'test@example.com', '0123456789', '<BCRYPT_HASH>');

-- To generate a bcrypt hash locally (recommended):
-- - Use a quick Node.js script, Java program, or an online tool (avoid committing generated hashes containing secrets).
-- - Or create the user via the API (POST /api/auth/register) which will hash the password correctly.

-- Example: create test user via API (curl):
-- curl -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" -d '{"name":"Test User","email":"test@example.com","password":"secret123"}'

-- End of seed template
