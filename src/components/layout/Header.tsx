import { CurrentlyPlayingBox } from "@/components/header/CurrentlyPlayingBox";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "motion/react";

type HeaderProps = {
  onAiModeClick: () => void;
  currentlyPlaying?: {
    title?: string;
    artists?: string[];
    imageUrl?: string | null;
  } | null;
  isPlaying?: boolean;
};

export function Header({
  onAiModeClick,
  currentlyPlaying,
  isPlaying = false,
}: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between gap-4 border-b border-white/10 bg-[#0f1117]/80 px-4 backdrop-blur-xl sm:px-5"
    >
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, delay: 0.05 }}
        className="flex min-w-0 items-center gap-2"
      >
        <motion.div
          whileHover={{ scale: 1.08, rotate: -4 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-green-400/30 bg-green-500/20 text-sm text-green-300 shadow-lg shadow-green-500/10"
        >
          ♪
        </motion.div>

        <motion.h1
          layout
          className="truncate font-bold tracking-tight"
        >
          VibeForge
        </motion.h1>
      </motion.div>

      <div className="hidden flex-1 justify-center lg:flex">
        <AnimatePresence mode="wait">
          {currentlyPlaying?.title ? (
            <motion.div
              key={`${currentlyPlaying.title}-${currentlyPlaying.artists?.join(
                "-"
              )}`}
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <CurrentlyPlayingBox
                title={currentlyPlaying.title}
                artists={currentlyPlaying.artists}
                imageUrl={currentlyPlaying.imageUrl}
                isPlaying={isPlaying}
              />
            </motion.div>
          ) : (
            <motion.div
              key="currently-playing-empty"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <CurrentlyPlayingBox isPlaying={false} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, delay: 0.08 }}
        className="flex shrink-0 items-center gap-3"
      >
        <motion.button
          type="button"
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={onAiModeClick}
          className="rounded-full px-2 py-1 text-sm text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
        >
          AI Mode
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => signOut()}
          className="rounded-full px-2 py-1 text-sm text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
        >
          Logout
        </motion.button>
      </motion.div>
    </motion.header>
  );
}