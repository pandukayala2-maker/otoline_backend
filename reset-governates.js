const { MongoClient } = require('mongodb');

const DATABASE_URL = 'mongodb://admin:admin@64.227.153.124:27028/?authMechanism=DEFAULT';

async function resetGovernates() {
  const client = new MongoClient(DATABASE_URL);
  
  try {
    await client.connect();
    const db = client.db('autoline');
    
    // Update all governates to have null vendor_id (admin-owned)
    const result = await db.collection('governates').updateMany(
      {},
      { 
        $set: { vendor_id: null },
        $unset: { vendor: '' }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} governates to admin-owned (vendor_id: null)`);
    
    // Verify
    const governates = await db.collection('governates').find({}).toArray();
    console.log(`\nTotal governates: ${governates.length}`);
    governates.forEach(g => {
      console.log(`- ${g.name}: vendor_id=${g.vendor_id}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

resetGovernates();
