// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
      enum: ['customer', 'restaurant', 'rider', 'admin'],
      default: 'customer',
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
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
  },

  {
    timestamps: true,
  },
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
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

module.exports = mongoose.model('User', userSchema);
