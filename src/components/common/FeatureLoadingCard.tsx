"use client";

import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

type FeatureLoadingCardProps = {
    title: string;
    icon?: LucideIcon;
    variant?: "simple" | "scores";
};

export function FeatureLoadingCard({
    title,
    icon: Icon = Loader2,
    variant = "simple",
}: FeatureLoadingCardProps) {
    if (variant === "scores") {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="mb-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5"
            >
                <div className="mb-4 flex items-center gap-2 text-green-300">
                    <Icon size={16} strokeWidth={2.3} />
                    <p className="text-sm font-semibold">{title}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                        >
                            <div className="mb-3 h-3 w-24 animate-pulse rounded bg-white/[0.08]" />
                            <div className="h-1.5 animate-pulse rounded-full bg-white/[0.08]" />
                        </div>
                    ))}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="mb-4 space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
        >
            <div className="flex items-center gap-2">
                <Icon size={15} strokeWidth={2.3} className="text-green-300" />
                <div className="h-4 w-36 animate-pulse rounded bg-white/[0.08]" />
            </div>

            <div className="h-3 w-full animate-pulse rounded bg-white/[0.06]" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.06]" />
        </motion.div>
    );
}