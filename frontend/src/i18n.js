import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationVI from './locales/vi.json';
import translationEN from './locales/en.json';

const resources = {
  vi: { translation: translationVI },
  en: { translation: translationEN }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('lng') || 'vi',
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
