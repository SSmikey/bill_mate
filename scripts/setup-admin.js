const http = require('http');

const adminData = {
  email: 'admin@billmate.com',
  password: 'admin123',
  name: 'System Administrator',
  phone: '0800000000'
};

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
        console.log(`Email: ${adminData.email}`);
        console.log(`Password: ${adminData.password}`);
        console.log(`Name: ${adminData.name}`);
        console.log(`Role: admin`);
        console.log('===============================');
        console.log('Please save these credentials securely!');
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