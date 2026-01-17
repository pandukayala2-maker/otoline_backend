import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Config from '../config/dot_config';
import { AuthModel } from '../modules/auth/auth_model';
import { VendorModel } from '../modules/vendor/vendor_model';
import { UserTypeEnum } from '../constant/enum';

dotenv.config();

async function run() {
  const EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@ootoline.com';
  const PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'password';

  console.log(`Seeding admin user: ${EMAIL}`);

  await mongoose.connect(Config._DB_URL, {
    dbName: Config._DB_NAME,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  try {
    const existing = await AuthModel.findOne({ email: EMAIL });
    if (existing) {
      console.log('Admin already exists:\n', {
        id: existing.id,
        email: existing.email,
        usertype: existing.usertype,
      });
      existing.password = PASSWORD; // force reset locally
      await existing.save();
      console.log('Updated admin password to default for local dev.');
    } else {
      const auth = await AuthModel.create({
        email: EMAIL,
        password: PASSWORD,
        usertype: UserTypeEnum.vendor,
        is_email_verified: true,
      });

      await VendorModel.create({
        _id: auth._id,
        email: EMAIL,
        company_name: 'Local Vendor',
        owner_name: 'Admin',
        country: 'Local',
        address: { name: 'Local', phone: '', street: '', area: '', block: '', type: '' },
      } as any);

      console.log('Admin vendor created:\n', { id: auth.id, email: EMAIL });
    }
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
