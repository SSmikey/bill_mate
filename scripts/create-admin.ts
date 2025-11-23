import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User';
import connectDB from '../src/lib/mongodb';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function createAdmin() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');

    // Admin credentials
    const adminData = {
      email: 'admin@billmate.com',
      password: 'admin123',
      name: 'System Administrator',
      phone: '0800000000',
      role: 'admin'
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log(`Email: ${adminData.email}`);
      console.log('Password: admin123');
      return;
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(adminData.password, salt);

    // Create admin user
    const admin = await User.create({
      email: adminData.email,
      password: hashedPassword,
      name: adminData.name,
      phone: adminData.phone,
      role: adminData.role
    });

    console.log('Admin user created successfully!');
    console.log('===============================');
    console.log(`Email: ${adminData.email}`);
    console.log(`Password: ${adminData.password}`);
    console.log(`Name: ${adminData.name}`);
    console.log(`Role: ${adminData.role}`);
    console.log('===============================');
    console.log('Please save these credentials securely!');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
createAdmin();