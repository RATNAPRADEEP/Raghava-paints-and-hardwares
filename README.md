# Raghava Paints & Hardwares

A local-first shop operations dashboard.

## Architecture
Browser UI → JavaScript → local Excel workbook

No PHP, MySQL, MongoDB, or JSON database.

## Excel storage
Download the `Raghava_Shop_Data.xlsx` workbook from the repository and connect that file from the app. The workbook contains sample paint-shop data for demonstration:
- Products
- Customers
- Suppliers
- Sales
- Purchases
- Stock Movements

The sample data is modeled around the business structure of the reference paint-shop database project by Talat Zubair: product code, brand, type, shade, size/pack, price, customers, orders/sales, payments, and shop-oriented reporting. The implementation here uses those business concepts with a local Excel workbook instead of the original PHP/MySQL stack.

## Frontend direction
The interface uses the VoiceCall Guru frontend as a visual/product-design reference: clear workflow navigation, strong state indicators, quick actions, cards, metrics, activity tables, responsive layout, and a focused primary action. The business workflow is adapted specifically for a paint and hardware shop: Manage → Sell → Purchase → Track → Analyze.

## Run
Use Microsoft Edge or Google Chrome on the HTTPS Vercel deployment. Click **Connect Excel Storage** and select the local `Raghava_Shop_Data.xlsx` file. The app reads and writes that workbook directly using the browser File System Access API.
