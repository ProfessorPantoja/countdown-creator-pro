import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../src/translations';

type Language = 'pt' | 'en';
type Translations = typeof translations.pt;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en'); // Default to EN for international reach

    useEffect(() => {
        // Auto-detect language
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('pt')) {
            setLanguage('pt');
        } else {
            setLanguage('en');
        }
    }, []);

    const value = {
        language,
        setLanguage,
        t: translations[language]
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
