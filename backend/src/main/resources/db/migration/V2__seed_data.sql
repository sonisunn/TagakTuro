-- =====================================================================================
-- DATABASE CLEARING STATEMENTS
-- Use these SQL statements to delete all records before adding fresh data:
--
-- USE tagakturo;
-- SET FOREIGN_KEY_CHECKS = 0;
-- DELETE FROM bookings;
-- DELETE FROM user_roles;
-- DELETE FROM tutor_applications;
-- DELETE FROM students;
-- DELETE FROM tutors;
-- DELETE FROM users;
-- SET FOREIGN_KEY_CHECKS = 1;
--
-- Optional: Reset auto-increment counters
-- ALTER TABLE users AUTO_INCREMENT = 1;
-- ALTER TABLE students AUTO_INCREMENT = 1;
-- ALTER TABLE tutors AUTO_INCREMENT = 1;
-- ALTER TABLE bookings AUTO_INCREMENT = 1;
-- ALTER TABLE tutor_applications AUTO_INCREMENT = 1;
-- =====================================================================================

INSERT IGNORE INTO `users` (name, email, password, student_id, course_program, phone_number)
VALUES ('Test Student', 'student@example.com', '$2a$10$vI/v9WvB6v2o4zB2.4l2A.5p5yJg5j.g5j.g5j.g5j.g5j.g5', 'S123456', 'Computer Science', '1234567890');

INSERT IGNORE INTO `user_roles` (user_id, role)
SELECT id, 'STUDENT' FROM `users` WHERE email = 'student@example.com';

INSERT IGNORE INTO `students` (name, student_id, email, course_program, phone_number)
VALUES ('Test Student', 'S123456', 'student@example.com', 'Computer Science', '1234567890');

INSERT IGNORE INTO `users` (name, email, password, student_id, course_program, phone_number)
VALUES ('Test Tutor', 'tutor@example.com', '$2a$10$vI/v9WvB6v2o4zB2.4l2A.5p5yJg5j.g5j.g5j.g5j.g5j.g5', 'TUTOR001', 'N/A', '1234567890');

INSERT IGNORE INTO `user_roles` (user_id, role)
SELECT id, 'TUTOR' FROM `users` WHERE email = 'tutor@example.com';

INSERT IGNORE INTO `tutors` (name, tutor_id, email, phone_number)
VALUES ('Test Tutor', 'TUTOR001', 'tutor@example.com', '1234567890');

INSERT IGNORE INTO `users` (name, email, password, student_id, course_program, phone_number)
VALUES ('Admin', 'admin@umak.edu.ph', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN001', 'N/A', '0000000000');

INSERT IGNORE INTO `user_roles` (user_id, role)
SELECT id, 'ROLE_ADMIN' FROM `users` WHERE email = 'admin@umak.edu.ph';

INSERT IGNORE INTO `users` (name, email, password, student_id, course_program, phone_number)
VALUES ('CCED Admin', 'cced@umak.edu.ph', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CCED001', 'N/A', '0000000001');

INSERT IGNORE INTO `user_roles` (user_id, role)
SELECT id, 'ROLE_CCED' FROM `users` WHERE email = 'cced@umak.edu.ph';
