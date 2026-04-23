-- MySQL Migration to add admin and cced accounts and populate data

-- 1. Insert new Users
INSERT INTO `users` (name, email, password, student_id, course_program, phone_number)
VALUES ('Admin', 'TagakOVPSSCD@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'OVPSSCD002', 'N/A', '0000000010');

INSERT INTO `user_roles` (user_id, role)
SELECT id, 'ROLE_ADMIN' FROM `users` WHERE email = 'TagakOVPSSCD';

INSERT INTO `users` (name, email, password, student_id, course_program, phone_number)
VALUES ('CCED Admin', 'TagakCCED@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CCED002', 'N/A', '0000000011');

INSERT INTO `user_roles` (user_id, role)
SELECT id, 'ROLE_CCED' FROM `users` WHERE email = 'TagakCCED';

-- 2. Define variables for test student and test tutor
-- Ensure we get the correct IDs based on the seed data from V2
SET @test_student_user_id = (SELECT id FROM `users` WHERE email = 'student@example.com' LIMIT 1);
SET @test_student_entity_id = (SELECT id FROM `students` WHERE email = 'student@example.com' LIMIT 1);
SET @test_tutor_user_id = (SELECT id FROM `users` WHERE email = 'tutor@example.com' LIMIT 1);
SET @test_tutor_name = (SELECT name FROM `tutors` WHERE email = 'tutor@example.com' LIMIT 1);

-- 3. Insert Bookings (Sessions) - Using dates in the future to ensure they're valid
-- We will create a CONFIRMED booking and a PENDING booking
INSERT INTO `bookings` (student_id, subject, booking_date_time, status, modality, tutor_name, notes, duration_minutes)
VALUES (@test_student_entity_id, 'Test Mathematics', DATE_ADD(NOW(), INTERVAL 2 DAY), 'CONFIRMED', 'Online', @test_tutor_name, 'Looking forward to the session!', 60);

SET @created_booking_id = LAST_INSERT_ID();

INSERT INTO `bookings` (student_id, subject, booking_date_time, status, modality, tutor_name, notes, duration_minutes)
VALUES (@test_student_entity_id, 'Test Science', DATE_ADD(NOW(), INTERVAL 4 DAY), 'PENDING', 'Online', @test_tutor_name, 'Need help with upcoming test', 60);

-- 4. Insert Notifications
-- One for the student
INSERT INTO `notifications` (user_id, title, body, is_read, date_sent)
VALUES (@test_student_user_id, 'Booking Confirmed', 'Your Mathematics booking has been confirmed by the tutor.', 0, NOW());

-- One for the tutor
INSERT INTO `notifications` (user_id, title, body, is_read, date_sent)
VALUES (@test_tutor_user_id, 'New Booking Request', 'You have a new booking request for Test Science.', 0, NOW());

-- 5. Insert Feedbacks
-- A feedback instance from the student to the tutor for a theoretically completed session
INSERT INTO `feedbacks` (booking_id, reviewer_id, reviewee_id, rating, comments, created_at)
VALUES (@created_booking_id, @test_student_user_id, @test_tutor_user_id, 5, 'Great tutor, explained everything clearly!', NOW());
