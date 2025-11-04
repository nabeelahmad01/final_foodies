# 🚪 Logout Functionality Test Guide

## ✅ **Logout Buttons Added To:**

### **1. 🏪 Restaurant Dashboard**
- **Location**: Top-right header (next to settings)
- **Icon**: Log out icon
- **Action**: Clears session and redirects to login

### **2. 📱 Menu Management Screen**
- **Location**: Top-right header (next to add button)
- **Icon**: Log out icon  
- **Action**: Clears session and redirects to login

### **3. 🏠 Home Screen (User)**
- **Location**: Top-right header (next to profile)
- **Icon**: Log out icon
- **Action**: Clears session and redirects to login

---

## 🧪 **How to Test Logout:**

### **Step 1: Login to App**
1. Open the app
2. Login with your credentials
3. App should navigate to appropriate screen based on role

### **Step 2: Find Logout Button**
- **Restaurant Users**: Look in Dashboard or Menu Management header
- **Regular Users**: Look in Home screen header
- **Icon**: 🚪 Log out symbol (arrow pointing to door)

### **Step 3: Test Logout**
1. **Tap logout button**
2. **App should immediately:**
   - Clear user session
   - Clear stored token
   - Navigate back to login screen
3. **Close and reopen app**
4. **Should NOT auto-login** - should show login screen

---

## 🔧 **What Logout Does:**

### **✅ Clears Data:**
- **User token** from AsyncStorage
- **User data** from Redux store
- **Authentication state** reset
- **Navigation stack** reset to login

### **✅ Security:**
- **No auto-login** after logout
- **Complete session cleanup**
- **Secure token removal**

---

## 🚨 **If Logout Doesn't Work:**

### **Check 1: Button Visible?**
- Look for log-out icon in header
- Should be next to other header buttons

### **Check 2: Button Working?**
- Tap should immediately go to login
- No delay or loading

### **Check 3: Auto-login Stopped?**
- Close app completely
- Reopen app
- Should show login screen, not auto-login

### **Check 4: Token Cleared?**
```bash
# Check if token is cleared (for debugging)
# In React Native debugger console:
AsyncStorage.getItem('userToken').then(console.log)
# Should return null after logout
```

---

## 🎯 **Expected Behavior:**

### **✅ Before Logout:**
- User logged in and using app
- Auto-login works on app restart
- User data available in screens

### **✅ After Logout:**
- Immediately redirected to login screen
- No auto-login on app restart
- Must enter credentials again
- All user data cleared

---

## 📱 **Screen-Specific Locations:**

### **🏪 Restaurant Dashboard:**
```
[Dashboard Title]           [⚙️] [🚪]
```

### **📱 Menu Management:**
```
[← Back] [Menu Management]  [➕] [🚪]
```

### **🏠 Home Screen:**
```
[Hello, User]               [👤] [🚪]
```

---

## 🔄 **Complete Test Flow:**

1. **Login** → App opens to main screen
2. **Use app** → Navigate, create data, etc.
3. **Tap logout** → Immediately goes to login
4. **Close app** → Force close completely  
5. **Reopen app** → Should show login screen
6. **Login again** → Should work normally

**✅ If all steps work = Logout is working perfectly!**

---

## 🛠️ **Troubleshooting:**

### **Problem: Can't find logout button**
- **Solution**: Look in header area, should be log-out icon

### **Problem: Logout doesn't redirect**
- **Solution**: Check navigation reset is working

### **Problem: Still auto-logs in**
- **Solution**: Check AsyncStorage is being cleared

### **Problem: App crashes on logout**
- **Solution**: Check Redux store is handling logout action

---

**Ab aap easily logout kar sakte hain! Har screen mein logout button hai! 🎉**
