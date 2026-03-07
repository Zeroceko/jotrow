import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Copy, Check, Loader2, User as UserIcon, Mail, ShieldCheck } from 'lucide-react';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'register' | 'success' | 'username'>('register');

  const { login } = useAuth();
  const navigate = useNavigate();

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
      setShareCode(response.data.share_code);
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.put('/auth/me', { username });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to set username.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (shareCode) {
      navigator.clipboard.writeText(shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── STEP 2: Success & Share Code ───────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4 animate-in fade-in zoom-in duration-500">
        <Card className="w-full max-w-md border-retro-accent shadow-solid-accent">
          <div className="mb-6 flex items-center gap-3">
            <div className="p-2 bg-retro-accent/10 border-2 border-retro-accent rounded-full">
              <ShieldCheck className="text-retro-accent" size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-bold uppercase tracking-tight text-retro-accent leading-none">SUCCESS!</h2>
              <p className="text-retro-muted font-mono text-[10px] uppercase mt-1 tracking-widest">Account identity established.</p>
            </div>
          </div>

          <div className="bg-retro-panel border-2 border-retro-border p-8 mb-8 text-center relative group shadow-solid transition-all">
            <p className="text-retro-muted font-mono text-xs mb-4 uppercase tracking-widest opacity-70">Your Private Share Code</p>
            <div className="text-6xl font-mono font-bold tracking-widest text-retro-accent mb-2">
              {shareCode}
            </div>

            <Button
              variant="secondary"
              onClick={copyToClipboard}
              className="mt-4 flex items-center gap-2 mx-auto py-1 px-4 text-sm"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'COPIED!' : 'COPY CODE_'}
            </Button>

            <div className="mt-8 pt-4 border-t-2 border-retro-border border-dashed text-[10px] text-retro-muted text-left font-mono leading-tight italic">
              IMPORTANT: This PIN is required for others to access your public profile. Keep it secure.
            </div>
          </div>

          <Button onClick={() => setStep('username')} variant="primary" className="w-full py-5 text-xl group">
            CONTINUE TO ONBOARDING <span className="group-hover:translate-x-1 transition-transform inline-block ml-1">→</span>
          </Button>
        </Card>
      </div>
    );
  }

  // ── STEP 3: Choose Username ────────────────────────────────────────────────
  if (step === 'username') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4 animate-in slide-in-from-right duration-500">
        <Card className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold uppercase tracking-tight mb-2">PICK_A_HANDLE<span className="text-retro-accent">_</span></h2>
            <p className="text-retro-muted font-mono text-sm leading-relaxed">Choose how you will be identified in the JOTROW network.</p>
          </div>

          {error && (
            <div className="bg-retro-danger/20 border-2 border-retro-danger text-retro-danger p-3 mb-6 font-mono text-sm">
              ERROR: {error}
            </div>
          )}

          <form onSubmit={handlePickUsername} className="space-y-8">
            <div className="relative">
              <Input
                label="USERNAME"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
              {isLoading ? 'ESTABLISHING...' : 'FINALIZE_IDENTITIES'}
            </Button>

            <p className="text-center text-[10px] text-retro-muted font-mono uppercase tracking-widest opacity-50">
              Identity can be modified later in settings.
            </p>
          </form>
        </Card>
      </div>
    );
  }

  // ── STEP 1: Email/Password ─────────────────────────────────────────────────
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
      <Card className="w-full max-w-md animate-in fade-in duration-700">
        <div className="mb-8">
          <h2 className="text-4xl font-bold uppercase tracking-tighter mb-2 italic">JOIN_US<span className="text-retro-accent">.</span></h2>
          <p className="text-retro-muted font-mono text-xs uppercase tracking-[0.2em]">Initialize new user sequence.</p>
        </div>

        {error && (
          <div className="bg-retro-danger/20 border-2 border-retro-danger text-retro-danger p-3 mb-6 font-mono text-sm">
            ERROR: {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="relative">
            <Input
              label="EMAIL_ADDRESS"
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
              label="ACCESS_PASSWORD"
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
            {isLoading ? 'INITIALIZING...' : 'START_MISSION_'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t-2 border-retro-border text-center font-mono text-xs">
          <span className="text-retro-muted uppercase opacity-70">Already established? </span>
          <Link to="/login" className="text-retro-accent hover:underline decoration-2 underline-offset-4 font-bold ml-1">
            LOGIN_HERE
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
