import json
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3

TABLE_NAME = os.environ.get('SALES_TABLE', '')
BUCKET_NAME = os.environ.get('RECEIPTS_BUCKET', '')
table = boto3.resource('dynamodb').Table(TABLE_NAME) if TABLE_NAME else None

def response(status, body):
    return {'statusCode': status, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'}, 'body': json.dumps(body, default=str)}

def handler(event, context):
    method = event.get('httpMethod', '')
    path = event.get('path', '')
    if method == 'OPTIONS':
        return response(204, {})
    if method == 'GET' and path.endswith('/health'):
        return response(200, {'ok': True, 'service': 'Raghava SmartShop', 'aws': ['API Gateway', 'Lambda', 'DynamoDB', 'S3']})
    if method == 'GET' and path.endswith('/sales'):
        if not table: return response(500, {'error': 'SALES_TABLE is not configured'})
        items = table.scan().get('Items', [])
        items.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        return response(200, {'sales': items})
    if method == 'POST' and path.endswith('/sales'):
        if not table: return response(500, {'error': 'SALES_TABLE is not configured'})
        raw = event.get('body') or '{}'
        payload = json.loads(raw) if isinstance(raw, str) else raw
        product = str(payload.get('product', '')).strip()
        customer = str(payload.get('customer', '')).strip()
        quantity = Decimal(str(payload.get('quantity', 0)))
        price = Decimal(str(payload.get('price', 0)))
        if not product or quantity <= 0 or price <= 0:
            return response(400, {'error': 'product, positive quantity and positive price are required'})
        sale = {'saleId': str(uuid.uuid4()), 'product': product, 'customer': customer, 'quantity': quantity, 'price': price, 'total': quantity * price, 'createdAt': datetime.now(timezone.utc).isoformat()}
        table.put_item(Item=sale)
        return response(201, {'sale': sale})
    return response(404, {'error': 'Route not found'})