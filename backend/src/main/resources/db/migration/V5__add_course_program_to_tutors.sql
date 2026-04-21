-- Migration to add course_program column to tutors table
ALTER TABLE `tutors` ADD COLUMN `course_program` VARCHAR(255) DEFAULT NULL;
