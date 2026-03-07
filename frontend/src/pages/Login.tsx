import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

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
      setError(err.response?.data?.detail || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
      <Card className="w-full max-w-md">
        <div className="mb-8">
          <h2 className="text-3xl font-bold uppercase tracking-tight mb-2">Login<span className="text-retro-accent">_</span></h2>
          <p className="text-retro-muted font-mono text-sm">Welcome back to the system.</p>
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
          />
          <Input
            label="PASSWORD"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <Button 
            type="submit" 
            className="w-full mt-4" 
            disabled={isLoading}
          >
            {isLoading ? 'AUTHENTICATING...' : 'LOGIN_'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t-2 border-retro-border text-center font-mono text-sm">
          <span className="text-retro-muted">Don't have an account? </span>
          <Link to="/register" className="text-retro-accent hover:underline decoration-2 underline-offset-4 font-bold">
            REGISTER
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Login;
