// scripts/approveRestaurant.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import User model
import User from '../backend/models/User.js';

async function approveRestaurantUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find and update the user
    const user = await User.findOneAndUpdate(
      { email: 'admin786@gmail.com' },
      { 
        kycStatus: 'approved',
        role: 'restaurant'
      },
      { new: true }
    );

    if (!user) {
      console.error('User not found with email: admin786@gmail.com');
      process.exit(1);
    }

    console.log('User updated successfully:');
    console.log({
      name: user.name,
      email: user.email,
      role: user.role,
      kycStatus: user.kycStatus,
      _id: user._id
    });

    process.exit(0);
  } catch (error) {
    console.error('Error updating user:', error);
    process.exit(1);
  }
}

// Run the function
approveRestaurantUser();
