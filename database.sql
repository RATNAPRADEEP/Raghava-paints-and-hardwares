CREATE DATABASE IF NOT EXISTS raghava_paints
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE raghava_paints;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS purchase_items;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS categories;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE suppliers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(150),
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE customers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE products (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(180) NOT NULL,
    brand VARCHAR(100),
    category_id INT UNSIGNED,
    unit VARCHAR(30) NOT NULL DEFAULT 'piece',
    purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock DECIMAL(12,2) NOT NULL DEFAULT 0,
    reorder_level DECIMAL(12,2) NOT NULL DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_product_stock CHECK (stock >= 0),
    CONSTRAINT chk_product_prices CHECK (purchase_price >= 0 AND selling_price >= 0)
) ENGINE=InnoDB;

CREATE TABLE purchases (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT UNSIGNED,
    invoice_no VARCHAR(60),
    total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
    purchased_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_purchase_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE purchase_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    purchase_id BIGINT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(14,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    CONSTRAINT fk_purchase_item_purchase
        FOREIGN KEY (purchase_id) REFERENCES purchases(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_purchase_item_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE sales (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id INT UNSIGNED,
    invoice_no VARCHAR(60),
    total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
    sold_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sale_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE sale_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sale_id BIGINT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    CONSTRAINT fk_sale_item_sale
        FOREIGN KEY (sale_id) REFERENCES sales(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_sale_item_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE stock_movements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id INT UNSIGNED NOT NULL,
    movement_type ENUM('OPENING','PURCHASE','SALE','ADJUSTMENT') NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    reference_id BIGINT UNSIGNED NULL,
    note VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_stock_product_date (product_id, created_at),
    CONSTRAINT fk_stock_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO categories (name) VALUES
('Interior Paint'),
('Exterior Paint'),
('Primers'),
('Putty & Wall Care'),
('Hardware'),
('Tools'),
('Adhesives');

INSERT INTO suppliers (name, phone, address) VALUES
('Asian Paints Distributor', '9876543210', 'Vijayawada'),
('Berger Paints Distributor', '9876543211', 'Vijayawada'),
('Local Hardware Wholesale', '9876543212', 'Guntur');

INSERT INTO customers (name, phone, address) VALUES
('Walk-in Customer', '9000000000', 'Local'),
('Sri Lakshmi Constructions', '9000000001', 'Vijayawada'),
('Ravi Home Solutions', '9000000002', 'Guntur');

INSERT INTO products
(sku, name, brand, category_id, unit, purchase_price, selling_price, stock, reorder_level)
VALUES
('AP-ROY-001', 'Royale Luxury Emulsion 20L', 'Asian Paints', 1, 'bucket', 5200, 6100, 8, 3),
('AP-APEX-001', 'Apex Ultima 20L', 'Asian Paints', 2, 'bucket', 6800, 7900, 5, 2),
('BG-PRM-001', 'Wall Primer 20L', 'Berger', 3, 'bucket', 2600, 3200, 12, 4),
('PUT-020', 'Wall Putty 20kg', 'Birla White', 4, 'bag', 650, 820, 25, 8),
('BRU-004', 'Paint Brush 4 inch', 'Generic', 6, 'piece', 90, 140, 35, 10),
('ROL-009', 'Paint Roller 9 inch', 'Generic', 6, 'piece', 120, 190, 18, 5),
('FEV-001', 'Fevicol SH 1kg', 'Pidilite', 7, 'piece', 220, 290, 20, 6),
('SWI-016', 'Switch 16A', 'Anchor', 5, 'piece', 75, 110, 40, 10);

INSERT INTO stock_movements (product_id, movement_type, quantity, note)
SELECT id, 'OPENING', stock, 'Opening stock'
FROM products;

INSERT INTO purchases (supplier_id, invoice_no, total_amount, purchased_at)
VALUES (1, 'PUR-1001', 10400, DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost)
VALUES
(1, 1, 2, 5200);

INSERT INTO sales (customer_id, invoice_no, total_amount, sold_at)
VALUES (1, 'SAL-1001', 810, DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
VALUES
(1, 1, 0.1, 6100),
(1, 5, 1, 200);

INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id, note)
VALUES
(1, 'PURCHASE', 2, 1, 'Seed purchase'),
(1, 'SALE', -0.1, 1, 'Seed sale'),
(5, 'SALE', -1, 1, 'Seed sale');

UPDATE products SET stock = stock + 2 WHERE id = 1;
UPDATE products SET stock = stock - 0.1 WHERE id = 1;
UPDATE products SET stock = stock - 1 WHERE id = 5;
