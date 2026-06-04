import { signOut } from "next-auth/react";
import { CurrentlyPlayingBox } from "@/components/header/CurrentlyPlayingBox";

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
    <div className="fixed top-0 left-0 right-0 h-14 border-b border-white/10 bg-[#0f1117]/80 backdrop-blur-xl flex items-center justify-between gap-4 px-4 sm:px-5 z-50">
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-7 w-7 rounded-lg bg-green-500/20 border border-green-400/30 flex items-center justify-center text-green-300 text-sm shrink-0">
          ♪
        </div>

        <h1 className="font-bold tracking-tight truncate">VibeForge</h1>
      </div>

      <div className="hidden flex-1 justify-center lg:flex">
        <CurrentlyPlayingBox
          title={currentlyPlaying?.title}
          artists={currentlyPlaying?.artists}
          imageUrl={currentlyPlaying?.imageUrl}
          isPlaying={isPlaying}
        />
      </div>

      <div className="flex gap-3 shrink-0">
        <button
          onClick={onAiModeClick}
          className="text-sm text-zinc-400 hover:text-white transition"
        >
          AI Mode
        </button>

        <button
          onClick={() => signOut()}
          className="text-sm text-zinc-400 hover:text-white transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}