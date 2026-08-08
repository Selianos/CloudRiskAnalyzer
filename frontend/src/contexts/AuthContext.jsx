import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { loginUser, signupUser, logoutUser } from '../api/auth';
import { apiClient, setTokenProvider, setUnauthorizedHandler, BASE_URL } from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser && savedUser !== 'undefined' ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const [isInitializing, setIsInitializing] = useState(true);
  const refreshTokenPromise = useRef(null);

  useEffect(() => {
    // Configure API Client
    setTokenProvider(() => localStorage.getItem('token'));
    
    setUnauthorizedHandler(async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token available');

      if (!refreshTokenPromise.current) {
        refreshTokenPromise.current = (async () => {
          try {
            const response = await fetch(`${BASE_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken })
            });
            if (!response.ok) throw new Error('Failed to refresh token');
            
            const data = await response.json();
            if (data.access_token) localStorage.setItem('token', data.access_token);
            if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token);
            return data.access_token;
          } finally {
            refreshTokenPromise.current = null;
          }
        })();
      }
      
      try {
        return await refreshTokenPromise.current;
      } catch (e) {
        // Flag for the Login page to show an alert
        sessionStorage.setItem('sessionExpired', 'true');
        
        // Force logout on failure using direct state setters
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
        throw e;
      }
    });

    const verifySession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await apiClient('/auth/me');
        } catch (error) {
          console.error("Session invalid on load", error);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setIsInitializing(false);
    };

    verifySession();
  }, []);

  const login = async (email, password) => {
    const response = await loginUser({ email, password });

    const token = response?.token || response?.access_token;
    const refreshToken = response?.refresh_token;
    const userData = response?.user || null;

    if (token) localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

    localStorage.setItem('isAuthenticated', 'true');
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }

    setIsAuthenticated(true);
    setUser(userData);
  };

  const signup = async (name, email, password) => {
    await signupUser({ fullname: name, email, password });
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  if (isInitializing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--gray-2)' }}>
        Loading session...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
