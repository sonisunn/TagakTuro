-- Optional seed data for development only.
-- IMPORTANT: Do NOT commit production credentials or real user data.
-- This file is a template. Two ways to create users for local dev:
-- 1) Use the backend API (recommended): POST /api/auth/signup with JSON { name, email, password } (alias /api/auth/register supported)
-- 2) Insert directly with an already-BCrypt-hashed password

-- - Or create the user via the API (POST /api/auth/signup) which will hash the password correctly. A compatibility alias `/api/auth/register` is also available.
-- VALUES ('Test User', 'S12345', 'Course', 'test@example.com', '0123456789', '<BCRYPT_HASH>');
-- Example: create test user via API (curl):
-- curl -X POST http://localhost:8080/api/auth/signup -H "Content-Type: application/json" -d '{"name":"Test User","email":"test@example.com","password":"secret123"}'
-- - Use a quick Node.js script, Java program, or an online tool (avoid committing generated hashes containing secrets).
-- - Or create the user via the API (POST /api/auth/register) which will hash the password correctly.

-- Example: create test user via API (curl):
-- curl -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" -d '{"name":"Test User","email":"test@example.com","password":"secret123"}'

-- Example tutor user with a placeholder hashed password
-- Replace '<BCRYPT_HASH>' with a real hash generated for your password
INSERT INTO `users` (name, email, password, studentId, courseProgram, phoneNumber)
VALUES ('Test Tutor', 'tutor@example.com', '$2a$10$vI/v9WvB6v2o4zB2.4l2A.5p5yJg5j.g5j.g5j.g5j.g5j.g5', 'TUTOR001', 'N/A', '1234567890');

-- Get the last inserted user ID
SET @last_user_id = LAST_INSERT_ID();

-- Assign the 'TUTOR' role to the new user
INSERT INTO `user_roles` (user_id, role)
VALUES (@last_user_id, 'TUTOR');

-- Create a corresponding tutor profile
INSERT INTO `tutors` (name, tutor_id, email, phone_number)
VALUES ('Test Tutor', 'TUTOR001', 'tutor@example.com', '1234567890');


-- Create a test student user with specific ID 1
INSERT INTO `users` (id, name, email, password, studentId, courseProgram, phoneNumber)
VALUES (1, 'Test Student', 'student@example.com', '$2a$10$vI/v9WvB6v2o4zB2.4l2A.5p5yJg5j.g5j.g5j.g5j.g5j.g5', 'S123456', 'Computer Science', '1234567890');

-- Assign the 'STUDENT' role to the new user
INSERT INTO `user_roles` (user_id, role)
VALUES (1, 'STUDENT');

-- Create a corresponding student profile with ID 1
INSERT INTO `students` (id, name, student_id, email, course_program, phone_number)
VALUES (1, 'Test Student', 'S123456', 'student@example.com', 'Computer Science', '1234567890');

-- End of seed template
