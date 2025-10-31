// backend/models/MenuItem.js
const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide item name'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: 200,
    },
    price: {
      type: Number,
      required: [true, 'Please provide price'],
      min: 0,
    },
    category: {
      type: String,
      enum: ['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Side Dish'],
      required: true,
    },
    image: {
      type: String,
      default: null,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    preparationTime: {
      type: Number, // in minutes
      default: 15,
    },
    isVeg: {
      type: Boolean,
      default: false,
    },
    spiceLevel: {
      type: String,
      enum: ['none', 'mild', 'medium', 'hot', 'extra-hot'],
      default: 'none',
    },
    nutritionInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
    },
    tags: [String], // e.g., ['popular', 'chef-special', 'new']
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
menuItemSchema.index({ restaurantId: 1, isAvailable: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
