ALTER TABLE `evaluations`
  ADD COLUMN `star_rating` TINYINT NOT NULL DEFAULT 0 AFTER `open_comment`;
