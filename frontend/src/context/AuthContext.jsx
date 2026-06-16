import { createContext, useContext, useState, useCallback } from 'react';
import axios from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const login = useCallback((userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', tokenData);
  }, []);

  const logout = useCallback(async () => {
    // Call backend logout endpoint to log the logout event
    // The axios interceptor will automatically add the Authorization header
    if (token) {
      try {
        await axios.post('/auth/logout');
      } catch (error) {
        console.error('Logout API call failed:', error);
      }
    }
    // Clear local state regardless of API call success
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, [token]);

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

