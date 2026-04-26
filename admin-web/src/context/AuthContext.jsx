import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'tagakturo_token';
const USER_KEY = 'tagakturo_user';
const ROLE_KEY = 'tagakturo_role';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [role, setRole] = useState(() => localStorage.getItem(ROLE_KEY));
  const [loading, setLoading] = useState(false);

  const isAdmin = role === 'ROLE_ADMIN';
  const isCced = role === 'ROLE_CCED';

  const isAuthenticated = !!token;


  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Invalid credentials');
      }

      const data = await res.json();
      const userName = data.user?.name || '';

      if (!userName.includes('Admin')) {
        throw new Error('Access denied. Only those with "Admin" in their name can login.');
      }

      const roles = data.roles || [];

      const isAdminUser = roles.includes('ROLE_ADMIN');
      const isCcedUser = roles.includes('ROLE_CCED');

      if (!isAdminUser && !isCcedUser) {
        throw new Error('Access denied. Admin or CCED privileges required.');
      }

      const primaryRole = isAdminUser ? 'ROLE_ADMIN' : 'ROLE_CCED';

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      localStorage.setItem(ROLE_KEY, primaryRole);
      setToken(data.token);
      setUser(data.user);
      setRole(primaryRole);

      return { success: true, role: primaryRole };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
    setToken(null);
    setUser(null);
    setRole(null);
  };

  const authFetch = async (url, options = {}) => {
    const method = options.method || 'GET';
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };

    // Only set Content-Type to JSON if it's a POST/PUT/PATCH and not already set
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401 || res.status === 403) {
      logout();
      return null;
    }

    return res;
  };

  return (
    <AuthContext.Provider value={{ token, user, role, isAdmin, isCced, isAuthenticated, loading, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
