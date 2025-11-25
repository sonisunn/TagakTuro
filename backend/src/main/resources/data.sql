-- Create a test student user (minimal required fields)
INSERT INTO `users` (name, email, password, studentId, courseProgram, phoneNumber)
VALUES ('Test Student', 'student@example.com', '$2a$10$vI/v9WvB6v2o4zB2.4l2A.5p5yJg5j.g5j.g5j.g5j.g5j.g5', 'S123456', 'Computer Science', '1234567890');

-- Get the auto-generated user ID and assign STUDENT role
INSERT INTO `user_roles` (user_id, role)
SELECT id, 'STUDENT' FROM `users` WHERE email = 'student@example.com';

-- Create a corresponding student profile
INSERT INTO `students` (name, student_id, email, course_program, phone_number)
VALUES ('Test Student', 'S123456', 'student@example.com', 'Computer Science', '1234567890');

-- Create a test tutor user
INSERT INTO `users` (name, email, password, studentId, courseProgram, phone_number)
VALUES ('Test Tutor', 'tutor@example.com', '$2a$10$vI/v9WvB6v2o4zB2.4l2A.5p5yJg5j.g5j.g5j.g5j.g5j.g5', 'TUTOR001', 'N/A', '1234567890');

-- Assign TUTOR role
INSERT INTO `user_roles` (user_id, role)
SELECT id, 'TUTOR' FROM `users` WHERE email = 'tutor@example.com';

-- Create a corresponding tutor profile
INSERT INTO `tutors` (name, tutor_id, email, phone_number)
VALUES ('Test Tutor', 'TUTOR001', 'tutor@example.com', '1234567890');

-- Create test bookings (pending) - times in Philippine timezone
INSERT INTO `bookings` (student_id, subject, booking_date_time, status, tutor_name, notes, duration_minutes, modality)
VALUES (1, 'Mathematics', '2025-11-26T10:00:00', 'PENDING', NULL, 'Need help with calculus', 60, 'Online');

INSERT INTO `bookings` (student_id, subject, booking_date_time, status, tutor_name, notes, duration_minutes, modality)
VALUES (1, 'Physics', '2025-11-26T14:00:00', 'PENDING', NULL, 'Quantum mechanics assistance', 120, 'In-person');