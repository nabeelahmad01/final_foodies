// src/utils/soundUtils.js
import { Audio } from 'expo-audio';

let notificationSound = null;

export const initializeSound = async () => {
  try {
    // For now, just use system notification (no actual sound file needed)
    console.log('Sound system initialized (using system notifications)');
    return true;
  } catch (error) {
    console.log('Sound initialization failed:', error);
    return false;
  }
};

export const playNotificationSound = async () => {
  try {
    // For development, just log the notification
    console.log('🔔 Notification sound played!');
    // You can add actual sound playback here later
    playSystemNotification();
  } catch (error) {
    console.log('Error playing notification sound:', error);
  }
};

export const cleanupSound = async () => {
  try {
    if (notificationSound) {
      await notificationSound.unloadAsync();
      notificationSound = null;
    }
  } catch (error) {
    console.log('Error cleaning up sound:', error);
  }
};

// Alternative: Use system notification sound
export const playSystemNotification = () => {
  // This will use the device's default notification sound
  // No additional setup required
  console.log('System notification played (silent in development)');
};
