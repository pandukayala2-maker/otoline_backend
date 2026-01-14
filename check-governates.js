const { MongoClient } = require('mongodb');

const DATABASE_URL = 'mongodb://admin:admin@64.227.153.124:27028/?authMechanism=DEFAULT';

async function checkGovernates() {
  const client = new MongoClient(DATABASE_URL);
  
  try {
    await client.connect();
    const db = client.db('autoline');
    
    const governates = await db.collection('governates').find({}).toArray();
    console.log(`Total governates: ${governates.length}`);
    
    if (governates.length > 0) {
      console.log('\nFirst governate:');
      console.log(JSON.stringify(governates[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

checkGovernates();
