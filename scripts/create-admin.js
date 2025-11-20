const bcryptjs = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../src/models/User');

// Import connectDB function
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://webnextdatabase:webnext123@webnext.5wtvsao.mongodb.net/billmate?retryWrites=true&w=majority');
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