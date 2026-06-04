type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close confirmation dialog"
        onClick={loading ? undefined : onCancel}
        className="absolute cursor-pointer inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#12141f] p-5 shadow-2xl">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/30 bg-red-500/10 text-red-300">
          !
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>

        <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl cursor-pointer border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl cursor-pointer bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Removing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}