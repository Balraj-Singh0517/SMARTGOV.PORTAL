import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Language, translations } from '../utils/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultText?: string) => string;
  isHindi: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'smartgov-language-preference';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLang === 'en' || savedLang === 'hi') {
        return savedLang;
      }
    }
    return 'en';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.setAttribute('data-language', language);
    }
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const t = useMemo(() => {
    return (key: string, defaultText?: string): string => {
      const entry = translations[key];
      if (entry && entry[language]) {
        return entry[language];
      }
      return defaultText || key;
    };
  }, [language]);

  const isHindi = language === 'hi';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isHindi }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
