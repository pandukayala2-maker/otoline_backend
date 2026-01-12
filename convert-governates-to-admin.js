// Script to convert vendor-specific governates to admin governates (visible to all vendors)
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.DB_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'autoline';

async function convertToAdminGovernates() {
    try {
        await mongoose.connect(MONGODB_URI, {
            dbName: DB_NAME,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        console.log('Connected to MongoDB');

        // Update all governates to have vendor_id: null (making them admin governates)
        const result = await mongoose.connection.db.collection('governates').updateMany(
            { vendor_id: { $exists: true, $ne: null } }, // Find all governates with vendor_id
            { $set: { vendor_id: null } } // Set vendor_id to null
        );

        console.log(`Updated ${result.modifiedCount} governates to admin governates`);
        console.log('All vendors will now see these governates');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

convertToAdminGovernates();
