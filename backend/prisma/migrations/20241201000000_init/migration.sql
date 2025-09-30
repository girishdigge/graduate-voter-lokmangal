-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `aadhar_number` VARCHAR(12) NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `sex` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    `guardian_spouse` VARCHAR(255) NULL,
    `qualification` VARCHAR(255) NULL,
    `occupation` VARCHAR(255) NULL,
    `contact` VARCHAR(15) NOT NULL,
    `email` VARCHAR(255) NULL,
    `date_of_birth` DATE NOT NULL,
    `age` INTEGER NOT NULL,
    `house_number` VARCHAR(50) NOT NULL,
    `street` VARCHAR(255) NOT NULL,
    `area` VARCHAR(255) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `state` VARCHAR(100) NOT NULL,
    `pincode` VARCHAR(10) NOT NULL,
    `is_registered_elector` BOOLEAN NOT NULL DEFAULT false,
    `assembly_number` VARCHAR(10) NULL,
    `assembly_name` VARCHAR(255) NULL,
    `polling_station_number` VARCHAR(10) NULL,
    `elector_dob` DATE NULL,
    `epic_number` VARCHAR(20) NULL,
    `university` VARCHAR(255) NULL,
    `graduation_year` INTEGER NULL,
    `graduation_doc_type` VARCHAR(100) NULL,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `verified_by` VARCHAR(191) NULL,
    `verified_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_aadhar_number_key`(`aadhar_number`),
    INDEX `users_aadhar_number_idx`(`aadhar_number`),
    INDEX `users_contact_idx`(`contact`),
    INDEX `users_assembly_number_idx`(`assembly_number`),
    INDEX `users_polling_station_number_idx`(`polling_station_number`),
    INDEX `users_is_verified_idx`(`is_verified`),
    INDEX `users_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `document_type` ENUM('AADHAR', 'DEGREE_CERTIFICATE', 'PHOTO') NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `s3_key` VARCHAR(500) NOT NULL,
    `s3_bucket` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `documents_user_id_idx`(`user_id`),
    INDEX `documents_document_type_idx`(`document_type`),
    INDEX `documents_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `references` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `reference_name` VARCHAR(255) NOT NULL,
    `reference_contact` VARCHAR(15) NOT NULL,
    `status` ENUM('PENDING', 'CONTACTED', 'APPLIED') NOT NULL DEFAULT 'PENDING',
    `whatsapp_sent` BOOLEAN NOT NULL DEFAULT false,
    `whatsapp_sent_at` DATETIME(3) NULL,
    `status_updated_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `references_user_id_idx`(`user_id`),
    INDEX `references_status_idx`(`status`),
    INDEX `references_reference_contact_idx`(`reference_contact`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'MANAGER') NOT NULL DEFAULT 'MANAGER',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admins_username_key`(`username`),
    UNIQUE INDEX `admins_email_key`(`email`),
    INDEX `admins_role_idx`(`role`),
    INDEX `admins_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `old_values` JSON NULL,
    `new_values` JSON NULL,
    `user_id` VARCHAR(191) NULL,
    `admin_id` VARCHAR(191) NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_entity_type_idx`(`entity_type`),
    INDEX `audit_logs_entity_id_idx`(`entity_id`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_user_id_idx`(`user_id`),
    INDEX `audit_logs_admin_id_idx`(`admin_id`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `references` ADD CONSTRAINT `references_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_verified_by_fkey` FOREIGN KEY (`verified_by`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;