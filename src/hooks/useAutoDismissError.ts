import { useState, useEffect, useCallback } from "react";

export const useAutoDismissError = (timeout = 5000) => {
  const [error, setError] = useState<string | null>(null);

  const setErrorWithTimeout = useCallback((errorMessage: string | null) => {
    setError(errorMessage);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-dismiss error after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, timeout);
      return () => clearTimeout(timer);
    }
  }, [error, timeout]);

  return {
    error,
    setError: setErrorWithTimeout,
    clearError,
  };
};
