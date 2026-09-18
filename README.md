# Raghava Paints & Hardwares

A live shop-operations dashboard for products, sales, purchases, customers, suppliers and inventory.

## Architecture

```text
Vercel static frontend
        ↓
Supabase Auth
        ↓
Supabase PostgreSQL
        ↓
Products / Sales / Purchases / Stock Movements / Customers / Suppliers
```

There is no traditional PHP/MySQL server. The frontend talks to Supabase using the browser-safe publishable/anon key, with Row Level Security enabled.

## Workflow

**Manage → Sell → Purchase → Track → Analyze**

- Products and inventory are stored in PostgreSQL.
- Sales atomically deduct stock.
- Purchases atomically increase stock and update purchase cost.
- Customers and suppliers are persistent database records.
- Stock movements provide an audit trail.
- Excel remains a backup/import-export artifact, not the live database.

## Setup

See `supabase/README.md` and run `supabase/schema.sql` in the Supabase SQL Editor.

Then put the Supabase Project URL and browser-safe anon/publishable key into `assets/js/app.js` and deploy the repository to Vercel.

## Free-tier target

The project is designed to run on Supabase Free + Vercel for portfolio/demo usage.