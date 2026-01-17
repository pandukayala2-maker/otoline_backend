import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Config from '../config/dot_config';
import { AuthModel } from '../modules/auth/auth_model';
import { UserTypeEnum } from '../constant/enum';

dotenv.config();

async function run() {
  const EMAIL = process.env.SEED_ADMIN_EMAIL || 'superadmin@ootoline.com';
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
      existing.password = PASSWORD;
      await existing.save();
      console.log('Updated admin password to default for local dev.');
    } else {
      const auth = await AuthModel.create({
        email: EMAIL,
        password: PASSWORD,
        usertype: UserTypeEnum.admin,
        is_email_verified: true,
      });

      console.log('Admin user created:\n', { id: auth.id, email: EMAIL, usertype: 'admin' });
    }
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
