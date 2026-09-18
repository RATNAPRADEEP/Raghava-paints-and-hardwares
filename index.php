<?php
declare(strict_types=1);
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Raghava Paints & Hardwares</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
<nav class="navbar navbar-dark app-navbar sticky-top">
    <div class="container-fluid px-4">
        <span class="navbar-brand fw-bold">
            <i class="bi bi-palette2 me-2"></i>Raghava Paints & Hardwares
        </span>
        <span class="text-white-50 small">Sales & Inventory Management</span>
    </div>
</nav>

<main class="container-fluid px-4 py-4">
    <div id="alertBox"></div>

    <section class="hero-panel mb-4">
        <div>
            <div class="eyebrow">BUSINESS OPERATIONS</div>
            <h1 class="display-6 fw-bold mb-2">Paint Shop Control Center</h1>
            <p class="mb-0 text-secondary">
                Track stock, sales, purchases, customers and suppliers from one dashboard.
            </p>
        </div>
        <div class="hero-icon"><i class="bi bi-boxes"></i></div>
    </section>

    <section class="row g-3 mb-4" id="stats">
        <div class="col-6 col-xl-2"><div class="stat-card"><span>Products</span><strong id="statProducts">0</strong></div></div>
        <div class="col-6 col-xl-2"><div class="stat-card"><span>Stock Units</span><strong id="statStock">0</strong></div></div>
        <div class="col-6 col-xl-2"><div class="stat-card"><span>Inventory Value</span><strong id="statInventory">₹0</strong></div></div>
        <div class="col-6 col-xl-2"><div class="stat-card"><span>Today's Sales</span><strong id="statTodaySales">₹0</strong></div></div>
        <div class="col-6 col-xl-2"><div class="stat-card"><span>Total Sales</span><strong id="statTotalSales">₹0</strong></div></div>
        <div class="col-6 col-xl-2"><div class="stat-card warning"><span>Low Stock</span><strong id="statLowStock">0</strong></div></div>
    </section>

    <ul class="nav nav-pills app-tabs mb-4" id="appTabs">
        <li class="nav-item"><button class="nav-link active" data-section="dashboard">Dashboard</button></li>
        <li class="nav-item"><button class="nav-link" data-section="products">Products</button></li>
        <li class="nav-item"><button class="nav-link" data-section="sales">Sales</button></li>
        <li class="nav-item"><button class="nav-link" data-section="purchases">Purchases</button></li>
        <li class="nav-item"><button class="nav-link" data-section="masters">Customers & Suppliers</button></li>
    </ul>

    <section id="section-dashboard" class="app-section">
        <div class="row g-4">
            <div class="col-lg-7">
                <div class="content-card">
                    <div class="card-heading">
                        <div><h5>Sales Overview</h5><span>Top-selling products by quantity</span></div>
                    </div>
                    <canvas id="salesChart" height="120"></canvas>
                </div>
            </div>
            <div class="col-lg-5">
                <div class="content-card">
                    <div class="card-heading"><div><h5>Low Stock Alerts</h5><span>Products at or below reorder level</span></div></div>
                    <div id="lowStockTable"></div>
                </div>
            </div>
            <div class="col-lg-7">
                <div class="content-card">
                    <div class="card-heading"><div><h5>Recent Sales</h5><span>Latest recorded transactions</span></div></div>
                    <div class="table-responsive"><table class="table align-middle" id="recentSalesTable"></table></div>
                </div>
            </div>
            <div class="col-lg-5">
                <div class="content-card">
                    <div class="card-heading"><div><h5>System Notes</h5><span>Inventory rules</span></div></div>
                    <ul class="notes-list">
                        <li>Sales are rejected when stock is insufficient.</li>
                        <li>Purchases automatically increase stock.</li>
                        <li>Every stock change is recorded in a movement ledger.</li>
                        <li>Server-side totals prevent client-side price manipulation.</li>
                        <li>Transactions keep sale/purchase and stock updates consistent.</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <section id="section-products" class="app-section d-none">
        <div class="content-card">
            <div class="card-heading">
                <div><h5>Product Catalog</h5><span>Paint, hardware, tools and accessories</span></div>
                <button class="btn btn-dark" data-bs-toggle="modal" data-bs-target="#productModal"><i class="bi bi-plus-lg me-1"></i>Add Product</button>
            </div>
            <div class="table-responsive"><table class="table align-middle" id="productsTable"></table></div>
        </div>
    </section>

    <section id="section-sales" class="app-section d-none">
        <div class="row g-4">
            <div class="col-lg-7">
                <div class="content-card">
                    <div class="card-heading"><div><h5>Record Sale</h5><span>Stock is validated before posting</span></div></div>
                    <form id="saleForm">
                        <div class="mb-3"><label class="form-label">Customer</label><select class="form-select" id="saleCustomer"></select></div>
                        <div class="row g-2 align-items-end">
                            <div class="col-md-6"><label class="form-label">Product</label><select class="form-select" id="saleProduct"></select></div>
                            <div class="col-md-4"><label class="form-label">Quantity</label><input type="number" min="0.01" step="0.01" class="form-control" id="saleQty" required></div>
                            <div class="col-md-2"><button class="btn btn-primary w-100" type="submit">Sell</button></div>
                        </div>
                    </form>
                </div>
            </div>
            <div class="col-lg-5"><div class="content-card h-100"><h5>How sales work</h5><p class="text-secondary">The server reads the current product price and stock under a database lock, calculates the total, records the sale, decreases stock and creates a stock-movement entry.</p></div></div>
        </div>
        <div class="content-card mt-4"><div class="card-heading"><div><h5>Sales History</h5></div></div><div class="table-responsive"><table class="table" id="salesTable"></table></div></div>
    </section>

    <section id="section-purchases" class="app-section d-none">
        <div class="row g-4">
            <div class="col-lg-7">
                <div class="content-card">
                    <div class="card-heading"><div><h5>Record Purchase</h5><span>Incoming stock from supplier</span></div></div>
                    <form id="purchaseForm">
                        <div class="mb-3"><label class="form-label">Supplier</label><select class="form-select" id="purchaseSupplier"></select></div>
                        <div class="row g-2 align-items-end">
                            <div class="col-md-5"><label class="form-label">Product</label><select class="form-select" id="purchaseProduct"></select></div>
                            <div class="col-md-3"><label class="form-label">Quantity</label><input type="number" min="0.01" step="0.01" class="form-control" id="purchaseQty" required></div>
                            <div class="col-md-3"><label class="form-label">Unit Cost</label><input type="number" min="0" step="0.01" class="form-control" id="purchaseCost" required></div>
                            <div class="col-md-1"><button class="btn btn-primary w-100" type="submit">+</button></div>
                        </div>
                    </form>
                </div>
            </div>
            <div class="col-lg-5"><div class="content-card h-100"><h5>Purchase flow</h5><p class="text-secondary">A purchase creates a transaction, adds the received quantity to stock, updates the latest purchase cost and records the movement in the stock ledger.</p></div></div>
        </div>
        <div class="content-card mt-4"><div class="card-heading"><div><h5>Purchase History</h5></div></div><div class="table-responsive"><table class="table" id="purchasesTable"></table></div></div>
    </section>

    <section id="section-masters" class="app-section d-none">
        <div class="row g-4">
            <div class="col-lg-6">
                <div class="content-card">
                    <div class="card-heading"><div><h5>Customers</h5></div><button class="btn btn-outline-dark btn-sm" data-bs-toggle="modal" data-bs-target="#customerModal">Add</button></div>
                    <div class="table-responsive"><table class="table" id="customersTable"></table></div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="content-card">
                    <div class="card-heading"><div><h5>Suppliers</h5></div><button class="btn btn-outline-dark btn-sm" data-bs-toggle="modal" data-bs-target="#supplierModal">Add</button></div>
                    <div class="table-responsive"><table class="table" id="suppliersTable"></table></div>
                </div>
            </div>
        </div>
    </section>
