import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, BookText, PlusCircle, User, Globe, ChevronDown, Wallet } from 'lucide-react';
import { Button } from './ui/Button';
import { useLanguage } from '../context/LanguageContext';

export const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
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

  return (
    <nav className="border-b-2 border-retro-border bg-retro-bg/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="py-3 sm:h-16 sm:py-0">
          <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-4 sm:h-full">
            <Link to="/explore" className="flex min-w-0 items-center gap-2 group">
              <div className="bg-retro-accent text-retro-bg p-1.5 border-2 border-retro-accent group-hover:bg-retro-bg group-hover:text-retro-accent transition-colors">
                <BookText size={24} />
              </div>
              <span className="font-bold text-lg tracking-tight uppercase truncate sm:text-xl">
                JOTROW
              </span>
            </Link>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-4 sm:overflow-visible sm:pb-0">
              <div className="relative group shrink-0">
                <button
                  className="text-retro-muted hover:text-retro-text font-mono text-xs sm:text-sm border-2 border-transparent hover:border-retro-muted px-2 py-1 flex items-center gap-1 transition-colors"
                  title="Select Language"
                >
                  <Globe size={16} />
                  <span className="w-6 text-left">{language.toUpperCase()}</span>
                  <ChevronDown size={14} />
                </button>
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-24 bg-retro-panel border-2 border-retro-border hidden group-hover:block group-focus-within:block z-50">
                  <button onClick={() => setLanguage('en')} className="block w-full text-left px-4 py-2 hover:bg-retro-bg font-mono text-sm">EN</button>
                  <button onClick={() => setLanguage('tr')} className="block w-full text-left px-4 py-2 hover:bg-retro-bg font-mono text-sm">TR</button>
                </div>
              </div>

              {isAuthenticated ? (
                <>
                  <Link to="/explore" className="shrink-0 text-retro-muted hover:text-retro-text font-medium transition-colors text-xs sm:text-sm sm:mr-2">
                    {t('nav.explore') || 'EXPLORE'}
                  </Link>
                  <Link to="/wallet" className="shrink-0 text-retro-muted hover:text-retro-text font-medium transition-colors flex items-center gap-2 border-2 border-transparent hover:border-retro-muted px-2 py-1 rounded text-xs sm:text-sm">
                    <Wallet size={18} />
                    <span className="hidden md:inline">{t('set.wallet') || 'WALLET'}</span>
                  </Link>
                  <Link to="/profile" className="shrink-0 text-retro-muted hover:text-retro-text font-medium transition-colors flex items-center gap-2 border-2 border-transparent hover:border-retro-muted px-2 py-1 rounded text-xs sm:text-sm">
                    <User size={18} />
                    <span className="hidden md:inline">Benim Yerim</span>
                  </Link>
                  <Button variant="ghost" onClick={handleUploadClick} className="shrink-0 flex gap-2 items-center px-2 sm:px-3 text-xs sm:text-sm">
                    <PlusCircle size={18} />
                    <span className="hidden lg:inline">{t('nav.upload') || 'UPLOAD'}</span>
                  </Button>
                  <Button variant="secondary" onClick={handleLogout} className="shrink-0 flex gap-2 items-center px-2 sm:px-4 text-xs sm:text-sm">
                    <LogOut size={16} />
                    <span className="hidden md:inline">{t('nav.logout')}</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/explore" className="shrink-0 text-retro-muted hover:text-retro-text font-medium transition-colors text-xs sm:text-sm sm:mr-4">
                    {t('nav.explore')}
                  </Link>
                  <Link to="/login" className="shrink-0 text-retro-muted hover:text-retro-text font-medium transition-colors text-xs sm:text-sm">
                    {t('nav.login')}
                  </Link>
                  <Link to="/register" className="hidden sm:block shrink-0">
                    <Button variant="primary" className="px-3 sm:px-4 text-xs sm:text-sm">{t('nav.register')}</Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3 sm:hidden">
            <Link to="/explore" className="flex min-w-0 items-center gap-2 group">
              <div className="bg-retro-accent text-retro-bg p-1.5 border-2 border-retro-accent group-hover:bg-retro-bg group-hover:text-retro-accent transition-colors">
                <BookText size={24} />
              </div>
              <span className="font-bold text-lg tracking-tight uppercase truncate">
                JOTROW
              </span>
            </Link>

            {!isAuthenticated ? (
              <Link to="/register" className="justify-self-end">
                <Button variant="primary" className="px-3 text-xs whitespace-nowrap">{t('nav.register')}</Button>
              </Link>
            ) : (
              <Button variant="secondary" onClick={handleLogout} className="justify-self-end px-3 text-xs whitespace-nowrap">
                <LogOut size={16} />
              </Button>
            )}

            <div className="col-span-2 flex items-center justify-between gap-2 border-t border-retro-border pt-2">
              <div className="relative group">
                <button
                  className="text-retro-muted hover:text-retro-text font-mono text-xs border-2 border-transparent hover:border-retro-muted px-2 py-1 flex items-center gap-1 transition-colors"
                  title="Select Language"
                >
                  <Globe size={16} />
                  <span className="w-6 text-left">{language.toUpperCase()}</span>
                  <ChevronDown size={14} />
                </button>
                <div className="absolute left-0 mt-2 w-24 bg-retro-panel border-2 border-retro-border hidden group-hover:block group-focus-within:block z-50">
                  <button onClick={() => setLanguage('en')} className="block w-full text-left px-4 py-2 hover:bg-retro-bg font-mono text-sm">EN</button>
                  <button onClick={() => setLanguage('tr')} className="block w-full text-left px-4 py-2 hover:bg-retro-bg font-mono text-sm">TR</button>
                </div>
              </div>
              {!isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Link to="/explore" className="text-retro-muted hover:text-retro-text font-medium transition-colors text-xs">
                    {t('nav.explore')}
                  </Link>
                  <Link to="/login" className="text-retro-muted hover:text-retro-text font-medium transition-colors text-xs">
                    {t('nav.login')}
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2 overflow-x-auto">
                  <Link to="/explore" className="shrink-0 text-retro-muted hover:text-retro-text font-medium transition-colors text-xs">
                    {t('nav.explore') || 'EXPLORE'}
                  </Link>
                  <Link to="/wallet" className="shrink-0 text-retro-muted hover:text-retro-text font-medium transition-colors flex items-center gap-1 text-xs">
                    <Wallet size={16} />
                  </Link>
                  <Link to="/profile" className="shrink-0 text-retro-muted hover:text-retro-text font-medium transition-colors flex items-center gap-1 text-xs">
                    <User size={16} />
                  </Link>
                  <Button variant="ghost" onClick={handleUploadClick} className="shrink-0 flex gap-1 items-center px-2 text-xs">
                    <PlusCircle size={16} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
