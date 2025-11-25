// Load environment variables
require('dotenv').config({ path: '.env.local' });

const bcryptjs = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../src/models/User');

// Import connectDB function
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set in environment variables. Please check your .env.local file.');
    }
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

async function createAdmin() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');

    // Admin credentials from environment variables
    const adminData = {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      name: process.env.ADMIN_NAME,
      phone: process.env.ADMIN_PHONE,
      role: 'admin'
    };

    // Validate required fields
    if (!adminData.email || !adminData.password || !adminData.name) {
      throw new Error('Missing required admin credentials in environment variables. Please check ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME in .env.local');
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log(`Email: ${adminData.email}`);
      console.log('Check .env.local for the password');
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

    console.log('✅ Admin user created successfully!');
    console.log('===============================');
    console.log(`Email: ${adminData.email}`);
    console.log(`Name: ${adminData.name}`);
    console.log(`Role: ${adminData.role}`);
    console.log('===============================');
    console.log('Check your .env.local file for the password');
    console.log('You can now login at: http://localhost:3000/login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
createAdmin();