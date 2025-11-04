// backend/scripts/seed-restaurants.js
// Script to create sample restaurants and menu items
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const sampleRestaurants = [
  {
    name: "Pizza Palace",
    description: "Authentic Italian pizzas with fresh ingredients",
    cuisineType: ["Italian", "Fast Food"],
    address: "123 Main Street, Lahore",
    city: "Lahore",
    location: {
      type: "Point",
      coordinates: [74.3587, 31.5204] // [longitude, latitude] for Lahore
    },
    images: [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500",
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500"
    ],
    rating: 4.5,
    totalReviews: 120,
    isOpen: true,
    openingHours: {
      monday: { open: "11:00", close: "23:00" },
      tuesday: { open: "11:00", close: "23:00" },
      wednesday: { open: "11:00", close: "23:00" },
      thursday: { open: "11:00", close: "23:00" },
      friday: { open: "11:00", close: "23:00" },
      saturday: { open: "11:00", close: "23:00" },
      sunday: { open: "12:00", close: "22:00" }
    },
    deliveryFee: 150,
    minimumOrder: 500,
    preparationTime: 25
  },
  {
    name: "Burger Barn",
    description: "Juicy burgers and crispy fries",
    cuisineType: ["Fast Food"],
    address: "456 Food Street, Lahore",
    city: "Lahore",
    location: {
      type: "Point",
      coordinates: [74.3587, 31.5304]
    },
    images: [
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
      "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500"
    ],
    rating: 4.2,
    totalReviews: 89,
    isOpen: true,
    openingHours: {
      monday: { open: "12:00", close: "24:00" },
      tuesday: { open: "12:00", close: "24:00" },
      wednesday: { open: "12:00", close: "24:00" },
      thursday: { open: "12:00", close: "24:00" },
      friday: { open: "12:00", close: "24:00" },
      saturday: { open: "12:00", close: "24:00" },
      sunday: { open: "12:00", close: "24:00" }
    },
    deliveryFee: 100,
    minimumOrder: 300,
    preparationTime: 20
  },
  {
    name: "Biryani House",
    description: "Traditional Pakistani biryani and karahi",
    cuisineType: ["Pakistani", "Indian"],
    address: "789 Spice Lane, Lahore",
    city: "Lahore",
    location: {
      type: "Point",
      coordinates: [74.3487, 31.5104]
    },
    images: [
      "https://images.unsplash.com/photo-1563379091339-03246963d51a?w=500",
      "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500"
    ],
    rating: 4.7,
    totalReviews: 200,
    isOpen: true,
    openingHours: {
      monday: { open: "12:00", close: "23:30" },
      tuesday: { open: "12:00", close: "23:30" },
      wednesday: { open: "12:00", close: "23:30" },
      thursday: { open: "12:00", close: "23:30" },
      friday: { open: "12:00", close: "23:30" },
      saturday: { open: "12:00", close: "23:30" },
      sunday: { open: "12:00", close: "23:30" }
    },
    deliveryFee: 120,
    minimumOrder: 600,
    preparationTime: 35
  },
  {
    name: "Sweet Treats",
    description: "Delicious desserts and beverages",
    cuisineType: ["Desserts", "Beverages"],
    address: "321 Sweet Street, Lahore",
    city: "Lahore",
    location: {
      type: "Point",
      coordinates: [74.3687, 31.5404]
    },
    images: [
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500",
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500"
    ],
    rating: 4.3,
    totalReviews: 75,
    isOpen: true,
    openingHours: {
      monday: { open: "14:00", close: "22:00" },
      tuesday: { open: "14:00", close: "22:00" },
      wednesday: { open: "14:00", close: "22:00" },
      thursday: { open: "14:00", close: "22:00" },
      friday: { open: "14:00", close: "22:00" },
      saturday: { open: "14:00", close: "22:00" },
      sunday: { open: "14:00", close: "22:00" }
    },
    deliveryFee: 80,
    minimumOrder: 200,
    preparationTime: 15
  }
];

