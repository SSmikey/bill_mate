// Load environment variables
require('dotenv').config({ path: '.env.local' });

const http = require('http');

// Admin credentials from environment variables
const adminData = {
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
  name: process.env.ADMIN_NAME,
  phone: process.env.ADMIN_PHONE
};

// Validate that all required environment variables are set
if (!adminData.email || !adminData.password || !adminData.name) {
  console.error('❌ Error: Missing required admin credentials in environment variables.');
  console.error('Please check ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME in .env.local');
  process.exit(1);
}

const postData = JSON.stringify(adminData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/init-admin',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Creating admin user...');
console.log('Please make sure your Next.js development server is running on http://localhost:3000');
console.log('');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 201) {
        console.log('✅ Admin user created successfully!');
        console.log('===============================');
        console.log('Admin credentials have been set from environment variables');
        console.log('Role: admin');
        console.log('===============================');
        console.log('Check your .env.local file for the actual credentials');
        console.log('');
        console.log('You can now login at: http://localhost:3000/login');
      } else {
        console.log('❌ Error creating admin user:');
        console.log(response.error || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error making request:', error.message);
  console.log('');
  console.log('Please make sure:');
  console.log('1. Your Next.js development server is running on http://localhost:3000');
  console.log('2. You have MongoDB connection configured in .env.local');
  console.log('');
  console.log('To start the server, run: npm run dev');
});

req.write(postData);
req.end();