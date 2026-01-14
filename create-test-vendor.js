const { MongoClient, ObjectId } = require('mongodb');

const DATABASE_URL = 'mongodb://admin:admin@64.227.153.124:27028/?authMechanism=DEFAULT';

async function createTestVendor() {
  const client = new MongoClient(DATABASE_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('autoline');
    
    // Get existing governorate IDs
    const governorates = await db.collection('governates').find({}).toArray();
    console.log(`📍 Found ${governorates.length} governorates`);
    
    if (governorates.length === 0) {
      console.log('⚠️ No governorates found. Run setup-governates-timeslots.js first');
      return;
    }
    
    // Use first 3 governorate IDs
    const governate_ids = governorates.slice(0, 3).map(g => g._id.toString());
    console.log('📍 Using governorate IDs:', governate_ids);
    
    // Create test vendor
    const vendor = {
      _id: new ObjectId(),
      company_name: 'Test Auto Service Center',
      email: 'testvendor@autoline.com',
      phone: '+96512345678',
      password: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', // Dummy hashed password
      governate_ids: governate_ids,
      weekends: [5, 6], // Friday, Saturday
      timeslots: [
        {
          startTime: '08:00',
          endTime: '10:00',
          isActive: true,
          number_of_services: 5
        },
        {
          startTime: '10:00',
          endTime: '12:00',
          isActive: true,
          number_of_services: 5
        },
        {
          startTime: '14:00',
          endTime: '16:00',
          isActive: true,
          number_of_services: 3
        },
        {
          startTime: '16:00',
          endTime: '18:00',
          isActive: true,
          number_of_services: 3
        }
      ],
      address: 'Test Street, Kuwait City',
      business_type: 'Auto Service',
      description: 'Full-service automotive center for testing',
      is_disabled: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await db.collection('vendors').insertOne(vendor);
    console.log('✅ Test vendor created:', result.insertedId);
    console.log('📧 Email:', vendor.email);
    console.log('📞 Phone:', vendor.phone);
    console.log('📍 Governorates:', governate_ids.length);
    console.log('📅 Weekends:', vendor.weekends);
    console.log('⏰ Timeslots:', vendor.timeslots.length);
    
    // Also create a test service for this vendor
    const categories = await db.collection('categories').find({}).limit(1).toArray();
    
    if (categories.length > 0) {
      const service = {
        _id: new ObjectId(),
        vendor_id: vendor._id.toString(),
        category_id: categories[0]._id.toString(),
        service_name: 'Oil Change',
        description: 'Complete oil change service',
        price: 25.000,
        duration: 30, // minutes
        is_disabled: false,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await db.collection('services').insertOne(service);
      console.log('✅ Test service created:', service.service_name);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Connection closed');
  }
}

createTestVendor();
