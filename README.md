# Paints & Hardwares

A lightweight shop operations dashboard for managing products, sales, purchases, customers, stock, and business activity using a real Excel workbook.

## Live Demo

**Vercel:** https://raghava-paints-and-hardwares.vercel.app/

Open the live application in Microsoft Edge or Google Chrome.

## Workflow

**Manage → Sell → Purchase → Track → Analyze**

The application is designed for a local paint and hardware shop and keeps the operational data in an Excel `.xlsx` workbook.

## Architecture

```
Vercel App
    ↓
Google Sign-in / OAuth
    ↓
Google Picker
    ↓
Google Drive
    ↓
Paints & Hardwares .xlsx workbook
```

The application has no traditional PHP/MySQL/MongoDB backend. The connected Excel workbook remains the primary operational data store.

## Excel Storage

The workbook can contain:

- Products and product inventory
- Size-specific products and subproducts
- Product pack sizes and pricing
- Customers
- Suppliers
- Sales
- Purchases
- Stock movements
- Business/customer type reference data

The application reads the connected workbook in the browser and can save the updated workbook back to the same Google Drive file.

## Google Drive Integration

The live application uses Google OAuth and Google Picker to let the user select an existing `.xlsx` workbook from Google Drive.

After connection:

- Products and related data are loaded from the workbook.
- Sales and purchases update operational data.
- Stock is adjusted when transactions are recorded.
- **Save to Google Drive** writes the updated Excel workbook back to the selected Drive file.

## Product Pricing

The workbook supports size-aware pricing so products such as paint, enamel, filler, brushes, rollers, and other hardware/subproducts can have their own pack-size selling prices.

Pricing is stored in Excel rather than hard-coded into the application.

## Planned AI / WhatsApp Integration

A future integration will allow a shop user to:

1. Take a photo of a product.
2. Send the photo through WhatsApp.
3. AI identifies the product and pack size.
4. The system matches it against the Excel catalogue.
5. WhatsApp returns the corresponding selling price.

Planned flow:

```
Product Photo
    ↓
WhatsApp
    ↓
Vision AI
    ↓
Product + Pack Size
    ↓
Excel Catalogue
    ↓
Selling Price
    ↓
WhatsApp Price Response
```

The AI will identify the product, while the Excel workbook remains the source for the actual price.

## Frontend

The interface follows a simple shop workflow with responsive cards, forms, metrics, transaction tables, customer activity, product tracking, and Google Drive synchronization.

## Run

For the deployed version, open the Vercel URL above and connect the shop's Excel workbook through Google Drive.

For local development, serve the repository over HTTPS-compatible local hosting when testing Google OAuth and Picker integration.

## First Commit 2026 — AWS Hackathon Layer

This repository is being extended during the September 17–20, 2026 First Commit hackathon with an AWS-powered SmartShop layer. The original shop workflow remains intact while the new layer adds a reproducible serverless backend and an AWS Strands Agents prototype.

### AWS stack

- AWS SAM — reproducible infrastructure and local development
- API Gateway — transaction API
- AWS Lambda — serverless transaction processing
- DynamoDB — transaction storage
- Amazon S3 — receipt/document storage foundation
- Strands Agents SDK — constrained shop-operations assistant prototype

See aws/README.md for the architecture and local execution path.
