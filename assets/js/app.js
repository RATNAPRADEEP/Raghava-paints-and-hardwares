let products = [];
let customers = [];
let suppliers = [];
let categories = [];
let salesChart = null;

const money = value => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
}).format(Number(value || 0));

async function api(action, options = {}) {
    const response = await fetch('api.php?action=' + encodeURIComponent(action), {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.message || 'Request failed.');
    }

    return result.data;
}

function showAlert(message, type = 'success') {
    document.getElementById('alertBox').innerHTML =
        '<div class="alert alert-' + type + ' alert-dismissible fade show" role="alert">' +
        message +
        '<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>';
}

function stockBadge(row) {
    const stock = Number(row.stock);
    const reorder = Number(row.reorder_level);

    if (stock <= 0) return '<span class="badge-stock badge-out">Out of stock</span>';
    if (stock <= reorder) return '<span class="badge-stock badge-low">Low</span>';
    return '<span class="badge-stock badge-good">Healthy</span>';
}

function fillSelect(id, rows, placeholder, labelKey = 'name') {
    const el = document.getElementById(id);
    el.innerHTML = '<option value="">' + placeholder + '</option>' +
        rows.map(row => '<option value="' + row.id + '">' + escapeHtml(row[labelKey]) + '</option>').join('');
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[char]));
}

async function loadMasters() {
    [products, customers, suppliers, categories] = await Promise.all([
        api('products'),
        api('customers'),
        api('suppliers'),
        api('categories')
    ]);

    fillSelect('saleCustomer', customers, 'Walk-in customer');
    fillSelect('saleProduct', products, 'Choose product');
    fillSelect('purchaseSupplier', suppliers, 'Choose supplier');
    fillSelect('purchaseProduct', products, 'Choose product');
    fillSelect('productCategory', categories, 'Choose category');

    renderProducts();
    renderCustomers();
    renderSuppliers();
}

