"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ListPlus } from "lucide-react";
import {
    animate,
    motion,
    useMotionValue,
    useTransform,
} from "motion/react";

type SwipeToQueueContainerProps = {
    enabled: boolean;
    onQueue: () => void;
    onSwipeStart?: () => void;
    children: ReactNode;
};

const QUEUE_SWIPE_THRESHOLD = 84;
const MAX_SWIPE_DISTANCE = 116;

export function SwipeToQueueContainer({
    enabled,
    onQueue,
    onSwipeStart,
    children,
}: SwipeToQueueContainerProps) {
    const [isTouchLayout, setIsTouchLayout] = useState(false);
    const [swipeReady, setSwipeReady] = useState(false);

    const swipeX = useMotionValue(0);
    const queueBackgroundOpacity = useTransform(
        swipeX,
        [0, 40, 90],
        [0, 0.45, 1]
    );
    const queueIconScale = useTransform(swipeX, [0, 72, 104], [0.85, 1, 1.08]);

    const canSwipe = isTouchLayout && enabled;

    useEffect(() => {
        function updateTouchLayout() {
            setIsTouchLayout(window.matchMedia("(max-width: 1023px)").matches);
        }

        updateTouchLayout();

        window.addEventListener("resize", updateTouchLayout);

        return () => {
            window.removeEventListener("resize", updateTouchLayout);
        };
    }, []);

    useEffect(() => {
        setSwipeReady(false);
        swipeX.set(0);
    }, [enabled, swipeX]);

    function snapBack() {
        setSwipeReady(false);

        void animate(swipeX, 0, {
            type: "spring",
            stiffness: 260,
            damping: 28,
            mass: 0.95,
        });
    }

    return (
        <div className="relative overflow-hidden rounded-xl lg:overflow-visible">
            <motion.div
                style={{
                    opacity: queueBackgroundOpacity,
                }}
                className={`pointer-events-none absolute inset-0 flex items-center rounded-xl px-4 lg:hidden ${swipeReady
                        ? "bg-green-500/25 text-green-200"
                        : "bg-green-500/15 text-green-300"
                    }`}
            >
                <motion.div
                    style={{
                        scale: queueIconScale,
                    }}
                    className="flex items-center gap-2"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-black shadow-lg shadow-green-500/30">
                        <ListPlus size={18} strokeWidth={2.5} />
                    </div>

                    <span className="text-sm font-semibold">
                        {swipeReady ? "Release to queue" : "Swipe to queue"}
                    </span>
                </motion.div>
            </motion.div>

            <motion.div
                drag={canSwipe ? "x" : false}
                dragDirectionLock
                dragConstraints={{
                    left: 0,
                    right: MAX_SWIPE_DISTANCE,
                }}
                dragElastic={0.22}
                dragMomentum={false}
                style={{
                    x: swipeX,
                    touchAction: canSwipe ? "pan-y" : undefined,
                }}
                onDragStart={() => {
                    if (!canSwipe) return;
                    onSwipeStart?.();
                }}
                onDrag={(_, info) => {
                    if (!canSwipe) return;

                    const nextX = Math.max(0, info.offset.x);
                    setSwipeReady(nextX >= QUEUE_SWIPE_THRESHOLD);
                }}
                onDragEnd={(_, info) => {
                    if (!canSwipe) {
                        snapBack();
                        return;
                    }

                    const shouldQueue = info.offset.x >= QUEUE_SWIPE_THRESHOLD;

                    if (shouldQueue) {
                        onQueue();
                        snapBack();
                        return;
                    }

                    snapBack();
                }}
            >
                {children}
            </motion.div>
        </div>
    );
}