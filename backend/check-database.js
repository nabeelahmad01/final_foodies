// check-database.js
// Check which database is being used
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const checkDatabase = async () => {
  try {
    // Connect using the same connection string as the server
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodies';
    
    console.log('🔍 Checking Database Connection...\n');
    console.log('📋 Connection String:', MONGODB_URI.replace(/(mongodb[+srv]*:\/\/)([^:]+):([^@]+)@/, '$1****:****@'));
    
    await mongoose.connect(MONGODB_URI);
    
    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log('📋 Current Database Name:', dbName);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Collections in database:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Count users
    const User = mongoose.model('User', new mongoose.Schema({}, { collection: 'users' }));
    const userCount = await User.countDocuments();
    console.log('📋 Total Users:', userCount);
    
    // Show some users
    const users = await User.find({}, { name: 1, email: 1, role: 1 }).limit(5);
    console.log('📋 Sample Users:');
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
    });
    
    console.log('\n🎯 Database Analysis:');
    if (dbName === 'test') {
      console.log('❌ Currently using TEST database');
      console.log('🔧 Need to change to foodie_app database');
    } else if (dbName === 'foodie_app') {
      console.log('✅ Using correct foodie_app database');
    } else {
      console.log(`📋 Using database: ${dbName}`);
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

checkDatabase();
