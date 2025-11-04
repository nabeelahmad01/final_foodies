// test-signup.js
// Test signup functionality and database connection
const axios = require('axios');

const API_URL = 'http://192.168.0.43:5000/api';

const testSignup = async () => {
  console.log('🧪 Testing Signup Process...\n');
  
  try {
    // Test 1: Backend connectivity
    console.log('1️⃣ Testing Backend Connection...');
    try {
      const healthCheck = await axios.get(`${API_URL.replace('/api', '')}/`);
      console.log('✅ Backend is running');
      console.log('📋 Response:', healthCheck.data);
    } catch (error) {
      console.log('❌ Backend connection failed:', error.message);
      console.log('🔧 Make sure backend is running: cd backend && npm start');
      return;
    }

    // Test 2: Test signup endpoint
    console.log('\n2️⃣ Testing Signup Endpoint...');
    const testUser = {
      name: 'Test Signup User',
      email: `testsignup${Date.now()}@example.com`,
      phone: '03001234567',
      password: 'password123',
      role: 'restaurant'
    };

    console.log('📋 Sending signup data:', {
      ...testUser,
      password: '***hidden***'
    });

    try {
      const signupResponse = await axios.post(`${API_URL}/auth/register`, testUser);
      console.log('✅ Signup successful!');
      console.log('📋 Response status:', signupResponse.status);
      console.log('📋 User created:', {
        id: signupResponse.data.user._id,
        name: signupResponse.data.user.name,
        email: signupResponse.data.user.email,
        role: signupResponse.data.user.role
      });
      console.log('📋 Token received:', signupResponse.data.token ? 'Yes' : 'No');
      
      // Test 3: Verify user exists in database
      console.log('\n3️⃣ Testing Login with Created User...');
      try {
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          email: testUser.email,
          password: testUser.password
        });
        console.log('✅ Login successful - User exists in database!');
        console.log('📋 Login user data:', {
          id: loginResponse.data.user._id,
          name: loginResponse.data.user.name,
          email: loginResponse.data.user.email
        });
      } catch (loginError) {
        console.log('❌ Login failed - User may not be in database');
        console.log('📋 Login error:', loginError.response?.data?.message || loginError.message);
      }
      
    } catch (signupError) {
      console.log('❌ Signup failed!');
      console.log('📋 Status:', signupError.response?.status);
      console.log('📋 Error:', signupError.response?.data?.message || signupError.message);
      console.log('📋 Full error:', signupError.response?.data);
      
      // Check if it's a validation error
      if (signupError.response?.status === 400) {
        console.log('🔧 This might be a validation error or user already exists');
      }
      
      // Check if it's a database connection error
      if (signupError.response?.status === 500) {
        console.log('🔧 This might be a database connection error');
        console.log('🔧 Check MongoDB connection in backend');
      }
    }

    // Test 4: Check database connection directly
    console.log('\n4️⃣ Testing Database Connection...');
    try {
      const dbTestResponse = await axios.get(`${API_URL}/auth/test-db`);
      console.log('✅ Database connection test successful');
    } catch (dbError) {
      console.log('❌ Database connection test failed');
      console.log('📋 Error:', dbError.response?.data?.message || dbError.message);
      console.log('🔧 Check if MongoDB is running and connected');
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  console.log('\n📊 Summary:');
  console.log('1. Check if backend is running');
  console.log('2. Check if MongoDB is connected');
  console.log('3. Check signup endpoint validation');
  console.log('4. Check database write permissions');
  console.log('\n🔧 If signup still fails:');
  console.log('- Check backend console for errors');
  console.log('- Check MongoDB connection string');
  console.log('- Check User model validation');
};

testSignup();
