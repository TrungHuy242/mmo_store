import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for fetching admin data with loading and error states
 */
export function useAdminData(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      // Handle both axios response and fetch response
      setData(res.data?.data ?? res.data ?? res);
    } catch (err) {
      console.error('useAdminData error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}

/**
 * Custom hook for paginated data
 */
export function usePaginatedData(fetchFn, initialParams = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const result = res.data?.data ?? res.data ?? res;
      
      if (Array.isArray(result)) {
        setData(result);
      } else if (result.orders) {
        setData(result.orders);
      } else if (result.items) {
        setData(result.items);
      } else {
        setData(result);
      }
      
      // Extract pagination info
      const pagination = res.data?.pagination ?? res.pagination;
      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
        setTotal(pagination.total || 0);
      }
      setPage(pageNum);
    } catch (err) {
      console.error('usePaginatedData error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    load(1);
  }, [params]);

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      load(newPage);
    }
  };

  const updateParams = (newParams) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  };

  return {
    data,
    loading,
    error,
    page,
    totalPages,
    total,
    params,
    reload: () => load(page),
    changePage,
    updateParams,
    setData,
  };
}

export default useAdminData;
