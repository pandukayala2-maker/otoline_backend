const { MongoClient, ObjectId } = require('mongodb');

const DATABASE_URL = 'mongodb://admin:admin@64.227.153.124:27028/?authMechanism=DEFAULT';

async function checkActionProtectionVendor() {
  const client = new MongoClient(DATABASE_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('autoline');
    
    // Find Action Protection vendor
    const vendor = await db.collection('vendors').findOne({
      company_name: { $regex: 'Action Protection', $options: 'i' }
    });
    
    if (!vendor) {
      console.log('❌ Action Protection vendor NOT found');
      return;
    }
    
    console.log('\n📋 ACTION PROTECTION VENDOR FOUND:');
    console.log('═══════════════════════════════════════');
    console.log('ID:', vendor._id);
    console.log('Company:', vendor.company_name);
    console.log('Email:', vendor.email);
    console.log('Phone:', vendor.phone);
    console.log('Category IDs:', vendor.category_ids || []);
    console.log('═══════════════════════════════════════\n');
    
    // Check for services for this vendor
    const services = await db.collection('services')
      .find({
        vendor_id: vendor._id,
        deleted_at: null
      })
      .toArray();
    
    console.log(`\n🔧 SERVICES FOR THIS VENDOR: ${services.length} found`);
    if (services.length > 0) {
      services.forEach((service, idx) => {
        console.log(`\n  ${idx + 1}. ${service.name}`);
        console.log(`     ID: ${service._id}`);
        console.log(`     Category ID: ${service.category_id}`);
        console.log(`     Price: ${service.price}`);
        console.log(`     Duration: ${service.duration}`);
      });
    } else {
      console.log('  ⚠️ No services found for this vendor');
    }
    
    // Check for products for this vendor
    const products = await db.collection('products')
      .find({
        vendor_id: vendor._id,
        deleted_at: null
      })
      .toArray();
    
    console.log(`\n📦 PRODUCTS FOR THIS VENDOR: ${products.length} found`);
    if (products.length > 0) {
      products.forEach((product, idx) => {
        console.log(`\n  ${idx + 1}. ${product.name}`);
        console.log(`     ID: ${product._id}`);
        console.log(`     Category IDs: ${product.category_id}`);
        console.log(`     Price: ${product.price}`);
        console.log(`     Stock: ${product.stock}`);
      });
    } else {
      console.log('  ⚠️ No products found for this vendor');
    }
    
    // Check available categories
    if (vendor.category_ids && vendor.category_ids.length > 0) {
      console.log(`\n📂 VENDOR ASSIGNED CATEGORIES: ${vendor.category_ids.length}`);
      const categories = await db.collection('categories')
        .find({
          _id: { $in: vendor.category_ids }
        })
        .toArray();
      
      categories.forEach((cat, idx) => {
        console.log(`  ${idx + 1}. ${cat.name} (Type: ${cat.type})`);
        console.log(`     ID: ${cat._id}`);
      });
    } else {
      console.log('\n⚠️ NO CATEGORIES ASSIGNED TO THIS VENDOR');
    }
    
    console.log('\n═══════════════════════════════════════');
    console.log('SUMMARY:');
    console.log(`  Services: ${services.length}`);
    console.log(`  Products: ${products.length}`);
    console.log(`  Categories: ${vendor.category_ids ? vendor.category_ids.length : 0}`);
    console.log(`  Needs: ${services.length === 0 ? 'Services ' : ''}${products.length === 0 ? 'Products' : ''}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkActionProtectionVendor();
