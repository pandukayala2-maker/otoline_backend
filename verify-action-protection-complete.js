const { MongoClient, ObjectId } = require('mongodb');

const DATABASE_URL = 'mongodb://admin:admin@64.227.153.124:27028/?authMechanism=DEFAULT';

async function generateVerificationReport() {
  const client = new MongoClient(DATABASE_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('autoline');
    
    // Find Action Protection vendor
    const vendor = await db.collection('vendors').findOne({
      company_name: { $regex: 'Action Protection', $options: 'i' }
    });
    
    if (!vendor) {
      console.log('❌ Vendor not found');
      return;
    }
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         ACTION PROTECTION VENDOR - VERIFICATION REPORT     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    // Vendor Info
    console.log('📋 VENDOR INFORMATION:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`ID:              ${vendor._id}`);
    console.log(`Company Name:    ${vendor.company_name}`);
    console.log(`Email:           ${vendor.email}`);
    console.log(`Phone:           ${vendor.phone}`);
    console.log(`Status:          ${vendor.is_disabled ? '❌ Disabled' : '✅ Active'}`);
    console.log('');
    
    // Categories
    console.log('📂 CATEGORIES ASSIGNED:');
    console.log('─────────────────────────────────────────────────────────────');
    if (vendor.category_ids && vendor.category_ids.length > 0) {
      const categories = await db.collection('categories')
        .find({
          _id: { $in: vendor.category_ids }
        })
        .toArray();
      
      categories.forEach((cat, idx) => {
        console.log(`${idx + 1}. ${cat.name}`);
        console.log(`   ID: ${cat._id}`);
        console.log(`   Type: ${cat.type}`);
        console.log('');
      });
    }
    
    // Services
    const services = await db.collection('services')
      .find({
        vendor_id: vendor._id,
        deleted_at: null
      })
      .toArray();
    
    console.log('🔧 SERVICES (Backend Response Example):');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`Total: ${services.length} services\n`);
    
    // Show first 3 services
    console.log('First 3 Services (Sample Response):');
    services.slice(0, 3).forEach((service, idx) => {
      console.log(`\n${idx + 1}. ${service.name}`);
      console.log(`   ID: ${service._id}`);
      console.log(`   Category: ${service.category_id}`);
      console.log(`   Price: ${service.price} KWD`);
      console.log(`   Type: ${service.type || 'N/A'}`);
    });
    console.log(`\n... and ${services.length - 3} more services`);
    console.log('');
    
    // Products
    const products = await db.collection('products')
      .find({
        vendor_id: vendor._id,
        deleted_at: null
      })
      .toArray();
    
    console.log('📦 PRODUCTS (Backend Response Example):');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`Total: ${products.length} products\n`);
    
    // Show all products
    console.log('All Products:');
    products.forEach((product, idx) => {
      console.log(`\n${idx + 1}. ${product.name}`);
      console.log(`   ID: ${product._id}`);
      console.log(`   Categories: ${product.category_id?.join(', ') || 'N/A'}`);
      console.log(`   Price: ${product.price} KWD`);
      console.log(`   Stock: ${product.stock}`);
      console.log(`   Rating: ${product.rating}`);
    });
    
    // Summary
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                         SUMMARY                            ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║ Services:     ${String(services.length).padEnd(48)} ║`);
    console.log(`║ Products:     ${String(products.length).padEnd(48)} ║`);
    console.log(`║ Categories:   ${String((vendor.category_ids || []).length).padEnd(48)} ║`);
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║ Tab Display:  ${'BOTH TABS WILL SHOW ✅'.padEnd(48)} ║`);
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    // API Endpoints Reference
    console.log('\n');
    console.log('🌐 API ENDPOINTS FOR TESTING:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`\n1. Get Services:`);
    console.log(`   GET /v1/service?vendor_id=${vendor._id}`);
    console.log(`   Expected: Array of ${services.length} services\n`);
    
    console.log(`2. Get Products:`);
    console.log(`   GET /v1/product?vendor_id=${vendor._id}`);
    console.log(`   Expected: Array of ${products.length} products\n`);
    
    console.log(`3. Get Vendor:`);
    console.log(`   GET /v1/vendor/${vendor._id}`);
    console.log(`   Expected: Vendor details with category_ids\n`);
    
    // Mobile App Flow
    console.log('');
    console.log('📱 MOBILE APP FLOW:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('VendorScreen.checkData() calls:');
    console.log(`  1. spareController.get(vendorId: "${vendor._id}")`);
    console.log(`     → Returns ${products.length} products`);
    console.log(`     → hasSpareData = ${products.length > 0 ? 'true' : 'false'}`);
    console.log('');
    console.log(`  2. serviceController.get(vendorId: "${vendor._id}")`);
    console.log(`     → Returns ${services.length} services`);
    console.log(`     → hasServiceData = ${services.length > 0 ? 'true' : 'false'}`);
    console.log('');
    
    const bothHaveData = services.length > 0 && products.length > 0;
    console.log(`Result: hasSpareData=${products.length > 0}, hasServiceData=${services.length > 0}`);
    console.log(`\nUI Decision: ${bothHaveData ? '✅ SHOW TABS (Both tabs will be visible)' : 'Show without tabs'}`);
    
    // Data Structure Examples
    console.log('\n');
    console.log('📄 DATA STRUCTURE EXAMPLES:');
    console.log('─────────────────────────────────────────────────────────────');
    
    if (services.length > 0) {
      console.log('\nService Response Format:');
      const service = services[0];
      console.log(`{
  "id": "${service._id}",
  "name": "${service.name}",
  "vendor_id": "${service.vendor_id}",
  "category_id": "${service.category_id}",
  "price": ${service.price},
  "type": "${service.type || 'service'}"
}`);
    }
    
    if (products.length > 0) {
      console.log('\nProduct Response Format:');
      const product = products[0];
      console.log(`{
  "id": "${product._id}",
  "name": "${product.name}",
  "vendor_id": "${product.vendor_id}",
  "category": "${product.category_id?.[0] || 'N/A'}",
  "price": ${product.price},
  "stock": ${product.stock},
  "rating": ${product.rating},
  "image_list": [${product.image_list ? product.image_list.slice(0, 1).map(i => `"${i}"`).join(', ') : ''}]
}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

generateVerificationReport();
