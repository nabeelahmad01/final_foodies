import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../translations/en.json';
import ur from '../translations/ur.json';

const i18n = new I18n({
  en,
  ur,
});

// Resolve device locale safely across Expo SDK versions
const getDeviceLocale = () => {
  try {
    if (typeof Localization.getLocales === 'function') {
      const locales = Localization.getLocales();
      if (Array.isArray(locales) && locales.length > 0) {
        const tag = locales[0]?.languageTag;
        if (typeof tag === 'string' && tag.length > 0) return tag;
      }
    }
    if (typeof Localization.locale === 'string' && Localization.locale.length > 0) {
      return Localization.locale;
    }
  } catch (_) {}
  return 'en';
};

// Set the locale once at the beginning of your app
i18n.locale = getDeviceLocale();

// Enable fallback if you want to use a key that doesn't exist
i18n.enableFallback = true;

// Default to English if locale not found
i18n.defaultLocale = 'en';

// Load saved language preference
export const loadLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('language');
    if (savedLanguage) {
      i18n.locale = savedLanguage;
    }
  } catch (error) {
    console.error('Failed to load language:', error);
  }
};

// Change language
export const changeLanguage = async language => {
  try {
    i18n.locale = language;
    await AsyncStorage.setItem('language', language);
  } catch (error) {
    console.error('Failed to save language:', error);
  }
};

// Translation helper
export const t = (key, options = {}) => {
  return i18n.t(key, options);
};

export default i18n;
