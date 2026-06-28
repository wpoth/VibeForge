"use client";

import { AnimatePresence, motion } from "motion/react";
import { Keyboard, X } from "lucide-react";

type KeyboardShortcutsOverlayProps = {
  open: boolean;
  onClose: () => void;
};

const shortcuts = [
  { keys: "Space", label: "Play or pause" },
  { keys: "←", label: "Seek back 10 seconds" },
  { keys: "→", label: "Seek forward 10 seconds" },
  { keys: "Shift + ←", label: "Previous track" },
  { keys: "Shift + →", label: "Next track" },
  { keys: "F", label: "Open fullscreen player" },
  { keys: "Q", label: "Open queue" },
  { keys: "H", label: "Go home" },
  { keys: "A", label: "Open AI playlist creator" },
  { keys: "R", label: "Open recent plays" },
  { keys: "S", label: "Open stats" },
  { keys: "?", label: "Show shortcuts" },
  { keys: "Esc", label: "Close this panel" },
];

export function KeyboardShortcutsOverlay({
  open,
  onClose,
}: KeyboardShortcutsOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
          onMouseDown={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            onMouseDown={(event) => event.stopPropagation()}
            className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#11141d]/95 p-5 shadow-2xl shadow-black/40"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-green-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-purple-400/10 blur-3xl" />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-green-400/20 bg-green-400/10 text-green-300">
                  <Keyboard size={20} />
                </div>

                <h2 className="mt-4 text-2xl font-black tracking-tight text-white">
                  Keyboard shortcuts
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Control VibeForge faster without leaving the keyboard.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="Close keyboard shortcuts"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative mt-6 grid gap-2 sm:grid-cols-2">
              {shortcuts.map((shortcut) => (
                <div
                  key={shortcut.keys}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"
                >
                  <span className="text-sm text-zinc-300">
                    {shortcut.label}
                  </span>

                  <kbd className="shrink-0 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 text-xs font-bold text-green-200 shadow-inner shadow-white/5">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
