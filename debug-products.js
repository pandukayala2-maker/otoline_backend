const { MongoClient, ObjectId } = require('mongodb');

const DATABASE_URL = 'mongodb://admin:admin@64.227.153.124:27028/?authMechanism=DEFAULT';

async function debugProducts() {
  const client = new MongoClient(DATABASE_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('autoline');
    
    // Get Action Protection vendor ID
    const vendor = await db.collection('vendors').findOne({
      company_name: 'Action Protection'
    });
    
    console.log('🔍 SEARCHING FOR VENDOR:');
    console.log(`Vendor ID: ${vendor?._id}`);
    console.log(`Vendor Name: ${vendor?.company_name}\n`);
    
    if (!vendor) {
      console.log('❌ Vendor not found!');
      return;
    }
    
    // Check ALL products in database
    const allProducts = await db.collection('products').find({}).toArray();
    console.log(`📦 TOTAL PRODUCTS IN DATABASE: ${allProducts.length}\n`);
    
    // Find products for this vendor
    const vendorProducts = await db.collection('products')
      .find({
        vendor_id: vendor._id,
        deleted_at: null
      })
      .toArray();
    
    console.log(`🎯 PRODUCTS FOR ACTION PROTECTION (${vendor._id}):`);
    console.log(`Found: ${vendorProducts.length} products\n`);
    
    if (vendorProducts.length === 0) {
      console.log('❌ NO PRODUCTS FOUND FOR THIS VENDOR!');
      
      // Check if there are products with string vendor_id
      const stringVendorId = vendor._id.toString();
      const stringProducts = await db.collection('products')
        .find({
          vendor_id: stringVendorId,
          deleted_at: null
        })
        .toArray();
      
      console.log(`\n🔍 Checking with STRING vendor_id: ${stringVendorId}`);
      console.log(`Found with string ID: ${stringProducts.length} products`);
      
      // List ALL products with their vendor_ids
      console.log('\n📋 ALL PRODUCTS IN DATABASE (vendor_id info):');
      const firstProducts = await db.collection('products')
        .find({})
        .limit(10)
        .toArray();
      
      firstProducts.forEach((p, idx) => {
        console.log(`\n${idx + 1}. ${p.name}`);
        console.log(`   vendor_id: ${p.vendor_id}`);
        console.log(`   vendor_id type: ${typeof p.vendor_id}`);
        console.log(`   vendor_id constructor: ${p.vendor_id?.constructor?.name}`);
      });
      
      return;
    }
    
    // Show found products
    vendorProducts.forEach((product, idx) => {
      console.log(`${idx + 1}. ${product.name}`);
      console.log(`   ID: ${product._id}`);
      console.log(`   Vendor ID: ${product.vendor_id}`);
      console.log(`   Vendor ID Type: ${typeof product.vendor_id}`);
      console.log(`   Price: ${product.price}`);
      console.log(`   Stock: ${product.stock}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

debugProducts();
