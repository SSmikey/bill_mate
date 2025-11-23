// Simple test script to verify room management API endpoints
// Run with: node test-room-management.js

const BASE_URL = 'http://localhost:3000';

// Test data
const testRoom = {
  roomNumber: 'TEST-101',
  floor: 1,
  rentPrice: 3000,
  waterPrice: 100,
  electricityPrice: 5
};

const testTenant = {
  name: 'Test Tenant',
  email: 'tenant@test.com',
  password: 'password123',
  role: 'tenant',
  phone: '0812345678'
};

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', data = null, isFormData = false) {
  const options = {
    method,
    headers: {}
  };

  if (data) {
    if (isFormData) {
      options.body = data; // FormData object
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`\n${method} ${endpoint}`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', result);
    
    return { success: response.ok, data: result };
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    return { success: false, error: error.message };
  }
}

// Test functions
async function testRoomManagement() {
  console.log('=== Testing Room Management Workflow ===\n');
  
  // 1. Create a test room
  console.log('1. Creating test room...');
  const roomResult = await apiCall('/api/rooms', 'POST', testRoom);
  if (!roomResult.success) {
    console.error('Failed to create room');
    return;
  }
  const roomId = roomResult.data.data._id;
  console.log(`Room created with ID: ${roomId}`);
  
  // 2. Create a test tenant
  console.log('\n2. Creating test tenant...');
  const tenantResult = await apiCall('/api/users', 'POST', testTenant);
  if (!tenantResult.success) {
    console.error('Failed to create tenant');
    return;
  }
  const tenantId = tenantResult.data.data._id;
  console.log(`Tenant created with ID: ${tenantId}`);
  
  // 3. Assign tenant to room
  console.log('\n3. Assigning tenant to room...');
  const assignmentData = new FormData();
  assignmentData.append('tenantId', tenantId);
  assignmentData.append('moveInDate', new Date().toISOString().split('T')[0]);
  assignmentData.append('rentDueDate', '5');
  assignmentData.append('depositAmount', '3000');
  assignmentData.append('notes', 'Test assignment notes');
  
  const assignResult = await apiCall(`/api/rooms/${roomId}/assign`, 'POST', assignmentData, true);
  if (!assignResult.success) {
    console.error('Failed to assign tenant to room');
    return;
  }
  console.log('Tenant assigned to room successfully');
  
  // 4. Get room statistics
  console.log('\n4. Getting room statistics...');
  const statsResult = await apiCall('/api/rooms/stats');
  if (!statsResult.success) {
    console.error('Failed to get room statistics');
    return;
  }
  console.log('Room statistics retrieved successfully');
  
  // 5. Checkout tenant from room
  console.log('\n5. Checking out tenant from room...');
  const checkoutResult = await apiCall(`/api/rooms/${roomId}/assign`, 'DELETE');
  if (!checkoutResult.success) {
    console.error('Failed to checkout tenant from room');
    return;
  }
  console.log('Tenant checked out from room successfully');
  
  // 6. Clean up - delete test data
  console.log('\n6. Cleaning up test data...');
  await apiCall(`/api/rooms/${roomId}`, 'DELETE');
  await apiCall(`/api/users/${tenantId}`, 'DELETE');
  console.log('Test data cleaned up');
  
  console.log('\n=== Room Management Workflow Test Completed Successfully ===');
}

// Run the test
testRoomManagement().catch(console.error);