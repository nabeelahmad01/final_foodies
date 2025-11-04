# 🍔 Foodies App - Setup Instructions

## 🚀 Quick Setup Guide

### 1. **Get Your Local IP Address**
```bash
# Run this to get your IP address
node get-ip.js
```
Then update `src/utils/constants.js` with your actual IP address.

### 2. **Start Backend Server**
```bash
cd backend
npm run dev
```

### 3. **Setup Database with Sample Data**
```bash
# Create sample restaurants and menu items
cd backend
npm run seed-restaurants
```

### 4. **Approve KYC for Users**
```bash
# Approve KYC for specific user
cd backend
npm run approve-kyc user@example.com

# OR approve KYC for all restaurant/rider users
cd backend
npm run approve-kyc --all
```

### 5. **Start Frontend App**
```bash
# In main directory
npm start
```

## 🔧 Key Features Fixed

### ✅ **Complete Real API Integration**
- **No more mock data anywhere**
- All login/signup data saves to MongoDB
- Real authentication flow
- Real restaurant creation
- Real menu management
- Real KYC upload process

### ✅ **KYC Status Management**
- Manual KYC approval via command line
- Once approved, users won't be asked again
- Verified badge shows next to user name

### ✅ **Home Screen Categories**
- Categories display properly
- Sample restaurants with menu items
- Proper API responses

### ✅ **Navigation Flow**
- Role-based routing (User/Restaurant/Rider)
- Persistent login state
- Proper screen connections

## 📱 **Test the App**

1. **Register** a new user with role "restaurant"
2. **Login** - data saves to real database
3. **Approve KYC** using command: `npm run approve-kyc user@email.com`
4. **Refresh app** - user will see verified badge
5. **Navigate** - proper routing based on user status

## 🛠️ **Commands Reference**

```bash
# Get your IP address
node get-ip.js

# Start backend
cd backend && npm run dev

# Create sample data
cd backend && npm run seed-restaurants

# Approve KYC for user
cd backend && npm run approve-kyc user@example.com

# Approve KYC for all restaurant/rider users
cd backend && npm run approve-kyc --all

# Start frontend
npm start

# Test complete flow (optional)
node test-complete-flow.js
```

## 📋 **Database Collections**

- **Users** - Authentication and user data
- **Restaurants** - Restaurant information
- **MenuItems** - Food items for each restaurant
- **Orders** - Order history and tracking

## 🎯 **Next Steps**

Your app is now fully functional with:
- Real database connectivity
- Proper KYC management
- Working categories and restaurants
- Complete navigation flow

**Happy coding! 🚀**
