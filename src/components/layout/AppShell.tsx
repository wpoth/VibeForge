import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#12141f] via-[#0f1117] to-[#17111f] text-white">
      <style jsx global>{`
        .custom-sidebar-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(34, 197, 94, 0.55) rgba(255, 255, 255, 0.05);
        }

        .custom-sidebar-scrollbar::-webkit-scrollbar {
          width: 10px;
        }

        .custom-sidebar-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 999px;
        }

        .custom-sidebar-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(
            180deg,
            rgba(34, 197, 94, 0.85),
            rgba(168, 85, 247, 0.55)
          );
          border-radius: 999px;
          border: 2px solid rgba(15, 17, 23, 0.95);
        }

        .custom-sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            180deg,
            rgba(74, 222, 128, 0.95),
            rgba(192, 132, 252, 0.75)
          );
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-green-500/10 blur-3xl" />
        <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {children}
    </div>
  );
}