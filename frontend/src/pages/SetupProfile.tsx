import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Loader2, User as UserIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const SetupProfile: React.FC = () => {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [ready, setReady] = useState(false);

    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user, login } = useAuth();

    useEffect(() => {
        // Use the username from the JWT (already decoded in AuthContext)
        // If the user already has a proper username, redirect away
        if (user) {
            if (user.username && !user.username.startsWith('user_')) {
                navigate('/');
            } else {
                // User needs to pick a username — show the form
                setReady(true);
            }
        } else {
            // No user at all — shouldn't happen on a ProtectedRoute, but show form anyway
            setReady(true);
        }
    }, [user, navigate]);

    const handlePickUsername = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await api.put('/auth/me', { username });
            if (res.data.access_token) {
                login(res.data.access_token);
            }
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.detail || t('reg.fail_user') || 'Failed to update username');
        } finally {
            setIsLoading(false);
        }
    };

    if (!ready) {
        return <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-retro-accent" /></div>;
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4 animate-in slide-in-from-right duration-500">
            <Card className="w-full max-w-md">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold uppercase tracking-tight mb-2">
                        {t('reg.title_step2') || 'CHOOSE HANDLE'}<span className="text-retro-accent">_</span>
                    </h2>
                    <p className="text-retro-muted font-mono text-sm leading-relaxed">
                        {t('reg.subtitle_step2') || 'Pick a unique username for your profile.'}
                    </p>
                </div>

                {error && (
                    <div className="bg-retro-danger/20 border-2 border-retro-danger text-retro-danger p-3 mb-6 font-mono text-sm">
                        {t('login.error_prefix') || '> Error:'} {error}
                    </div>
                )}

                <form onSubmit={handlePickUsername} className="space-y-8">
                    <div className="relative">
                        <Input
                            label={t('reg.user_label') || 'Username'}
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                            required
                            autoComplete="off"
                            spellCheck="false"
                            maxLength={30}
                            placeholder="e.g. cyber_stud"
                            className="pl-12"
                        />
                        <UserIcon className="absolute left-4 top-[38px] text-retro-muted" size={20} />
                    </div>

                    <Button
                        type="submit"
                        className="w-full py-5 text-xl flex justify-center items-center gap-2"
                        disabled={isLoading || !username}
                    >
                        {isLoading && <Loader2 className="animate-spin" size={20} />}
                        {isLoading ? (t('reg.establishing') || 'Establishing...') : (t('reg.finalize') || 'Finalize')}
                    </Button>

                    <p className="text-center text-[10px] text-retro-muted font-mono uppercase tracking-widest opacity-50 mt-4">
                        {t('reg.modify_later') || 'Identity can be modified later in settings.'}
                    </p>
                </form>
            </Card>
        </div>
    );
};

export default SetupProfile;
