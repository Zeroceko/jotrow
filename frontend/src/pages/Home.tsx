import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Zap, Gem, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center">
            {/* Hero Section */}
            <section className="py-20 px-4 text-center max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 bg-retro-accent/10 border border-retro-accent/30 text-retro-accent px-4 py-1 mb-6 rounded-full font-mono text-sm animate-pulse">
                    <Sparkles size={16} />
                    <span>V1.0 LIVE: JOT {'->'} REFINE {'->'} SHARE</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-6 leading-tight">
                    Capture your thoughts, <br />
                    <span className="text-retro-accent underline decoration-4 underline-offset-8">refine</span> into knowledge.
                </h1>

                <p className="text-xl text-retro-muted font-mono mb-10 max-w-2xl mx-auto leading-relaxed">
                    The minimalist workspace for students to jot down quick notes,
                    refine them into study materials, and share via secure 4-digit PINs.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        onClick={() => navigate(isAuthenticated ? '/' : '/register')}
                        className="text-lg py-4 px-10"
                    >
                        {isAuthenticated ? 'LAUNCH DASHBOARD_' : 'GET STARTED_'}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/explore')}
                        className="text-lg py-4 px-10"
                    >
                        EXPLORE NOTES_
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
                        <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Rapid Capture</h3>
                        <p className="text-retro-muted font-mono">
                            "Jot" down raw thoughts instantly before they fade. No distractions, just your ideas.
                        </p>
                    </div>

                    <div className="flex flex-col items-center text-center group">
                        <div className="bg-retro-bg p-5 border-2 border-retro-accent mb-6 transform group-hover:rotate-3 transition-transform">
                            <Gem size={32} className="text-retro-accent" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Clean Refinement</h3>
                        <p className="text-retro-muted font-mono">
                            Turn messy scribbles into structured, searchable study materials with Markdown support.
                        </p>
                    </div>

                    <div className="flex flex-col items-center text-center group">
                        <div className="bg-retro-bg p-5 border-2 border-retro-accent mb-6 transform group-hover:-rotate-3 transition-transform">
                            <Lock size={32} className="text-retro-accent" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 uppercase tracking-tight">Simple Sharing</h3>
                        <p className="text-retro-muted font-mono">
                            Share your work with a 4-digit PIN. Keep things private or open to the world in a click.
                        </p>
                    </div>
                </div>
            </section>

            {/* PIN Section */}
            <section className="py-20 px-4 text-center max-w-2xl mx-auto">
                <div className="bg-retro-bg border-4 border-dashed border-retro-border p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-retro-accent"></div>
                    <h2 className="text-3xl font-bold mb-4 uppercase italic tracking-widest text-retro-accent">Secure by PIN</h2>
                    <p className="text-retro-text font-mono mb-6">
                        Share your entire public profile or specific notes using your unique 4-digit Secret Code.
                        Others can view your profile at <span className="text-white">/u/[username]</span> only if they know your code.
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
                <h2 className="text-4xl font-bold mb-8 uppercase tracking-tighter">Ready to study smarter?</h2>
                <Link to="/register">
                    <Button variant="primary" className="text-xl py-4 px-12">
                        INITIALIZE JOINT_
                    </Button>
                </Link>
            </section>
        </div>
    );
};

export default Home;
