// test-kyc-upload.js
// Test KYC upload endpoint
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5001/api';

const testKYCUpload = async () => {
  console.log('🧪 Testing KYC Upload Endpoint...\n');
  
  try {
    // Step 1: Test backend connection
    console.log('1️⃣ Testing Backend Connection...');
    try {
      const healthResponse = await axios.get(`${API_URL.replace('/api', '')}/`);
      console.log('✅ Backend is running');
    } catch (error) {
      console.log('❌ Backend not running!');
      console.log('🔧 Start backend: cd backend && npm start');
      return;
    }

    // Step 2: Create a test user and get token
    console.log('\n2️⃣ Creating Test User...');
    const testUser = {
      name: 'KYC Test User',
      email: `kyctest${Date.now()}@example.com`,
      phone: '03001234567',
      password: 'password123',
      role: 'restaurant'
    };

    let userToken = null;
    try {
      const signupResponse = await axios.post(`${API_URL}/auth/register`, testUser);
      userToken = signupResponse.data.token;
      console.log('✅ Test user created and token received');
    } catch (error) {
      console.log('❌ Failed to create test user:', error.response?.data?.message || error.message);
      return;
    }

    // Step 3: Test KYC upload endpoint
    console.log('\n3️⃣ Testing KYC Upload Endpoint...');
    
    // Create a simple test file
    const testFilePath = path.join(__dirname, 'test-document.txt');
    fs.writeFileSync(testFilePath, 'This is a test KYC document for testing purposes.');
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('document', fs.createReadStream(testFilePath), {
        filename: 'test-document.txt',
        contentType: 'text/plain'
      });

      console.log('📤 Sending KYC upload request...');
      const uploadResponse = await axios.post(`${API_URL}/auth/upload-kyc`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${userToken}`
        },
        timeout: 30000 // 30 second timeout
      });

      console.log('✅ KYC Upload Successful!');
      console.log('📋 Response:', {
        status: uploadResponse.data.status,
        message: uploadResponse.data.message,
        kycStatus: uploadResponse.data.user?.kycStatus
      });

    } catch (uploadError) {
      console.log('❌ KYC Upload Failed!');
      console.log('📋 Status Code:', uploadError.response?.status);
      console.log('📋 Error Response:', uploadError.response?.data);
      console.log('📋 Error Message:', uploadError.message);
      
      if (uploadError.code === 'ECONNREFUSED') {
        console.log('🔧 Backend connection refused - check if backend is running');
      } else if (uploadError.code === 'ETIMEDOUT') {
        console.log('🔧 Request timeout - backend may be slow or unresponsive');
      } else if (uploadError.response?.status === 401) {
        console.log('🔧 Authentication error - token may be invalid');
      } else if (uploadError.response?.status === 400) {
        console.log('🔧 Bad request - check file format or request structure');
      }
    } finally {
      // Clean up test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }

    // Step 4: Test with different API URLs
    console.log('\n4️⃣ Testing Different API URLs...');
    const testUrls = [
      'http://localhost:5001/api',
      'http://127.0.0.1:5001/api',
      'http://192.168.0.43:5001/api'
    ];

    for (const testUrl of testUrls) {
      try {
        console.log(`Testing: ${testUrl}`);
        const response = await axios.get(`${testUrl.replace('/api', '')}/`, { timeout: 5000 });
        console.log(`✅ ${testUrl} - Working`);
      } catch (error) {
        console.log(`❌ ${testUrl} - Failed: ${error.message}`);
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  console.log('\n📊 KYC Upload Test Summary:');
  console.log('1. Backend connectivity test');
  console.log('2. User authentication test');
  console.log('3. File upload endpoint test');
  console.log('4. Network URL variations test');
  
  console.log('\n🔧 Common Issues & Solutions:');
  console.log('- Backend not running: cd backend && npm start');
  console.log('- Wrong API URL: Check constants.js');
  console.log('- Network issues: Try different IP addresses');
  console.log('- File format: Ensure proper multipart/form-data');
  console.log('- Authentication: Check token validity');
  console.log('- Cloudinary: Check upload configuration');
};

testKYCUpload();
