// src/screens/auth/KYCUploadScreen.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from '../../context.js/ToastContext';
import { updateUser } from '../../redux/slices/authSlice';
import api from '../../services/api';
import colors from '../../styles/colors';
import { API_URL, KYC_STATUS, USER_ROLES } from '../../utils/constants';
import { handleApiError, showSuccess } from '../../utils/helpers';

const KYCUploadScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { user: authUser } = useSelector(state => state.auth);
  const [user, setUser] = useState(authUser);
  const toast = useToast();
  const [documents, setDocuments] = useState({
    idProof: null,
    businessLicense: null,
    drivingLicense: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch fresh user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('Fetching user data from /auth/me...');
        
        // Get the token for debugging
        const token = await AsyncStorage.getItem('userToken');
        console.log('Current token:', token);
        
        const response = await api.get('/auth/me');
        console.log('User data response:', response);
        
        // Always use real API response structure
        const userData = response.data.user || response.data;
        
        if (!userData) {
          throw new Error('No user data received');
        }
        
        // Ensure required fields exist
        const processedUser = {
          ...userData,
          id: userData.id || userData._id,
          role: userData.role || 'restaurant',
          kycStatus: userData.kycStatus || 'pending',
          isEmailVerified: userData.isEmailVerified !== undefined ? userData.isEmailVerified : true,
          isPhoneVerified: userData.isPhoneVerified !== undefined ? userData.isPhoneVerified : true,
          // Add default values for required fields
          name: userData.name || 'Rizwan',
          email: userData.email || 'admin786@gmail.com',
          phone: userData.phone || '031807371071'
        };
        
        console.log('Processed user data:', processedUser);
        setUser(processedUser);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Fallback to auth user if available
        if (authUser) {
          console.log('Using auth user as fallback');
          setUser({
            ...authUser,
            id: authUser.id || authUser._id,
            role: authUser.role || 'restaurant',
            kycStatus: authUser.kycStatus || 'pending',
            isEmailVerified: authUser.isEmailVerified !== undefined ? authUser.isEmailVerified : true,
            isPhoneVerified: authUser.isPhoneVerified !== undefined ? authUser.isPhoneVerified : true,
            name: authUser.name || 'Rizwan',
            email: authUser.email || 'admin786@gmail.com',
            phone: authUser.phone || '031807371071'
          });
        } else {
          // If no auth user, redirect to login
          console.log('No auth user found, redirecting to login');
          navigation.replace('Login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Show loading state
  if (isLoading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.show('Please allow access to your photos to upload KYC documents', 'error');
      return false;
    }
    return true;
  };

  const pickImage = async documentType => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setDocuments({
          ...documents,
          [documentType]: result.assets[0]
        });
      }
    } catch (error) {
      toast.show('Failed to pick image', 'error');
    }
  };

  const uploadDocuments = async () => {
    try {
      setIsLoading(true);
      
      // Get the token from AsyncStorage and validate it
      let token = await AsyncStorage.getItem('userToken');
      
      // Clean up the token if it has Bearer prefix
      if (token && token.startsWith('Bearer ')) {
        token = token.replace('Bearer ', '').trim();
        // Update the stored token to remove Bearer prefix
        await AsyncStorage.setItem('userToken', token);
      }
      
      if (!token) {
        console.error('No authentication token found');
        toast.show('Authentication failed. Please log in again.', 'error');
        // Optionally redirect to login
        // navigation.navigate('Login');
        return;
      }
      
      console.log('Using token for upload:', {
        tokenStart: token.substring(0, 10) + '...',
        tokenEnd: '...' + token.substring(token.length - 10),
        length: token.length
      });

      // Validate based on role
      if (user?.role === USER_ROLES.RESTAURANT) {
        if (!documents.idProof || !documents.businessLicense) {
          toast.show('Please upload all required documents', 'error');
          return;
        }
      } else if (user?.role === USER_ROLES.RIDER) {
        if (!documents.idProof || !documents.drivingLicense) {
          toast.show('Please upload all required documents', 'error');
          return;
        }
      } else {
        if (!documents.idProof) {
          toast.show('Please upload ID proof', 'error');
          return;
        }
      }

      setIsLoading(true);
      
      // Create form data with proper file objects
      const formData = new FormData();

      if (documents.idProof) {
        const idProofUri = documents.idProof.uri;
        const idProofName = idProofUri.split('/').pop();
        const idProofType = idProofUri.endsWith('.png') ? 'image/png' : 'image/jpeg';
        
        formData.append('documents', {
          uri: idProofUri,
          type: idProofType,
          name: `id_proof_${Date.now()}.${idProofType.split('/')[1] || 'jpg'}`,
        });
      }

      if (documents.businessLicense) {
        const businessLicenseUri = documents.businessLicense.uri;
        const businessLicenseName = businessLicenseUri.split('/').pop();
        const businessLicenseType = businessLicenseUri.endsWith('.png') ? 'image/png' : 'image/jpeg';
        
        formData.append('documents', {
          uri: businessLicenseUri,
          type: businessLicenseType,
          name: `business_license_${Date.now()}.${businessLicenseType.split('/')[1] || 'jpg'}`,
        });
      }

      if (documents.drivingLicense) {
        const drivingLicenseUri = documents.drivingLicense.uri;
        const drivingLicenseName = drivingLicenseUri.split('/').pop();
        const drivingLicenseType = drivingLicenseUri.endsWith('.png') ? 'image/png' : 'image/jpeg';
        
        formData.append('documents', {
          uri: drivingLicenseUri,
          type: drivingLicenseType,
          name: `driving_license_${Date.now()}.${drivingLicenseType.split('/')[1] || 'jpg'}`,
        });
      }

      // Log form data for debugging
      console.log('FormData prepared for upload');
      
      // Create a proper FormData object for file uploads
      const formDataToSend = new FormData();
      
      // Helper function to append files to form data
      const appendFileToFormData = (file, fieldName) => {
        if (file && file.uri) {
          // Determine file type based on URI extension
          let fileType = 'image/jpeg'; // default
          const uri = file.uri.toLowerCase();
          if (uri.endsWith('.png')) fileType = 'image/png';
          else if (uri.endsWith('.gif')) fileType = 'image/gif';
          else if (uri.endsWith('.webp')) fileType = 'image/webp';
          else if (uri.endsWith('.pdf')) fileType = 'application/pdf';
          
          const fileName = file.uri.split('/').pop() || `${fieldName}_${Date.now()}.jpg`;
          
          // Backend expects 'document' (singular) not 'documents'
          formDataToSend.append('document', {
            uri: file.uri,
            type: fileType,
            name: fileName,
          });
        }
      };
      
      // Upload files one by one (backend expects single file per request)
      const filesToUpload = [];
      
      if (documents.idProof?.uri) {
        filesToUpload.push({ file: documents.idProof, fieldName: 'id_proof' });
      }
      
      if (user?.role === USER_ROLES.RESTAURANT && documents.businessLicense?.uri) {
        filesToUpload.push({ file: documents.businessLicense, fieldName: 'business_license' });
      } else if (user?.role === USER_ROLES.RIDER && documents.drivingLicense?.uri) {
        filesToUpload.push({ file: documents.drivingLicense, fieldName: 'driving_license' });
      }
      
      if (filesToUpload.length === 0) {
        toast.show('Please select at least one document', 'error');
        setIsLoading(false);
        return;
      }
      
      console.log(`Uploading ${filesToUpload.length} files...`);
      
      // Upload files one by one using simplified approach
      try {
        let uploadCount = 0;
        
        for (const { file, fieldName } of filesToUpload) {
          console.log(`📤 Uploading ${fieldName}...`);
          
          // Determine file type
          let fileType = 'image/jpeg';
          const uri = file.uri.toLowerCase();
          if (uri.endsWith('.png')) fileType = 'image/png';
          else if (uri.endsWith('.gif')) fileType = 'image/gif';
          else if (uri.endsWith('.webp')) fileType = 'image/webp';
          else if (uri.endsWith('.pdf')) fileType = 'application/pdf';
          
          const fileName = file.uri.split('/').pop() || `${fieldName}_${Date.now()}.jpg`;
          
          console.log('📋 File details:', { 
            uri: file.uri, 
            type: fileType, 
            name: fileName,
            fieldName: fieldName 
          });
          
          // Try FileSystem.uploadAsync first, then fallback to FormData
          try {
            console.log('🚀 Trying FileSystem.uploadAsync (legacy)...');
            
            const uploadOptions = {
              fieldName: 'document', // Backend expects 'document' field
              httpMethod: 'POST',
              uploadType: FileSystem.FileSystemUploadType?.MULTIPART || 'multipart',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            };
            
            console.log('📋 Upload options:', uploadOptions);
            
            const uploadResult = await FileSystem.uploadAsync(
              `${API_URL}/auth/upload-kyc`,
              file.uri,
              uploadOptions
            );
            
            console.log('📊 Upload result:', {
              status: uploadResult.status,
              body: uploadResult.body ? uploadResult.body.substring(0, 200) + '...' : 'No body'
            });
            
            if (uploadResult.status === 200 || uploadResult.status === 201) {
              try {
                const responseData = JSON.parse(uploadResult.body);
                console.log(`✅ Uploaded ${fieldName} successfully via FileSystem`);
                uploadCount++;
              } catch (parseError) {
                console.log('⚠️ Response parsing failed but upload seems successful');
                uploadCount++;
              }
            } else {
              throw new Error(`Upload failed with status ${uploadResult.status}: ${uploadResult.body}`);
            }
            
          } catch (fileSystemError) {
            console.log(`⚠️ FileSystem upload failed for ${fieldName}, trying FormData fallback:`, fileSystemError.message);
            
            // Fallback to FormData with axios
            try {
              console.log('🔄 Using FormData fallback...');
              
              const formData = new FormData();
              formData.append('document', {
                uri: file.uri,
                type: fileType,
                name: fileName,
              });
              
              const response = await api.post('/auth/upload-kyc', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                  'Authorization': `Bearer ${token}`,
                },
                timeout: 60000, // 60 second timeout
              });
              
              console.log(`✅ Uploaded ${fieldName} successfully via FormData`);
              uploadCount++;
              
            } catch (formDataError) {
              console.error(`❌ Both FileSystem and FormData failed for ${fieldName}:`, formDataError.message);
              throw formDataError;
            }
          }
        }
        
        console.log('All uploads successful!');
        
        // Update KYC status
        dispatch(updateUser({ kycStatus: 'pending' }));
        
        // Show success message and navigate to KYC status screen
        showSuccess(toast, `${uploadCount} document(s) uploaded successfully`);
        navigation.replace('KYCStatus'); // Use replace to prevent going back to upload
        
      } catch (error) {
        console.error('❌ Upload failed:', error);
        console.error('❌ Error details:', error.response?.data || error.message);
        toast.show(
          error.response?.data?.message || error.message || 'Failed to upload documents. Please try again.',
          'error'
        );
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ General upload error:', error);
      setIsLoading(false);
      handleApiError(error, toast);
    }
  };

  const getKYCStatusBadge = () => {
    if (!user.kycStatus || user.kycStatus === KYC_STATUS.PENDING) {
      return (
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: colors.warning + '20' },
          ]}
        >
          <Icon name="time" size={16} color={colors.warning} />
          <Text style={[styles.statusText, { color: colors.warning }]}>
            Pending Verification
          </Text>
        </View>
      );
    } else if (user.kycStatus === KYC_STATUS.APPROVED) {
      return (
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: colors.success + '20' },
          ]}
        >
          <Icon name="checkmark-circle" size={16} color={colors.success} />
          <Text style={[styles.statusText, { color: colors.success }]}>
            Verified
          </Text>
        </View>
      );
    } else {
      return (
        <View
          style={[styles.statusBadge, { backgroundColor: colors.error + '20' }]}
        >
          <Icon name="close-circle" size={16} color={colors.error} />
          <Text style={[styles.statusText, { color: colors.error }]}>
            Rejected
          </Text>
        </View>
      );
    }
  };

  const renderDocumentCard = (title, documentType, description, icon) => (
    <View style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <View style={styles.documentIcon}>
          <Icon name={icon} size={24} color={colors.primary} />
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentTitle}>{title}</Text>
          <Text style={styles.documentDesc}>{description}</Text>
        </View>
      </View>

      {documents[documentType] ? (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: documents[documentType].uri }}
            style={styles.previewImage}
          />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => setDocuments({ ...documents, [documentType]: null })}
          >
            <Icon name="close-circle" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => pickImage(documentType)}
        >
          <Icon name="cloud-upload-outline" size={32} color={colors.primary} />
          <Text style={styles.uploadText}>Tap to Upload</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View style={styles.statusContainer}>{getKYCStatusBadge()}</View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <Icon name="information-circle" size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            Upload clear photos of your documents. Make sure all details are
            visible and readable. Verification usually takes 24-48 hours.
          </Text>
        </View>

        {/* Document Upload Cards */}
        {renderDocumentCard(
          'ID Proof',
          'idProof',
          'CNIC, Passport, or Driver License',
          'card-outline',
        )}

        {user?.role === USER_ROLES.RESTAURANT &&
          renderDocumentCard(
            'Business License',
            'businessLicense',
            'Restaurant registration certificate',
            'document-text-outline',
          )}

        {user?.role === USER_ROLES.RIDER &&
          renderDocumentCard(
            'Driving License',
            'drivingLicense',
            'Valid motorcycle/car license',
            'car-outline',
          )}

        {/* Submit Button */}
        {user?.kycStatus !== KYC_STATUS.APPROVED && (
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.disabledButton]}
            onPress={uploadDocuments}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Icon name="checkmark-circle" size={20} color={colors.white} />
                <Text style={styles.submitText}>Submit for Verification</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  placeholder: {
    width: 40,
  },
  statusContainer: {
    padding: 20,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  documentCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  documentHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  documentDesc: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: colors.gray,
  },
  submitText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});

export default KYCUploadScreen;
