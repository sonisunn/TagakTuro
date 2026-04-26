-- V9: Schema fixes + comprehensive data population for all tables
-- All passwords are 'TagakTuro2025'
-- bcrypt hash: $2b$10$pG9kmSQcNjKZFfZjCYvvwOwiwVQRlVUQ/3rvrLZs6VQ/x.J6inXV6

SET FOREIGN_KEY_CHECKS=0;

-- ============================================================
-- 0. SCHEMA FIXES: Create missing tables that Hibernate auto-created
-- ============================================================
ALTER TABLE `bookings` ADD COLUMN IF NOT EXISTS `venue` VARCHAR(255) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `modules` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `capacity` int(11) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `current_tutors` int(11) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `module_name` varchar(255) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_module_name` (`module_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tutor_applications` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `certificates_path` varchar(255) DEFAULT NULL,
  `course_program` varchar(255) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `experience` text NOT NULL,
  `name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone_number` varchar(255) NOT NULL,
  `report_of_grades_path` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `student_id` varchar(255) NOT NULL,
  `time_available_end` time(6) NOT NULL,
  `time_available_start` time(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tutor_app_email` (`email`),
  UNIQUE KEY `uk_tutor_app_student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pama_preferences` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `preference_rank` int(11) DEFAULT NULL,
  `score` double DEFAULT NULL,
  `module_id` bigint(20) NOT NULL,
  `tutor_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pama_assignments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `matching_score` double DEFAULT NULL,
  `round_number` int(11) DEFAULT NULL,
  `status` enum('CONFIRMED','DEADLOCK','PENDING','REJECTED') DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `module_id` bigint(20) NOT NULL,
  `tutor_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `conversations` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `last_message_id` bigint(20) DEFAULT NULL,
  `user1_id` bigint(20) NOT NULL,
  `user2_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `messages` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `content` longtext NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `is_read` bit(1) NOT NULL,
  `message_type` enum('FILE','IMAGE','SYSTEM','TEXT') DEFAULT NULL,
  `read_at` datetime(6) DEFAULT NULL,
  `conversation_id` bigint(20) NOT NULL,
  `sender_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS=1;

-- ============================================================
-- 1. MORE STUDENTS (3 additional)
-- ============================================================
INSERT INTO `users` (name, email, password, student_id, course_program, phone_number)
VALUES ('Ana Reyes', 'areyes@umak.edu.ph', '$2b$10$pG9kmSQcNjKZFfZjCYvvwOwiwVQRlVUQ/3rvrLZs6VQ/x.J6inXV6', 'K11111111', 'BS Information Technology', '09170001111');
INSERT INTO `user_roles` (user_id, role) SELECT id, 'ROLE_STUDENT' FROM `users` WHERE email = 'areyes@umak.edu.ph';
INSERT INTO `students` (name, student_id, email, course_program, phone_number, user_id)
SELECT 'Ana Reyes', 'K11111111', 'areyes@umak.edu.ph', 'BS Information Technology', '09170001111', id FROM `users` WHERE email = 'areyes@umak.edu.ph';

INSERT INTO `users` (name, email, password, student_id, course_program, phone_number)
VALUES ('Carlos Garcia', 'cgarcia@umak.edu.ph', '$2b$10$pG9kmSQcNjKZFfZjCYvvwOwiwVQRlVUQ/3rvrLZs6VQ/x.J6inXV6', 'K22222222', 'BS Computer Engineering', '09170002222');
INSERT INTO `user_roles` (user_id, role) SELECT id, 'ROLE_STUDENT' FROM `users` WHERE email = 'cgarcia@umak.edu.ph';
INSERT INTO `students` (name, student_id, email, course_program, phone_number, user_id)
SELECT 'Carlos Garcia', 'K22222222', 'cgarcia@umak.edu.ph', 'BS Computer Engineering', '09170002222', id FROM `users` WHERE email = 'cgarcia@umak.edu.ph';

INSERT INTO `users` (name, email, password, student_id, course_program, phone_number)
VALUES ('Bea Lim', 'blim@umak.edu.ph', '$2b$10$pG9kmSQcNjKZFfZjCYvvwOwiwVQRlVUQ/3rvrLZs6VQ/x.J6inXV6', 'K33333333', 'BS Mathematics', '09170003333');
INSERT INTO `user_roles` (user_id, role) SELECT id, 'ROLE_STUDENT' FROM `users` WHERE email = 'blim@umak.edu.ph';
INSERT INTO `students` (name, student_id, email, course_program, phone_number, user_id)
SELECT 'Bea Lim', 'K33333333', 'blim@umak.edu.ph', 'BS Mathematics', '09170003333', id FROM `users` WHERE email = 'blim@umak.edu.ph';

