<?php
declare(strict_types=1);

require __DIR__ . '/config/config.php';

$action = $_GET['action'] ?? '';

try {
    $pdo = db();

    switch ($action) {
        case 'dashboard':
            $stats = [
                'products' => (int)$pdo->query("SELECT COUNT(*) FROM products")->fetchColumn(),
                'stock_units' => (float)$pdo->query("SELECT COALESCE(SUM(stock),0) FROM products")->fetchColumn(),
                'inventory_value' => (float)$pdo->query("SELECT COALESCE(SUM(stock * purchase_price),0) FROM products")->fetchColumn(),
                'today_sales' => (float)$pdo->query("SELECT COALESCE(SUM(total_amount),0) FROM sales WHERE DATE(sold_at)=CURDATE()")->fetchColumn(),
                'total_sales' => (float)$pdo->query("SELECT COALESCE(SUM(total_amount),0) FROM sales")->fetchColumn(),
                'low_stock' => (int)$pdo->query("SELECT COUNT(*) FROM products WHERE stock <= reorder_level")->fetchColumn(),
            ];

            $lowStock = $pdo->query(
                "SELECT p.id, p.sku, p.name, p.brand, p.stock, p.unit, p.reorder_level
                 FROM products p
                 WHERE p.stock <= p.reorder_level
                 ORDER BY p.stock ASC
                 LIMIT 8"
            )->fetchAll();

            $topProducts = $pdo->query(
                "SELECT p.name, p.brand, SUM(si.quantity) AS quantity_sold
                 FROM sale_items si
                 JOIN products p ON p.id = si.product_id
                 GROUP BY si.product_id
                 ORDER BY quantity_sold DESC
                 LIMIT 7"
            )->fetchAll();

            $recentSales = $pdo->query(
                "SELECT s.id, s.invoice_no, s.total_amount, s.sold_at,
                        COALESCE(c.name, 'Walk-in Customer') AS customer
                 FROM sales s
                 LEFT JOIN customers c ON c.id = s.customer_id
                 ORDER BY s.sold_at DESC
                 LIMIT 8"
            )->fetchAll();

            jsonResponse(true, [
                'stats' => $stats,
                'low_stock' => $lowStock,
                'top_products' => $topProducts,
                'recent_sales' => $recentSales,
            ]);

        case 'products':
            $rows = $pdo->query(
                "SELECT p.*, c.name AS category_name
                 FROM products p
                 LEFT JOIN categories c ON c.id = p.category_id
                 ORDER BY p.name"
            )->fetchAll();
            jsonResponse(true, $rows);

        case 'customers':
            jsonResponse(true, $pdo->query("SELECT * FROM customers ORDER BY name")->fetchAll());

        case 'suppliers':
            jsonResponse(true, $pdo->query("SELECT * FROM suppliers ORDER BY name")->fetchAll());

        case 'categories':
            jsonResponse(true, $pdo->query("SELECT * FROM categories ORDER BY name")->fetchAll());

        case 'sales':
            $rows = $pdo->query(
                "SELECT s.id, s.invoice_no, s.total_amount, s.sold_at,
                        COALESCE(c.name, 'Walk-in Customer') AS customer
                 FROM sales s
                 LEFT JOIN customers c ON c.id = s.customer_id
                 ORDER BY s.sold_at DESC
                 LIMIT 100"
            )->fetchAll();
            jsonResponse(true, $rows);

        case 'purchases':
            $rows = $pdo->query(
                "SELECT p.id, p.invoice_no, p.total_amount, p.purchased_at,
                        COALESCE(s.name, 'Unknown Supplier') AS supplier
                 FROM purchases p
                 LEFT JOIN suppliers s ON s.id = p.supplier_id
                 ORDER BY p.purchased_at DESC
                 LIMIT 100"
            )->fetchAll();
            jsonResponse(true, $rows);

        case 'create_product':
            $data = requestJson();

            $required = ['sku', 'name', 'category_id', 'unit', 'purchase_price', 'selling_price', 'stock', 'reorder_level'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || $data[$field] === '') {
                    jsonResponse(false, null, "Missing field: {$field}");
                }
            }

            $pdo->beginTransaction();

            $stmt = $pdo->prepare(
                "INSERT INTO products
                 (sku, name, brand, category_id, unit, purchase_price, selling_price, stock, reorder_level)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );

            $stmt->execute([
                trim((string)$data['sku']),
                trim((string)$data['name']),
                trim((string)($data['brand'] ?? '')),
                (int)$data['category_id'],
                trim((string)$data['unit']),
                (float)$data['purchase_price'],
                (float)$data['selling_price'],
                (float)$data['stock'],
                (float)$data['reorder_level'],
            ]);

            $productId = (int)$pdo->lastInsertId();

            if ((float)$data['stock'] > 0) {
                $movement = $pdo->prepare(
                    "INSERT INTO stock_movements
                     (product_id, movement_type, quantity, note)
                     VALUES (?, 'OPENING', ?, 'Opening stock')"
                );
                $movement->execute([$productId, (float)$data['stock']]);
            }

            $pdo->commit();
            jsonResponse(true, ['id' => $productId], 'Product created successfully.');

        case 'create_customer':
            $data = requestJson();
            if (trim((string)($data['name'] ?? '')) === '') {
                jsonResponse(false, null, 'Customer name is required.');
            }

            $stmt = $pdo->prepare(
                "INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)"
            );
            $stmt->execute([
                trim((string)$data['name']),
                trim((string)($data['phone'] ?? '')),
                trim((string)($data['address'] ?? '')),
            ]);

            jsonResponse(true, ['id' => (int)$pdo->lastInsertId()], 'Customer created successfully.');

        case 'create_supplier':
            $data = requestJson();
            if (trim((string)($data['name'] ?? '')) === '') {
                jsonResponse(false, null, 'Supplier name is required.');
            }

            $stmt = $pdo->prepare(
                "INSERT INTO suppliers (name, phone, email, address) VALUES (?, ?, ?, ?)"
            );
            $stmt->execute([
                trim((string)$data['name']),
                trim((string)($data['phone'] ?? '')),
                trim((string)($data['email'] ?? '')),
                trim((string)($data['address'] ?? '')),
            ]);

            jsonResponse(true, ['id' => (int)$pdo->lastInsertId()], 'Supplier created successfully.');

        case 'create_sale':
            $data = requestJson();
            $customerId = !empty($data['customer_id']) ? (int)$data['customer_id'] : null;
            $items = $data['items'] ?? [];

            if (!is_array($items) || count($items) === 0) {
                jsonResponse(false, null, 'At least one sale item is required.');
            }

            $pdo->beginTransaction();

            $total = 0.0;
            $preparedItems = [];

            $productStmt = $pdo->prepare(
                "SELECT id, name, stock, selling_price
                 FROM products
                 WHERE id = ?
                 FOR UPDATE"
            );

            foreach ($items as $item) {
                $productId = (int)($item['product_id'] ?? 0);
                $quantity = (float)($item['quantity'] ?? 0);

                if ($productId <= 0 || $quantity <= 0) {
                    throw new RuntimeException('Invalid sale item.');
                }

                $productStmt->execute([$productId]);
                $product = $productStmt->fetch();

                if (!$product) {
                    throw new RuntimeException('Product not found.');
                }

                if ((float)$product['stock'] < $quantity) {
                    throw new RuntimeException(
                        "Insufficient stock for {$product['name']}. Available: {$product['stock']}"
                    );
                }

                $unitPrice = (float)$product['selling_price'];
                $lineTotal = $quantity * $unitPrice;
                $total += $lineTotal;

                $preparedItems[] = [
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                ];
            }

            $invoiceNo = 'SAL-' . date('Ymd-His');

            $saleStmt = $pdo->prepare(
                "INSERT INTO sales (customer_id, invoice_no, total_amount)
                 VALUES (?, ?, ?)"
            );
            $saleStmt->execute([$customerId, $invoiceNo, $total]);

            $saleId = (int)$pdo->lastInsertId();

            $itemStmt = $pdo->prepare(
                "INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
                 VALUES (?, ?, ?, ?)"
            );

            $stockStmt = $pdo->prepare(
                "UPDATE products SET stock = stock - ? WHERE id = ?"
            );

            $movementStmt = $pdo->prepare(
                "INSERT INTO stock_movements
                 (product_id, movement_type, quantity, reference_id, note)
                 VALUES (?, 'SALE', ?, ?, ?)"
            );

            foreach ($preparedItems as $item) {
                $itemStmt->execute([
                    $saleId,
                    $item['product_id'],
                    $item['quantity'],
                    $item['unit_price'],
                ]);

                $stockStmt->execute([
                    $item['quantity'],
                    $item['product_id'],
                ]);

                $movementStmt->execute([
                    $item['product_id'],
                    -$item['quantity'],
                    $saleId,
                    'Sale ' . $invoiceNo,
                ]);
            }

            $pdo->commit();

            jsonResponse(true, [
                'sale_id' => $saleId,
                'invoice_no' => $invoiceNo,
                'total' => $total,
            ], 'Sale recorded successfully.');

        case 'create_purchase':
            $data = requestJson();
            $supplierId = !empty($data['supplier_id']) ? (int)$data['supplier_id'] : null;
            $items = $data['items'] ?? [];

            if (!is_array($items) || count($items) === 0) {
                jsonResponse(false, null, 'At least one purchase item is required.');
            }

            $pdo->beginTransaction();

            $total = 0.0;
            $preparedItems = [];

            $productStmt = $pdo->prepare(
                "SELECT id, name
                 FROM products
                 WHERE id = ?
                 FOR UPDATE"
            );

            foreach ($items as $item) {
                $productId = (int)($item['product_id'] ?? 0);
                $quantity = (float)($item['quantity'] ?? 0);
                $unitCost = (float)($item['unit_cost'] ?? 0);

                if ($productId <= 0 || $quantity <= 0 || $unitCost < 0) {
                    throw new RuntimeException('Invalid purchase item.');
                }

                $productStmt->execute([$productId]);
                if (!$productStmt->fetch()) {
                    throw new RuntimeException('Product not found.');
                }

                $total += $quantity * $unitCost;

                $preparedItems[] = [
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                ];
            }

            $invoiceNo = 'PUR-' . date('Ymd-His');

            $purchaseStmt = $pdo->prepare(
                "INSERT INTO purchases (supplier_id, invoice_no, total_amount)
                 VALUES (?, ?, ?)"
            );
            $purchaseStmt->execute([$supplierId, $invoiceNo, $total]);

            $purchaseId = (int)$pdo->lastInsertId();

            $itemStmt = $pdo->prepare(
                "INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost)
                 VALUES (?, ?, ?, ?)"
            );

            $stockStmt = $pdo->prepare(
                "UPDATE products SET stock = stock + ?, purchase_price = ? WHERE id = ?"
            );

            $movementStmt = $pdo->prepare(
                "INSERT INTO stock_movements
                 (product_id, movement_type, quantity, reference_id, note)
                 VALUES (?, 'PURCHASE', ?, ?, ?)"
            );

            foreach ($preparedItems as $item) {
                $itemStmt->execute([
                    $purchaseId,
                    $item['product_id'],
                    $item['quantity'],
                    $item['unit_cost'],
                ]);

                $stockStmt->execute([
                    $item['quantity'],
                    $item['unit_cost'],
                    $item['product_id'],
                ]);

                $movementStmt->execute([
                    $item['product_id'],
                    $item['quantity'],
                    $purchaseId,
                    'Purchase ' . $invoiceNo,
                ]);
            }

            $pdo->commit();

            jsonResponse(true, [
                'purchase_id' => $purchaseId,
                'invoice_no' => $invoiceNo,
                'total' => $total,
            ], 'Purchase recorded successfully.');

        default:
            jsonResponse(false, null, 'Unknown API action.');
    }
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(false, null, $e->getMessage());
}
