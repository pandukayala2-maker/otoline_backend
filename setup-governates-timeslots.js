// Script to create sample governorates and add them to vendors
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/autoline';

async function setupGovernatesAndVendors() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // First, create sample governorates if they don't exist
        const governatesCollection = mongoose.connection.db.collection('governates');
        
        const sampleGovernorates = [
            { name: 'Kuwait City', value: 5, is_disabled: false, deleted_at: null, vendor_id: null },
            { name: 'Farwaniya', value: 3, is_disabled: false, deleted_at: null, vendor_id: null },
            { name: 'Hawalli', value: 4, is_disabled: false, deleted_at: null, vendor_id: null },
            { name: 'Ahmadi', value: 6, is_disabled: false, deleted_at: null, vendor_id: null },
            { name: 'Jahra', value: 7, is_disabled: false, deleted_at: null, vendor_id: null },
            { name: 'Mubarak Al-Kabeer', value: 5, is_disabled: false, deleted_at: null, vendor_id: null },
        ];

        // Check if governorates already exist
        const existingCount = await governatesCollection.countDocuments({ deleted_at: null });
        
        if (existingCount === 0) {
            console.log('No governorates found. Creating sample governorates...');
            await governatesCollection.insertMany(sampleGovernorates);
            console.log(`Created ${sampleGovernorates.length} governorates`);
        } else {
            console.log(`Found ${existingCount} existing governorates`);
        }

        // Get all governates
        const allGovernorates = await governatesCollection.find({ deleted_at: null }).toArray();
        const governateIds = allGovernorates.map(g => g._id.toString());
        console.log('Governate IDs:', governateIds);

        // Sample timeslots
        const now = new Date();
        const sampleTimeslots = [
            {
                startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0),
                endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0),
                isActive: true,
                number_of_services: 5
            },
            {
                startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0),
                endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0),
                isActive: true,
                number_of_services: 5
            },
            {
                startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0),
                endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0, 0),
                isActive: true,
                number_of_services: 3
            },
            {
                startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0, 0),
                endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0),
                isActive: true,
                number_of_services: 3
            }
        ];

        // Sample weekends: Friday (5) and Saturday (6)
        // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
        const sampleWeekends = [5, 6];

        // Update all vendors to add timeslots, governate_ids, and weekends
        const vendorsCollection = mongoose.connection.db.collection('vendors');
        
        const vendorCount = await vendorsCollection.countDocuments({});
        console.log(`\nFound ${vendorCount} vendors in database`);

        if (vendorCount === 0) {
            console.log('WARNING: No vendors found in database!');
            console.log('Please create vendors first, then run this script again.');
        } else {
            const result = await vendorsCollection.updateMany(
                {},
                {
                    $set: {
                        timeslots: sampleTimeslots,
                        governate_ids: governateIds,
                        weekends: sampleWeekends
                    }
                }
            );

            console.log(`Updated ${result.modifiedCount} vendors with:`);
            console.log(`  - ${sampleTimeslots.length} timeslots`);
            console.log(`  - ${governateIds.length} governate IDs`);
            console.log(`  - Weekends: Friday and Saturday`);
            
            // Show a sample vendor
            const sampleVendor = await vendorsCollection.findOne({});
            if (sampleVendor) {
                console.log('\nSample vendor data:');
                console.log('  Company:', sampleVendor.company_name);
                console.log('  Timeslots count:', sampleVendor.timeslots?.length || 0);
                console.log('  Governate IDs count:', sampleVendor.governate_ids?.length || 0);
                console.log('  Weekends:', sampleVendor.weekends);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

setupGovernatesAndVendors();