-- ============================================================
-- 2. MORE TUTORS (2 additional)
-- ============================================================
INSERT INTO `users` (name, email, password, student_id, course_program, phone_number)
VALUES ('Daniel Cruz', 'dcruz@umak.edu.ph', '$2b$10$pG9kmSQcNjKZFfZjCYvvwOwiwVQRlVUQ/3rvrLZs6VQ/x.J6inXV6', 'K44444444', 'BS Computer Science', '09170004444');
INSERT INTO `user_roles` (user_id, role) SELECT id, 'ROLE_TUTOR' FROM `users` WHERE email = 'dcruz@umak.edu.ph';
INSERT INTO `tutors` (name, tutor_id, email, phone_number, user_id, course_program, sessions_done, total_hours, rating) 
SELECT 'Daniel Cruz', 'K44444444', 'dcruz@umak.edu.ph', '09170004444', id, 'BS Computer Science', 15, 22.5, 4.7 FROM `users` WHERE email = 'dcruz@umak.edu.ph';

INSERT INTO `users` (name, email, password, student_id, course_program, phone_number)
VALUES ('Elena Ramos', 'eramos@umak.edu.ph', '$2b$10$pG9kmSQcNjKZFfZjCYvvwOwiwVQRlVUQ/3rvrLZs6VQ/x.J6inXV6', 'K55555555', 'BS Mathematics', '09170005555');
INSERT INTO `user_roles` (user_id, role) SELECT id, 'ROLE_TUTOR' FROM `users` WHERE email = 'eramos@umak.edu.ph';
INSERT INTO `tutors` (name, tutor_id, email, phone_number, user_id, course_program, sessions_done, total_hours, rating)
SELECT 'Elena Ramos', 'K55555555', 'eramos@umak.edu.ph', '09170005555', id, 'BS Mathematics', 8, 12.0, 4.9 FROM `users` WHERE email = 'eramos@umak.edu.ph';

-- Update Maria Santos (from V8) with tutor stats
UPDATE `tutors` SET sessions_done = 10, total_hours = 15.0, rating = 4.8, course_program = 'BS Information Technology' WHERE email = 'testtutor@umak.edu.ph';

-- ============================================================
-- 3. Grab IDs for reference
-- ============================================================
SET @juan_uid = (SELECT id FROM `users` WHERE email = 'teststudent@umak.edu.ph');
SET @juan_sid = (SELECT id FROM `students` WHERE email = 'teststudent@umak.edu.ph');
SET @ana_uid  = (SELECT id FROM `users` WHERE email = 'areyes@umak.edu.ph');
SET @ana_sid  = (SELECT id FROM `students` WHERE email = 'areyes@umak.edu.ph');
SET @carlos_uid = (SELECT id FROM `users` WHERE email = 'cgarcia@umak.edu.ph');
SET @carlos_sid = (SELECT id FROM `students` WHERE email = 'cgarcia@umak.edu.ph');
SET @bea_uid = (SELECT id FROM `users` WHERE email = 'blim@umak.edu.ph');
SET @bea_sid = (SELECT id FROM `students` WHERE email = 'blim@umak.edu.ph');
SET @maria_uid = (SELECT id FROM `users` WHERE email = 'testtutor@umak.edu.ph');
SET @daniel_uid = (SELECT id FROM `users` WHERE email = 'dcruz@umak.edu.ph');
SET @elena_uid = (SELECT id FROM `users` WHERE email = 'eramos@umak.edu.ph');

-- ============================================================
-- 4. MORE BOOKINGS (variety of statuses, tutors, students)
-- ============================================================
-- Ana with Daniel
INSERT INTO `bookings` (student_id, subject, booking_date_time, status, modality, tutor_name, venue, notes, duration_minutes)
VALUES (@ana_sid, 'Data Structures', DATE_ADD(NOW(), INTERVAL 1 DAY), 'CONFIRMED', 'Online', 'Daniel Cruz', NULL, 'Need help with binary trees', 60);

INSERT INTO `bookings` (student_id, subject, booking_date_time, status, modality, tutor_name, venue, notes, duration_minutes)
VALUES (@ana_sid, 'Algorithms', DATE_ADD(NOW(), INTERVAL 6 DAY), 'PENDING', 'In-Person', 'Daniel Cruz', 'Library', 'Sorting algorithms review', 90);

