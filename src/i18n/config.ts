import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslations from './locales/en/translation.json';
import esTranslations from './locales/es/translation.json';

// Soporta { nav, home, ... }, { translation: { ... } } (Decap) o translation como string (JSON en bruto).
function norm (raw: unknown): Record<string, unknown> {
  const v = (raw as any)?.translation ?? raw;
  if (typeof v === 'string') {
    try { return JSON.parse(v) as Record<string, unknown>; } catch { return {}; }
  }
  return (v && typeof v === 'object') ? (v as Record<string, unknown>) : {};
}
const en = norm(enTranslations);
const es = norm(esTranslations);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
