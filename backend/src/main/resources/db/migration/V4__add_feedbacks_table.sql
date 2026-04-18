-- Migration to add feedbacks table for the Feedback Feature

CREATE TABLE IF NOT EXISTS `feedbacks` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `booking_id` BIGINT NOT NULL,
  `reviewer_id` BIGINT NOT NULL,
  `reviewee_id` BIGINT NOT NULL,
  `rating` INT NOT NULL,
  `comments` VARCHAR(1000) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_feedbacks_booking_reviewer` (`booking_id`, `reviewer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
