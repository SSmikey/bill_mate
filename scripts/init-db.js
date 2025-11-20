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
    console.log(`Email: ${adminData.email}`);
    console.log(`Password: ${adminData.password}`);
    console.log(`Name: ${adminData.name}`);
    console.log(`Role: ${adminData.role}`);
    console.log('===============================');
    console.log('Please save these credentials securely!');
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