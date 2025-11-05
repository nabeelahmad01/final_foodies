// backend/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'customer', 'restaurant', 'rider', 'admin'],
      default: 'user',
    },
    profileImage: {
      type: String,
      default: null,
    },
    wallet: {
      balance: {
        type: Number,
        default: 0,
      },
      transactions: [
        {
          type: { type: String, enum: ['credit', 'debit'] },
          amount: Number,
          description: String,
          date: { type: Date, default: Date.now },
        },
      ],
    },
    addresses: [
      {
        label: String, // Home, Work, etc.
        address: String,
        city: String,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
        isDefault: { type: Boolean, default: false },
      },
    ],
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
      },
    ],
    pushToken: {
      type: String,
      default: null,
    },
    kycStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    kycDocuments: [
      {
        type: { type: String }, // id_proof, business_license, etc.
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    kycRejectionReason: String,
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Rider-specific fields
    isOnline: {
      type: Boolean,
      default: false,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    lastLogin: Date,
  },

  {
    timestamps: true,
  },
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update wallet balance
userSchema.methods.updateWallet = function (amount, type, description) {
  if (type === 'credit') {
    this.wallet.balance += amount;
  } else {
    this.wallet.balance -= amount;
  }

  this.wallet.transactions.push({
    type,
    amount,
    description,
  });

  return this.save();
};

const User = mongoose.model('User', userSchema);

export default User;
