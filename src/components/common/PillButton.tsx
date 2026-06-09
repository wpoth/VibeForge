"use client";

import type { LucideIcon } from "lucide-react";
import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

type PillButtonVariant = "default" | "primary" | "danger" | "ghost";

type PillButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
    icon?: LucideIcon;
    children: ReactNode;
    variant?: PillButtonVariant;
    fullWidth?: boolean;
};

const variantClasses: Record<PillButtonVariant, string> = {
    default:
        "bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] disabled:opacity-50",
    primary:
        "bg-green-500 text-black hover:bg-green-400 shadow-lg shadow-green-500/20 disabled:opacity-50",
    danger:
        "bg-red-500 text-white hover:bg-red-400 disabled:opacity-50",
    ghost:
        "bg-transparent text-zinc-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-50",
};

export function PillButton({
    icon: Icon,
    children,
    variant = "default",
    fullWidth = false,
    className = "",
    disabled,
    ...props
}: PillButtonProps) {
    return (
        <motion.button
            type="button"
            whileHover={disabled ? undefined : { scale: 1.03 }}
            whileTap={disabled ? undefined : { scale: 0.97 }}
            disabled={disabled}
            className={`flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed ${fullWidth ? "w-full" : "w-auto"
                } ${variantClasses[variant]} ${className}`}
            {...props}
        >
            {Icon && <Icon size={14} strokeWidth={2.2} />}
            {children}
        </motion.button>
    );
}