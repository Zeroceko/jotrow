import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, BookText } from 'lucide-react';
import { Button } from './ui/Button';

export const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="border-b-2 border-retro-border bg-retro-bg/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-retro-accent text-retro-bg p-1.5 border-2 border-retro-accent group-hover:bg-retro-bg group-hover:text-retro-accent transition-colors">
              <BookText size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight uppercase">
              NOTLAR<span className="text-retro-accent">.</span>BURADA
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/explore" className="text-retro-muted hover:text-retro-text font-medium transition-colors mr-4">
                  Explore
                </Link>
                <Button variant="ghost" onClick={() => navigate('/upload')}>
                  Upload Note
                </Button>
                <Button variant="secondary" onClick={handleLogout} className="flex gap-2 items-center px-4">
                  <LogOut size={16} />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Link to="/explore" className="text-retro-muted hover:text-retro-text font-medium transition-colors mr-4">
                  Explore
                </Link>
                <Link to="/login" className="text-retro-muted hover:text-retro-text font-medium transition-colors">
                  Login
                </Link>
                <Link to="/register">
                  <Button variant="primary">Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