</main>

<div class="modal fade" id="productModal" tabindex="-1">
<div class="modal-dialog modal-lg"><div class="modal-content">
<div class="modal-header"><h5 class="modal-title">Add Product</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
<form id="productForm"><div class="modal-body">
<div class="row g-3">
<div class="col-md-4"><label class="form-label">SKU</label><input name="sku" class="form-control" required></div>
<div class="col-md-8"><label class="form-label">Product Name</label><input name="name" class="form-control" required></div>
<div class="col-md-4"><label class="form-label">Brand</label><input name="brand" class="form-control"></div>
<div class="col-md-4"><label class="form-label">Category</label><select name="category_id" id="productCategory" class="form-select" required></select></div>
<div class="col-md-4"><label class="form-label">Unit</label><select name="unit" class="form-select"><option>piece</option><option>bucket</option><option>bag</option><option>box</option><option>litre</option><option>kg</option></select></div>
<div class="col-md-3"><label class="form-label">Purchase Price</label><input name="purchase_price" type="number" step="0.01" min="0" class="form-control" required></div>
<div class="col-md-3"><label class="form-label">Selling Price</label><input name="selling_price" type="number" step="0.01" min="0" class="form-control" required></div>
<div class="col-md-3"><label class="form-label">Opening Stock</label><input name="stock" type="number" step="0.01" min="0" class="form-control" required></div>
<div class="col-md-3"><label class="form-label">Reorder Level</label><input name="reorder_level" type="number" step="0.01" min="0" value="5" class="form-control" required></div>
</div></div>
<div class="modal-footer"><button type="submit" class="btn btn-dark">Save Product</button></div></form>
</div></div></div>

<div class="modal fade" id="customerModal" tabindex="-1">
<div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h5>Add Customer</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
<form id="customerForm"><div class="modal-body"><input name="name" class="form-control mb-3" placeholder="Customer name" required><input name="phone" class="form-control mb-3" placeholder="Phone"><input name="address" class="form-control" placeholder="Address"></div><div class="modal-footer"><button class="btn btn-dark">Save</button></div></form>
</div></div></div>

<div class="modal fade" id="supplierModal" tabindex="-1">
<div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h5>Add Supplier</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
<form id="supplierForm"><div class="modal-body"><input name="name" class="form-control mb-3" placeholder="Supplier name" required><input name="phone" class="form-control mb-3" placeholder="Phone"><input name="email" type="email" class="form-control mb-3" placeholder="Email"><input name="address" class="form-control" placeholder="Address"></div><div class="modal-footer"><button class="btn btn-dark">Save</button></div></form>
</div></div></div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
<script src="assets/js/app.js"></script>
</body>
</html>
