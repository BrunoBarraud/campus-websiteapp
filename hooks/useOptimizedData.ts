// 🚀 Hook optimizado para manejo de datos con cache
import { useState, useEffect, useCallback, useMemo } from 'react';

interface UseOptimizedDataOptions<T> {
  apiUrl: string;
  cacheKey: string;
  cacheTime?: number; // en milisegundos, default 5 minutos
  refetchOnWindowFocus?: boolean;
  initialData?: T[];
}

interface CacheEntry<T> {
  data: T[];
  timestamp: number;
  expiry: number;
}

// Cache global simple en memoria
const cache = new Map<string, CacheEntry<any>>();

export function useOptimizedData<T>({
  apiUrl,
  cacheKey,
  cacheTime = 5 * 60 * 1000, // 5 minutos
  refetchOnWindowFocus = false,
  initialData = []
}: UseOptimizedDataOptions<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar cache
  const getCachedData = useCallback(() => {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    return null;
  }, [cacheKey]);

  // Guardar en cache
  const setCachedData = useCallback((newData: T[]) => {
    cache.set(cacheKey, {
      data: newData,
      timestamp: Date.now(),
      expiry: Date.now() + cacheTime
    });
  }, [cacheKey, cacheTime]);

  // Función de fetch optimizada
  const fetchData = useCallback(async (force = false) => {
    // Intentar cache primero
    if (!force) {
      const cachedData = getCachedData();
      if (cachedData) {
        setData(cachedData);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setCachedData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, getCachedData, setCachedData]);

  // Efecto principal
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      const cached = cache.get(cacheKey);
      // Solo refetch si los datos son antiguos (más de 1 minuto)
      if (!cached || Date.now() - cached.timestamp > 60000) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, cacheKey, fetchData]);

  // Funciones de utilidad
  const refresh = useCallback(() => fetchData(true), [fetchData]);
  
  const clearCache = useCallback(() => {
    cache.delete(cacheKey);
  }, [cacheKey]);

  // Memoized value
  const memoizedData = useMemo(() => data, [data]);

  return {
    data: memoizedData,
    loading,
    error,
    refresh,
    clearCache,
    isStale: () => {
      const cached = cache.get(cacheKey);
      return !cached || Date.now() > cached.expiry;
    }
  };
}

// Hook para paginación optimizada
export function usePaginatedData<T>({
  apiUrl,
  cacheKey,
  pageSize = 10,
  initialPage = 1
}: {
  apiUrl: string;
  cacheKey: string;
  pageSize?: number;
  initialPage?: number;
}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalItems] = useState(0); // Mantenemos para futura implementación
  
  const paginatedApiUrl = `${apiUrl}?page=${currentPage}&limit=${pageSize}`;
  const paginatedCacheKey = `${cacheKey}_page_${currentPage}`;

  const { data, loading, error, refresh } = useOptimizedData<T>({
    apiUrl: paginatedApiUrl,
    cacheKey: paginatedCacheKey,
    cacheTime: 2 * 60 * 1000 // 2 minutos para datos paginados
  });

  const totalPages = Math.ceil(totalItems / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) setCurrentPage(prev => prev + 1);
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) setCurrentPage(prev => prev - 1);
  }, [hasPrevPage]);

  return {
    data,
    loading,
    error,
    refresh,
    currentPage,
    totalPages,
    totalItems,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    pageSize
  };
}
