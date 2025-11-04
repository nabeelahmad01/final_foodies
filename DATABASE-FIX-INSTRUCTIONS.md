# 🔧 Database Fix Instructions

## ❌ **Current Problem:**
- Backend is connecting to `test` database
- Users are being saved in wrong database
- You want users in `foodie_app` database

## ✅ **Solution:**

### **Step 1: Update .env File**
1. **Open**: `backend/.env` file
2. **Find this line**:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.udffwrs.mongodb.net/
   ```
3. **Change it to**:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.udffwrs.mongodb.net/foodie_app
   ```
   **Note**: Add `/foodie_app` at the end

### **Step 2: Restart Backend**
```bash
# Stop current backend (Ctrl+C)
# Then restart:
cd backend
npm start
```

### **Step 3: Test Database Connection**
```bash
# Run this to verify:
cd backend
node check-database.js
```

---

## 🎯 **Expected Results:**

### **Before Fix:**
```
📋 Current Database Name: test
❌ Currently using TEST database
```

### **After Fix:**
```
📋 Current Database Name: foodie_app
✅ Using correct foodie_app database
```

---

## 🧪 **Test New User Creation:**

### **After fixing, test signup:**
```bash
# Test signup to foodie_app database
node ../debug-signup.js
```

### **Should show:**
- ✅ Connected to `foodie_app` database
- ✅ Users saved in correct database
- ✅ User count increases in `foodie_app`

---

## 📋 **Database Status:**

### **Current Databases:**
- **`test`**: 7 users (wrong database)
- **`foodie_app`**: 9 collections, ready to use (correct database)

### **After Fix:**
- **New users** will go to `foodie_app`
- **Old users** in `test` can be migrated if needed

---

## 🔧 **Quick Fix Commands:**

### **1. Check Current Database:**
```bash
cd backend
node check-database.js
```

### **2. After .env Update:**
```bash
# Restart backend
npm start
```

### **3. Test Signup:**
```bash
cd ..
node debug-signup.js
```

---

## ⚠️ **Important Notes:**

1. **Backup**: Current users are in `test` database
2. **Migration**: Can move users from `test` to `foodie_app` if needed
3. **Environment**: Make sure to update production .env too
4. **Restart**: Backend must be restarted after .env change

---

## 🎉 **Expected Final Result:**

After fixing:
- ✅ All new signups go to `foodie_app` database
- ✅ Users collection in correct database
- ✅ App uses proper database structure
- ✅ No more test database usage

**Fix karne ke baad sab users `foodie_app` database mein jayenge! 🚀**
