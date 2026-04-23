-- MySQL Migration: Admin/CCED accounts, test student/tutor, and sample data
-- Password hash is for 'TagakTuro2025'

-- ============================================================
-- 1. Admin and CCED accounts
-- ============================================================
INSERT INTO `users` (name, email, password, student_id, course_program, phone_number)
VALUES ('Admin', 'TagakOVPSSCD@gmail.com', '$2b$10$pG9kmSQcNjKZFfZjCYvvwOwiwVQRlVUQ/3rvrLZs6VQ/x.J6inXV6', 'OVPSSCD002', 'N/A', '0000000010');

INSERT INTO `user_roles` (user_id, role)
SELECT id, 'ROLE_ADMIN' FROM `users` WHERE email = 'TagakOVPSSCD@gmail.com';

INSERT INTO `users` (name, email, password, student_id, course_program, phone_number)
VALUES ('CCED Admin', 'TagakCCED@gmail.com', '$2b$10$pG9kmSQcNjKZFfZjCYvvwOwiwVQRlVUQ/3rvrLZs6VQ/x.J6inXV6', 'CCED002', 'N/A', '0000000011');

INSERT INTO `user_roles` (user_id, role)
SELECT id, 'ROLE_CCED' FROM `users` WHERE email = 'TagakCCED@gmail.com';

-- ============================================================
-- 2. Test Student account (email: teststudent@umak.edu.ph / password: TagakTuro2025)
-- ============================================================
INSERT INTO `users` (name, email, password, student_id, course_program, phone_number)
VALUES ('Juan Dela Cruz', 'teststudent@umak.edu.ph', '$2b$10$pG9kmSQcNjKZFfZjCYvvwOwiwVQRlVUQ/3rvrLZs6VQ/x.J6inXV6', 'K12345678', 'BS Computer Science', '09171234567');

INSERT INTO `user_roles` (user_id, role)
SELECT id, 'ROLE_STUDENT' FROM `users` WHERE email = 'teststudent@umak.edu.ph';

INSERT INTO `students` (name, student_id, email, course_program, phone_number, user_id)
SELECT 'Juan Dela Cruz', 'K12345678', 'teststudent@umak.edu.ph', 'BS Computer Science', '09171234567', id
FROM `users` WHERE email = 'teststudent@umak.edu.ph';

-- ============================================================
-- 3. Test Tutor account (email: testtutor@umak.edu.ph / password: TagakTuro2025)
-- ============================================================
INSERT INTO `users` (name, email, password, student_id, course_program, phone_number)
VALUES ('Maria Santos', 'testtutor@umak.edu.ph', '$2b$10$pG9kmSQcNjKZFfZjCYvvwOwiwVQRlVUQ/3rvrLZs6VQ/x.J6inXV6', 'K87654321', 'BS Information Technology', '09179876543');

INSERT INTO `user_roles` (user_id, role)
SELECT id, 'ROLE_TUTOR' FROM `users` WHERE email = 'testtutor@umak.edu.ph';

INSERT INTO `tutors` (name, tutor_id, email, phone_number, user_id)
SELECT 'Maria Santos', 'K87654321', 'testtutor@umak.edu.ph', '09179876543', id
FROM `users` WHERE email = 'testtutor@umak.edu.ph';

-- ============================================================
-- 4. Define variables for bookings / notifications / feedback
-- ============================================================
SET @student_user_id = (SELECT id FROM `users` WHERE email = 'teststudent@umak.edu.ph' LIMIT 1);
SET @student_entity_id = (SELECT id FROM `students` WHERE email = 'teststudent@umak.edu.ph' LIMIT 1);
SET @tutor_user_id = (SELECT id FROM `users` WHERE email = 'testtutor@umak.edu.ph' LIMIT 1);

-- ============================================================
-- 5. Sample Bookings
-- ============================================================
INSERT INTO `bookings` (student_id, subject, booking_date_time, status, modality, tutor_name, notes, duration_minutes)
VALUES (@student_entity_id, 'Calculus I', DATE_ADD(NOW(), INTERVAL 2 DAY), 'CONFIRMED', 'Online', 'Maria Santos', 'Need help with derivatives', 60);

SET @confirmed_booking_id = LAST_INSERT_ID();

INSERT INTO `bookings` (student_id, subject, booking_date_time, status, modality, tutor_name, notes, duration_minutes)
VALUES (@student_entity_id, 'Physics 101', DATE_ADD(NOW(), INTERVAL 5 DAY), 'PENDING', 'In-Person', 'Maria Santos', 'Preparing for midterms', 90);

INSERT INTO `bookings` (student_id, subject, booking_date_time, status, modality, tutor_name, notes, duration_minutes)
VALUES (@student_entity_id, 'Web Development', DATE_SUB(NOW(), INTERVAL 3 DAY), 'COMPLETED', 'Online', 'Maria Santos', 'HTML/CSS/JS basics', 60);

SET @completed_booking_id = LAST_INSERT_ID();

-- ============================================================
-- 6. Sample Notifications
-- ============================================================
INSERT INTO `notifications` (user_id, title, body, is_read, date_sent)
VALUES (@student_user_id, 'Booking Confirmed!', 'Your Calculus I session with Maria Santos has been confirmed.', 0, NOW());

INSERT INTO `notifications` (user_id, title, body, is_read, date_sent)
VALUES (@student_user_id, 'Session Completed', 'Your Web Development session has been marked as completed. Leave a review!', 1, DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO `notifications` (user_id, title, body, is_read, date_sent)
VALUES (@tutor_user_id, 'New Booking Request', 'Juan Dela Cruz has requested a Physics 101 session.', 0, NOW());

INSERT INTO `notifications` (user_id, title, body, is_read, date_sent)
VALUES (@tutor_user_id, 'Feedback Received', 'You received a 5-star review from Juan Dela Cruz!', 0, DATE_SUB(NOW(), INTERVAL 1 DAY));

-- ============================================================
-- 7. Sample Feedback
-- ============================================================
INSERT INTO `feedbacks` (booking_id, reviewer_id, reviewee_id, rating, comments, created_at)
VALUES (@completed_booking_id, @student_user_id, @tutor_user_id, 5, 'Excellent tutor! Very patient and explains concepts clearly.', DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO `feedbacks` (booking_id, reviewer_id, reviewee_id, rating, comments, created_at)
VALUES (@completed_booking_id, @tutor_user_id, @student_user_id, 4, 'Great student, very eager to learn. Comes prepared with questions.', DATE_SUB(NOW(), INTERVAL 1 DAY));
