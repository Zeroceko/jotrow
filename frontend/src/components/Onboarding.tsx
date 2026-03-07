import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { X, ChevronRight, Zap, Gem, Lock } from 'lucide-react';

const Onboarding: React.FC = () => {
    const [step, setStep] = useState(1);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('jotrow_onboarding_seen');
        if (!hasSeenOnboarding) {
            // Small delay for better feel
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = (dontShowAgain = false) => {
        if (dontShowAgain) {
            localStorage.setItem('jotrow_onboarding_seen', 'true');
        }
        setIsVisible(false);
    };

    const nextStep = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            handleClose(true);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <Card className="max-w-md w-full border-retro-accent shadow-solid-accent relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-retro-accent"></div>

                <button
                    onClick={() => handleClose()}
                    className="absolute top-4 right-4 text-retro-muted hover:text-retro-text transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="pt-4 px-2">
                    {/* Progress Dots */}
                    <div className="flex gap-2 mb-8">
                        {[1, 2, 3].map(i => (
                            <div
                                key={i}
                                className={`h-1.5 flex-1 transition-all duration-300 ${i <= step ? 'bg-retro-accent' : 'bg-retro-border'}`}
                            />
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-retro-accent/10 w-16 h-16 flex items-center justify-center border-2 border-retro-accent">
                                <Zap size={32} className="text-retro-accent" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold uppercase tracking-tight mb-2">Step 1: Jot ✍️</h3>
                                <p className="text-retro-text font-mono leading-relaxed">
                                    Start here. Quick-capture raw thoughts, lecture snippets, or ideas.
                                    Don't worry about formatting yet—just get it down.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-retro-accent/10 w-16 h-16 flex items-center justify-center border-2 border-retro-accent">
                                <Gem size={32} className="text-retro-accent" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold uppercase tracking-tight mb-2">Step 2: Refine 💎</h3>
                                <p className="text-retro-text font-mono leading-relaxed">
                                    Clean it up. Organize your 'jots' into Courses.
                                    Add Markdown, images, and structure to turn raw data into permanent knowledge.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-retro-accent/10 w-16 h-16 flex items-center justify-center border-2 border-retro-accent">
                                <Lock size={32} className="text-retro-accent" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold uppercase tracking-tight mb-2">Step 3: Share 🔗</h3>
                                <p className="text-retro-text font-mono leading-relaxed">
                                    Control the access. Use your 4-digit PIN to share your profile.
                                    Your private notes stay private; the rest is for the world to see.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="mt-12 flex items-center justify-between gap-4">
                        <button
                            onClick={() => handleClose(true)}
                            className="text-xs font-mono text-retro-muted hover:text-retro-text uppercase tracking-widest transition-colors"
                        >
                            Don't show again
                        </button>
                        <Button onClick={nextStep} className="flex items-center gap-2 px-8">
                            <span>{step === 3 ? 'FINISH_' : 'NEXT_'}</span>
                            <ChevronRight size={18} />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Onboarding;
