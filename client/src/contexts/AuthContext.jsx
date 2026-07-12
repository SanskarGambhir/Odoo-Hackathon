import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { loginUser, logoutUser, getCurrentUser } from '../api/auth.js';
import { ROLE_ACCESS, ROLE_LABELS, GLOBAL_ROUTES } from '../data/mockData';

const AuthContext = createContext(null);

const toDisplayUser = (rawUser) => ({
  id: rawUser.id,
  email: rawUser.email,
  name: rawUser.username,
  role: ROLE_LABELS[rawUser.role] || rawUser.role,
  avatar: rawUser.username?.substring(0, 2).toUpperCase() || 'U',
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on load using the httpOnly cookie, if any
  useEffect(() => {
    (async () => {
      try {
        const { data } = await getCurrentUser();
        setUser(toDisplayUser(data.user));
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);

    if (!email || !password) {
      setError({ type: 'invalid', message: 'Please enter both email and password.' });
      return false;
    }

    try {
      const { data } = await loginUser({ email, password });
      setUser(toDisplayUser(data.user));
      return true;
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 401 || status === 404) {
        setError({ type: 'invalid', message: message || 'Invalid email or password. Please try again.' });
      } else {
        setError({ type: 'invalid', message: message || 'Something went wrong. Please try again.' });
      }
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // ignore - clear local state regardless
    }
    setUser(null);
    setError(null);
  }, []);

  const hasAccess = useCallback((path) => {
    if (!user) return false;
    if (GLOBAL_ROUTES.some(route => path.startsWith(route))) return true;
    const access = ROLE_ACCESS[user.role];
    if (!access) return false;
    return access.routes.some(route => path.startsWith(route));
  }, [user]);

  const getAccessibleRoutes = useCallback(() => {
    if (!user) return [];
    return ROLE_ACCESS[user.role]?.routes || [];
  }, [user]);

  const getModuleAccess = useCallback(() => {
    if (!user) return {};
    return ROLE_ACCESS[user.role]?.modules || {};
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      error,
      isLoading,
      login,
      logout,
      hasAccess,
      getAccessibleRoutes,
      getModuleAccess,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
