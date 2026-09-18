# Supabase setup

1. Create a Supabase Free project.
2. Open **SQL Editor** and run `schema.sql`.
3. Import the existing 100-product Asian Paints catalogue into `products` (the source workbook remains in the repository as backup).
4. Copy **Project URL** and the browser-safe **anon/publishable key** from Supabase.
5. In `assets/js/app.js`, replace:
   - `__SUPABASE_URL__`
   - `__SUPABASE_ANON_KEY__`
6. Deploy to Vercel.
7. Create the shop owner account from the app.
8. For a real shop, disable public sign-ups after creating the owner account, or replace the simple authenticated policy with an allow-list.

The app uses Supabase PostgreSQL directly from the browser with Row Level Security. Sales and purchases use database functions so stock changes happen atomically.

## Migration note

The old Google Drive/Excel connection is no longer used for runtime storage. Keep `Raghava_Shop_Data.xlsx` as an import/export/backup artifact.
