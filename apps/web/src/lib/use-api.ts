'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

interface State<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Pengambil data sederhana untuk client component yang butuh token.
 * Cukup untuk halaman dashboard; kalau kebutuhan caching bertambah,
 * ganti dengan TanStack Query tanpa mengubah pemanggilnya.
 */
export function useApi<T>(path: string | null, deps: unknown[] = []) {
  const [state, setState] = useState<State<T>>({
    data: null,
    error: null,
    loading: true,
  });

  const reload = useCallback(async () => {
    if (!path) {
      setState({ data: null, error: null, loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api.get<T>(path, { auth: true });
      setState({ data, error: null, loading: false });
    } catch (err) {
      setState({
        data: null,
        error: err instanceof Error ? err.message : 'Gagal memuat data',
        loading: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...state, reload };
}
