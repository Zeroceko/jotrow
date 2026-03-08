import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'tr';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    // A simple function (t) to get localized strings
    t: (key: string) => string;
}

// Very basic dictionary for core Navigation and structural text. We can expand this.
const translations: Record<Language, Record<string, string>> = {
    en: {
        'nav.explore': 'EXPLORE',
        'nav.profile': 'PROFILE',
        'nav.upload': 'UPLOAD_',
        'nav.logout': 'LOGOUT_',
        'nav.login': 'Login',
        'nav.register': 'Register',
        'upload.title': 'Upload Note',
        'profile.settings': 'Settings',
    },
    tr: {
        'nav.explore': 'KEŞFET',
        'nav.profile': 'PROFİL',
        'nav.upload': 'YÜKLE_',
        'nav.logout': 'ÇIKIŞ_',
        'nav.login': 'Giriş',
        'nav.register': 'Kayıt Ol',
        'upload.title': 'Not Yükle',
        'profile.settings': 'Ayarlar',
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('jotrow_lang');
        if (saved === 'en' || saved === 'tr') return saved;
        // Default to browser language or 'en'
        const browserLang = navigator.language.split('-')[0];
        return browserLang === 'tr' ? 'tr' : 'en';
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('jotrow_lang', lang);
    };

    const t = (key: string): string => {
        return translations[language]?.[key] || translations['en'][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
