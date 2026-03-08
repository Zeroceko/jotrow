import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Zap, Gem, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Home: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center">
            {/* Hero Section */}
            <section className="py-20 px-4 text-center max-w-4xl mx-auto">
                <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-6 leading-tight">
                    {t('home.hero.title_1')} <br />
                    <span className="text-retro-accent underline decoration-4 underline-offset-8">{t('home.hero.title_2')}</span>{t('home.hero.title_3')}
                </h1>

                <p className="text-xl text-retro-muted font-mono mb-10 max-w-2xl mx-auto leading-relaxed">
                    {t('home.hero.desc')}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        onClick={() => navigate(isAuthenticated ? '/' : '/register')}
                        className="text-lg py-4 px-10"
                    >
                        {isAuthenticated ? t('home.hero.launch') : t('home.hero.start')}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/explore')}
                        className="text-lg py-4 px-10"
                    >
                        {t('home.hero.explore')}
                    </Button>
                </div>
            </section>

            {/* Why Section */}
            <section className="py-20 w-full bg-retro-panel border-y-2 border-retro-border">
                <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-12">
                    <div className="flex flex-col items-center text-center group">
                        <div className="bg-retro-bg p-5 border-2 border-retro-accent mb-6 transform group-hover:-rotate-3 transition-transform">
                            <Zap size={32} className="text-retro-accent" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">{t('home.why.rapid')}</h3>
                        <p className="text-retro-muted font-mono">
                            {t('home.why.rapid_desc')}
                        </p>
                    </div>

                    <div className="flex flex-col items-center text-center group">
                        <div className="bg-retro-bg p-5 border-2 border-retro-accent mb-6 transform group-hover:rotate-3 transition-transform">
                            <Gem size={32} className="text-retro-accent" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">{t('home.why.clean')}</h3>
                        <p className="text-retro-muted font-mono">
                            {t('home.why.clean_desc')}
                        </p>
                    </div>

                    <div className="flex flex-col items-center text-center group">
                        <div className="bg-retro-bg p-5 border-2 border-retro-accent mb-6 transform group-hover:-rotate-3 transition-transform">
                            <Lock size={32} className="text-retro-accent" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">{t('home.why.simple')}</h3>
                        <p className="text-retro-muted font-mono">
                            {t('home.why.simple_desc')}
                        </p>
                    </div>
                </div>
            </section>

            {/* PIN Section */}
            <section className="py-20 px-4 text-center max-w-2xl mx-auto">
                <div className="bg-retro-bg border-4 border-dashed border-retro-border p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-retro-accent"></div>
                    <h2 className="text-3xl font-bold mb-4 uppercase italic tracking-widest text-retro-accent">{t('home.pin.title')}</h2>
                    <p className="text-retro-text font-mono mb-6">
                        {t('home.pin.desc_1')}
                        <br />{t('home.pin.desc_2')}<span className="text-white">/u/[username]</span>{t('home.pin.desc_3')}
                    </p>
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4].map(n => (
                            <div key={n} className="w-10 h-14 border-2 border-retro-border flex items-center justify-center text-2xl font-mono bg-retro-panel">
                                *
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer-ish CTA */}
            <section className="py-20 text-center">
                <h2 className="text-4xl font-bold mb-8 uppercase tracking-tighter">{t('home.cta.title')}</h2>
                <Link to="/register">
                    <Button variant="primary" className="text-xl py-4 px-12">
                        {t('home.cta.button')}
                    </Button>
                </Link>
            </section>
        </div>
    );
};

export default Home;
