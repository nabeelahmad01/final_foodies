// src/screens/auth/KYCUploadScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import colors from '../../styles/colors';
import { USER_ROLES, KYC_STATUS } from '../../utils/constants';
import { useToast } from '../../context.js/ToastContext';
import { handleApiError, showSuccess } from '../../utils/helpers';

const KYCUploadScreen = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  const toast = useToast();
  const [documents, setDocuments] = useState({
    idProof: null,
    businessLicense: null,
    drivingLicense: null,
  });
  const [isLoading, setIsLoading] = useState(false);

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setDocuments({
          ...documents,
          [documentType]: result.assets[0],
        });
      }
    } catch (error) {
      toast.show('Failed to pick image', 'error');
    }
  };

  const uploadDocuments = async () => {
    // Validate based on role
    if (user.role === USER_ROLES.RESTAURANT) {
      if (!documents.idProof || !documents.businessLicense) {
        toast.show('Please upload all required documents', 'error');
        return;
      }
    } else if (user.role === USER_ROLES.RIDER) {
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

    try {
      const formData = new FormData();

      if (documents.idProof) {
        formData.append('documents', {
          uri: documents.idProof.uri,
          type: 'image/jpeg',
          name: 'id_proof.jpg',
        });
      }

      if (documents.businessLicense) {
        formData.append('documents', {
          uri: documents.businessLicense.uri,
          type: 'image/jpeg',
          name: 'business_license.jpg',
        });
      }

      if (documents.drivingLicense) {
        formData.append('documents', {
          uri: documents.drivingLicense.uri,
          type: 'image/jpeg',
          name: 'driving_license.jpg',
        });
      }

      await api.post('/auth/upload-kyc', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsLoading(false);
      showSuccess(toast, 'KYC documents uploaded successfully');
      navigation.goBack();
    } catch (error) {
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

        {user.role === USER_ROLES.RESTAURANT &&
          renderDocumentCard(
            'Business License',
            'businessLicense',
            'Restaurant registration certificate',
            'document-text-outline',
          )}

        {user.role === USER_ROLES.RIDER &&
          renderDocumentCard(
            'Driving License',
            'drivingLicense',
            'Valid motorcycle/car license',
            'car-outline',
          )}

        {/* Submit Button */}
        {user.kycStatus !== KYC_STATUS.APPROVED && (
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
