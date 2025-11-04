// test-backend.js
// Simple script to test backend connectivity
const axios = require('axios');

const API_URL = 'http://192.168.0.43:5000/api';

const testBackend = async () => {
  console.log('🔍 Testing backend connectivity...');
  console.log(`API URL: ${API_URL}`);
  
  try {
    // Test basic connectivity
    console.log('\n1. Testing basic connectivity...');
    const response = await axios.get(`${API_URL.replace('/api', '')}/`);
    console.log('✅ Backend is running');
    
    // Test API endpoint
    console.log('\n2. Testing API endpoint...');
    try {
      const apiResponse = await axios.get(`${API_URL}/restaurants`);
      console.log('✅ API endpoint working');
      console.log(`📊 Found ${apiResponse.data?.restaurants?.length || 0} restaurants`);
    } catch (apiError) {
      console.log('⚠️ API endpoint issue:', apiError.response?.status || apiError.message);
    }
    
    // Test login endpoint
    console.log('\n3. Testing login endpoint...');
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      });
    } catch (loginError) {
      if (loginError.response?.status === 401) {
        console.log('✅ Login endpoint working (401 expected for invalid credentials)');
      } else {
        console.log('❌ Login endpoint error:', loginError.response?.status || loginError.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Backend connection failed:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solutions:');
      console.log('   1. Make sure backend server is running: cd backend && npm run dev');
      console.log('   2. Check if port 5000 is correct');
      console.log('   3. Verify IP address in constants.js');
    }
  }
};

testBackend();
