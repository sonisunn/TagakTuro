-- V1: Consolidated Baseline Schema for TagakTuro
-- This combines all structures from previous V1-V15 migrations into a clean, unified start.

SET FOREIGN_KEY_CHECKS=0;

-- 1. USERS
CREATE TABLE `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) DEFAULT NULL,
  `student_id` VARCHAR(255) NOT NULL,
  `course_program` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone_number` VARCHAR(255) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `profile_picture_url` LONGTEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. USER ROLES (ElementCollection)
CREATE TABLE `user_roles` (
  `user_id` BIGINT NOT NULL,
  `role` VARCHAR(255) NOT NULL,
  KEY `fk_user_roles_user` (`user_id`),
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. STUDENTS
CREATE TABLE `students` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `student_id` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `course_program` VARCHAR(255) DEFAULT NULL,
  `phone_number` VARCHAR(255) DEFAULT NULL,
  `user_id` BIGINT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_students_student_id` (`student_id`),
  UNIQUE KEY `uk_students_email` (`email`),
  UNIQUE KEY `uk_students_user_id` (`user_id`),
  CONSTRAINT `fk_students_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. TUTORS
CREATE TABLE `tutors` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `tutor_id` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone_number` VARCHAR(255) DEFAULT NULL,
  `course_program` VARCHAR(255) DEFAULT NULL,
  `sessions_done` INT DEFAULT 0,
  `total_hours` DOUBLE DEFAULT 0.0,
  `rating` DOUBLE DEFAULT 0.0,
  `is_cert_issued` BOOLEAN DEFAULT FALSE,
  `user_id` BIGINT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tutors_tutor_id` (`tutor_id`),
  UNIQUE KEY `uk_tutors_email` (`email`),
  UNIQUE KEY `uk_tutors_user_id` (`user_id`),
  CONSTRAINT `fk_tutors_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. TUTOR AVAILABILITY
CREATE TABLE `tutor_availability` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tutor_id` BIGINT NOT NULL,
  `day_of_week` INT NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_tutor_availability_tutor` FOREIGN KEY (`tutor_id`) REFERENCES `tutors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. BOOKINGS
CREATE TABLE `bookings` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `student_id` BIGINT NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `booking_date_time` DATETIME NOT NULL,
  `status` VARCHAR(255) NOT NULL,
  `modality` VARCHAR(255) DEFAULT NULL,
  `tutor_name` VARCHAR(255) DEFAULT NULL,
  `venue` VARCHAR(255) DEFAULT NULL,
  `notes` VARCHAR(255) DEFAULT NULL,
  `duration_minutes` INT DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_bookings_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. NOTIFICATIONS
CREATE TABLE `notifications` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `body` VARCHAR(255) NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `date_sent` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. FEEDBACKS
CREATE TABLE `feedbacks` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `booking_id` BIGINT NOT NULL,
  `reviewer_id` BIGINT NOT NULL,
  `reviewee_id` BIGINT NOT NULL,
  `rating` INT NOT NULL,
  `comments` VARCHAR(1000) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_feedbacks_booking_reviewer` (`booking_id`, `reviewer_id`),
  CONSTRAINT `fk_feedbacks_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_feedbacks_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_feedbacks_reviewee` FOREIGN KEY (`reviewee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. EVALUATIONS
CREATE TABLE `evaluations` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `booking_id` BIGINT NOT NULL,
  `evaluator_id` BIGINT NOT NULL,
  `evaluatee_id` BIGINT NOT NULL,
  `evaluation_type` VARCHAR(50)  NOT NULL,
  `q1_answer` VARCHAR(1) NOT NULL,
  `q2_answer` VARCHAR(1) NOT NULL,
  `q3_answer` VARCHAR(1) DEFAULT NULL,
  `open_comment` TEXT DEFAULT NULL,
  `star_rating` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_evaluation_booking_type` (`booking_id`, `evaluation_type`),
  CONSTRAINT `fk_evaluation_booking`   FOREIGN KEY (`booking_id`)   REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_evaluation_evaluator` FOREIGN KEY (`evaluator_id`) REFERENCES `users`    (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_evaluation_evaluatee` FOREIGN KEY (`evaluatee_id`) REFERENCES `users`    (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. CONVERSATIONS
CREATE TABLE `conversations` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user1_id` BIGINT NOT NULL,
  `user2_id` BIGINT NOT NULL,
  `last_message_id` BIGINT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conversations_user_pair` (`user1_id`, `user2_id`),
  CONSTRAINT `fk_conversations_user1` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conversations_user2` FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. MESSAGES
CREATE TABLE `messages` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `conversation_id` BIGINT NOT NULL,
  `sender_id` BIGINT NOT NULL,
  `content` LONGTEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` TIMESTAMP NULL,
  `message_type` VARCHAR(50) NOT NULL DEFAULT 'TEXT',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Link conversations back to messages for 'last_message'
ALTER TABLE `conversations` ADD CONSTRAINT `fk_conversations_last_message`
  FOREIGN KEY (`last_message_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL;

-- 12. MODULES (PAMA)
CREATE TABLE `modules` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `module_name` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `capacity` INT DEFAULT NULL,
  `current_tutors` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_modules_name` (`module_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. PAMA PREFERENCES
CREATE TABLE `pama_preferences` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tutor_id` BIGINT NOT NULL,
  `module_id` BIGINT NOT NULL,
  `preference_rank` INT DEFAULT NULL,
  `score` DOUBLE DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_pama_pref_tutor` FOREIGN KEY (`tutor_id`) REFERENCES `tutors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pama_pref_module` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. PAMA ASSIGNMENTS
CREATE TABLE `pama_assignments` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `tutor_id` BIGINT NOT NULL,
  `module_id` BIGINT NOT NULL,
  `status` VARCHAR(50) DEFAULT 'PENDING',
  `round_number` INT DEFAULT NULL,
  `matching_score` DOUBLE DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_pama_assign_tutor` FOREIGN KEY (`tutor_id`) REFERENCES `tutors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pama_assign_module` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. TUTOR APPLICATIONS (Self-contained registration table)
CREATE TABLE `tutor_applications` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `student_id` VARCHAR(255) NOT NULL,
  `course_program` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone_number` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `experience` TEXT,
  `time_available_start` TIME NOT NULL,
  `time_available_end` TIME NOT NULL,
  `report_of_grades_path` VARCHAR(255) NOT NULL,
  `certificates_path` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tutor_app_email` (`email`),
  UNIQUE KEY `uk_tutor_app_student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS=1;
