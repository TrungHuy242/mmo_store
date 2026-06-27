import { useState, useCallback, useEffect } from 'react';

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

  const load = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn(...args);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (autoLoad) load();
  }, [autoLoad, load]);

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

  const load = useCallback(async (pageNum = 1, queryParams = params) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn({ page: pageNum, limit: 20, ...queryParams });
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
  }, [fetchFn, params]);

  useEffect(() => {
    if (autoLoad) load(1, params);
  }, [autoLoad, load, params]);

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      load(newPage, params);
    }
  };

  const updateParams = (newParams) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  };

  const reload = () => load(page, params);

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
 */
export function useParallelData(fetchers, { autoLoad = true } = {}) {
  const [state, setState] = useState(
    fetchers.map(() => ({ data: null, loading: autoLoad, error: null }))
  );

  const load = useCallback(async () => {
    setState((prev) => prev.map(() => ({ data: null, loading: true, error: null })));
    const next = await Promise.all(
      fetchers.map(async (fn, i) => {
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
  }, [fetchers]);

  useEffect(() => {
    if (autoLoad) load();
  }, [autoLoad, load]);

  return { results: state, reload: load };
}

export default useAdminData;