-- Carlos with Elena
INSERT INTO `bookings` (student_id, subject, booking_date_time, status, modality, tutor_name, venue, notes, duration_minutes)
VALUES (@carlos_sid, 'Linear Algebra', DATE_ADD(NOW(), INTERVAL 3 DAY), 'CONFIRMED', 'Online', 'Elena Ramos', NULL, 'Matrix operations', 60);

INSERT INTO `bookings` (student_id, subject, booking_date_time, status, modality, tutor_name, venue, notes, duration_minutes)
VALUES (@carlos_sid, 'Discrete Math', DATE_SUB(NOW(), INTERVAL 5 DAY), 'COMPLETED', 'In-Person', 'Elena Ramos', 'OPVSSCD Conference Room', 'Great session on graph theory', 60);
SET @carlos_completed = LAST_INSERT_ID();

-- Bea with Maria
INSERT INTO `bookings` (student_id, subject, booking_date_time, status, modality, tutor_name, venue, notes, duration_minutes)
VALUES (@bea_sid, 'Statistics', DATE_ADD(NOW(), INTERVAL 2 DAY), 'PENDING', 'Online', 'Maria Santos', NULL, 'Probability distributions', 60);

INSERT INTO `bookings` (student_id, subject, booking_date_time, status, modality, tutor_name, venue, notes, duration_minutes)
VALUES (@bea_sid, 'Calculus II', DATE_SUB(NOW(), INTERVAL 7 DAY), 'COMPLETED', 'Online', 'Maria Santos', NULL, 'Integration techniques', 90);
SET @bea_completed = LAST_INSERT_ID();

-- Juan with Daniel (extra booking)
INSERT INTO `bookings` (student_id, subject, booking_date_time, status, modality, tutor_name, venue, notes, duration_minutes)
VALUES (@juan_sid, 'Operating Systems', DATE_ADD(NOW(), INTERVAL 8 DAY), 'PENDING', 'In-Person', 'Daniel Cruz', 'Library', 'Process scheduling algorithms', 60);

-- A cancelled booking
INSERT INTO `bookings` (student_id, subject, booking_date_time, status, modality, tutor_name, venue, notes, duration_minutes)
VALUES (@ana_sid, 'Database Systems', DATE_SUB(NOW(), INTERVAL 2 DAY), 'CANCELLED', 'Online', 'Maria Santos', NULL, 'Had a schedule conflict', 60);

-- ============================================================
-- 5. MORE NOTIFICATIONS (for various users)
-- ============================================================
-- Ana
INSERT INTO `notifications` (user_id, title, body, is_read, date_sent)
VALUES (@ana_uid, 'Booking Confirmed!', 'Your Data Structures session with Daniel Cruz has been confirmed.', 0, NOW());
INSERT INTO `notifications` (user_id, title, body, is_read, date_sent)
VALUES (@ana_uid, 'Welcome to TagakTuro!', 'Start booking tutors to boost your grades!', 1, DATE_SUB(NOW(), INTERVAL 10 DAY));

-- Carlos
INSERT INTO `notifications` (user_id, title, body, is_read, date_sent)
VALUES (@carlos_uid, 'Session Completed', 'Your Discrete Math session is complete. Leave a review!', 0, DATE_SUB(NOW(), INTERVAL 4 DAY));
INSERT INTO `notifications` (user_id, title, body, is_read, date_sent)
VALUES (@carlos_uid, 'Booking Confirmed!', 'Your Linear Algebra session with Elena Ramos has been confirmed.', 0, NOW());

-- Bea
INSERT INTO `notifications` (user_id, title, body, is_read, date_sent)
VALUES (@bea_uid, 'Session Completed', 'Your Calculus II session is complete. Leave a review!', 0, DATE_SUB(NOW(), INTERVAL 6 DAY));

-- Daniel (tutor)
INSERT INTO `notifications` (user_id, title, body, is_read, date_sent)
VALUES (@daniel_uid, 'New Booking Request', 'Ana Reyes has requested an Algorithms session.', 0, NOW());
INSERT INTO `notifications` (user_id, title, body, is_read, date_sent)
VALUES (@daniel_uid, 'New Booking Request', 'Juan Dela Cruz has requested an Operating Systems session.', 0, NOW());
INSERT INTO `notifications` (user_id, title, body, is_read, date_sent)
VALUES (@daniel_uid, 'Feedback Received', 'You received a 5-star review!', 1, DATE_SUB(NOW(), INTERVAL 3 DAY));

