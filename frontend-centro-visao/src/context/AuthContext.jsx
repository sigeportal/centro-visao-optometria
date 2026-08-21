import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { login as apiLogin, obterMinhaSessao } from '../api/auth';

const AuthContext = createContext(null);

function normalizeToken(value) {
  if (!value) return null;
  const token = String(value).trim();
  if (!token || token === 'undefined' || token === 'null') return null;
  return token;
}

function readStoredUser() {
  const stored = localStorage.getItem('co_user');
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem('co_user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => normalizeToken(localStorage.getItem('co_token')));
  const [user, setUser] = useState(readStoredUser);
  const [sessionLoading, setSessionLoading] = useState(() => Boolean(token));

  const persistUser = useCallback((sessionUser) => {
    localStorage.setItem('co_user', JSON.stringify(sessionUser));
    setUser(sessionUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('co_token');
    localStorage.removeItem('co_user');
    setToken(null);
    setUser(null);
    setSessionLoading(false);
  }, []);

  const refreshSession = useCallback(async () => {
    const sessionUser = await obterMinhaSessao();
    persistUser(sessionUser);
    return sessionUser;
  }, [persistUser]);

  const login = useCallback(async (username, password) => {
    const result = await apiLogin(username, password);
    const payload = result?.data || result || {};
    const newToken = normalizeToken(payload.token);

    if (!result?.success || !newToken) {
      return {
        success: false,
        error: result?.error || payload?.error || { message: 'Resposta de login inválida.' },
      };
    }

    localStorage.setItem('co_token', newToken);
    setToken(newToken);
    setSessionLoading(true);

    try {
      await refreshSession();
      return result;
    } catch (error) {
      logout();
      throw error;
    } finally {
      setSessionLoading(false);
    }
  }, [logout, refreshSession]);

  useEffect(() => {
    if (!token) {
      setSessionLoading(false);
      return undefined;
    }

    let active = true;
    setSessionLoading(true);

    obterMinhaSessao()
      .then((sessionUser) => {
        if (active) persistUser(sessionUser);
      })
      .catch(() => {
        if (active) logout();
      })
      .finally(() => {
        if (active) setSessionLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, logout, persistUser]);

  useEffect(() => {
    const handleForcedLogout = () => logout();
    window.addEventListener('co:auth:logout', handleForcedLogout);
    return () => window.removeEventListener('co:auth:logout', handleForcedLogout);
  }, [logout]);

  const can = useCallback(
    (permission) => Boolean(user?.permissoes?.includes(permission)),
    [user],
  );

  const value = useMemo(() => ({
    token,
    user,
    login,
    logout,
    can,
    refreshSession,
    profile: user?.perfil || null,
    sessionLoading,
    isAuthenticated: Boolean(normalizeToken(token)),
  }), [token, user, login, logout, can, refreshSession, sessionLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }
  return context;
}
