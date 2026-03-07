import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Copy, Check, Loader2 } from 'lucide-react';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', {
        username,
        password
      });
      setShareCode(response.data.share_code);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Kayıt olurken bir hata oluştu.');
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

  if (shareCode) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <Card className="w-full max-w-md border-retro-accent shadow-solid-accent">
          <div className="mb-6">
            <h2 className="text-3xl font-bold uppercase tracking-tight mb-2 text-retro-accent">SUCCESS!</h2>
            <p className="text-retro-text font-mono">Your account has been created.</p>
          </div>

          <div className="bg-retro-panel border-2 border-retro-border p-8 mb-8 text-center relative group shadow-solid">
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

            <div className="mt-8 pt-4 border-t-2 border-retro-border border-dashed text-[10px] text-retro-muted text-left font-mono leading-tight">
              ⚠️ ATTENTION: This code is your only key to public sharing. Anyone with this PIN can view your shared notes. Keep it safe.
            </div>
          </div>

          <Button onClick={() => navigate('/login')} variant="primary" className="w-full py-4 text-lg">
            AUTHENTICATE & START_
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
      <Card className="w-full max-w-md">
        <div className="mb-8">
          <h2 className="text-3xl font-bold uppercase tracking-tight mb-2">Register<span className="text-retro-accent">_</span></h2>
          <p className="text-retro-muted font-mono text-sm">Initialize new user sequence.</p>
        </div>

        {error && (
          <div className="bg-retro-danger/20 border-2 border-retro-danger text-retro-danger p-3 mb-6 font-mono text-sm">
            ERROR: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="USERNAME"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="off"
            spellCheck="false"
            maxLength={30}
          />
          <Input
            label="PASSWORD"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          <Button
            type="submit"
            className="w-full mt-4 flex justify-center items-center gap-2"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            {isLoading ? 'REGISTERING...' : 'REGISTER_'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t-2 border-retro-border text-center font-mono text-sm">
          <span className="text-retro-muted">Already registered? </span>
          <Link to="/login" className="text-retro-accent hover:underline decoration-2 underline-offset-4 font-bold">
            LOGIN
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
