// Web-compatible KYC Upload Component
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useToast } from '../context.js/ToastContext';
import { API_URL } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../styles/colors';

const WebKYCUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();

  const handleWebFileUpload = async () => {
    if (Platform.OS !== 'web') {
      toast.show('This is for web testing only', 'error');
      return;
    }

    try {
      setIsUploading(true);
      
      // Create file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
          // Get token
          const token = await AsyncStorage.getItem('userToken');
          if (!token) {
            toast.show('Please login first', 'error');
            return;
          }
          
          // Create FormData
          const formData = new FormData();
          formData.append('document', file);
          
          console.log('🌐 Uploading file via web method...');
          console.log('📋 File details:', {
            name: file.name,
            type: file.type,
            size: file.size
          });
          
          // Upload using fetch
          const response = await fetch(`${API_URL}/auth/upload-kyc`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token.replace('Bearer ', '')}`,
            },
            body: formData,
          });
          
          const result = await response.json();
          
          if (response.ok) {
            console.log('✅ Upload successful:', result);
            toast.show('KYC document uploaded successfully!', 'success');
          } else {
            console.error('❌ Upload failed:', result);
            toast.show(result.message || 'Upload failed', 'error');
          }
          
        } catch (error) {
          console.error('❌ Upload error:', error);
          toast.show('Upload failed: ' + error.message, 'error');
        } finally {
          setIsUploading(false);
        }
      };
      
      // Trigger file picker
      input.click();
      
    } catch (error) {
      console.error('❌ File picker error:', error);
      toast.show('Failed to open file picker', 'error');
      setIsUploading(false);
    }
  };

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Web KYC Upload Test</Text>
      <TouchableOpacity
        style={[styles.button, isUploading && styles.buttonDisabled]}
        onPress={handleWebFileUpload}
        disabled={isUploading}
      >
        <Text style={styles.buttonText}>
          {isUploading ? 'Uploading...' : 'Test Web File Upload'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.background,
    borderRadius: 8,
    margin: 10,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.text.secondary,
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default WebKYCUpload;
