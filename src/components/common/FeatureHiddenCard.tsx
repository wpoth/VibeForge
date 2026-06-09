"use client";

import type { LucideIcon } from "lucide-react";
import { Eye } from "lucide-react";
import { motion } from "motion/react";

import { PillButton } from "@/components/common/PillButton";

type FeatureHiddenCardProps = {
    title: string;
    description: string;
    onShow: () => void;
    icon?: LucideIcon;
};

export function FeatureHiddenCard({
    title,
    description,
    onShow,
    icon: Icon = Eye,
}: FeatureHiddenCardProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.2 }}
            className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between"
        >
            <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs text-zinc-500">{description}</p>
            </div>

            <PillButton icon={Icon} onClick={onShow} fullWidth className="sm:w-auto">
                Show again
            </PillButton>
        </motion.div>
    );
}