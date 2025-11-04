// backend/scripts/debug-user.js
// Script to debug user login issues
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const debugUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodies');
    console.log('✅ Connected to MongoDB');

    const userEmail = process.argv[2];
    
    if (!userEmail) {
      console.log('Usage: node debug-user.js <user-email>');
      console.log('Example: node debug-user.js test5@example.com');
      
      // Show all users
      console.log('\n📋 All users in database:');
      const allUsers = await User.find({}, { name: 1, email: 1, role: 1, kycStatus: 1, createdAt: 1 });
      if (allUsers.length === 0) {
        console.log('❌ No users found in database');
      } else {
        allUsers.forEach((user, index) => {
          console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role} - KYC: ${user.kycStatus}`);
        });
      }
      process.exit(0);
    }

    // Find specific user
    const user = await User.findOne({ email: userEmail }).select('+password');
    
    if (!user) {
      console.log(`❌ User with email ${userEmail} not found`);
      console.log('\n💡 To create this user, run:');
      console.log(`node create-test-user.js ${userEmail}`);
    } else {
      console.log(`✅ User found: ${user.name} (${user.email})`);
      console.log(`📋 User Details:`);
      console.log(`   - ID: ${user._id}`);
      console.log(`   - Name: ${user.name}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Phone: ${user.phone}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - KYC Status: ${user.kycStatus}`);
      console.log(`   - Active: ${user.isActive}`);
      console.log(`   - Created: ${user.createdAt}`);
      console.log(`   - Password Hash: ${user.password ? 'Set' : 'Not set'}`);
      
      // Test password comparison
      if (user.password) {
        const testPassword = 'password123';
        const isMatch = await user.comparePassword(testPassword);
        console.log(`   - Password '${testPassword}' match: ${isMatch ? '✅' : '❌'}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

debugUser();
