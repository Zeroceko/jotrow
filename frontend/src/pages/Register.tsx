import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', {
        email,
        password
      });
      // Auto-login with the returned token
      login(response.data.access_token);
      // Let RequireUsername handle the redirect to SetupProfile
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || t('reg.fail'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
      <Card className="w-full max-w-md animate-in fade-in duration-700">
        <div className="mb-8">
          <h2 className="text-4xl font-bold uppercase tracking-tighter mb-2 italic">{t('reg.title_step1')}<span className="text-retro-accent">.</span></h2>
          <p className="text-retro-muted font-mono text-xs uppercase tracking-[0.2em]">{t('reg.subtitle_step1')}</p>
        </div>

        {error && (
          <div className="bg-retro-danger/20 border-2 border-retro-danger text-retro-danger p-3 mb-6 font-mono text-sm">
            {t('login.error_prefix')} {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="relative">
            <Input
              label={t('reg.email_label')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@network.com"
              className="pl-12"
            />
            <Mail className="absolute left-4 top-[38px] text-retro-muted" size={20} />
          </div>

          <div className="relative">
            <Input
              label={t('reg.pwd_label')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="pl-12"
            />
            <ShieldCheck className="absolute left-4 top-[38px] text-retro-muted" size={20} />
          </div>

          <Button
            type="submit"
            className="w-full mt-4 py-5 text-xl flex justify-center items-center gap-2 group shadow-solid hover:shadow-solid-accent transition-all"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="animate-spin" size={20} />}
            {isLoading ? t('reg.initializing') : t('reg.start')}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t-2 border-retro-border text-center font-mono text-xs">
          <span className="text-retro-muted uppercase opacity-70">{t('reg.already')} </span>
          <Link to="/login" className="text-retro-accent hover:underline decoration-2 underline-offset-4 font-bold ml-1">
            {t('reg.login')}
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
