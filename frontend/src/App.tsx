import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import Explore from './pages/Explore';
import './index.css';

import CourseDetail from './pages/CourseDetail';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-retro-bg text-retro-text selection:bg-retro-accent selection:text-retro-bg">
          <Navbar />
          <main className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/course/:id" element={<CourseDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/u/:username" element={<Profile isPublic={true} />} />
          </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
