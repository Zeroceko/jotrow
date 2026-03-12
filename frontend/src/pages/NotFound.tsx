import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const NotFound: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="flex items-center justify-center min-h-[70vh] p-4 text-center">
            <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                <div className="bg-retro-panel border-4 border-retro-border p-12 shadow-[12px_12px_0px_var(--color-retro-border)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-retro-danger"></div>

                    <div className="mb-8">
                        <div className="mx-auto w-24 h-24 bg-retro-danger/10 border-4 border-retro-danger flex items-center justify-center mb-6 transform rotate-6">
                            <span className="text-5xl font-bold text-retro-danger">404</span>
                        </div>
                        <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4 italic leading-none">
                            {t('nf.title')}
                        </h1>
                        <p className="text-retro-muted font-mono text-sm leading-relaxed whitespace-pre-wrap">
                            {t('nf.desc')}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Link to="/" className="block">
                            <Button className="w-full h-14 text-lg flex items-center justify-center gap-2 group shadow-solid hover:shadow-solid-accent transition-all">
                                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                                {t('nf.back')}
                            </Button>
                        </Link>

                        <div className="pt-4 border-t-2 border-dashed border-retro-border mt-6">
                            <p className="text-[10px] text-retro-muted font-mono uppercase tracking-widest flex items-center justify-center gap-1">
                                <HelpCircle size={10} /> {t('nf.debug')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
