const { MongoClient, ObjectId } = require('mongodb');

const DATABASE_URL = 'mongodb://admin:admin@64.227.153.124:27028/?authMechanism=DEFAULT';

async function createTestProduct() {
  const client = new MongoClient(DATABASE_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('autoline');
    
    // Get a vendor
    const vendor = await db.collection('vendors').findOne({});
    if (!vendor) {
      console.log('⚠️ No vendors found in database');
      return;
    }
    
    console.log('📦 Found vendor:', vendor.company_name);
    
    // Get a category
    const category = await db.collection('categories').findOne({});
    if (!category) {
      console.log('⚠️ No categories found in database');
      return;
    }
    
    console.log('📂 Found category:', category.name);
    
    // Create test product
    const product = {
      _id: new ObjectId(),
      name: 'Premium Car Air Filter',
      other_name: 'High Performance Filter',
      desc: 'High-quality air filter for improved engine performance',
      other_desc: 'Reduces particulate matter by 99%',
      origin: 'Japan',
      port_number: 'AF-1234',
      price: 45.99,
      discount: 10,
      rating: 4.5,
      stock: 50,
      coming_soon: false,
      specification: {
        'material': 'Fiberglass',
        'compatibility': 'Universal Fit',
        'warranty': '2 Years'
      },
      image_list: [
        'https://via.placeholder.com/400x300?text=Air+Filter+1',
        'https://via.placeholder.com/400x300?text=Air+Filter+2',
        'https://via.placeholder.com/400x300?text=Air+Filter+3'
      ],
      vendor_id: vendor._id,
      category_id: [category._id],
      brand_id: [],
      variants: [],
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      is_disabled: false
    };
    
    // Insert product
    const result = await db.collection('products').insertOne(product);
    
    console.log('✅ Product created successfully!');
    console.log('📝 Product ID:', result.insertedId);
    console.log('🏢 Vendor:', vendor.company_name);
    console.log('📂 Category:', category.name);
    console.log('🛍️ Product Name:', product.name);
    console.log('💰 Price:', product.price);
    console.log('📦 Stock:', product.stock);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

createTestProduct();
