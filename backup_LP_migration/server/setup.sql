-- E-Mais CMS - MySQL Schema
-- Run this file to create the database and table

CREATE DATABASE IF NOT EXISTS emais_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE emais_cms;

CREATE TABLE IF NOT EXISTS site_content (
  id INT PRIMARY KEY DEFAULT 1,
  events JSON NOT NULL,
  packages JSON NOT NULL,
  testimonials JSON NOT NULL,
  hero_images JSON NOT NULL,
  categories JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default empty row (will be populated on first admin save)
INSERT IGNORE INTO site_content (id, events, packages, testimonials, hero_images, categories)
VALUES (1, '[]', '[]', '[]', '{}', '[]');

-- Admin users table (passwords stored as bcrypt hashes)
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'master') NOT NULL DEFAULT 'admin'
);
