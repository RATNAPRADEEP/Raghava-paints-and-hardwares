# Raghava Paints & Hardwares

A practical **Paint Shop Sales & Inventory Management System** built for a small retail hardware/paint business.

The project is inspired by the workflow of paint-shop sales and inventory systems, but the implementation, schema, UI, and business rules are original.

## What it manages

- Product catalog with SKU, category, brand, unit, selling price, purchase price and stock
- Customers and suppliers
- Purchase transactions that increase stock
- Sales transactions that decrease stock
- Automatic stock validation
- Low-stock and out-of-stock alerts
- Dashboard KPIs
- Sales and purchase summaries
- Top-selling products
- Recent transactions
- AJAX-based operations without full-page refreshes
- Responsive Bootstrap interface
- Chart.js analytics

## Technology

- **Frontend:** HTML5, CSS3, Bootstrap 5, JavaScript
- **AJAX:** Fetch API
- **Backend:** PHP 8+
- **Database:** MySQL 8+
- **Charts:** Chart.js
- **Local server:** XAMPP / Apache

## Architecture

```
Browser
   |
   | AJAX / HTTP
   v
PHP Application
   |
   | PDO + Prepared Statements
   v
MySQL
   |
   +-- products
   +-- categories
   +-- customers
   +-- suppliers
   +-- purchases
   +-- purchase_items
   +-- sales
   +-- sale_items
   +-- stock_movements
```

## Database design

The database separates master data from transaction data:

- `categories` → product classification
- `products` → current product and stock state
- `customers` → customer master data
- `suppliers` → supplier master data
- `purchases` / `purchase_items` → incoming stock
- `sales` / `sale_items` → outgoing stock
- `stock_movements` → auditable stock changes

Sales and purchases are processed inside database transactions so the transaction and stock update succeed or fail together.

## Run locally

### 1. Requirements

Install XAMPP with:

- Apache
- PHP 8+
- MySQL

### 2. Copy project

Place the repository in:

```
C:\xampp\htdocs\Raghava-paints-and-hardwares
```

### 3. Create database

Open phpMyAdmin and import:

```
database.sql
```

The script creates the `raghava_paints` database and sample data.

### 4. Configure connection

Edit:

```
config/config.php
```

Default XAMPP configuration:

```
host = 127.0.0.1
database = raghava_paints
username = root
password = 
```

### 5. Start

Start Apache and MySQL in XAMPP and open:

```
http://localhost/Raghava-paints-and-hardwares/
```

## Core business rules

1. A sale cannot exceed available stock.
2. A purchase increases stock.
3. A sale decreases stock.
4. Every stock change creates a stock-movement record.
5. Sale totals are calculated on the server.
6. Purchase totals are calculated on the server.
7. Database transactions protect inventory consistency.
8. Product SKU is unique.
9. Product quantity cannot become negative.

## Example workflow

### Purchase

Supplier → Product → Quantity → Purchase price → Save

Result:

```
Stock = Previous Stock + Purchased Quantity
```

### Sale

Customer → Product → Quantity → Selling price → Save

Result:

```
Stock = Previous Stock - Sold Quantity
```

### Dashboard

The dashboard derives:

- Total products
- Total stock units
- Inventory value
- Today's sales
- Total sales
- Low-stock products
- Top-selling products
- Recent sales

## Project structure

```
Raghava-paints-and-hardwares/
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── config/
│   └── config.php
├── api.php
├── database.sql
├── index.php
├── .gitignore
└── README.md
```

## Future extensions

- Authentication and role-based access
- GST invoice generation
- PDF invoice export
- Barcode scanning
- Supplier payment tracking
- Customer credit/dues
- Excel/CSV reports
- Monthly profit analysis
- WhatsApp invoice sharing
- Multi-user audit logs

## Portfolio description

**Raghava Paints & Hardwares — Sales & Inventory Management System**

Developed a PHP/MySQL business management application for a paint and hardware retail workflow. Implemented normalized relational data modeling, transactional purchase/sales processing, stock validation, AJAX operations, inventory movement tracking, dashboard analytics, and Chart.js visualizations.

## Learning outcomes

This project demonstrates:

- Relational database design
- Primary/foreign-key relationships
- SQL joins and aggregation
- CRUD operations
- Transactions
- Prepared statements
- REST-style AJAX endpoints
- Inventory business logic
- Data visualization
- Responsive web UI

