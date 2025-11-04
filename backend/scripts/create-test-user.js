// backend/scripts/create-test-user.js
// Script to create test users for debugging
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const createTestUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodies');
    console.log('✅ Connected to MongoDB');

    const userEmail = process.argv[2] || 'test5@example.com';
    const userName = process.argv[3] || 'Test User';
    const userRole = process.argv[4] || 'customer';
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: userEmail });
    if (existingUser) {
      console.log(`❌ User with email ${userEmail} already exists`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   KYC Status: ${existingUser.kycStatus}`);
      process.exit(1);
    }

    // Create new user
    const user = await User.create({
      name: userName,
      email: userEmail,
      phone: '03001234567',
      password: 'password123', // Default password
      role: userRole,
      kycStatus: userRole === 'customer' ? 'approved' : 'pending'
    });

    console.log(`✅ User created successfully!`);
    console.log(`📋 User Details:`);
    console.log(`   - Name: ${user.name}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Phone: ${user.phone}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Password: password123`);
    console.log(`   - KYC Status: ${user.kycStatus}`);
    
    console.log(`\n🔑 Login Credentials:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: password123`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    process.exit(1);
  }
};

createTestUser();
