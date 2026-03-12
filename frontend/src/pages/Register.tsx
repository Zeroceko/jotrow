import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ChevronDown, ChevronUp, Loader2, Mail, ShieldCheck, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralHandle, setReferralHandle] = useState('');
  const [showReferralField, setShowReferralField] = useState(false);
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
        password,
        referral_handle: showReferralField ? referralHandle.trim() || null : null,
      });
      // Auto-login with the returned token
      login(response.data.access_token);
      // Let RequireUsername handle the redirect to SetupProfile
      navigate('/');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail === 'Referral handle not found.' || detail === 'Referral code not found.') {
        setError(t('reg.referral_not_found'));
      } else {
        setError(detail || t('reg.fail'));
      }
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
          <div className="space-y-2">
            <label className="text-sm font-bold text-retro-muted tracking-widest uppercase">
              {t('reg.email_label')}
            </label>
            <div className="relative">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@network.com"
                className="pl-14"
              />
              <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-retro-muted" size={20} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-retro-muted tracking-widest uppercase">
              {t('reg.pwd_label')}
            </label>
            <div className="relative">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="pl-14"
              />
              <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-retro-muted" size={20} />
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setShowReferralField((prev) => !prev);
                if (error === t('reg.referral_not_found')) {
                  setError('');
                }
              }}
              className="w-full flex items-center justify-between px-4 py-3 border-2 border-dashed border-retro-border text-retro-muted font-mono text-xs font-bold uppercase tracking-[0.2em] hover:border-retro-accent hover:text-retro-accent transition-colors"
            >
              <span>{t('reg.referral_label')}</span>
              {showReferralField ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showReferralField && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-retro-muted tracking-widest uppercase">
                  {t('reg.referral_field_label')}
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={referralHandle}
                    onChange={(e) => setReferralHandle(e.target.value.replace(/^@+/, '').replace(/[^a-zA-Z0-9_]/g, ''))}
                    placeholder={t('reg.referral_placeholder')}
                    className="pl-14"
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-retro-muted" size={20} />
                </div>
              </div>
            )}
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