-- Elena (tutor)
INSERT INTO `notifications` (user_id, title, body, is_read, date_sent)
VALUES (@elena_uid, 'Feedback Received', 'Carlos Garcia left you a review.', 0, DATE_SUB(NOW(), INTERVAL 4 DAY));
INSERT INTO `notifications` (user_id, title, body, is_read, date_sent)
VALUES (@elena_uid, 'New Booking Request', 'Carlos Garcia has requested a Linear Algebra session.', 1, DATE_SUB(NOW(), INTERVAL 1 DAY));

-- ============================================================
-- 6. MORE FEEDBACKS
-- ============================================================
-- Carlos reviewed Elena
INSERT INTO `feedbacks` (booking_id, reviewer_id, reviewee_id, rating, comments, created_at)
VALUES (@carlos_completed, @carlos_uid, @elena_uid, 5, 'Elena is amazing! She made graph theory so easy to understand.', DATE_SUB(NOW(), INTERVAL 4 DAY));
-- Elena reviewed Carlos
INSERT INTO `feedbacks` (booking_id, reviewer_id, reviewee_id, rating, comments, created_at)
VALUES (@carlos_completed, @elena_uid, @carlos_uid, 5, 'Carlos is a dedicated student. Always comes prepared.', DATE_SUB(NOW(), INTERVAL 3 DAY));

-- Bea reviewed Maria
INSERT INTO `feedbacks` (booking_id, reviewer_id, reviewee_id, rating, comments, created_at)
VALUES (@bea_completed, @bea_uid, @maria_uid, 4, 'Good session, but could use more practice problems.', DATE_SUB(NOW(), INTERVAL 6 DAY));
-- Maria reviewed Bea
INSERT INTO `feedbacks` (booking_id, reviewer_id, reviewee_id, rating, comments, created_at)
VALUES (@bea_completed, @maria_uid, @bea_uid, 5, 'Bea is very attentive and asks great questions!', DATE_SUB(NOW(), INTERVAL 5 DAY));

-- ============================================================
-- 7. CONVERSATIONS & MESSAGES
-- ============================================================
-- Conversation: Juan <-> Maria
INSERT INTO `conversations` (user1_id, user2_id, created_at, updated_at)
VALUES (LEAST(@juan_uid, @maria_uid), GREATEST(@juan_uid, @maria_uid), DATE_SUB(NOW(), INTERVAL 3 DAY), NOW());
SET @conv1 = LAST_INSERT_ID();

INSERT INTO `messages` (conversation_id, sender_id, content, is_read, created_at, message_type)
VALUES (@conv1, @juan_uid, 'Hi Maria! Can you help me with Calculus derivatives?', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), 'TEXT');
INSERT INTO `messages` (conversation_id, sender_id, content, is_read, created_at, message_type)
VALUES (@conv1, @maria_uid, 'Of course Juan! I''d be happy to help. When are you available?', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), 'TEXT');
INSERT INTO `messages` (conversation_id, sender_id, content, is_read, created_at, message_type)
VALUES (@conv1, @juan_uid, 'I''m free tomorrow afternoon. Would 2pm work?', 1, DATE_SUB(NOW(), INTERVAL 2 DAY), 'TEXT');
INSERT INTO `messages` (conversation_id, sender_id, content, is_read, created_at, message_type)
VALUES (@conv1, @maria_uid, 'Perfect! I''ll see you then. Make sure to bring your notes from class.', 1, DATE_SUB(NOW(), INTERVAL 2 DAY), 'TEXT');
SET @last_msg1 = LAST_INSERT_ID();
INSERT INTO `messages` (conversation_id, sender_id, content, is_read, created_at, message_type)
VALUES (@conv1, @juan_uid, 'Thanks so much! See you tomorrow :)', 0, DATE_SUB(NOW(), INTERVAL 1 DAY), 'TEXT');
SET @last_msg1 = LAST_INSERT_ID();
UPDATE `conversations` SET last_message_id = @last_msg1 WHERE id = @conv1;

-- Conversation: Ana <-> Daniel
INSERT INTO `conversations` (user1_id, user2_id, created_at, updated_at)
VALUES (LEAST(@ana_uid, @daniel_uid), GREATEST(@ana_uid, @daniel_uid), DATE_SUB(NOW(), INTERVAL 2 DAY), NOW());
SET @conv2 = LAST_INSERT_ID();

