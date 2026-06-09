"use client";

import { Info } from "lucide-react";

type BetaAccessNoticeProps = {
    compact?: boolean;
};

export function BetaAccessNotice({ compact = false }: BetaAccessNoticeProps) {
    return (
        <div
            className={`rounded-2xl border border-yellow-400/20 bg-yellow-500/10 ${compact ? "p-3" : "p-4"
                }`}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-yellow-400/15 text-yellow-300 ring-1 ring-yellow-300/20">
                    <Info size={16} strokeWidth={2.3} />
                </div>

                <div className="min-w-0">
                    <p className="text-sm font-semibold text-yellow-100">
                        Private Spotify beta
                    </p>

                    <p
                        className={`mt-1 leading-5 text-yellow-100/75 ${compact ? "text-xs" : "text-sm"
                            }`}
                    >
                        VibeForge is currently limited by Spotify Developer API restrictions.
                        To use the app, your Spotify account must be added to the app
                        allowlist first.
                    </p>
                </div>
            </div>
        </div>
    );
}