// Mock API for development
const users = [];

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
    
    // Find user
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    return {
      user: {
        ...user,
        password: undefined,
        confirmPassword: undefined
      },
      token: 'mock-jwt-token'
    };
  },
  
  // Get current user (mimics /auth/me endpoint)
  async getUser() {
    await new Promise(resolve => setTimeout(resolve, 500));
    const user = users[0]; // Return the first user as current user
    if (!user) {
      throw new Error('User not found');
    }
    
    // Remove sensitive data
    const { password, ...userData } = user;
    return userData;
  },
  
  // Mock API methods
  post(endpoint, data) {
    if (endpoint === '/auth/register') {
      return { data: this.register(data) };
    } else if (endpoint === '/auth/login') {
      return { data: this.login(data) };
    }
    return { data: {} };
  },
  
  get(endpoint) {
    if (endpoint === '/auth/me') {
      return { data: this.getUser() };
    }
    return { data: {} };
  }
};

export default mockApi;
