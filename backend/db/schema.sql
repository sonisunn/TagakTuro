-- Schema for TagakTuro `tagakturo` database
-- This schema matches the JPA `User` entity in the backend project.
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

-- End of schema
