-- V2: Initial Seed Data for TagakTuro
-- Includes Admin accounts and sample data for testing.
-- All passwords are 'TagakTuro2025' (hashed with BCrypt)

INSERT INTO `users` (name, email, password, student_id, course_program, phone_number)
VALUES 
  ('Admin', 'TagakOVPSSCD@umak.edu.ph', '$2a$10$3qGSXa7p8x9K2zL1mN4pQOh6wP9rV8sT3dL4kJ5yM6nO7pQ8rS9tU', 'OVPSSCD001', 'N/A', '0000000000'),
  ('CCED Admin', 'TagakCCED@gmail.com', '$2a$10$3qGSXa7p8x9K2zL1mN4pQOh6wP9rV8sT3dL4kJ5yM6nO7pQ8rS9tU', 'CCED001', 'N/A', '0000000001');

-- Assign ROLE_ADMIN and ROLE_CCED
INSERT INTO `user_roles` (user_id, role)
SELECT id, 'ROLE_ADMIN' FROM `users` WHERE email = 'TagakOVPSSCD@umak.edu.ph';

INSERT INTO `user_roles` (user_id, role)
SELECT id, 'ROLE_CCED' FROM `users` WHERE email = 'TagakCCED@gmail.com';

-- Create a Test Student
INSERT INTO `users` (name, email, password, student_id, course_program, phone_number)
VALUES ('Juan Dela Cruz', 'teststudent@umak.edu.ph', '$2a$10$3qGSXa7p8x9K2zL1mN4pQOh6wP9rV8sT3dL4kJ5yM6nO7pQ8rS9tU', 'K12345678', 'BS Computer Science', '09171234567');

INSERT INTO `user_roles` (user_id, role)
SELECT id, 'ROLE_STUDENT' FROM `users` WHERE email = 'teststudent@umak.edu.ph';

INSERT INTO `students` (name, student_id, email, course_program, phone_number, user_id)
SELECT 'Juan Dela Cruz', 'K12345678', 'teststudent@umak.edu.ph', 'BS Computer Science', '09171234567', id
FROM `users` WHERE email = 'teststudent@umak.edu.ph';

-- Create a Test Tutor
INSERT INTO `users` (name, email, password, student_id, course_program, phone_number)
VALUES ('Maria Santos', 'testtutor@umak.edu.ph', '$2a$10$3qGSXa7p8x9K2zL1mN4pQOh6wP9rV8sT3dL4kJ5yM6nO7pQ8rS9tU', 'K87654321', 'BS Information Technology', '09179876543');

INSERT INTO `user_roles` (user_id, role)
SELECT id, 'ROLE_TUTOR' FROM `users` WHERE email = 'testtutor@umak.edu.ph';

INSERT INTO `tutors` (name, tutor_id, email, phone_number, course_program, user_id)
SELECT 'Maria Santos', 'K87654321', 'testtutor@umak.edu.ph', '09179876543', 'BS Information Technology', id
FROM `users` WHERE email = 'testtutor@umak.edu.ph';

-- Add default modules
INSERT INTO `modules` (module_name, description, capacity)
VALUES 
  ('Calculus I', 'Limits, derivatives, and basic integration', 5),
  ('Data Structures', 'Arrays, Lists, Trees, and Graphs', 5),
  ('Web Development', 'HTML, CSS, JavaScript, and React', 5);
