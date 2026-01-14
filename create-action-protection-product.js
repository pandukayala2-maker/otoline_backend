const { MongoClient, ObjectId } = require('mongodb');

const DATABASE_URL = 'mongodb://admin:admin@64.227.153.124:27028/?authMechanism=DEFAULT';

async function createActionProtectionProduct() {
  const client = new MongoClient(DATABASE_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('autoline');
    
    // Get the test vendor (Test Auto Service Center)
    const vendor = await db.collection('vendors').findOne({
      company_name: 'Test Auto Service Center'
    });
    
    if (!vendor) {
      console.log('⚠️ Test vendor not found. Creating test vendor first...');
      console.log('Run: node create-test-vendor.js');
      return;
    }
    
    console.log('📦 Found vendor:', vendor.company_name);
    console.log('🆔 Vendor ID:', vendor._id);
    
    // Get a SERVICE category (not spare parts category)
    const category = await db.collection('categories').findOne({
      type: 'service',
      deleted_at: null
    });
    
    if (!category) {
      console.log('⚠️ No service category found in database');
      console.log('Creating a test service category...');
      
      // Create a service category if none exists
      const newCategory = {
        _id: new ObjectId(),
        name: 'Protective Services',
        other_name: 'خدمات الحماية',
        image: 'https://via.placeholder.com/300x200?text=Protection+Services',
        alt_image: '',
        desc: 'Vehicle protection and coating services',
        type: 'service',
        vendor_id: null, // Admin-owned category
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        is_disabled: false
      };
      
      await db.collection('categories').insertOne(newCategory);
      console.log('✅ Created service category:', newCategory.name);
      var serviceCategoryId = newCategory._id;
    } else {
      console.log('📂 Found service category:', category.name);
      var serviceCategoryId = category._id;
    }
    
    // Check if vendor has this category assigned
    const vendorCategories = vendor.category_ids || [];
    const hasCategoryAssigned = vendorCategories.some(id => id.toString() === serviceCategoryId.toString());
    
    if (!hasCategoryAssigned) {
      console.log('⚠️ Vendor does not have this category assigned. Adding it...');
      await db.collection('vendors').updateOne(
        { _id: vendor._id },
        { $addToSet: { category_ids: serviceCategoryId } }
      );
      console.log('✅ Category assigned to vendor');
    }
    
    // Create Action Protection Product
    const product = {
      _id: new ObjectId(),
      name: 'Action Protection Coating',
      other_name: 'طلاء الحماية الفعال',
      desc: 'Premium paint protection coating that shields your vehicle from scratches, UV rays, and environmental damage. Long-lasting formula with hydrophobic properties.',
      other_desc: 'طلاء حماية متميز يحمي سيارتك من الخدوش والأشعة فوق البنفسجية والأضرار البيئية. تركيبة طويلة الأمد بخصائص مقاومة للماء',
      origin: 'Germany',
      port_number: 'APC-2024',
      price: 150.000,  // Price in KWD
      discount: 0,     // No discount
      rating: 4.8,
      stock: 100,      // Available service slots
      coming_soon: false,
      specification: {
        'coverage': 'Full Body',
        'protection_level': 'Premium',
        'duration': '5 Years',
        'warranty': '3 Years',
        'hydrophobic': 'Yes',
        'uv_protection': '99%',
        'scratch_resistance': 'High',
        'application_time': '4-6 hours',
        'curing_time': '24 hours'
      },
      image_list: [
        'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400',
        'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400',
        'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400'
      ],
      vendor_id: vendor._id,
      category_id: [serviceCategoryId],
      brand_id: [],
      variants: [],
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      is_disabled: false
    };
    
    // Check if product already exists
    const existingProduct = await db.collection('products').findOne({
      name: 'Action Protection Coating',
      vendor_id: vendor._id,
      deleted_at: null
    });
    
    if (existingProduct) {
      console.log('⚠️ Product already exists! Updating instead...');
      await db.collection('products').updateOne(
        { _id: existingProduct._id },
        { $set: {
          desc: product.desc,
          other_desc: product.other_desc,
          price: product.price,
          specification: product.specification,
          category_id: product.category_id,
          updated_at: new Date()
        }}
      );
      console.log('✅ Product updated successfully!');
      console.log('📝 Product ID:', existingProduct._id);
    } else {
      // Insert new product
      const result = await db.collection('products').insertOne(product);
      console.log('✅ Product created successfully!');
      console.log('📝 Product ID:', result.insertedId);
    }
    
    console.log('\n📋 Product Details:');
    console.log('═══════════════════════════════════════');
    console.log('🏢 Vendor:', vendor.company_name);
    console.log('📂 Category:', category ? category.name : 'Protective Services');
    console.log('🛍️ Product Name:', product.name);
    console.log('💰 Price:', product.price, 'KWD');
    console.log('⭐ Rating:', product.rating);
    console.log('📦 Stock/Availability:', product.stock);
    console.log('🏭 Origin:', product.origin);
    console.log('🔖 Port Number:', product.port_number);
    console.log('\n📄 Description:');
    console.log(product.desc);
    console.log('\n🔧 Specifications:');
    for (const [key, value] of Object.entries(product.specification)) {
      console.log(`  - ${key}: ${value}`);
    }
    console.log('═══════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

createActionProtectionProduct();