async function loadDashboard() {
    const data = await api('dashboard');

    document.getElementById('statProducts').textContent = data.stats.products;
    document.getElementById('statStock').textContent = Number(data.stats.stock_units).toLocaleString('en-IN');
    document.getElementById('statInventory').textContent = money(data.stats.inventory_value);
    document.getElementById('statTodaySales').textContent = money(data.stats.today_sales);
    document.getElementById('statTotalSales').textContent = money(data.stats.total_sales);
    document.getElementById('statLowStock').textContent = data.stats.low_stock;

    document.getElementById('lowStockTable').innerHTML = data.low_stock.length
        ? '<div class="table-responsive"><table class="table"><thead><tr><th>Product</th><th>Stock</th><th>Status</th></tr></thead><tbody>' +
          data.low_stock.map(p =>
              '<tr><td><strong>' + escapeHtml(p.name) + '</strong><br><small class="text-secondary">' + escapeHtml(p.sku) + '</small></td>' +
              '<td>' + Number(p.stock).toLocaleString('en-IN') + ' ' + escapeHtml(p.unit) + '</td>' +
              '<td>' + stockBadge(p) + '</td></tr>'
          ).join('') +
          '</tbody></table></div>'
        : '<p class="text-secondary mb-0">No low-stock products.</p>';

    document.getElementById('recentSalesTable').innerHTML =
        '<thead><tr><th>Invoice</th><th>Customer</th><th>Total</th><th>Date</th></tr></thead><tbody>' +
        data.recent_sales.map(s =>
            '<tr><td>' + escapeHtml(s.invoice_no) + '</td><td>' + escapeHtml(s.customer) + '</td><td>' +
            money(s.total_amount) + '</td><td>' + new Date(s.sold_at).toLocaleString('en-IN') + '</td></tr>'
        ).join('') + '</tbody>';

    if (salesChart) salesChart.destroy();

    salesChart = new Chart(document.getElementById('salesChart'), {
        type: 'bar',
        data: {
            labels: data.top_products.map(p => p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name),
            datasets: [{
                label: 'Quantity sold',
                data: data.top_products.map(p => Number(p.quantity_sold)),
                borderRadius: 7
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

function renderProducts() {
    document.getElementById('productsTable').innerHTML =
        '<thead><tr><th>SKU</th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead><tbody>' +
        products.map(p =>
            '<tr><td><code>' + escapeHtml(p.sku) + '</code></td>' +
            '<td><strong>' + escapeHtml(p.name) + '</strong><br><small class="text-secondary">' + escapeHtml(p.brand || '') + '</small></td>' +
            '<td>' + escapeHtml(p.category_name || '-') + '</td>' +
            '<td>' + money(p.selling_price) + '</td>' +
            '<td>' + Number(p.stock).toLocaleString('en-IN') + ' ' + escapeHtml(p.unit) + '</td>' +
            '<td>' + stockBadge(p) + '</td></tr>'
        ).join('') + '</tbody>';
}

function renderCustomers() {
    document.getElementById('customersTable').innerHTML =
        '<thead><tr><th>Name</th><th>Phone</th><th>Address</th></tr></thead><tbody>' +
        customers.map(c =>
            '<tr><td>' + escapeHtml(c.name) + '</td><td>' + escapeHtml(c.phone || '-') + '</td><td>' + escapeHtml(c.address || '-') + '</td></tr>'
        ).join('') + '</tbody>';
}

function renderSuppliers() {
    document.getElementById('suppliersTable').innerHTML =
        '<thead><tr><th>Name</th><th>Phone</th><th>Address</th></tr></thead><tbody>' +
        suppliers.map(s =>
            '<tr><td>' + escapeHtml(s.name) + '</td><td>' + escapeHtml(s.phone || '-') + '</td><td>' + escapeHtml(s.address || '-') + '</td></tr>'
        ).join('') + '</tbody>';
}

async function loadTransactions() {
    const [sales, purchases] = await Promise.all([api('sales'), api('purchases')]);

    document.getElementById('salesTable').innerHTML =
        '<thead><tr><th>Invoice</th><th>Customer</th><th>Total</th><th>Date</th></tr></thead><tbody>' +
        sales.map(s =>
            '<tr><td>' + escapeHtml(s.invoice_no) + '</td><td>' + escapeHtml(s.customer) + '</td><td>' +
            money(s.total_amount) + '</td><td>' + new Date(s.sold_at).toLocaleString('en-IN') + '</td></tr>'
        ).join('') + '</tbody>';

    document.getElementById('purchasesTable').innerHTML =
        '<thead><tr><th>Invoice</th><th>Supplier</th><th>Total</th><th>Date</th></tr></thead><tbody>' +
        purchases.map(p =>
            '<tr><td>' + escapeHtml(p.invoice_no) + '</td><td>' + escapeHtml(p.supplier) + '</td><td>' +
            money(p.total_amount) + '</td><td>' + new Date(p.purchased_at).toLocaleString('en-IN') + '</td></tr>'
        ).join('') + '</tbody>';
}

async function refresh() {
    await Promise.all([loadMasters(), loadDashboard(), loadTransactions()]);
}

document.querySelectorAll('#appTabs .nav-link').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('#appTabs .nav-link').forEach(b => b.classList.remove('active'));
        button.classList.add('active');

        document.querySelectorAll('.app-section').forEach(section => section.classList.add('d-none'));
        document.getElementById('section-' + button.dataset.section).classList.remove('d-none');
    });
});

document.getElementById('productForm').addEventListener('submit', async event => {
    event.preventDefault();

    const form = new FormData(event.target);
    const data = Object.fromEntries(form.entries());

    try {
        await api('create_product', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
        event.target.reset();
        showAlert('Product added successfully.');
        await refresh();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
});

document.getElementById('customerForm').addEventListener('submit', async event => {
    event.preventDefault();

    try {
        await api('create_customer', {
            method: 'POST',
            body: JSON.stringify(Object.fromEntries(new FormData(event.target).entries()))
        });

        bootstrap.Modal.getInstance(document.getElementById('customerModal')).hide();
        event.target.reset();
        showAlert('Customer added successfully.');
        await refresh();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
});

document.getElementById('supplierForm').addEventListener('submit', async event => {
    event.preventDefault();

    try {
        await api('create_supplier', {
            method: 'POST',
            body: JSON.stringify(Object.fromEntries(new FormData(event.target).entries()))
        });

        bootstrap.Modal.getInstance(document.getElementById('supplierModal')).hide();
        event.target.reset();
        showAlert('Supplier added successfully.');
        await refresh();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
});

document.getElementById('saleForm').addEventListener('submit', async event => {
    event.preventDefault();

    const productId = Number(document.getElementById('saleProduct').value);
    const quantity = Number(document.getElementById('saleQty').value);
    const customerId = Number(document.getElementById('saleCustomer').value) || null;

    if (!productId || quantity <= 0) {
        showAlert('Choose a product and enter a valid quantity.', 'warning');
        return;
    }

    try {
        const result = await api('create_sale', {
            method: 'POST',
            body: JSON.stringify({
                customer_id: customerId,
                items: [{ product_id: productId, quantity }]
            })
        });

        event.target.reset();
        showAlert('Sale ' + result.invoice_no + ' recorded for ' + money(result.total) + '.');
        await refresh();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
});

document.getElementById('purchaseForm').addEventListener('submit', async event => {
    event.preventDefault();

    const productId = Number(document.getElementById('purchaseProduct').value);
    const quantity = Number(document.getElementById('purchaseQty').value);
    const unitCost = Number(document.getElementById('purchaseCost').value);
    const supplierId = Number(document.getElementById('purchaseSupplier').value) || null;

    if (!productId || quantity <= 0 || unitCost < 0) {
        showAlert('Enter valid purchase details.', 'warning');
        return;
    }

    try {
        const result = await api('create_purchase', {
            method: 'POST',
            body: JSON.stringify({
                supplier_id: supplierId,
                items: [{ product_id: productId, quantity, unit_cost: unitCost }]
            })
        });

        event.target.reset();
        showAlert('Purchase ' + result.invoice_no + ' recorded for ' + money(result.total) + '.');
        await refresh();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
});

refresh().catch(error => showAlert(error.message, 'danger'));
