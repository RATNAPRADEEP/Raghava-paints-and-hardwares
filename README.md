# Raghava Paints & Hardwares

A local-first shop operations dashboard.

## Architecture
Browser UI → JavaScript → local Excel workbook

No PHP, MySQL, MongoDB, or JSON database.

## Excel storage
When the user connects a local folder, the app creates Raghava_Shop_Data.xlsx with:
- Products
- Customers
- Suppliers
- Sales
- Purchases
- Stock Movements

## Frontend direction
The interface uses the VoiceCall Guru frontend as a visual/product-design reference: clear workflow navigation, strong state indicators, quick actions, cards, metrics, activity tables, responsive layout, and a focused primary action. The business workflow is adapted specifically for a paint and hardware shop: Manage → Sell → Purchase → Track → Analyze.

## Run
Use Microsoft Edge or Google Chrome. Open index.html, click Connect Excel Storage, and select a local folder. Keep the browser online when loading the page so the SheetJS library can load.
