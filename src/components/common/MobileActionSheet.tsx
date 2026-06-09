"use client";

import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import {
    AnimatePresence,
    motion,
    useDragControls,
} from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type MobileActionSheetItem = {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    destructive?: boolean;
    disabled?: boolean;
};

type MobileActionSheetProps = {
    open: boolean;
    title?: string;
    description?: string;
    items: MobileActionSheetItem[];
    onClose: () => void;
};

export function MobileActionSheet({
    open,
    title,
    description,
    items,
    onClose,
}: MobileActionSheetProps) {
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

    return createPortal(
        <AnimatePresence>
            {open && (
                <>
                    <motion.button
                        type="button"
                        aria-label="Close actions"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[8998] bg-black/45 backdrop-blur-sm lg:hidden"
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 32, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 32, scale: 0.98 }}
                        transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 34,
                            mass: 0.8,
                        }}
                        drag="y"
                        dragControls={dragControls}
                        dragListener={false}
                        dragConstraints={{
                            top: 0,
                            bottom: 180,
                        }}
                        dragElastic={0.18}
                        dragMomentum={false}
                        onDragEnd={(_, info) => {
                            const shouldClose = info.offset.y > 90 || info.velocity.y > 650;

                            if (shouldClose) {
                                onClose();
                            }
                        }}
                        className="fixed bottom-3 left-3 right-3 z-[8999] overflow-hidden rounded-3xl border border-white/10 bg-[#151823]/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-2xl lg:hidden"
                    >
                        <motion.button
                            type="button"
                            aria-label="Drag down to close"
                            onPointerDown={(event) => {
                                dragControls.start(event);
                            }}
                            whileTap={{ scaleX: 1.15, scaleY: 0.9 }}
                            className="mb-3 flex w-full touch-none cursor-grab justify-center active:cursor-grabbing"
                        >
                            <span className="h-1.5 w-12 rounded-full bg-white/20" />
                        </motion.button>

                        <div className="mb-3 flex items-start gap-3 px-2">
                            <div className="min-w-0 flex-1">
                                {title && (
                                    <h3 className="truncate text-base font-semibold text-white">
                                        {title}
                                    </h3>
                                )}

                                {description && (
                                    <p className="mt-1 truncate text-sm text-zinc-400">
                                        {description}
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="shrink-0 rounded-full bg-white/[0.08] p-2 text-zinc-300 transition hover:bg-white/[0.14] hover:text-white"
                                aria-label="Close actions"
                            >
                                <X size={18} strokeWidth={2.2} />
                            </button>
                        </div>

                        <div className="space-y-1">
                            {items.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <button
                                        key={item.label}
                                        type="button"
                                        disabled={item.disabled}
                                        onClick={() => {
                                            if (item.disabled) return;

                                            item.onClick();
                                            onClose();
                                        }}
                                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45 ${item.destructive
                                                ? "text-red-300 hover:bg-red-500/10"
                                                : "text-zinc-100 hover:bg-white/[0.08]"
                                            }`}
                                    >
                                        {Icon && (
                                            <Icon
                                                size={18}
                                                strokeWidth={2.25}
                                                className="shrink-0"
                                            />
                                        )}

                                        <span className="min-w-0 flex-1 truncate">
                                            {item.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}