'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Role, UserDto } from '@testcraft/shared';
import {
  ACCESS_TOKEN_KEY,
  api,
  ApiError,
  REFRESH_TOKEN_KEY,
  REMEMBERED_EMAIL_KEY,
} from './api';

interface AuthResponse {
  user: UserDto;
  tokens: { accessToken: string; refreshToken: string; expiresIn: number };
}

interface AuthContextValue {
  user: UserDto | null;
  loading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<UserDto>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<UserDto>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** Email yang diingat dari login terakhir (kosong bila tidak dicentang). */
  rememberedEmail: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Halaman default per role setelah login. */
export function homePathFor(role: Role): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/admin';
    case 'INSTRUCTOR':
      return '/instructor';
    case 'CORPORATE_ADMIN':
      return '/corporate';
    default:
      return '/dashboard';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [rememberedEmail, setRememberedEmail] = useState('');
  const router = useRouter();

  const persist = useCallback((res: AuthResponse, remember: boolean) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, res.tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.tokens.refreshToken);
    // Hanya email yang diingat — password diserahkan ke password manager browser.
    if (remember) localStorage.setItem(REMEMBERED_EMAIL_KEY, res.user.email);
    else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    setUser(res.user);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await api.get<UserDto>('/auth/me', { auth: true }));
    } catch (err) {
      // Access token kedaluwarsa → coba tukar dengan refresh token sekali.
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (err instanceof ApiError && err.status === 401 && refreshToken) {
        try {
          const res = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
          persist(res, !!localStorage.getItem(REMEMBERED_EMAIL_KEY));
          return;
        } catch {
          /* jatuh ke pembersihan di bawah */
        }
      }
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [persist]);

  useEffect(() => {
    setRememberedEmail(localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? '');
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      const res = await api.post<AuthResponse>('/auth/login', { email, password });
      persist(res, remember);
      setRememberedEmail(remember ? res.user.email : '');
      return res.user;
    },
    [persist],
  );

  const register = useCallback(
    async (input: { name: string; email: string; password: string; phone?: string }) => {
      const res = await api.post<AuthResponse>('/auth/register', input);
      persist(res, true);
      setRememberedEmail(res.user.email);
      return res.user;
    },
    [persist],
  );

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    try {
      await api.post('/auth/logout', { refreshToken }, { auth: true });
    } catch {
      /* sesi lokal tetap dibersihkan meski request gagal */
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
    router.push('/login');
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser, rememberedEmail }),
    [user, loading, login, register, logout, refreshUser, rememberedEmail],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}

/** Redirect ke /login bila belum masuk, atau ke beranda role bila role salah. */
export function useRequireAuth(allowed?: Role[]) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (allowed && !allowed.includes(user.role) && user.role !== 'SUPER_ADMIN') {
      router.replace(homePathFor(user.role));
    }
  }, [user, loading, allowed, router]);

  return { user, loading };
}
