// Mock API for development
import AsyncStorage from '@react-native-async-storage/async-storage';

let users = [];

// Load users from AsyncStorage on startup
const loadUsers = async () => {
  try {
    const storedUsers = await AsyncStorage.getItem('mockUsers');
    if (storedUsers) {
      users = JSON.parse(storedUsers);
    }
  } catch (error) {
    console.error('Failed to load mock users:', error);
  }
};

// Save users to AsyncStorage
const saveUsers = async () => {
  try {
    await AsyncStorage.setItem('mockUsers', JSON.stringify(users));
  } catch (error) {
    console.error('Failed to save mock users:', error);
  }
};

// Initialize users
loadUsers();

// Add a default test user
users.push({
  id: 'mock-user-id',
  name: 'Test User',
  email: 'test@example.com',
  phone: '1234567890',
  password: 'password123',
  role: 'customer',
  createdAt: new Date().toISOString()
});

const mockApi = {
  async register(userData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if user already exists
    const userExists = users.some(user => user.email === userData.email);
    if (userExists) {
      throw new Error('User already exists with this email');
    }
    
    // Create new user
    const newUser = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    await saveUsers();
    
    return {
      user: {
        ...newUser,
        password: undefined,
        confirmPassword: undefined
      },
      token: 'mock-jwt-token'
    };
  },
  
  async login({ email, password }) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reload users to ensure we have latest data
    await loadUsers();
    
    // For testing purposes, allow any password for the admin user
    let user = users.find(u => u.email === email);
    
    // If no user found with this email, check if it's the default admin
    if (!user && email === 'admin786@gmail.com') {
    }
    
    // In a real app, you would verify the password hash here
    if (user.password !== password) {
      throw new Error('Invalid credentials');
    }
    
    // Remove password before returning
    const { password: _, ...userData } = user;
    
    // Generate a more realistic JWT token
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
    
    // Return user data with token in the same structure as the real API
    return {
      data: {
        user: userData,
        token: token,
        success: true,
        message: 'Login successful'
      }
    };
  },
  
  // Get current user (mimics /auth/me endpoint)
  async getUser() {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Reload users to ensure we have latest data
    await loadUsers();
    
    // Try to find the admin user first
    let user = users.find(u => u.email === 'admin786@gmail.com');
    
    // If no admin user exists, create one
    if (!user) {
      user = {
        _id: '1',
        id: '1',
        name: 'Rizwan',
        email: 'admin786@gmail.com',
        phone: '031807371071',
        role: 'restaurant',
        kycStatus: 'pending',
        restaurantName: 'My Restaurant',
        address: '123 Main Street, City',
        city: 'Lahore',
        country: 'Pakistan',
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      users.push(user);
      await saveUsers();
    }
    
    // Remove sensitive data and ensure consistent structure
    const { password, confirmPassword, ...userData } = user;
    
    // Ensure required fields exist
    return {
      ...userData,
      _id: userData._id || userData.id,
      role: userData.role || 'restaurant',
      kycStatus: userData.kycStatus || 'pending',
      isEmailVerified: userData.isEmailVerified || true,
      isPhoneVerified: userData.isPhoneVerified || true
    };
  },
  
  // Mock API request method
  async request(config) {
    const { method = 'get', url, data, params } = config;
    
    // Handle FormData
    let requestData = data;
    if (data && typeof data === 'object' && data._parts) {
      // Convert FormData to a simple object
      requestData = {};
      data._parts.forEach((part) => {
        if (Array.isArray(part) && part.length >= 2) {
          requestData[part[0]] = part[1];
        }
      });
    }
    
    // Handle /auth/me endpoint
    if (url === '/auth/me' && method.toLowerCase() === 'get') {
      try {
        const user = await this.getUser();
        console.log('Mock API - Returning user data:', user);
        // Return the user data directly as the response
        return { 
          data: user,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
          request: {}
        };
      } catch (error) {
        console.error('Mock API - Error getting user:', error);
        return {
          data: {
            success: false,
            message: error.message || 'Failed to fetch user data',
            user: null
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
          request: {}
        };
      }
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Handle GET requests
    if (method.toLowerCase() === 'get') {
      if (url === '/auth/me') {
        try {
          const user = await this.getUser();
          return { 
            data: {
              success: true,
              message: 'User data retrieved successfully',
              data: user
            }
          };
        } catch (error) {
          return {
            data: {
              success: false,
              message: error.message || 'Failed to fetch user data',
              data: null
            }
          };
        }
      } 
      
      if (url === '/restaurants/dashboard') {
        // Get current user to check role and other details
        const user = await this.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Return mock dashboard data
        return {
          data: {
            success: true,
            message: 'Dashboard data fetched successfully',
            data: {
              stats: {
                totalOrders: 42,
                pendingOrders: 5,
                completedOrders: 37,
                totalEarnings: 1250.75,
                totalItems: 15,
                totalCategories: 4,
                todayRevenue: 125.50,
                totalCustomers: 28
              },
              recentOrders: [
                {
                  _id: 'order-1',
                  orderNumber: '#12345',
                  customerName: 'John Doe',
                  total: 25.99,
                  status: 'completed',
                  items: 3,
                  date: new Date(Date.now() - 3600000).toISOString()
                },
                {
                  _id: 'order-2',
                  orderNumber: '#12344',
                  customerName: 'Jane Smith',
                  total: 18.50,
                  status: 'preparing',
                  items: 2,
                  date: new Date().toISOString()
                }
              ],
              restaurant: {
                _id: 'mock-restaurant-1',
                name: user.restaurantName || 'My Restaurant',
                status: 'open',
                rating: 4.5,
                totalRatings: 28,
                address: '123 Food Street, Cuisine City',
                cuisine: 'Fast Food',
                deliveryFee: 2.99,
                minOrder: 10.00,
                image: 'https://via.placeholder.com/300',
                openingHours: {
                  monday: { open: '09:00', close: '22:00' },
                  tuesday: { open: '09:00', close: '22:00' },
                  wednesday: { open: '09:00', close: '22:00' },
                  thursday: { open: '09:00', close: '22:00' },
                  friday: { open: '09:00', close: '23:00' },
                  saturday: { open: '10:00', close: '23:00' },
                  sunday: { open: '10:00', close: '22:00' }
                },
                kycStatus: user.kycStatus || 'pending',
                isSetupComplete: !!user.restaurantName
              },
              popularItems: [
                { id: 'item1', name: 'Cheese Burger', price: 8.99, image: 'https://via.placeholder.com/100', category: 'Burgers', orderCount: 42 },
                { id: 'item2', name: 'Margherita Pizza', price: 12.99, image: 'https://via.placeholder.com/100', category: 'Pizza', orderCount: 38 },
                { id: 'item3', name: 'Caesar Salad', price: 7.99, image: 'https://via.placeholder.com/100', category: 'Salads', orderCount: 25 }
              ],
              analytics: {
                weeklySales: [125, 89, 142, 98, 167, 210, 185],
                topCategories: [
                  { name: 'Burgers', count: 42 },
                  { name: 'Pizza', count: 38 },
                  { name: 'Salads', count: 25 },
                  { name: 'Drinks', count: 18 }
                ],
                customerRatings: 4.5,
                totalReviews: 28
              }
            }
          }
        };
      }
    }
    
    // Handle POST requests
    if (method.toLowerCase() === 'post') {
      if (url === '/auth/register') {
        return { data: await this.register(data) };
      } else if (url === '/auth/login') {
        return { data: await this.login(data) };
      } else if (url === '/auth/upload-kyc' || url === '/api/kyc/upload') {
        try {
          // Simulate KYC upload delay
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Get current user
          const user = await this.getUser();
          
          if (!user) {
            throw new Error('User not found');
          }
          
          // Extract file data from FormData
          const kycData = user.kycDocuments || {};
          
          // Update only the fields that were provided in the request
          if (requestData.idProof) kycData.idProof = 'uploaded_id.jpg';
          if (requestData.businessLicense) kycData.businessLicense = 'uploaded_license.jpg';
          if (requestData.drivingLicense) kycData.drivingLicense = 'uploaded_driving.jpg';
          kycData.updatedAt = new Date().toISOString();
          
          // Update user's KYC status and documents
          user.kycStatus = 'pending';
          user.kycDocuments = kycData;
          user.updatedAt = new Date().toISOString();
          
          // Save the updated user
          const userIndex = users.findIndex(u => (u.id === user.id) || (u._id === (user._id || user.id)));
          if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...user };
            await saveUsers();
          }
          
          return { 
            data: { 
              success: true, 
              message: 'KYC documents submitted for verification',
              user: {
                ...user,
                kycStatus: 'pending',
                kycDocuments: user.kycDocuments || {}
              },
              kycStatus: 'pending',
              message: 'KYC documents uploaded successfully. Your documents are under review.'
            } 
          };
        } catch (error) {
          return {
            data: {
              success: false,
              message: error.message || 'Failed to upload KYC documents',
              data: null
            }
          };
        }
      }
    }
    
    return { data: {} };
  },
  
  // Mock API methods
  async get(endpoint) {
    return this.request({ method: 'get', url: endpoint });
  },
  
  async post(endpoint, data) {
    return this.request({ method: 'post', url: endpoint, data });
  },
  
  async put(endpoint, data) {
    return this.request({ method: 'put', url: endpoint, data });
  },
  
  async delete(endpoint) {
    return this.request({ method: 'delete', url: endpoint });
  }
};

export default mockApi;
