import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';

import Upload from './pages/Upload';
import Profile from './pages/Profile';
import Explore from './pages/Explore';
import Home from './pages/Home';
import Settings from './pages/Settings';
import SetupProfile from './pages/SetupProfile';
import Wallet from './pages/Wallet';
import './index.css';

import CourseDetail from './pages/CourseDetail';
import NotFound from './pages/NotFound';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const RequireUsername = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user?.username?.startsWith('user_')) {
    return <Navigate to="/setup-profile" replace />;
  }

  return <>{children}</>;
};

const Root = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/profile" replace /> : <Home />;
};

import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-retro-bg text-retro-text selection:bg-retro-accent selection:text-retro-bg">
              <Navbar />
              <main className="max-w-7xl mx-auto">
                <Routes>
                  <Route path="/" element={<RequireUsername><Root /></RequireUsername>} />
                  <Route path="/setup-profile" element={<ProtectedRoute><SetupProfile /></ProtectedRoute>} />
                  <Route path="/course/:id" element={
                    <RequireUsername>
                      <ProtectedRoute>
                        <CourseDetail />
                      </ProtectedRoute>
                    </RequireUsername>
                  } />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/explore" element={<RequireUsername><Explore /></RequireUsername>} />
                  <Route path="/upload" element={<RequireUsername><Upload /></RequireUsername>} />
                  <Route path="/wallet" element={
                    <RequireUsername>
                      <ProtectedRoute>
                        <Wallet />
                      </ProtectedRoute>
                    </RequireUsername>
                  } />
                  <Route path="/profile" element={<RequireUsername><Profile /></RequireUsername>} />
                  <Route path="/settings" element={
                    <RequireUsername>
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    </RequireUsername>
                  } />
                  <Route path="/u/:username" element={<RequireUsername><Profile isPublic={true} /></RequireUsername>} />
                  <Route path="*" element={<RequireUsername><NotFound /></RequireUsername>} />
                </Routes>
              </main>
            </div>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
