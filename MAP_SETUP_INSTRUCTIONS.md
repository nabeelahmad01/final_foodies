# 🗺️ Map Setup Instructions - Fix APK Crashes

## Problem
Map screens crash in APK builds because Google Maps API key is missing.

## Solution Steps

### 1. Get Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing one
3. Enable **"Maps SDK for Android"** API
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the API key (starts with `AIzaSy...`)

### 2. Restrict API Key (Important for Security)
1. Click on your API key in credentials
2. Under **Application restrictions**:
   - Select **Android apps**
   - Add package name: `com.foodies.app`
   - Add SHA-1 certificate fingerprint (get from EAS build)
3. Under **API restrictions**:
   - Select **Restrict key**
   - Choose **Maps SDK for Android**

### 3. Add API Key to App
1. Open `app.json`
2. Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key:
```json
"config": {
  "googleMaps": {
    "apiKey": "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

### 4. Update .env File
1. Open `.env` file
2. Replace the placeholder:
```
GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. Rebuild APK
```bash
# Clean and rebuild
expo prebuild --clean
eas build --platform android
```

## Alternative: Use Expo Location Instead
If you continue having issues, we can replace react-native-maps with expo-location + static map images.

## Error Prevention Features Added
- ✅ MapErrorBoundary - Catches map crashes
- ✅ Fallback UI - Shows when maps fail
- ✅ Error handling - Graceful degradation
- ✅ Safe imports - Prevents import crashes

## Test After Setup
1. Install APK on device
2. Go to Order Tracking screen
3. Map should load without crashes
4. If still crashes, check logcat for specific error

## Common Issues
- **"Authorization failure"** → Check API key restrictions
- **"Billing not enabled"** → Enable billing in Google Cloud
- **"API not enabled"** → Enable Maps SDK for Android
- **Still crashing** → Check device compatibility

## Support
If issues persist, the app will show a fallback message instead of crashing, keeping the app functional.
