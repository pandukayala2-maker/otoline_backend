const { MongoClient, ObjectId } = require('mongodb');

const DATABASE_URL = 'mongodb://admin:admin@64.227.153.124:27028/?authMechanism=DEFAULT';

async function createActionProtectionProducts() {
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
    
    console.log('📦 Found vendor:', vendor.company_name);
    console.log('🆔 Vendor ID:', vendor._id);
    
    // Find "Car Protection" category (type: service)
    const category = await db.collection('categories').findOne({
      name: 'Car Protection',
      type: 'service'
    });
    
    if (!category) {
      console.log('❌ Car Protection category NOT found');
      return;
    }
    
    console.log('📂 Found category:', category.name);
    console.log('🔖 Category ID:', category._id);
    
    // Products to create
    const products = [
      {
        name: 'PPF (Paint Protection Film) - Full Body',
        other_name: 'حماية الطلاء - الجسم الكامل',
        desc: 'Premium self-healing paint protection film that protects your vehicle from scratches, rock chips, and harsh weather. Invisible protection with crystal-clear clarity.',
        other_desc: 'فيلم حماية الطلاء الممتاز الذي يحمي سيارتك من الخدوش والشظايا والطقس القاسي. حماية غير مرئية مع وضوح بلوري.',
        origin: 'USA',
        port_number: 'PPF-FB-2024',
        price: 800.000,
        discount: 0,
        rating: 4.9,
        stock: 50,
        specification: {
          'material': 'Self-Healing TPU Film',
          'coverage': 'Full Body',
          'warranty': '10 Years',
          'thickness': '0.2mm',
          'clarity': 'Crystal Clear',
          'uv_protection': 'Yes',
          'self_healing': 'Yes',
          'installation_time': '8-10 hours'
        }
      },
      {
        name: 'Ceramic Coating - Professional Grade',
        other_name: 'طلاء سيراميك - درجة احترافية',
        desc: 'Advanced nano-ceramic coating providing 9H hardness, hydrophobic properties, and long-lasting protection for paint and glass.',
        other_desc: 'طلاء نانو سيراميك متقدم يوفر صلابة 9H وخصائص مقاومة للماء وحماية طويلة الأمد للطلاء والزجاج.',
        origin: 'Japan',
        port_number: 'CERAM-PRO-2024',
        price: 500.000,
        discount: 0,
        rating: 4.8,
        stock: 75,
        specification: {
          'material': 'Nano-Ceramic',
          'hardness': '9H',
          'hydrophobic': 'Yes',
          'duration': '3 Years',
          'coverage': 'Full Body',
          'gloss_level': 'High',
          'water_beading': 'Excellent',
          'curing_time': '48 hours'
        }
      },
      {
        name: 'Windshield Protection & Clarity Film',
        other_name: 'حماية الزجاج الأمامي وفيلم الوضوح',
        desc: 'Transparent protective film for windshield and windows. Prevents scratches and provides hydrophobic coating for better visibility during rain.',
        other_desc: 'فيلم حماية شفاف للزجاج الأمامي والنوافذ. يمنع الخدوش ويوفر طلاء مقاوم للماء لرؤية أفضل تحت المطر.',
        origin: 'Germany',
        port_number: 'WIND-PROT-2024',
        price: 300.000,
        discount: 0,
        rating: 4.7,
        stock: 100,
        specification: {
          'material': 'Hydrophobic Polymer',
          'coverage': 'Windshield & Windows',
          'clarity': 'Crystal Clear',
          'water_repellent': 'Yes',
          'scratch_resistant': 'Yes',
          'uv_blocking': '99%',
          'durability': '2 Years',
          'reapplication': 'Every 6 months'
        }
      },
      {
        name: 'Vinyl Wrap Protection Sealant',
        other_name: 'مانع الحماية لغلاف الفينيل',
        desc: 'Protective sealant for vinyl wraps and decals. Extends wrap life and prevents peeling, fading, and weathering damage.',
        other_desc: 'مانع حماية لغلاف الفينيل والملصقات. يطيل عمر الغلاف ويمنع القشر والتلاشي والأضرار الجوية.',
        origin: 'USA',
        port_number: 'VINYL-SEAL-2024',
        price: 200.000,
        discount: 0,
        rating: 4.6,
        stock: 80,
        specification: {
          'material': 'UV-Resistant Resin',
          'coverage': 'All Vinyl Wraps',
          'protection': 'UV & Weather',
          'durability': '2-3 Years',
          'gloss': 'High',
          'waterproof': 'Yes',
          'application_type': 'Spray'
        }
      },
      {
        name: 'Headlight & Taillight Protection Film',
        other_name: 'فيلم حماية المصابيح الأمامية والخلفية',
        desc: 'Clear protective film that prevents yellowing, fogging, and damage to headlights and taillights while maintaining perfect clarity.',
        other_desc: 'فيلم حماية شفاف يمنع الاصفرار والضباب والأضرار للمصابيح مع الحفاظ على الوضوح المثالي.',
        origin: 'USA',
        port_number: 'LIGHT-PROT-2024',
        price: 250.000,
        discount: 0,
        rating: 4.7,
        stock: 60,
        specification: {
          'material': 'UV-Blocking TPU',
          'coverage': 'Front & Rear Lights',
          'clarity': 'Crystal Clear',
          'uv_protection': '99%',
          'anti_yellowing': 'Yes',
          'anti_fog': 'Yes',
          'durability': '5 Years',
          'installation': 'Pre-cut Available'
        }
      },
      {
        name: 'Interior Protection & Detailing Kit',
        other_name: 'مجموعة الحماية والتفاصيل الداخلية',
        desc: 'Complete interior protection package including dashboard coating, leather protection, and fabric sealant for long-lasting freshness.',
        other_desc: 'مجموعة حماية داخلية كاملة تتضمن طلاء لوحة التحكم وحماية الجلد وختم النسيج للحفاظ على النضارة.',
        origin: 'Germany',
        port_number: 'INTERIOR-KIT-2024',
        price: 400.000,
        discount: 0,
        rating: 4.8,
        stock: 45,
        specification: {
          'includes': 'Dashboard Coating, Leather Protection, Fabric Sealant',
          'coverage': 'Complete Interior',
          'material': 'Nano-Technology',
          'dust_resistance': 'Yes',
          'stain_protection': 'Yes',
          'durability': '2 Years',
          'maintenance': 'Quarterly Re-application'
        }
      }
    ];
    
    // Create products
    let createdCount = 0;
    for (const productData of products) {
      const product = {
        _id: new ObjectId(),
        ...productData,
        vendor_id: vendor._id,
        category_id: [category._id],
        brand_id: [],
        variants: [],
        coming_soon: false,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        is_disabled: false
      };
      
      // Check if product already exists
      const exists = await db.collection('products').findOne({
        name: productData.name,
        vendor_id: vendor._id,
        deleted_at: null
      });
      
      if (!exists) {
        await db.collection('products').insertOne(product);
        createdCount++;
        console.log(`✅ Created: ${productData.name}`);
      } else {
        console.log(`⚠️ Skipped (exists): ${productData.name}`);
      }
    }
    
    console.log('\n═══════════════════════════════════════');
    console.log(`✅ SUCCESS: Created ${createdCount} products`);
    console.log(`📦 Total products for Action Protection: ${6}`);
    console.log(`🏢 Vendor: ${vendor.company_name}`);
    console.log(`📂 Category: ${category.name}`);
    console.log('═══════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

createActionProtectionProducts();
