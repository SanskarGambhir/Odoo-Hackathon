import { createContext, useContext, useState, useCallback } from 'react';
import { ROLE_ACCESS } from '../data/mockData';

const AuthContext = createContext(null);

const DEMO_USERS = {
  'fleet@transitops.com': { name: 'Arjun Mehta', role: 'Fleet Manager', avatar: 'AM' },
  'dispatch@transitops.com': { name: 'Priya Reddy', role: 'Dispatcher', avatar: 'PR' },
  'safety@transitops.com': { name: 'Karan Singh', role: 'Safety Officer', avatar: 'KS' },
  'finance@transitops.com': { name: 'Neha Kapoor', role: 'Financial Analyst', avatar: 'NK' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('transitops_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [error, setError] = useState(null);

  const login = useCallback((email, password, role) => {
    setError(null);

    // Simulate locked account
    if (email === 'locked@transitops.com') {
      setError({ type: 'locked', message: 'This account has been locked due to multiple failed login attempts. Please contact your administrator.' });
      return false;
    }

    // Simulate invalid credentials
    if (!email || !password) {
      setError({ type: 'invalid', message: 'Please enter both email and password.' });
      return false;
    }

    if (password.length < 3) {
      setError({ type: 'invalid', message: 'Invalid email or password. Please try again.' });
      return false;
    }

    // Check for demo user or accept any valid-looking email
    const demoUser = DEMO_USERS[email.toLowerCase()];
    const userData = demoUser
      ? { email: email.toLowerCase(), name: demoUser.name, role: demoUser.role, avatar: demoUser.avatar }
      : { email: email.toLowerCase(), name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), role, avatar: email.substring(0, 2).toUpperCase() };

    localStorage.setItem('transitops_user', JSON.stringify(userData));
    setUser(userData);
    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('transitops_user');
    setUser(null);
    setError(null);
  }, []);

  const hasAccess = useCallback((path) => {
    if (!user) return false;
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
