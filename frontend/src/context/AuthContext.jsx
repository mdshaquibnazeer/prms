import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, onUnauthorized, tokenStore } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(!!tokenStore.get()); // true while we verify a saved token

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // If any API call comes back 401 (expired token) log the user out.
  useEffect(() => { onUnauthorized(logout); }, [logout]);

  // On page load, verify the saved token with the backend.
  useEffect(() => {
    if (!tokenStore.get()) return;
    authApi.me()
      .then((r) => setUser(r.user))
      .catch(() => tokenStore.clear())
      .finally(() => setBooting(false));
  }, []);

  const setSession = useCallback((token, u) => {
    tokenStore.set(token);
    setUser(u);
  }, []);

  const login = useCallback(async (email, password, extra = {}) => {
    const r = await authApi.login(email, password, extra);
    tokenStore.set(r.token);
    setUser(r.user);
    return r.user;
  }, []);

  const value = useMemo(() => ({ user, booting, login, logout, setSession }), [user, booting, login, logout, setSession]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
