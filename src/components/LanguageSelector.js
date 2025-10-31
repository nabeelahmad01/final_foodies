import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { changeLanguage, t } from '../utils/i18n';
import colors from '../styles/colors';

const LanguageSelector = ({ onLanguageChange }) => {
  const [showModal, setShowModal] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  ];

  const handleSelectLanguage = async languageCode => {
    await changeLanguage(languageCode);
    setCurrentLanguage(languageCode);
    setShowModal(false);
    if (onLanguageChange) {
      onLanguageChange();
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowModal(true)}
      >
        <Icon name="language" size={24} color={colors.primary} />
        <Text style={styles.selectorText}>{t('profile.language')}</Text>
        <Icon name="chevron-forward" size={20} color={colors.gray} />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.language')}</Text>

            {languages.map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={styles.languageOption}
                onPress={() => handleSelectLanguage(lang.code)}
              >
                <Text style={styles.languageName}>{lang.nativeName}</Text>
                {currentLanguage === lang.code && (
                  <Icon name="checkmark" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectorText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  languageName: {
    fontSize: 16,
    color: colors.text.primary,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
});

export default LanguageSelector;
