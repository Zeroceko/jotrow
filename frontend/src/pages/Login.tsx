import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      login(response.data.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || t('login.fail'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
      <Card className="w-full max-w-md">
        <div className="mb-8">
          <h2 className="text-3xl font-bold uppercase tracking-tight mb-2">{t('login.title')}<span className="text-retro-accent">_</span></h2>
          <p className="text-retro-muted font-mono text-sm">{t('login.subtitle')}</p>
        </div>

        {error && (
          <div className="bg-retro-danger/20 border-2 border-retro-danger text-retro-danger p-3 mb-6 font-mono text-sm">
            {t('login.error_prefix')} {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label={t('login.email_label')}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="off"
            spellCheck="false"
            placeholder={t('login.email_placeholder')}
          />
          <Input
            label={t('login.pwd_label')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            className="w-full mt-4 flex justify-center items-center gap-2"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            {isLoading ? t('login.authenticating') : t('login.login_btn')}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t-2 border-retro-border text-center font-mono text-sm">
          <span className="text-retro-muted">{t('login.no_account')} </span>
          <Link to="/register" className="text-retro-accent hover:underline decoration-2 underline-offset-4 font-bold">
            {t('login.register')}
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Login;
