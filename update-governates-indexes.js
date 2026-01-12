// Script to update governates collection indexes
// This removes the unique constraint on name field and adds a compound unique index on (name, vendor_id)
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.DB_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'autoline';

async function updateGovernatesIndexes() {
    try {
        await mongoose.connect(MONGODB_URI, {
            dbName: DB_NAME,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('governates');

        // Get current indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', JSON.stringify(indexes, null, 2));

        // Drop the unique index on name field if it exists
        try {
            await collection.dropIndex('name_1');
            console.log('Dropped unique index on name field');
        } catch (error) {
            console.log('No name_1 index to drop or error:', error.message);
        }

        // Check if compound index already exists
        const hasCompoundIndex = indexes.some(idx => 
            idx.name === 'name_1_vendor_id_1' || idx.name === 'name_vendor_unique'
        );

        if (!hasCompoundIndex) {
            // Create compound unique index on name and vendor_id
            await collection.createIndex(
                { name: 1, vendor_id: 1 },
                { unique: true, name: 'name_vendor_unique' }
            );
            console.log('Created compound unique index on (name, vendor_id)');
        } else {
            console.log('Compound unique index already exists');
        }

        // Verify new indexes
        const newIndexes = await collection.indexes();
        console.log('New indexes:', JSON.stringify(newIndexes, null, 2));

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

updateGovernatesIndexes();
