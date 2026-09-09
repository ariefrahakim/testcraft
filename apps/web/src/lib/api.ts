import type { Paginated } from '@testcraft/shared';

/**
 * URL API. Server component memakai `API_INTERNAL_URL` (nama service Docker),
 * browser memakai `NEXT_PUBLIC_API_URL` (lewat host).
 */
export const API_URL =
  (typeof window === 'undefined'
    ? process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL
    : process.env.NEXT_PUBLIC_API_URL) ?? 'http://localhost:4001/api/v1';

export const ACCESS_TOKEN_KEY = 'tc.accessToken';
export const REFRESH_TOKEN_KEY = 'tc.refreshToken';
export const REMEMBERED_EMAIL_KEY = 'tc.rememberedEmail';
export const LOCALE_STORAGE_KEY = 'tc.locale';

export interface FieldError {
  field: string;
  code: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Kode stabil dari API, mis. "auth.invalidCredentials". */
    readonly code?: string,
    /** Error per-field pada kegagalan validasi. */
    readonly errors?: FieldError[],
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Pesan untuk sebuah field, bila ada. */
  fieldMessage(field: string): string | undefined {
    return this.errors?.find((e) => e.field === field)?.message;
  }
}

/** Bahasa aktif untuk header Accept-Language. */
function currentLocale(): string {
  if (typeof window === 'undefined') return 'id';
  return localStorage.getItem(LOCALE_STORAGE_KEY) ?? 'id';
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Sertakan Bearer token dari localStorage (hanya di browser). */
  auth?: boolean;
  /** Detik revalidate untuk fetch di server component. */
  revalidate?: number;
}

export async function apiFetch<T>(
  path: string,
  { body, auth, revalidate, headers, ...init }: RequestOptions = {},
): Promise<T> {
  const isBrowser = typeof window !== 'undefined';
  const token = auth && isBrowser ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // API menerjemahkan pesan error mengikuti header ini, sehingga pesan
      // dari server selalu sebahasa dengan antarmuka.
      'Accept-Language': currentLocale(),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...(isBrowser
      ? { cache: 'no-store' as const }
      : { next: { revalidate: revalidate ?? 60 } }),
  });

  if (res.status === 204) return undefined as T;

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : (payload?.message ?? `Request failed (${res.status})`);
    throw new ApiError(res.status, message, payload?.code, payload?.errors, payload);
  }
  return payload as T;
}

/** Helper khusus endpoint list yang selalu mengembalikan bentuk Paginated. */
export function apiList<T>(path: string, opts?: RequestOptions) {
  return apiFetch<Paginated<T>>(path, opts);
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    apiFetch<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T>(path: string, opts?: RequestOptions) =>
    apiFetch<T>(path, { ...opts, method: 'DELETE' }),
};
