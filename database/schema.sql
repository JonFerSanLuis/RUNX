CREATE DATABASE IF NOT EXISTS running_store
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE running_store;

CREATE TABLE categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  old_price DECIMAL(10,2) NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  rating DECIMAL(2,1) NOT NULL DEFAULT 0.0,
  reviews_count INT UNSIGNED NOT NULL DEFAULT 0,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  bestseller TINYINT(1) NOT NULL DEFAULT 0,
  is_new TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX idx_products_catalog (active, category_id, featured),
  INDEX idx_products_price (price),
  INDEX idx_products_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE product_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_images_product_order (product_id, sort_order)
) ENGINE=InnoDB;

CREATE TABLE product_colors (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  name VARCHAR(60) NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_product_colors_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_product_color (product_id, name)
) ENGINE=InnoDB;

CREATE TABLE product_sizes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  name VARCHAR(30) NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_product_sizes_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_product_size (product_id, name)
) ENGINE=InnoDB;

CREATE TABLE product_features (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  feature_text VARCHAR(255) NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_product_features_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_features_product_order (product_id, sort_order)
) ENGINE=InnoDB;
