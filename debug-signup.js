// debug-signup.js
// Comprehensive signup debugging script
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const debugSignup = async () => {
  console.log('🔍 Debugging Signup Process...\n');
  
  try {
    // Step 1: Test backend connection
    console.log('1️⃣ Testing Backend Connection...');
    try {
      const healthResponse = await axios.get(`${API_URL.replace('/api', '')}/`);
      console.log('✅ Backend is running');
      console.log('📋 Backend response:', healthResponse.data);
    } catch (error) {
      console.log('❌ Backend not running!');
      console.log('🔧 Start backend: cd backend && npm start');
      return;
    }

    // Step 2: Test database connection
    console.log('\n2️⃣ Testing Database Connection...');
    try {
      const dbResponse = await axios.get(`${API_URL}/auth/test-db`);
      console.log('✅ Database connected');
      console.log('📋 Current users in DB:', dbResponse.data.userCount);
    } catch (error) {
      console.log('❌ Database connection failed!');
      console.log('📋 Error:', error.response?.data?.message || error.message);
      console.log('🔧 Check MongoDB connection in backend');
    }

    // Step 3: Test signup with detailed logging
    console.log('\n3️⃣ Testing Signup Process...');
    
    const testUser = {
      name: 'Debug Test User',
      email: `debug${Date.now()}@example.com`,
      phone: '03001234567',
      password: 'password123',
      role: 'restaurant'
    };

    console.log('📋 Signup data being sent:', {
      ...testUser,
      password: '***hidden***'
    });

    try {
      console.log('📤 Sending signup request...');
      const signupResponse = await axios.post(`${API_URL}/auth/register`, testUser, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Signup Response Received!');
      console.log('📋 Status Code:', signupResponse.status);
      console.log('📋 Response Data:', {
        status: signupResponse.data.status,
        user: signupResponse.data.user,
        token: signupResponse.data.token ? 'Token received' : 'No token'
      });

      // Step 4: Verify user was created in database
      console.log('\n4️⃣ Verifying User in Database...');
      try {
        const dbCheckResponse = await axios.get(`${API_URL}/auth/test-db`);
        console.log('📋 Users in DB after signup:', dbCheckResponse.data.userCount);
        
        // Try to login with created user
        console.log('\n5️⃣ Testing Login with Created User...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          email: testUser.email,
          password: testUser.password
        });
        
        console.log('✅ Login successful! User exists in database');
        console.log('📋 Login response:', {
          status: loginResponse.data.status,
          user: loginResponse.data.user
        });
        
      } catch (loginError) {
        console.log('❌ Login failed - User may not be saved to database');
        console.log('📋 Login error:', loginError.response?.data?.message || loginError.message);
      }

    } catch (signupError) {
      console.log('❌ Signup Failed!');
      console.log('📋 Status Code:', signupError.response?.status);
      console.log('📋 Error Response:', signupError.response?.data);
      console.log('📋 Error Message:', signupError.message);
      
      if (signupError.code === 'ECONNREFUSED') {
        console.log('🔧 Backend is not running or not accessible');
      } else if (signupError.response?.status === 400) {
        console.log('🔧 Validation error or user already exists');
      } else if (signupError.response?.status === 500) {
        console.log('🔧 Server error - check backend console for details');
      }
    }

    // Step 6: Check current database state
    console.log('\n6️⃣ Final Database Check...');
    try {
      const finalDbResponse = await axios.get(`${API_URL}/auth/test-db`);
      console.log('📋 Final user count:', finalDbResponse.data.userCount);
    } catch (error) {
      console.log('❌ Could not check final database state');
    }

  } catch (error) {
    console.log('❌ Debug script failed:', error.message);
  }

  console.log('\n📊 Debugging Summary:');
  console.log('1. ✅ Backend running?');
  console.log('2. ✅ Database connected?');
  console.log('3. ✅ Signup request successful?');
  console.log('4. ✅ User saved to database?');
  console.log('5. ✅ Login works with created user?');
  
  console.log('\n🔧 Common Issues:');
  console.log('- Backend not running: cd backend && npm start');
  console.log('- MongoDB not connected: Check connection string');
  console.log('- Validation errors: Check required fields');
  console.log('- Duplicate email: User already exists');
  console.log('- Server errors: Check backend console logs');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Check backend console for detailed error logs');
  console.log('2. Verify MongoDB is running and accessible');
  console.log('3. Check network connectivity to backend');
  console.log('4. Try signup with different email address');
};

debugSignup();
