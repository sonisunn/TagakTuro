-- Migration to add extra columns to tutors table
ALTER TABLE `tutors` 
ADD COLUMN `sessions_done` INT DEFAULT 0,
ADD COLUMN `total_hours` DOUBLE DEFAULT 0.0,
ADD COLUMN `rating` DOUBLE DEFAULT 0.0;
