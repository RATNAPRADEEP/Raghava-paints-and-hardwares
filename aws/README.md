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
The existing shop workflow remains intact. The Sell -> Record Sale action now optionally syncs the same sale to `POST /sales` while keeping Google Drive/local recording independent.

### Connect the frontend
After deploying the SAM stack, copy the API Gateway URL and set it in the browser console:

`localStorage.setItem('smartshop_api_url_v1','https://YOUR-API-ID.execute-api.YOUR-REGION.amazonaws.com/Prod')`

Then reload the shop. When the URL is configured, each new sale is sent to AWS after the local/Google Drive sale record is created. If AWS is unavailable, the sale is still retained locally and the UI reports the AWS sync error.

This separation keeps the existing shop workflow usable while providing a real AWS-backed transaction path for the hackathon demo.