"use client";

import { RotateCcw, Settings, Waves, Zap, X } from "lucide-react";

import { DrawerShell } from "@/components/common/DrawerShell";
import { useAppSettings } from "@/hooks/useAppSettings";

type SettingsDrawerProps = {
    open: boolean;
    onClose: () => void;
};

type SettingsToggleProps = {
    title: string;
    description: string;
    checked: boolean;
    icon: React.ElementType;
    onChange: (checked: boolean) => void;
};

function SettingsToggle({
    title,
    description,
    checked,
    icon: Icon,
    onChange,
}: SettingsToggleProps) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.07]"
        >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-500/15 text-green-300 ring-1 ring-green-400/20">
                <Icon size={20} strokeWidth={2.3} />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
            </div>

            <span
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-green-500" : "bg-white/[0.14]"
                    }`}
            >
                <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? "left-6" : "left-1"
                        }`}
                />
            </span>
        </button>
    );
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
    const { settings, setSetting, resetSettings } = useAppSettings();

    return (
        <DrawerShell
            open={open}
            onClose={onClose}
            ariaLabel="Close settings"
            zIndex="high"
        >
            {({ dragHandle }) => (
                <>
                    <div className="border-b border-white/10 p-5">
                        {dragHandle}

                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-500/15 text-green-300 ring-1 ring-green-400/20">
                                <Settings size={22} strokeWidth={2.3} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-300">
                                    VibeForge
                                </p>

                                <h2 className="mt-1 text-2xl font-bold text-white">
                                    Settings
                                </h2>

                                <p className="mt-1 text-sm text-zinc-500">
                                    Tune motion, gestures, and layout preferences.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-full bg-white/[0.08] p-2 text-zinc-300 transition hover:bg-white/[0.14] hover:text-white"
                                aria-label="Close settings"
                            >
                                <X size={18} strokeWidth={2.2} />
                            </button>
                        </div>
                    </div>

                    <div className="custom-sidebar-scrollbar flex-1 overflow-y-auto p-5">
                        <div className="space-y-3">
                            <SettingsToggle
                                title="Reduce animations"
                                description="Minimizes CSS transitions and decorative motion where possible."
                                icon={Zap}
                                checked={settings.reduceAnimations}
                                onChange={(checked) => setSetting("reduceAnimations", checked)}
                            />

                            <SettingsToggle
                                title="Disable swipe gestures"
                                description="Turns off swipe-to-queue on mobile and tablet track rows."
                                icon={Waves}
                                checked={settings.disableSwipeGestures}
                                onChange={(checked) =>
                                    setSetting("disableSwipeGestures", checked)
                                }
                            />

                            <SettingsToggle
                                title="Compact track rows"
                                description="Makes playlist rows slightly tighter for smaller screens or dense playlists."
                                icon={Settings}
                                checked={settings.compactTrackRows}
                                onChange={(checked) => setSetting("compactTrackRows", checked)}
                            />
                        </div>

                        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                            <p className="text-sm font-semibold text-white">
                                Reset preferences
                            </p>
                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                                Restore all VibeForge settings to their default values.
                            </p>

                            <button
                                type="button"
                                onClick={resetSettings}
                                className="mt-4 flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.12]"
                            >
                                <RotateCcw size={14} strokeWidth={2.2} />
                                Reset settings
                            </button>
                        </div>
                    </div>
                </>
            )}
        </DrawerShell>
    );
}