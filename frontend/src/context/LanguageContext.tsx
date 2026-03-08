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
        'home.hero.title_1': 'Capture your thoughts,',
        'home.hero.title_2': 'refine',
        'home.hero.title_3': ' into knowledge.',
        'home.hero.desc': 'The minimalist workspace for students to jot down quick notes, refine them into study materials, and share via secure 4-digit PINs.',
        'home.hero.launch': 'LAUNCH DASHBOARD_',
        'home.hero.start': 'GET STARTED_',
        'home.hero.explore': 'EXPLORE NOTES_',
        'home.why.rapid': 'Rapid Capture',
        'home.why.rapid_desc': '"Jot" down raw thoughts instantly before they fade. No distractions, just your ideas.',
        'home.why.clean': 'Clean Refinement',
        'home.why.clean_desc': 'Turn messy scribbles into structured, searchable study materials with Markdown support.',
        'home.why.simple': 'Simple Sharing',
        'home.why.simple_desc': 'Share your work with a 4-digit PIN. Keep things private or open to the world in a click.',
        'home.pin.title': 'Secure by PIN',
        'home.pin.desc_1': 'Share your entire public profile or specific notes using your unique 4-digit Secret Code.',
        'home.pin.desc_2': 'Others can view your profile at ',
        'home.pin.desc_3': ' only if they know your code.',
        'home.cta.title': 'Ready to study smarter?',
        'home.cta.button': 'INITIALIZE JOINT_',
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
        'home.hero.title_1': 'Düşüncelerini yakala,',
        'home.hero.title_2': 'bilgiye',
        'home.hero.title_3': ' dönüştür.',
        'home.hero.desc': 'Öğrencilerin hızlıca not alması, bunları çalışma materyallerine dönüştürmesi ve 4 haneli güvenli PIN ile paylaşması için minimalist çalışma alanı.',
        'home.hero.launch': 'PANELİ BAŞLAT_',
        'home.hero.start': 'HEMEN BAŞLA_',
        'home.hero.explore': 'NOTLARI KEŞFET_',
        'home.why.rapid': 'Hızlı Kayıt',
        'home.why.rapid_desc': 'Ham düşüncelerini solup gitmeden anında "karala". Dikkat dağıtıcı yok, sadece senin fikirlerin.',
        'home.why.clean': 'Temiz Düzenleme',
        'home.why.clean_desc': 'Dağınık karalamaları Markdown desteğiyle yapılandırılmış, aranabilir çalışma materyallerine dönüştür.',
        'home.why.simple': 'Kolay Paylaşım',
        'home.why.simple_desc': 'Çalışmalarını 4 haneli PIN ile paylaş. Tek tıkla gizli tut veya dünyaya aç.',
        'home.pin.title': 'PIN Korumalı',
        'home.pin.desc_1': 'Tüm herkese açık profilini veya belirli notları benzersiz 4 haneli Gizli Kodunla paylaş.',
        'home.pin.desc_2': 'Başkaları profilini ',
        'home.pin.desc_3': ' adresinde ancak kodunu bilirlerse görüntüleyebilir.',
        'home.cta.title': 'Daha akıllı çalışmaya hazır mısın?',
        'home.cta.button': 'BAŞLAT_',
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
