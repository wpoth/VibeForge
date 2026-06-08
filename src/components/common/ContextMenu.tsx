"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export type ContextMenuItem = {
    label: string;
    onClick: () => void;
    destructive?: boolean;
    disabled?: boolean;
};

type ContextMenuProps = {
    open: boolean;
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
};

const MENU_WIDTH = 220;
const MENU_PADDING = 12;
const ITEM_HEIGHT = 40;
const MENU_EXTRA_HEIGHT = 12;
const CLOSE_CONTEXT_MENUS_EVENT = "vibeforge-close-context-menus";

export function closeAllContextMenus() {
    window.dispatchEvent(new CustomEvent(CLOSE_CONTEXT_MENUS_EVENT));
}

export function ContextMenu({
    open,
    x,
    y,
    items,
    onClose,
}: ContextMenuProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const position = useMemo(() => {
        if (typeof window === "undefined") {
            return {
                left: x,
                top: y,
            };
        }

        const estimatedHeight = items.length * ITEM_HEIGHT + MENU_EXTRA_HEIGHT;

        const safeLeft =
            x + MENU_WIDTH + MENU_PADDING > window.innerWidth
                ? window.innerWidth - MENU_WIDTH - MENU_PADDING
                : x;

        const safeTop =
            y + estimatedHeight + MENU_PADDING > window.innerHeight
                ? window.innerHeight - estimatedHeight - MENU_PADDING
                : y;

        return {
            left: Math.max(MENU_PADDING, safeLeft),
            top: Math.max(MENU_PADDING, safeTop),
        };
    }, [x, y, items.length]);

    useEffect(() => {
        function handleCloseAll() {
            onClose();
        }

        window.addEventListener(CLOSE_CONTEXT_MENUS_EVENT, handleCloseAll);

        return () => {
            window.removeEventListener(CLOSE_CONTEXT_MENUS_EVENT, handleCloseAll);
        };
    }, [onClose]);

    useEffect(() => {
        if (!open) return;

        function handleClick() {
            onClose();
        }

        function handleScroll() {
            onClose();
        }

        function handleResize() {
            onClose();
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        window.addEventListener("click", handleClick);
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleResize);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("click", handleClick);
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, onClose]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -4 }}
                    transition={{ duration: 0.13 }}
                    style={{
                        left: position.left,
                        top: position.top,
                        width: MENU_WIDTH,
                    }}
                    className="fixed z-[9999] overflow-hidden rounded-xl border border-white/10 bg-[#151823]/95 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl"
                    onClick={(event) => event.stopPropagation()}
                    onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                    }}
                >
                    {items.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            disabled={item.disabled}
                            onClick={() => {
                                if (item.disabled) return;

                                item.onClick();
                                onClose();
                            }}
                            className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${item.destructive
                                    ? "text-red-300 hover:bg-red-500/10"
                                    : "text-zinc-200 hover:bg-white/[0.08]"
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}