INSERT INTO `messages` (conversation_id, sender_id, content, is_read, created_at, message_type)
VALUES (@conv2, @ana_uid, 'Hello Daniel! I booked a Data Structures session with you.', 1, DATE_SUB(NOW(), INTERVAL 2 DAY), 'TEXT');
INSERT INTO `messages` (conversation_id, sender_id, content, is_read, created_at, message_type)
VALUES (@conv2, @daniel_uid, 'Hey Ana! Yes, I saw the booking. Looking forward to it!', 1, DATE_SUB(NOW(), INTERVAL 2 DAY), 'TEXT');
INSERT INTO `messages` (conversation_id, sender_id, content, is_read, created_at, message_type)
VALUES (@conv2, @ana_uid, 'Can we focus on AVL trees? That''s where I''m struggling.', 0, DATE_SUB(NOW(), INTERVAL 1 DAY), 'TEXT');
SET @last_msg2 = LAST_INSERT_ID();
UPDATE `conversations` SET last_message_id = @last_msg2 WHERE id = @conv2;

-- Conversation: Carlos <-> Elena
INSERT INTO `conversations` (user1_id, user2_id, created_at, updated_at)
VALUES (LEAST(@carlos_uid, @elena_uid), GREATEST(@carlos_uid, @elena_uid), DATE_SUB(NOW(), INTERVAL 5 DAY), NOW());
SET @conv3 = LAST_INSERT_ID();

INSERT INTO `messages` (conversation_id, sender_id, content, is_read, created_at, message_type)
VALUES (@conv3, @carlos_uid, 'Hi Elena! Thank you for the session yesterday. It was really helpful.', 1, DATE_SUB(NOW(), INTERVAL 4 DAY), 'TEXT');
INSERT INTO `messages` (conversation_id, sender_id, content, is_read, created_at, message_type)
VALUES (@conv3, @elena_uid, 'Glad to hear that Carlos! You did great on those graph problems.', 1, DATE_SUB(NOW(), INTERVAL 4 DAY), 'TEXT');
INSERT INTO `messages` (conversation_id, sender_id, content, is_read, created_at, message_type)
VALUES (@conv3, @carlos_uid, 'I already booked another session for Linear Algebra. Hope that works!', 1, DATE_SUB(NOW(), INTERVAL 1 DAY), 'TEXT');
INSERT INTO `messages` (conversation_id, sender_id, content, is_read, created_at, message_type)
VALUES (@conv3, @elena_uid, 'I confirmed it. See you soon!', 0, NOW(), 'TEXT');
SET @last_msg3 = LAST_INSERT_ID();
UPDATE `conversations` SET last_message_id = @last_msg3 WHERE id = @conv3;

