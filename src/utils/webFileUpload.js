// Web-compatible file upload utility
import { Platform } from 'react-native';

export const createWebCompatibleFormData = (file, fieldName = 'document') => {
  const formData = new FormData();
  
  if (Platform.OS === 'web') {
    // On web, we need to handle blob URLs differently
    if (file.uri && file.uri.startsWith('blob:')) {
      // Convert blob URL to actual File object
      fetch(file.uri)
        .then(response => response.blob())
        .then(blob => {
          const fileName = file.name || `${fieldName}_${Date.now()}.jpg`;
          const fileType = file.type || 'image/jpeg';
          
          // Create a proper File object for web
          const webFile = new File([blob], fileName, { type: fileType });
          formData.append(fieldName, webFile);
        });
    } else {
      // Fallback for other web scenarios
      const fileName = file.name || `${fieldName}_${Date.now()}.jpg`;
      const fileType = file.type || 'image/jpeg';
      
      formData.append(fieldName, file, fileName);
    }
  } else {
    // Native platform - use the existing format
    formData.append(fieldName, {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || `${fieldName}_${Date.now()}.jpg`,
    });
  }
  
  return formData;
};

export const uploadFileWeb = async (file, fieldName, token, apiUrl) => {
  if (Platform.OS !== 'web') {
    throw new Error('This function is for web platform only');
  }
  
  try {
    // Convert blob URL to File object
    const response = await fetch(file.uri);
    const blob = await response.blob();
    
    // Get file type from blob or file object
    let fileType = blob.type || file.type || 'image/jpeg';
    
    // Ensure we have a valid image type
    if (!fileType || !fileType.startsWith('image/')) {
      fileType = 'image/jpeg'; // Default to JPEG
    }
    
    const fileName = file.name || `${fieldName}_${Date.now()}.${fileType.split('/')[1] || 'jpg'}`;
    
    console.log('🔍 File type detection:', {
      blobType: blob.type,
      fileType: file.type,
      finalType: fileType,
      fileName: fileName
    });
    
    // Create proper File object
    const webFile = new File([blob], fileName, { type: fileType });
    
    // Create FormData
    const formData = new FormData();
    formData.append('document', webFile);
    
    // Upload using fetch (more reliable on web than axios for files)
    const uploadResponse = await fetch(`${apiUrl}/auth/upload-kyc`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
      body: formData,
    });
    
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload failed with status ${uploadResponse.status}`);
    }
    
    const result = await uploadResponse.json();
    return result;
    
  } catch (error) {
    console.error('Web file upload error:', error);
    throw error;
  }
};
