// test-network-kyc.js
// Test KYC upload with exact same setup as React Native
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://192.168.0.43:5000/api'; // Same as React Native

const testNetworkKYC = async () => {
  console.log('🔍 Testing Network KYC Upload (Same as React Native)...\n');
  
  try {
    // Step 1: Test basic connectivity
    console.log('1️⃣ Testing Basic Connectivity...');
    try {
      const response = await axios.get('http://192.168.0.43:5000/', { timeout: 5000 });
      console.log('✅ Backend reachable:', response.data.message);
    } catch (error) {
      console.log('❌ Backend not reachable:', error.message);
      return;
    }

    // Step 2: Create test user and get token
    console.log('\n2️⃣ Creating Test User...');
    const testUser = {
      name: 'Network KYC Test',
      email: `networkkyc${Date.now()}@example.com`,
      phone: '03001234567',
      password: 'password123',
      role: 'restaurant'
    };

    let userToken = null;
    try {
      const signupResponse = await axios.post(`${API_URL}/auth/register`, testUser, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      userToken = signupResponse.data.token;
      console.log('✅ User created, token received');
      console.log('📋 Token length:', userToken.length);
    } catch (error) {
      console.log('❌ User creation failed:', error.response?.data || error.message);
      return;
    }

    // Step 3: Create test image (same as React Native would send)
    console.log('\n3️⃣ Creating Test Image...');
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0B, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x62, 0x00, 0x02, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
    
    const testImagePath = path.join(__dirname, 'network-test.png');
    fs.writeFileSync(testImagePath, pngData);
    console.log('✅ Test image created');

    // Step 4: Test KYC upload exactly like React Native
    console.log('\n4️⃣ Testing KYC Upload (React Native Style)...');
    
    try {
      const formData = new FormData();
      
      // Simulate React Native FormData structure
      formData.append('document', fs.createReadStream(testImagePath), {
        filename: 'test-kyc-image.png',
        contentType: 'image/png'
      });

      console.log('📤 Sending upload request...');
      console.log('📋 URL:', `${API_URL}/auth/upload-kyc`);
      console.log('📋 Headers will include:', {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${userToken.substring(0, 20)}...`
      });

      const uploadResponse = await axios.post(`${API_URL}/auth/upload-kyc`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${userToken}`
        },
        timeout: 30000, // 30 second timeout
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      console.log('✅ KYC Upload Successful!');
      console.log('📋 Status:', uploadResponse.status);
      console.log('📋 Response:', {
        status: uploadResponse.data.status,
        message: uploadResponse.data.message,
        kycStatus: uploadResponse.data.user?.kycStatus
      });

    } catch (uploadError) {
      console.log('❌ KYC Upload Failed!');
      console.log('📋 Error Type:', uploadError.constructor.name);
      console.log('📋 Error Code:', uploadError.code);
      console.log('📋 Status Code:', uploadError.response?.status);
      console.log('📋 Error Message:', uploadError.message);
      console.log('📋 Response Data:', uploadError.response?.data);
      
      // Detailed error analysis
      if (uploadError.code === 'ECONNREFUSED') {
        console.log('🔧 Connection refused - backend not running or wrong port');
      } else if (uploadError.code === 'ETIMEDOUT') {
        console.log('🔧 Timeout - request took too long');
      } else if (uploadError.code === 'ENOTFOUND') {
        console.log('🔧 DNS/Network error - IP address not reachable');
      } else if (uploadError.response?.status === 401) {
        console.log('🔧 Authentication error - invalid token');
      } else if (uploadError.response?.status === 400) {
        console.log('🔧 Bad request - check file format or data');
      } else if (uploadError.response?.status === 500) {
        console.log('🔧 Server error - check backend logs');
      } else if (uploadError.message.includes('Network Error')) {
        console.log('🔧 Generic network error - check connectivity');
      }
    }

    // Cleanup
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }

    // Step 5: Test different network configurations
    console.log('\n5️⃣ Testing Network Configurations...');
    const testUrls = [
      'http://192.168.0.43:5000',
      'http://localhost:5000',
      'http://127.0.0.1:5000'
    ];

    for (const url of testUrls) {
      try {
        const response = await axios.get(url, { timeout: 3000 });
        console.log(`✅ ${url} - Working`);
      } catch (error) {
        console.log(`❌ ${url} - Failed: ${error.message}`);
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  console.log('\n📊 Network KYC Test Summary:');
  console.log('- Backend connectivity test');
  console.log('- User authentication test');
  console.log('- File upload simulation test');
  console.log('- Network configuration test');
  
  console.log('\n🔧 If still getting Network Error in React Native:');
  console.log('1. Check if phone and computer on same WiFi');
  console.log('2. Check Windows Firewall settings');
  console.log('3. Try different IP address (ipconfig)');
  console.log('4. Check React Native Metro bundler');
  console.log('5. Try restarting Expo/React Native app');
};

testNetworkKYC();
