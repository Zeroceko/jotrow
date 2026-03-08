import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, BookText, PlusCircle, User, Globe, ChevronDown, Wallet } from 'lucide-react';
import { Button } from './ui/Button';
import { jwtDecode } from 'jwt-decode';
import { useLanguage } from '../context/LanguageContext';

export const Navbar: React.FC = () => {
  const { isAuthenticated, logout, token } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Helper to extract courseId from path if present
  const courseMatch = location.pathname.match(/\/course\/(\d+)/);
  const currentCourseId = courseMatch ? courseMatch[1] : null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleUploadClick = () => {
    if (currentCourseId) {
      navigate(`/upload?courseId=${currentCourseId}`);
    } else {
      navigate('/upload');
    }
  };

  let username = '';
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      username = decoded.username || '';
    } catch {
      // invalid token
    }
  }



  return (
    <nav className="border-b-2 border-retro-border bg-retro-bg/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-retro-accent text-retro-bg p-1.5 border-2 border-retro-accent group-hover:bg-retro-bg group-hover:text-retro-accent transition-colors">
              <BookText size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight uppercase">
              JOTROW
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <button
                className="text-retro-muted hover:text-retro-text font-mono text-sm border-2 border-transparent hover:border-retro-muted px-2 py-1 flex items-center gap-1 transition-colors"
                title="Select Language"
              >
                <Globe size={16} />
                <span className="w-6 text-left">{language.toUpperCase()}</span>
                <ChevronDown size={14} />
              </button>
              <div className="absolute right-0 mt-2 w-24 bg-retro-panel border-2 border-retro-border hidden group-hover:block z-50">
                <button onClick={() => setLanguage('en')} className="block w-full text-left px-4 py-2 hover:bg-retro-bg font-mono text-sm">EN</button>
                <button onClick={() => setLanguage('tr')} className="block w-full text-left px-4 py-2 hover:bg-retro-bg font-mono text-sm">TR</button>
              </div>
            </div>

            {isAuthenticated ? (
              <>
                <Link to="/explore" className="text-retro-muted hover:text-retro-text font-medium transition-colors mr-2">
                  {t('nav.explore') || 'EXPLORE'}
                </Link>
                <Link to="/wallet" className="text-retro-muted hover:text-retro-text font-medium transition-colors flex items-center gap-2 border-2 border-transparent hover:border-retro-muted px-2 py-1 rounded">
                  <Wallet size={18} />
                  <span className="hidden md:inline">{t('set.wallet') || 'WALLET'}</span>
                </Link>
                <Link to={`/u/${username}`} className="text-retro-muted hover:text-retro-text font-medium transition-colors flex items-center gap-2 border-2 border-transparent hover:border-retro-muted px-2 py-1 rounded">
                  <User size={18} />
                  <span className="hidden sm:inline">{t('nav.profile') || 'PROFILE'}</span>
                </Link>
                <Button variant="ghost" onClick={handleUploadClick} className="flex gap-2 items-center">
                  <PlusCircle size={18} />
                  <span className="hidden xl:inline">{t('nav.upload') || 'UPLOAD'}</span>
                </Button>
                <Button variant="secondary" onClick={handleLogout} className="flex gap-2 items-center px-4">
                  <LogOut size={16} />
                  <span className="hidden sm:inline">{t('nav.logout')}</span>
                </Button>
              </>
            ) : (
              <>
                <Link to="/explore" className="text-retro-muted hover:text-retro-text font-medium transition-colors mr-4">
                  {t('nav.explore')}
                </Link>
                <Link to="/login" className="text-retro-muted hover:text-retro-text font-medium transition-colors">
                  {t('nav.login')}
                </Link>
                <Link to="/register">
                  <Button variant="primary">{t('nav.register')}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
