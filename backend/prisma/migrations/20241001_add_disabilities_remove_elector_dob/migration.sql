-- Add disabilities column and remove elector_dob column
ALTER TABLE `users` ADD COLUMN `disabilities` TEXT NULL;
ALTER TABLE `users` DROP COLUMN `elector_dob`;