"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
};

type ToastInput = {
  type?: ToastType;
  title: string;
  description?: string;
};

const TOAST_EVENT = "vibeforge-toast";

function createToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function toast({ type = "info", title, description }: ToastInput) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<ToastInput>(TOAST_EVENT, {
      detail: {
        type,
        title,
        description,
      },
    })
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toastItem) => toastItem.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = "info", title, description }: ToastInput) => {
      const id = createToastId();

      setToasts((current) => [
        ...current,
        {
          id,
          type,
          title,
          description,
        },
      ]);

      window.setTimeout(() => {
        removeToast(id);
      }, 3500);
    },
    [removeToast]
  );

  useEffect(() => {
    function handleToast(event: Event) {
      const customEvent = event as CustomEvent<ToastInput>;
      showToast(customEvent.detail);
    }

    window.addEventListener(TOAST_EVENT, handleToast);

    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);
    };
  }, [showToast]);

  return (
    <>
      {children}

      <div className="pointer-events-none fixed bottom-4 right-4 z-[10000] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:bottom-5 sm:right-5">
        <AnimatePresence initial={false}>
          {toasts.map((toastItem) => (
            <motion.div
              key={toastItem.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 16, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className={`pointer-events-auto rounded-2xl border p-4 shadow-2xl shadow-black/40 backdrop-blur-xl ${
                toastItem.type === "success"
                  ? "border-green-400/30 bg-green-500/15"
                  : toastItem.type === "error"
                    ? "border-red-400/30 bg-red-500/15"
                    : "border-white/10 bg-[#151823]/95"
              }`}
            >
              <div className="flex gap-3">
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    toastItem.type === "success"
                      ? "bg-green-500 text-black"
                      : toastItem.type === "error"
                        ? "bg-red-500 text-white"
                        : "bg-white/[0.08] text-zinc-200"
                  }`}
                >
                  {toastItem.type === "success"
                    ? "✓"
                    : toastItem.type === "error"
                      ? "!"
                      : "i"}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">
                    {toastItem.title}
                  </p>

                  {toastItem.description && (
                    <p className="mt-1 text-sm leading-5 text-zinc-300">
                      {toastItem.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toastItem.id)}
                  className="shrink-0 rounded-lg px-2 text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
                  aria-label="Close notification"
                >
                  ×
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}