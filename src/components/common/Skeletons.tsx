export function PlaylistCardSkeleton() {
  return (
    <div className="min-w-56 max-w-56 rounded-xl border border-white/5 bg-white/[0.04] p-3 lg:mb-2 lg:min-w-0 lg:max-w-none">
      <div className="flex gap-3">
        <div className="h-14 w-14 shrink-0 animate-pulse rounded-lg bg-white/[0.08]" />

        <div className="flex flex-1 flex-col justify-center gap-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.08]" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-white/[0.06]" />
        </div>
      </div>
    </div>
  );
}

export function TrackRowSkeleton() {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.04] p-3">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-white/[0.08]" />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-white/[0.08]" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-white/[0.06]" />
        </div>

        <div className="hidden h-8 w-20 animate-pulse rounded-lg bg-white/[0.06] sm:block" />
      </div>
    </div>
  );
}

export function PlaylistHeaderSkeleton() {
  return (
    <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl sm:mb-10 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-6">
        <div className="h-32 w-32 shrink-0 animate-pulse rounded-2xl bg-white/[0.08]" />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-4 w-24 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-9 w-3/4 animate-pulse rounded bg-white/[0.08]" />
          <div className="h-4 w-32 animate-pulse rounded bg-white/[0.06]" />
        </div>
      </div>
    </div>
  );
}

export function ManagePanelSkeleton() {
  return (
    <aside className="order-first xl:order-none xl:sticky xl:top-20 xl:self-start">
      <div className="rounded-2xl border border-white/10 bg-[#12141f]/90 p-4 shadow-xl backdrop-blur-xl">
        <div className="mb-4 space-y-2">
          <div className="h-4 w-28 animate-pulse rounded bg-white/[0.08]" />
          <div className="h-3 w-full animate-pulse rounded bg-white/[0.06]" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.06]" />
        </div>

        <div className="space-y-2">
          <div className="h-10 animate-pulse rounded-xl bg-white/[0.08]" />
          <div className="h-10 animate-pulse rounded-xl bg-white/[0.06]" />
        </div>
      </div>
    </aside>
  );
}

export function AiPreviewSkeleton() {
  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-28 animate-pulse rounded bg-white/[0.08]" />
          <div className="h-3 w-20 animate-pulse rounded bg-white/[0.06]" />
        </div>

        <div className="h-8 w-24 animate-pulse rounded-lg bg-white/[0.06]" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <TrackRowSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}