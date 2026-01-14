#!/bin/bash
# Test script to verify the product API fix

echo "🧪 PRODUCT API FIX VERIFICATION"
echo "=================================="
echo ""
echo "Testing API endpoint..."
echo "GET /v1/product?vendor_id=6926d9c155a439ba53df28fd"
echo ""

curl -s "http://192.168.8.119:4321/v1/product?vendor_id=6926d9c155a439ba53df28fd" | jq '
{
  success: .success,
  product_count: (.data | length),
  products: [.data[] | {name: .name, price: .price, stock: .stock}]
}'

echo ""
echo "=================================="
echo "✅ If you see products above, the fix worked!"
echo "=================================="
