// backend/models/Restaurant.js
import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide restaurant name'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    cuisineType: [
      {
        type: String,
        enum: [
          'Italian',
          'Chinese',
          'Fast Food',
          'Pakistani',
          'Indian',
          'Continental',
          'Desserts',
          'Beverages',
        ],
      },
    ],
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    images: [String],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    openingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    deliveryFee: {
      type: Number,
      default: 100,
    },
    minimumOrder: {
      type: Number,
      default: 0,
    },
    preparationTime: {
      type: Number, // in minutes
      default: 30,
    },
    earnings: {
      total: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      paid: { type: Number, default: 0 },
    },
    stripeAccountId: String, // For Stripe Connect
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for geospatial queries
restaurantSchema.index({ location: '2dsphere' });

// Calculate average rating
restaurantSchema.methods.calculateRating = async function () {
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    {
      $match: { restaurantId: this._id },
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    this.rating = Math.round(stats[0].avgRating * 10) / 10;
    this.totalReviews = stats[0].totalReviews;
  } else {
    this.rating = 0;
    this.totalReviews = 0;
  }

  await this.save();
};

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;
