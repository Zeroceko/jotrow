import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface UserPayload {
  sub: string; // The username (or email originally in older tokens)
  user_id: number;
  username: string;
  email: string;
  exp: number;
}

interface AuthContextType {
  token: string | null;
  user: UserPayload | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<UserPayload | null>(null);

  const processToken = (currentToken: string | null) => {
    if (currentToken) {
      try {
        const decoded = jwtDecode<UserPayload>(currentToken);
        // Ensure username is not lost if backend uses 'sub' instead of 'username'
        if (!decoded.username) {
          decoded.username = decoded.sub;
        }
        setUser(decoded);
      } catch (err) {
        console.error("Token decoding failed", err);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    processToken(token);
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const refreshUser = () => {
    const currentToken = localStorage.getItem('token');
    setToken(currentToken);
    processToken(currentToken);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
