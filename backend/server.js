// backend/server.js
// Load environment variables first
import dotenv from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv with explicit path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Now import other dependencies
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import http from 'http';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { Server } from 'socket.io';

// CORS configuration
const corsOptions = {
  origin: '*', // For development, restrict in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Log environment variables for debugging
console.log('Environment Variables Loaded:', {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  cloudinary_configured: !!process.env.CLOUDINARY_CLOUD_NAME,
  mongo_configured: !!process.env.MONGODB_URI
});

// Initialize Cloudinary
import configureCloudinary from './config/cloudinary.js';
try {
  const cloudinary = configureCloudinary();
  console.log('Cloudinary initialized successfully');
} catch (error) {
  console.error('Failed to initialize Cloudinary:', error.message);
  process.exit(1);
}

// Import routes
import errorMiddleware from './middleware/error.js';
import addressesRoutes from './routes/addresses.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import favoritesRoutes from './routes/favorites.js';
import menuRoutes from './routes/menus.js';
import notificationRoutes from './routes/notifications.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import promoCodeRoutes from './routes/promoCodes.js';
import restaurantRoutes from './routes/restaurants.js';
import reviewRoutes from './routes/reviews.js';
import riderRoutes from './routes/riders.js';
import userRoutes from './routes/users.js';
const { globalErrorHandler, notFound, catchAsync } = errorMiddleware;


// Initialize app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  },
});

// Make io instance available to routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Handle user joining specific rooms
  socket.on('join', (room) => {
    socket.join(room);
    console.log(`👤 User ${socket.id} joined room: ${room}`);
  });

  // Handle user leaving rooms
  socket.on('leave', (room) => {
    socket.leave(room);
    console.log(`👤 User ${socket.id} left room: ${room}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Connect to MongoDB with latest recommended options
const connectDB = async () => {
  try {
    console.log('🔗 Attempting to connect to MongoDB...');
    
    const options = {
      // Connection options
      useNewUrlParser: true,
      useUnifiedTopology: true,
      
      // Timeout settings
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      
      // Connection pooling
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 10000,
      
      // Retry settings
      retryWrites: true,
      retryReads: true,
      w: 'majority',
      
      // TLS/SSL - using the latest recommended approach
      ssl: true,
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      
      // Authentication
      authSource: 'admin',
      authMechanism: 'SCRAM-SHA-1'  // MongoDB Atlas requires SCRAM-SHA-1 or SCRAM-SHA-256
    };
    
    // Log the connection string (without password for security)
    const safeConnectionString = process.env.MONGODB_URI.replace(/(mongodb[+srv]*:\/\/)([^:]+):([^@]+)@/, '$1****:****@');
    console.log('Connecting to MongoDB at:', safeConnectionString);

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log('✅ MongoDB Connected Successfully');
    console.log('   - Host:', conn.connection.host);
    console.log('   - Database:', conn.connection.name);
    console.log('   - Port:', conn.connection.port);
    
    // Connection events with more detailed logging
    mongoose.connection.on('connected', () => {
      console.log('📊 Mongoose default connection is open');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose default connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  Mongoose default connection is disconnected');
    });
    
    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', () => {
      mongoose.connection.close(() => {
        console.log('🛑 Mongoose default connection is disconnected due to application termination');
        process.exit(0);
      });
    });
    
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  }
};

// Call the connectDB function
connectDB();

// Socket.IO Connection
io.on('connection', socket => {
  console.log('🔌 New client connected:', socket.id);

  // Join order room for real-time updates
  socket.on('joinOrder', orderId => {
    socket.join(`order_${orderId}`);
    console.log(`User joined order room: order_${orderId}`);
  });

  // Send order update to specific room
  socket.on('orderUpdate', data => {
    io.to(`order_${data.orderId}`).emit('orderUpdate', data);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// API Routes
// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/promo-codes', promoCodeRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/addresses', addressesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/riders', riderRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Foodies Backend API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
