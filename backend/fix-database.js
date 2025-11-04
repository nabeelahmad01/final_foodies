// fix-database.js
// Fix database connection to use foodie_app instead of test
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const fixDatabase = async () => {
  try {
    console.log('🔧 Fixing Database Connection...\n');
    
    // Current connection string
    const currentURI = process.env.MONGODB_URI;
    console.log('📋 Current URI:', currentURI.replace(/(mongodb[+srv]*:\/\/)([^:]+):([^@]+)@/, '$1****:****@'));
    
    // Check if URI already has database name
    if (currentURI.includes('/foodie_app')) {
      console.log('✅ URI already points to foodie_app database');
      return;
    }
    
    // Create new URI with foodie_app database
    let newURI;
    if (currentURI.includes('mongodb+srv://')) {
      // For MongoDB Atlas
      if (currentURI.endsWith('/')) {
        newURI = currentURI + 'foodie_app';
      } else {
        newURI = currentURI + '/foodie_app';
      }
    } else {
      // For local MongoDB
      newURI = currentURI.replace(/\/[^\/]*$/, '/foodie_app');
    }
    
    console.log('📋 New URI should be:', newURI.replace(/(mongodb[+srv]*:\/\/)([^:]+):([^@]+)@/, '$1****:****@'));
    
    console.log('\n🔧 To fix this:');
    console.log('1. Update your .env file');
    console.log('2. Change MONGODB_URI to include /foodie_app at the end');
    console.log('3. Restart the backend server');
    
    console.log('\n📝 Example:');
    console.log('MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/foodie_app');
    
    // Test connection to foodie_app
    console.log('\n🧪 Testing connection to foodie_app...');
    await mongoose.connect(newURI);
    
    const dbName = mongoose.connection.db.databaseName;
    console.log('✅ Successfully connected to:', dbName);
    
    // Check if foodie_app database exists or is empty
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Collections in foodie_app:', collections.length);
    
    if (collections.length === 0) {
      console.log('📋 foodie_app database is empty - this is expected for first time');
    } else {
      console.log('📋 Existing collections:');
      collections.forEach(col => console.log(`   - ${col.name}`));
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔧 Manual fix required:');
    console.log('1. Open backend/.env file');
    console.log('2. Find MONGODB_URI line');
    console.log('3. Add /foodie_app at the end');
    console.log('4. Save and restart backend');
  }
};

fixDatabase();
