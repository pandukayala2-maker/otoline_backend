// Script to add sample timeslots and governate_ids to vendors
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/autoline';

async function addTimeslotsAndGovernates() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // First, get all governates
        const governatesCollection = mongoose.connection.db.collection('governates');
        const allGovernorates = await governatesCollection.find({ deleted_at: null }).toArray();
        console.log(`Found ${allGovernorates.length} governorates in database`);

        // Get governate IDs (strings)
        const governateIds = allGovernorates.map(g => g._id.toString());
        console.log('Governate IDs:', governateIds);

        // Sample timeslots
        const sampleTimeslots = [
            {
                startTime: new Date('2024-01-01T08:00:00Z'),
                endTime: new Date('2024-01-01T10:00:00Z'),
                isActive: true,
                number_of_services: 5
            },
            {
                startTime: new Date('2024-01-01T10:00:00Z'),
                endTime: new Date('2024-01-01T12:00:00Z'),
                isActive: true,
                number_of_services: 5
            },
            {
                startTime: new Date('2024-01-01T14:00:00Z'),
                endTime: new Date('2024-01-01T16:00:00Z'),
                isActive: true,
                number_of_services: 3
            },
            {
                startTime: new Date('2024-01-01T16:00:00Z'),
                endTime: new Date('2024-01-01T18:00:00Z'),
                isActive: true,
                number_of_services: 3
            }
        ];

        // Sample weekends: Friday (5) and Saturday (6)
        const sampleWeekends = [5, 6]; // 0=Sunday, 1=Monday, ..., 6=Saturday

        // Update all vendors to add timeslots, governate_ids, and weekends
        const vendorsCollection = mongoose.connection.db.collection('vendors');
        const result = await vendorsCollection.updateMany(
            { deleted_at: null },
            {
                $set: {
                    timeslots: sampleTimeslots,
                    governate_ids: governateIds, // Assign all governates to all vendors
                    weekends: sampleWeekends
                }
            }
        );

        console.log(`Updated ${result.modifiedCount} vendors with timeslots, governate_ids, and weekends`);
        console.log('Sample data added successfully!');
        
        // Show a sample vendor
        const sampleVendor = await vendorsCollection.findOne({ deleted_at: null });
        console.log('\nSample vendor data:');
        console.log('Company:', sampleVendor.company_name);
        console.log('Timeslots:', sampleVendor.timeslots?.length || 0);
        console.log('Governate IDs:', sampleVendor.governate_ids?.length || 0);
        console.log('Weekends:', sampleVendor.weekends);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

addTimeslotsAndGovernates();
