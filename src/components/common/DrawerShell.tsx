"use client";

import {
    AnimatePresence,
    motion,
    useDragControls,
} from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type DrawerZIndex = "default" | "high";

type DrawerShellHelpers = {
    dragHandle: ReactNode;
};

type DrawerShellProps = {
    open: boolean;
    onClose: () => void;
    ariaLabel: string;
    children: (helpers: DrawerShellHelpers) => ReactNode;
    zIndex?: DrawerZIndex;
    className?: string;
    swipeLabel?: string;
};

const zIndexClasses: Record<
    DrawerZIndex,
    {
        backdrop: string;
        drawer: string;
    }
> = {
    default: {
        backdrop: "z-[90]",
        drawer: "z-[91]",
    },
    high: {
        backdrop: "z-[9000]",
        drawer: "z-[9001]",
    },
};

export function DrawerShell({
    open,
    onClose,
    ariaLabel,
    children,
    zIndex = "default",
    className = "",
    swipeLabel = "Swipe right to close",
}: DrawerShellProps) {
    const [mounted, setMounted] = useState(false);
    const dragControls = useDragControls();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!open) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, onClose]);

    if (!mounted) return null;

    const dragHandle = (
        <motion.button
            type="button"
            aria-label={swipeLabel}
            onPointerDown={(event) => {
                dragControls.start(event);
            }}
            whileTap={{ scaleX: 1.1, scaleY: 0.92 }}
            className="mb-4 flex touch-none cursor-grab items-center gap-2 rounded-full bg-white/[0.06] px-3 py-2 text-xs font-medium text-zinc-400 active:cursor-grabbing sm:hidden"
        >
            <span className="h-1.5 w-8 rounded-full bg-white/25" />
            {swipeLabel}
        </motion.button>
    );

    return createPortal(
        <AnimatePresence>
            {open && (
                <>
                    <motion.button
                        type="button"
                        aria-label={ariaLabel}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className={`fixed inset-0 ${zIndexClasses[zIndex].backdrop} bg-black/40 backdrop-blur-sm`}
                    />

                    <motion.aside
                        initial={{ opacity: 0, x: 32 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 32 }}
                        transition={{ duration: 0.22 }}
                        drag="x"
                        dragControls={dragControls}
                        dragListener={false}
                        dragConstraints={{
                            left: 0,
                            right: 180,
                        }}
                        dragElastic={0.18}
                        dragMomentum={false}
                        onDragEnd={(_, info) => {
                            const shouldClose = info.offset.x > 90 || info.velocity.x > 650;

                            if (shouldClose) {
                                onClose();
                            }
                        }}
                        className={`fixed bottom-0 right-0 top-0 ${zIndexClasses[zIndex].drawer} flex w-full max-w-xl flex-col overflow-hidden border-l border-white/10 bg-[#11141d]/95 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:w-[520px] ${className}`}
                    >
                        {children({ dragHandle })}
                    </motion.aside>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}