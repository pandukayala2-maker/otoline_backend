const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/autoline');
    
    const vendors = await mongoose.connection.db.collection('vendors').find({}).toArray();
    console.log('Total vendors:', vendors.length);
    
    vendors.forEach((v, i) => {
        console.log(`${i+1}. ${v.company_name} - timeslots: ${v.timeslots?.length || 0}, governate_ids: ${v.governate_ids?.length || 0}`);
    });
    
    await mongoose.disconnect();
}

main().catch(console.error);
