// backend/models/Review.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
      trim: true,
      maxlength: [1000, 'A review must have less or equal than 1000 characters'],
      minlength: [10, 'A review must have more or equal than 10 characters'],
    },
    rating: {
      type: Number,
      required: [true, 'A review must have a rating'],
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    restaurant: {
      type: mongoose.Schema.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Review must belong to a restaurant'],
    },
    order: {
      type: mongoose.Schema.ObjectId,
      ref: 'Order',
      required: [true, 'Review must be associated with an order'],
    },
    foodQuality: {
      type: Number,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    service: {
      type: Number,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    delivery: {
      type: Number,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    images: [String],
    isRecommended: Boolean,
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    response: {
      text: String,
      date: Date,
      by: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
reviewSchema.index({ restaurant: 1, user: 1 }, { unique: true });
reviewSchema.index({ restaurant: 1, rating: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ restaurant: 1, isActive: 1 });

// Prevent duplicate reviews from the same user for the same restaurant
reviewSchema.pre('save', async function (next) {
  if (this.isNew) {
    const existingReview = await this.constructor.findOne({
      user: this.user,
      restaurant: this.restaurant,
      _id: { $ne: this._id },
    });

    if (existingReview) {
      const err = new Error('You have already reviewed this restaurant');
      err.statusCode = 400;
      return next(err);
    }
  }
  next();
});

// Populate user and restaurant data when querying reviews
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name profileImage',
  }).populate({
    path: 'restaurant',
    select: 'name logo',
  });
  next();
});

// Static method to calculate average rating for a restaurant
reviewSchema.statics.calcAverageRatings = async function (restaurantId) {
  const stats = await this.aggregate([
    {
      $match: { restaurant: restaurantId, isActive: true },
    },
    {
      $group: {
        _id: '$restaurant',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        avgFoodQuality: { $avg: '$foodQuality' },
        avgService: { $avg: '$service' },
        avgDelivery: { $avg: '$delivery' },
      },
    },
  ]);

  if (stats.length > 0) {
    await this.model('Restaurant').findByIdAndUpdate(restaurantId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
      'ratings.foodQuality': stats[0].avgFoodQuality || 0,
      'ratings.service': stats[0].avgService || 0,
      'ratings.delivery': stats[0].avgDelivery || 0,
    });
  } else {
    await this.model('Restaurant').findByIdAndUpdate(restaurantId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
      'ratings.foodQuality': 0,
      'ratings.service': 0,
      'ratings.delivery': 0,
    });
  }
};

// Middleware to update restaurant ratings when a review is created, updated, or deleted
const updateRestaurantRatings = async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.restaurant);
  }
};

// Update restaurant ratings when a review is created, updated, or deleted
reviewSchema.post('save', updateRestaurantRatings);
reviewSchema.post('findOneAndUpdate', updateRestaurantRatings);
reviewSchema.post('findOneAndDelete', updateRestaurantRatings);

// Add a method to check if a user has already reviewed a restaurant
reviewSchema.statics.hasUserReviewed = async function (userId, restaurantId) {
  const count = await this.countDocuments({
    user: userId,
    restaurant: restaurantId,
  });
  return count > 0;
};

// Add a method to get reviews summary for a restaurant
reviewSchema.statics.getReviewsSummary = async function (restaurantId) {
  return this.aggregate([
    {
      $match: {
        restaurant: new mongoose.Types.ObjectId(restaurantId),
        isActive: true,
      },
    },
    {
      $group: {
        _id: '$restaurant',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingCounts: {
          $push: {
            rating: '$rating',
            count: 1,
          },
        },
      },
    },
    {
      $project: {
        averageRating: { $round: ['$averageRating', 1] },
        totalReviews: 1,
        ratingDistribution: {
          $map: {
            input: [1, 2, 3, 4, 5],
            as: 'r',
            in: {
              rating: '$$r',
              count: {
                $size: {
                  $filter: {
                    input: '$ratingCounts',
                    as: 'rc',
                    cond: { $eq: ['$$rc.rating', '$$r'] },
                  },
                },
              },
              percentage: {
                $multiply: [
                  {
                    $divide: [
                      {
                        $size: {
                          $filter: {
                            input: '$ratingCounts',
                            as: 'rc',
                            cond: { $eq: ['$$rc.rating', '$$r'] },
                          },
                        },
                      },
                      { $max: ['$totalReviews', 1] },
                    ],
                  },
                  100,
                ],
              },
            },
          },
        },
      },
    },
  ]);
};

const Review = mongoose.model('Review', reviewSchema);

export default Review;
