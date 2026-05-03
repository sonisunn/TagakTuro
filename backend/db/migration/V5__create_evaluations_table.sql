-- V5: Structured evaluation forms tied to completed sessions.
-- Two evaluation types: TUTOR_EVALUATES_STUDENT and STUDENT_EVALUATES_TUTOR.
-- One evaluation per booking per type (enforced by unique key).

CREATE TABLE IF NOT EXISTS `evaluations` (
  `id`              BIGINT       NOT NULL AUTO_INCREMENT,
  `booking_id`      BIGINT       NOT NULL,
  `evaluator_id`    BIGINT       NOT NULL,
  `evaluatee_id`    BIGINT       NOT NULL,
  `evaluation_type` VARCHAR(50)  NOT NULL,
  `q1_answer`       CHAR(1)      NOT NULL,
  `q2_answer`       CHAR(1)      NOT NULL,
  `q3_answer`       CHAR(1)      DEFAULT NULL,
  `open_comment`    TEXT         DEFAULT NULL,
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_evaluation_booking_type` (`booking_id`, `evaluation_type`),
  CONSTRAINT `fk_evaluation_booking`   FOREIGN KEY (`booking_id`)   REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_evaluation_evaluator` FOREIGN KEY (`evaluator_id`) REFERENCES `users`    (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_evaluation_evaluatee` FOREIGN KEY (`evaluatee_id`) REFERENCES `users`    (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
