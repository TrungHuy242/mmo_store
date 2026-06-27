import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

/**
 * Unwrap axios response to the inner payload.
 * Backend shape: { success, data, pagination?, message? }.
 * Accepts either the raw axios response or the inner payload.
 */
const unwrap = (res) => {
  const payload = res?.data ?? res;
  if (!payload) return { items: null, pagination: null };
  if (payload.data !== undefined) {
    return { items: payload.data, pagination: payload.pagination ?? null };
  }
  return { items: payload, pagination: null };
};

/**
 * Generic hook for fetching admin data.
 *
 * Returns { data, pagination, loading, error, load, setData } where:
 *   - data       : the inner `data` field from the API response
 *   - pagination : the inner `pagination` field (or null)
 *   - load       : function to (re)fetch; can accept args forwarded to fetchFn
 *
 * The hook does NOT auto-fetch on mount by default. Pass { autoLoad: true }
 * or call `load()` from a useEffect inside the consuming component.
 */
export function useAdminData(fetchFn, { autoLoad = false, initialData = null, deps = [] } = {}) {
  const [data, setData] = useState(initialData);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  // Keep latest fetchFn in a ref so the stable `load` callback always
  // invokes the most recent closure of the fetcher. This prevents
  // "Maximum update depth exceeded" when the consumer passes a non-memoized
  // fetcher (e.g. an inline arrow function).
  const fetchFnRef = useRef(fetchFn);
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const load = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchFnRef.current(...args);
        const { items, pagination: pag } = unwrap(res);
        setData(items);
        if (pag !== null) setPagination(pag);
        return items;
      } catch (err) {
        console.error('useAdminData error:', err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (autoLoad) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, load, ...deps]);

  return { data, pagination, loading, error, load, setData };
}

/**
 * Hook for paginated data. Expects backend to return { data: [...], pagination: { page, limit, total, totalPages } }.
 *
 * Returns { data, loading, error, page, totalPages, total, params, reload, changePage, updateParams, setData }.
 */
export function usePaginatedData(fetchFn, initialParams = {}, { autoLoad = true } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [params, setParams] = useState(initialParams);

  // Keep latest fetchFn in a ref so the stable `load` callback doesn't
  // re-create when consumer passes an inline fetcher.
  const fetchFnRef = useRef(fetchFn);
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  // Use a ref for params so changes to `params` do not recreate `load`.
  // `load` is stable; reload/changePage read `paramsRef.current`.
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const load = useCallback(
    async (pageNum = 1, queryParams) => {
      setLoading(true);
      setError(null);
      try {
        const effectiveParams = queryParams ?? paramsRef.current;
        const res = await fetchFnRef.current({ page: pageNum, limit: 20, ...effectiveParams });
        const { items, pagination } = unwrap(res);
        const list = Array.isArray(items) ? items : [];
        setData(list);
        if (pagination) {
          setTotal(pagination.total ?? list.length);
          setTotalPages(pagination.totalPages ?? 1);
        } else {
          setTotal(list.length);
          setTotalPages(1);
        }
        setPage(pageNum);
        return list;
      } catch (err) {
        console.error('usePaginatedData error:', err);
        setError(err);
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Auto-load when `params` change. We intentionally do NOT depend on `load`
  // because `load` is stable. We compare a stable serialization of `params`
  // so that a fresh object with the same content (e.g. {} every render) does
  // not re-fire the effect.
  const paramsKey = useMemo(() => JSON.stringify(params), [params]);
  useEffect(() => {
    if (autoLoad) load(1, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, paramsKey]);

  const changePage = useCallback(
    (newPage) => {
      if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
        load(newPage, params);
      }
    },
    [load, page, params, totalPages]
  );

  const updateParams = useCallback(
    (newParams) => setParams((prev) => ({ ...prev, ...newParams })),
    []
  );

  const reload = useCallback(() => load(page, params), [load, page, params]);

  return {
    data,
    loading,
    error,
    page,
    totalPages,
    total,
    params,
    reload,
    changePage,
    updateParams,
    setData,
  };
}

/**
 * Hook to fetch multiple independent resources in parallel (for dashboard).
 *
 * Returns { results: [{ data, loading, error }, ...], reload }.
 *
 * `fetchers` is intentionally NOT included in the effect dependency list.
 * The hook reads the latest `fetchers` via a ref, so passing a fresh
 * inline array on every render will NOT cause an infinite loop. If you
 * need to react to a change, pass a `deps` array.
 */
export function useParallelData(fetchers, { autoLoad = true, deps = [] } = {}) {
  const [state, setState] = useState(() =>
    (Array.isArray(fetchers) ? fetchers : []).map(() => ({
      data: null,
      loading: autoLoad,
      error: null,
    }))
  );

  const fetchersRef = useRef(fetchers);
  useEffect(() => {
    fetchersRef.current = fetchers;
  }, [fetchers]);

  const load = useCallback(async () => {
    const list = Array.isArray(fetchersRef.current) ? fetchersRef.current : [];
    setState(list.map(() => ({ data: null, loading: true, error: null })));
    const next = await Promise.all(
      list.map(async (fn) => {
        try {
          const res = await fn();
          const { items } = unwrap(res);
          return { data: items, loading: false, error: null };
        } catch (err) {
          return { data: null, loading: false, error: err };
        }
      })
    );
    setState(next);
  }, []);

  useEffect(() => {
    if (autoLoad) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, ...deps]);

  // Memoize results to keep referential stability for consumers
  const results = useMemo(() => state, [state]);

  return { results, reload: load };
}

export default useAdminData;