const sampleMenuItems = [
  // Pizza Palace items
  {
    name: "Margherita Pizza",
    description: "Fresh tomato sauce, mozzarella, and basil",
    price: 899,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=300",
    isVegetarian: true,
    isAvailable: true,
    preparationTime: 20
  },
  {
    name: "Pepperoni Pizza",
    description: "Pepperoni, mozzarella, and tomato sauce",
    price: 1199,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300",
    isVegetarian: false,
    isAvailable: true,
    preparationTime: 20
  },
  // Burger Barn items
  {
    name: "Classic Beef Burger",
    description: "Juicy beef patty with lettuce, tomato, and cheese",
    price: 599,
    category: "Burger",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300",
    isVegetarian: false,
    isAvailable: true,
    preparationTime: 15
  },
  {
    name: "Chicken Burger",
    description: "Grilled chicken breast with special sauce",
    price: 549,
    category: "Burger",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=300",
    isVegetarian: false,
    isAvailable: true,
    preparationTime: 15
  },
  // Biryani House items
  {
    name: "Chicken Biryani",
    description: "Aromatic basmati rice with tender chicken",
    price: 450,
    category: "Biryani",
    image: "https://images.unsplash.com/photo-1563379091339-03246963d51a?w=300",
    isVegetarian: false,
    isAvailable: true,
    preparationTime: 30
  },
  {
    name: "Mutton Karahi",
    description: "Spicy mutton cooked in traditional style",
    price: 750,
    category: "Karahi",
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300",
    isVegetarian: false,
    isAvailable: true,
    preparationTime: 35
  },
  // Sweet Treats items
  {
    name: "Chocolate Cake",
    description: "Rich chocolate cake with cream frosting",
    price: 299,
    category: "Desserts",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300",
    isVegetarian: true,
    isAvailable: true,
    preparationTime: 10
  },
  {
    name: "Fresh Juice",
    description: "Freshly squeezed seasonal fruit juice",
    price: 150,
    category: "Beverages",
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300",
    isVegetarian: true,
    isAvailable: true,
    preparationTime: 5
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodies');
    console.log('Connected to MongoDB');

    // Create a sample restaurant owner user if doesn't exist
    let restaurantOwner = await User.findOne({ email: 'restaurant@example.com' });
    if (!restaurantOwner) {
      restaurantOwner = await User.create({
        name: 'Restaurant Owner',
        email: 'restaurant@example.com',
        phone: '03001234567',
        password: 'password123',
        role: 'restaurant',
        kycStatus: 'approved'
      });
      console.log('✅ Created sample restaurant owner');
    }

    // Clear existing data
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    console.log('🗑️ Cleared existing restaurants and menu items');

    // Create restaurants
    const createdRestaurants = [];
    for (const restaurantData of sampleRestaurants) {
      const restaurant = await Restaurant.create({
        ...restaurantData,
        ownerId: restaurantOwner._id
      });
      createdRestaurants.push(restaurant);
      console.log(`✅ Created restaurant: ${restaurant.name}`);
    }

    // Create menu items for each restaurant
    for (let i = 0; i < createdRestaurants.length; i++) {
      const restaurant = createdRestaurants[i];
      const startIndex = i * 2; // 2 items per restaurant
      const endIndex = startIndex + 2;
      
      for (let j = startIndex; j < endIndex && j < sampleMenuItems.length; j++) {
        const menuItemData = sampleMenuItems[j];
        await MenuItem.create({
          ...menuItemData,
          restaurantId: restaurant._id
        });
        console.log(`✅ Created menu item: ${menuItemData.name} for ${restaurant.name}`);
      }
    }

    // Update restaurant owner with first restaurant ID
    if (createdRestaurants.length > 0) {
      await User.findByIdAndUpdate(restaurantOwner._id, {
        restaurantId: createdRestaurants[0]._id
      });
      console.log('✅ Updated restaurant owner with restaurant ID');
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log(`📊 Created ${createdRestaurants.length} restaurants`);
    console.log(`🍽️ Created ${sampleMenuItems.length} menu items`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
