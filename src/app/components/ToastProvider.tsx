"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
      const timer = window.setTimeout(() => removeToast(id), 4000);
      timers.current.set(id, timer);
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({
      success: (message: string) => pushToast(message, "success"),
      error: (message: string) => pushToast(message, "error"),
      info: (message: string) => pushToast(message, "info"),
    }),
    [pushToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[320px] flex-col gap-2">
        {toasts.map((toast) => {
          const base =
            "pointer-events-auto rounded-xl border px-3 py-2 text-xs shadow-lg";
          const variantClass =
            toast.variant === "success"
              ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-700"
              : toast.variant === "error"
              ? "border-rose-400/50 bg-rose-500/20 text-rose-700"
              : "border-slate-400/40 bg-slate-800/80 text-slate-700";

          return (
            <div
              key={toast.id}
              className={`${base} ${variantClass}`}
              onClick={() => removeToast(toast.id)}
            >
              {toast.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