-- ============================================================
-- 8. TUTOR APPLICATIONS (pending & approved)
-- ============================================================
INSERT INTO `tutor_applications` (name, student_id, course_program, email, phone_number, password, experience, time_available_start, time_available_end, report_of_grades_path, status, created_at)
VALUES ('Rico Mendoza', 'K66666666', 'BS Computer Science', 'rmendoza@umak.edu.ph', '09170006666',
  '$2b$10$pG9kmSQcNjKZFfZjCYvvwOwiwVQRlVUQ/3rvrLZs6VQ/x.J6inXV6',
  'Tutored classmates in programming for 2 years. Strong in Java, Python, and C++.',
  '09:00:00', '17:00:00', 'uploads/grades/rmendoza_rog.pdf', 'PENDING', DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT INTO `tutor_applications` (name, student_id, course_program, email, phone_number, password, experience, time_available_start, time_available_end, report_of_grades_path, status, created_at)
VALUES ('Sofia Tan', 'K77777777', 'BS Accountancy', 'stan@umak.edu.ph', '09170007777',
  '$2b$10$pG9kmSQcNjKZFfZjCYvvwOwiwVQRlVUQ/3rvrLZs6VQ/x.J6inXV6',
  'Dean''s lister for 3 semesters. Experience tutoring in Financial Accounting and Taxation.',
  '13:00:00', '20:00:00', 'uploads/grades/stan_rog.pdf', 'PENDING', DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO `tutor_applications` (name, student_id, course_program, email, phone_number, password, experience, time_available_start, time_available_end, report_of_grades_path, status, created_at)
VALUES ('Mark Villanueva', 'K88888888', 'BS Electrical Engineering', 'mvillanueva@umak.edu.ph', '09170008888',
  '$2b$10$pG9kmSQcNjKZFfZjCYvvwOwiwVQRlVUQ/3rvrLZs6VQ/x.J6inXV6',
  'Lab assistant for Physics dept. 1 year experience tutoring Circuit Analysis.',
  '08:00:00', '16:00:00', 'uploads/grades/mvillanueva_rog.pdf', 'PENDING', NOW());

-- ============================================================
-- 9. MODULES (for PAMA matching)
-- ============================================================
INSERT INTO `modules` (module_name, description, capacity, current_tutors, is_active, created_at, updated_at)
VALUES ('Calculus I', 'Limits, derivatives, and introduction to integration', 3, 1, 1, NOW(), NOW());
SET @mod_calc = LAST_INSERT_ID();

INSERT INTO `modules` (module_name, description, capacity, current_tutors, is_active, created_at, updated_at)
VALUES ('Data Structures', 'Arrays, linked lists, trees, graphs, and hash tables', 3, 1, 1, NOW(), NOW());
SET @mod_ds = LAST_INSERT_ID();

INSERT INTO `modules` (module_name, description, capacity, current_tutors, is_active, created_at, updated_at)
VALUES ('Linear Algebra', 'Vectors, matrices, eigenvalues, and linear transformations', 2, 1, 1, NOW(), NOW());
SET @mod_la = LAST_INSERT_ID();

INSERT INTO `modules` (module_name, description, capacity, current_tutors, is_active, created_at, updated_at)
VALUES ('Physics 101', 'Mechanics, thermodynamics, and waves', 2, 0, 1, NOW(), NOW());

INSERT INTO `modules` (module_name, description, capacity, current_tutors, is_active, created_at, updated_at)
VALUES ('Web Development', 'HTML, CSS, JavaScript, and React fundamentals', 3, 1, 1, NOW(), NOW());
SET @mod_web = LAST_INSERT_ID();

-- ============================================================
-- 10. PAMA PREFERENCES (tutor module preferences)
-- ============================================================
SET @maria_tid = (SELECT id FROM `tutors` WHERE email = 'testtutor@umak.edu.ph');
SET @daniel_tid = (SELECT id FROM `tutors` WHERE email = 'dcruz@umak.edu.ph');
SET @elena_tid = (SELECT id FROM `tutors` WHERE email = 'eramos@umak.edu.ph');

-- Maria's preferences
INSERT INTO `pama_preferences` (tutor_id, module_id, preference_rank, score) VALUES (@maria_tid, @mod_calc, 1, 0.95);
INSERT INTO `pama_preferences` (tutor_id, module_id, preference_rank, score) VALUES (@maria_tid, @mod_web, 2, 0.85);

-- Daniel's preferences
INSERT INTO `pama_preferences` (tutor_id, module_id, preference_rank, score) VALUES (@daniel_tid, @mod_ds, 1, 0.92);
INSERT INTO `pama_preferences` (tutor_id, module_id, preference_rank, score) VALUES (@daniel_tid, @mod_web, 2, 0.88);

-- Elena's preferences
INSERT INTO `pama_preferences` (tutor_id, module_id, preference_rank, score) VALUES (@elena_tid, @mod_la, 1, 0.97);
INSERT INTO `pama_preferences` (tutor_id, module_id, preference_rank, score) VALUES (@elena_tid, @mod_calc, 2, 0.90);

-- ============================================================
-- 11. PAMA ASSIGNMENTS (confirmed module assignments)
-- ============================================================
INSERT INTO `pama_assignments` (tutor_id, module_id, round_number, matching_score, status, created_at, updated_at)
VALUES (@maria_tid, @mod_calc, 1, 0.95, 'CONFIRMED', NOW(), NOW());
INSERT INTO `pama_assignments` (tutor_id, module_id, round_number, matching_score, status, created_at, updated_at)
VALUES (@daniel_tid, @mod_ds, 1, 0.92, 'CONFIRMED', NOW(), NOW());
INSERT INTO `pama_assignments` (tutor_id, module_id, round_number, matching_score, status, created_at, updated_at)
VALUES (@elena_tid, @mod_la, 1, 0.97, 'CONFIRMED', NOW(), NOW());
INSERT INTO `pama_assignments` (tutor_id, module_id, round_number, matching_score, status, created_at, updated_at)
VALUES (@daniel_tid, @mod_web, 1, 0.88, 'PENDING', NOW(), NOW());
