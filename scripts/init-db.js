// Load environment variables
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

// Define User schema inline to avoid import issues
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['admin', 'tenant'], default: 'tenant' },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function initializeDatabase() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://webnextdatabase:webnext123@webnext.5wtvsao.mongodb.net/billmate?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Admin credentials from environment variables
    const adminData = {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      name: process.env.ADMIN_NAME,
      phone: process.env.ADMIN_PHONE,
      role: 'admin'
    };

    // Validate that all required environment variables are set
    if (!adminData.email || !adminData.password || !adminData.name) {
      throw new Error('Missing required admin credentials in environment variables. Please check ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME in .env.local');
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
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

    console.log('✅ Admin user created successfully!');
    console.log('===============================');
    console.log('Admin credentials have been set from environment variables');
    console.log(`Role: ${adminData.role}`);
    console.log('===============================');
    console.log('Check your .env.local file for the actual credentials');
    console.log('');
    console.log('You can now login at: http://localhost:3000/login');
    console.log('Start the development server with: npm run dev');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
initializeDatabase();