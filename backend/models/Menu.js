// backend/models/Menu.js
import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A menu item must have a name'],
      trim: true,
      maxlength: [100, 'A menu item name must have less or equal than 100 characters'],
      minlength: [2, 'A menu item name must have more or equal than 2 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'A menu item description must have less or equal than 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'A menu item must have a price'],
      min: [0, 'Price must be a positive number'],
    },
    category: {
      type: String,
      required: [true, 'A menu item must belong to a category'],
      enum: {
        values: [
          'appetizers',
          'main-courses',
          'desserts',
          'beverages',
          'sides',
          'specials',
          'breakfast',
          'lunch',
          'dinner',
        ],
        message: 'Category is either: appetizers, main-courses, desserts, beverages, sides, specials, breakfast, lunch, dinner',
      },
    },
    image: {
      type: String,
      default: 'default-menu-item.jpg',
    },
    isVegetarian: {
      type: Boolean,
      default: false,
    },
    isVegan: {
      type: Boolean,
      default: false,
    },
    isGlutenFree: {
      type: Boolean,
      default: false,
    },
    isSpicy: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    preparationTime: {
      type: Number,
      default: 15, // in minutes
    },
    ingredients: [
      {
        name: {
          type: String,
          required: [true, 'An ingredient must have a name'],
          trim: true,
        },
        quantity: {
          type: Number,
          required: [true, 'An ingredient must have a quantity'],
          min: [0, 'Quantity must be a positive number'],
        },
        unit: {
          type: String,
          enum: ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'piece', 'pinch', 'to-taste'],
          default: 'piece',
        },
      },
    ],
    nutritionalInfo: {
      calories: {
        type: Number,
        min: [0, 'Calories must be a positive number'],
      },
      protein: {
        type: Number,
        min: [0, 'Protein must be a positive number'],
      },
      carbs: {
        type: Number,
        min: [0, 'Carbs must be a positive number'],
      },
      fat: {
        type: Number,
        min: [0, 'Fat must be a positive number'],
      },
    },
    restaurant: {
      type: mongoose.Schema.ObjectId,
      ref: 'Restaurant',
      required: [true, 'A menu item must belong to a restaurant'],
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A menu item must have a creator'],
    },
    updatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
menuItemSchema.index({ name: 'text', description: 'text' });
menuItemSchema.index({ restaurant: 1, category: 1 });
menuItemSchema.index({ price: 1 });
menuItemSchema.index({ isVegetarian: 1, isVegan: 1, isGlutenFree: 1 });

// Virtual populate for reviews
menuItemSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'menuItem',
  localField: '_id',
});

// Calculate average rating and number of ratings
menuItemSchema.virtual('ratingsAverage').get(function () {
  if (this.reviews && this.reviews.length > 0) {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / this.reviews.length;
  }
  return 0;
});

menuItemSchema.virtual('ratingsQuantity').get(function () {
  return this.reviews ? this.reviews.length : 0;
});

// Document middleware to update restaurant's menu when a new menu item is created
menuItemSchema.post('save', async function (doc) {
  await this.model('Restaurant').findByIdAndUpdate(doc.restaurant, {
    $addToSet: { menu: doc._id },
  });
});

// Query middleware to populate createdBy and updatedBy fields
menuItemSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'createdBy updatedBy',
    select: 'name email role',
  });
  next();
});

// Static method to get menu item stats by category
menuItemSchema.statics.getMenuStats = async function (restaurantId) {
  const stats = await this.aggregate([
    {
      $match: { restaurant: new mongoose.Types.ObjectId(restaurantId) },
    },
    {
      $group: {
        _id: '$category',
        numMenuItems: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  return stats;
};

// Call getMenuStats after save or update
menuItemSchema.post('save', function () {
  this.constructor.getMenuStats(this.restaurant);
});

menuItemSchema.post(/^findOneAnd/, function (doc) {
  if (doc) {
    doc.constructor.getMenuStats(doc.restaurant);
  }
});

const Menu = mongoose.model('Menu', menuItemSchema);

export default Menu;
