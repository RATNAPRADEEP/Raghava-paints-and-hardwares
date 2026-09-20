# Raghava SmartShop — AWS Layer

This folder contains the hackathon AWS implementation layer for the shop application.

## Architecture

Shop UI -> API Gateway -> AWS Lambda -> DynamoDB
                              \-> S3 receipt storage

## Services
- API Gateway: HTTPS API for the shop UI.
- Lambda: validates and records transactions.
- DynamoDB: durable transaction records.
- S3: receipt image/document storage.
- AWS SAM: reproducible infrastructure and local execution.

## Local execution
Install AWS SAM CLI, then:

sam build --template-file aws/template.yaml
sam local start-api --template-file aws/template.yaml

Health check: GET http://127.0.0.1:3000/health

Test a sale:
sam local invoke SmartShopFunction --event aws/events/sale.json

## Hackathon integration
The existing shop workflow remains intact. This AWS layer adds the new hackathon capability without replacing inventory, sales, purchase, invoice, or workbook workflows.

Next: connect Sell/Invoice save to POST /sales, upload receipt photos to S3, add an AWS AI assistant, and demonstrate the AWS-backed flow.