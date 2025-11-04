// backend/scripts/approve-kyc.js
// Script to manually approve KYC for users
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const approveKYC = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodies');
    console.log('Connected to MongoDB');

    // Get user email from command line argument
    const userEmail = process.argv[2];
    
    if (!userEmail) {
      console.log('Usage: node approve-kyc.js <user-email>');
      console.log('Example: node approve-kyc.js admin786@gmail.com');
      process.exit(1);
    }

    // Find and update user
    const user = await User.findOneAndUpdate(
      { email: userEmail },
      { 
        kycStatus: 'approved',
        $unset: { kycRejectionReason: 1 } // Remove rejection reason if exists
      },
      { new: true }
    );

    if (!user) {
      console.log(`❌ User with email ${userEmail} not found`);
      process.exit(1);
    }

    console.log(`✅ KYC approved for user: ${user.name} (${user.email})`);
    console.log(`📋 User Details:`);
    console.log(`   - Name: ${user.name}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - KYC Status: ${user.kycStatus}`);
    console.log(`   - Restaurant ID: ${user.restaurantId || 'Not set up yet'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error approving KYC:', error);
    process.exit(1);
  }
};

// Approve KYC for all restaurant/rider users (bulk operation)
const approveAllKYC = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodies');
    console.log('Connected to MongoDB');

    const result = await User.updateMany(
      { 
        role: { $in: ['restaurant', 'rider'] },
        kycStatus: { $ne: 'approved' }
      },
      { 
        kycStatus: 'approved',
        $unset: { kycRejectionReason: 1 }
      }
    );

    console.log(`✅ Approved KYC for ${result.modifiedCount} users`);
    
    // Show updated users
    const updatedUsers = await User.find(
      { role: { $in: ['restaurant', 'rider'] } },
      { name: 1, email: 1, role: 1, kycStatus: 1 }
    );

    console.log('\n📋 All Restaurant/Rider Users:');
    updatedUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role} - ${user.kycStatus}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error in bulk KYC approval:', error);
    process.exit(1);
  }
};

// Check command line arguments
if (process.argv[2] === '--all') {
  approveAllKYC();
} else {
  approveKYC();
}
