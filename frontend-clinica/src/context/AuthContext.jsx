import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { login as apiLogin } from '../api/auth';

const AuthContext = createContext(null);

function normalizeToken(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return null;
  return trimmed;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => normalizeToken(localStorage.getItem('co_token')));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('co_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (username, password) => {
    const result = await apiLogin(username, password);
    const payload = result?.data || result || {};
    const newToken = normalizeToken(payload.token);

    if (result?.success && newToken) {
      const user_id = payload.user_id;
      const uname = payload.username;

      localStorage.setItem('co_token', newToken);
      localStorage.setItem('co_user', JSON.stringify({ user_id, username: uname }));
      setToken(newToken);
      setUser({ user_id, username: uname });
      return result;
    }

    return {
      success: false,
      error: payload?.error || { message: 'Resposta de login invalida.' },
    };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('co_token');
    localStorage.removeItem('co_user');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const onAuthLogout = () => logout();
    window.addEventListener('co:auth:logout', onAuthLogout);
    return () => window.removeEventListener('co:auth:logout', onAuthLogout);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!normalizeToken(token) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
