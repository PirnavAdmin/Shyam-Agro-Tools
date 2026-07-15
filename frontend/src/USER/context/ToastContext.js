import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast({
      id: Date.now(),
      message,
      type,
    });

    timerRef.current = setTimeout(() => {
      setToast(null);
    }, 2200);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <div className="fixed right-4 top-24 z-[100000] max-w-sm border border-primary/20 bg-white px-5 py-4 text-sm font-bold text-dark shadow-2xl">
          <div className="flex items-center gap-3">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                toast.type === 'error' ? 'bg-red-500' : 'bg-primary'
              }`}
            />
            <span>{toast.message}</span>
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
};
