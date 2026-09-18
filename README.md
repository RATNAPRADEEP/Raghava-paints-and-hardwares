# Raghava Paints & Hardwares

A **local Paint Shop Sales & Inventory Management System** designed to run directly on a personal computer without a database server.

The application keeps business data in simple local text/JSON files. These files can be opened and edited with Windows Notepad, making the project easy to understand, portable, and suitable for a small shop.

## Key features

- Product catalog
- Categories and brands
- Customer records
- Supplier records
- Purchase recording
- Sales recording
- Automatic stock increase/decrease
- Low-stock alerts
- Dashboard summaries
- Sales and purchase history
- Top-selling products
- Local backup/export
- Import/restore
- Human-readable JSON data files

## How storage works

The project does not require MySQL, MongoDB, PHP, XAMPP, or any other database server.

Business records are stored as local JSON text files:

```
data/
├── products.json
├── customers.json
├── suppliers.json
├── sales.json
├── purchases.json
└── stock-movements.json
```

Because JSON is plain text, the files can be opened with **Notepad** or another text editor.

The application uses the browser's local file access capability to read and save these files after the user selects the project data folder.

## Running the application

### Option 1 — Open locally

Use a modern browser such as Microsoft Edge or Google Chrome.

1. Download/clone this repository.
2. Open `index.html`.
3. Click **Connect Local Data Folder**.
4. Select the project's `data` folder.
5. The application loads the shop records from the local files.

The browser will ask for permission before the application can write changes to the selected folder.

### Option 2 — Simple local web server

A local web server may also be used if the browser restricts local-file access. The data remains on the computer in the `data` folder.

## Data files

### products.json

Stores:

- SKU
- Product name
- Brand
- Category
- Unit
- Purchase price
- Selling price
- Current stock
- Reorder level

### customers.json

Stores customer names, phone numbers and addresses.

### suppliers.json

Stores supplier names, phone numbers, email addresses and addresses.

### sales.json

Stores sales invoices and their line items.

### purchases.json

Stores purchase invoices and their line items.

### stock-movements.json

Stores every opening, purchase, sale, or adjustment movement.

## Important business rules

1. A sale cannot reduce stock below zero.
2. A purchase increases stock.
3. A sale decreases stock.
4. Every stock change creates a movement record.
5. Prices are read from the product record when a transaction is created.
6. Invoice totals are calculated by the application.
7. Data is saved locally on the user's computer.
8. The user can back up the complete `data` folder.
9. JSON files remain human-readable and editable.

## Project structure

```
Raghava-paints-and-hardwares/
├── data/
│   ├── products.json
│   ├── customers.json
│   ├── suppliers.json
│   ├── sales.json
│   ├── purchases.json
│   └── stock-movements.json
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── index.html
├── .gitignore
└── README.md
```

## Portfolio description

**Raghava Paints & Hardwares — Local Sales & Inventory Management System**

Built a local-first paint and hardware shop management application that stores inventory, customers, suppliers, sales, purchases, and stock movements as editable JSON text files on a personal computer. Implemented stock validation, transaction calculations, dashboard reporting, local backup/restore, and a browser-based interface without requiring a traditional database server.

## Important note

This project intentionally uses **local files as its data store**. It is designed for a single-computer/single-user workflow rather than concurrent multi-user operation.
