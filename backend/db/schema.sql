-- Schema for TagakTuro `tagakturo` database
-- This schema matches the JPA entities in the backend project.
-- Run with: mysql -u <user> -p < tagakturo_schema.sql

CREATE DATABASE IF NOT EXISTS `tagakturo` DEFAULT CHARACTER SET = 'utf8mb4' DEFAULT COLLATE = 'utf8mb4_general_ci';
USE `tagakturo`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) DEFAULT NULL,
  `studentId` VARCHAR(255) DEFAULT NULL,
  `courseProgram` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phoneNumber` VARCHAR(255) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `students` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `student_id` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `course_program` VARCHAR(255) DEFAULT NULL,
  `phone_number` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_students_student_id` (`student_id`),
  UNIQUE KEY `uk_students_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tutors` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `tutor_id` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone_number` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tutors_tutor_id` (`tutor_id`),
  UNIQUE KEY `uk_tutors_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bookings` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `student_id` BIGINT NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `booking_date_time` DATETIME NOT NULL,
  `status` VARCHAR(255) NOT NULL,
  `modality` VARCHAR(255) DEFAULT NULL,
  `tutor_name` VARCHAR(255) DEFAULT NULL,
  `notes` VARCHAR(255) DEFAULT NULL,
  `duration_minutes` INT DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- End of schema

CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_id` BIGINT NOT NULL,
  `role` VARCHAR(255) NOT NULL,
  KEY `fk_user_roles_user` (`user_id`),
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tutor_applications` (
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
  `report_of_grades_path` VARCHAR(255),
  `certificates_path` VARCHAR(255),
  `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tutor_applications_email` (`email`),
  UNIQUE KEY `uk_tutor_applications_student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;