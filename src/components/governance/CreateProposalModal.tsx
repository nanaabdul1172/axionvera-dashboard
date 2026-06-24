import { useEffect, useRef, useState } from "react";

interface CreateProposalModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  createProposalStatus: "idle" | "pending" | "success" | "error";
  createProposalError: string | null;
  onClose: () => void;
  onSubmit: (title: string, description: string) => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function CreateProposalModal({
  isOpen,
  isSubmitting,
  createProposalStatus,
  createProposalError,
  onClose,
  onSubmit,
}: CreateProposalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
    focusable[0]?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const els = Array.from(dialog!.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (els.length === 0) { e.preventDefault(); return; }
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    onSubmit(title, description);
    if (createProposalStatus === "success") {
      setTitle("");
      setDescription("");
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-proposal-title"
        className="w-full max-w-lg rounded-2xl border border-border-primary bg-background-primary p-6 shadow-2xl"
        aria-hidden="false"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="create-proposal-title" className="text-lg font-bold text-text-primary">Create Proposal</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close create proposal dialog"
            className="rounded-lg p-1 text-text-muted transition hover:bg-background-secondary hover:text-text-primary"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="proposal-title" className="mb-1 block text-sm font-medium text-text-secondary">
              Title <span className="text-red-500" aria-hidden="true">*</span>
              <span className="sr-only"> (required)</span>
            </label>
            <input
              id="proposal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter proposal title..."
              className="w-full rounded-lg border border-border-primary bg-background-secondary/30 px-3 py-2 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-axion-500"
              required
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="proposal-description" className="mb-1 block text-sm font-medium text-text-secondary">
              Description <span className="text-red-500" aria-hidden="true">*</span>
              <span className="sr-only"> (required)</span>
            </label>
            <textarea
              id="proposal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your proposal in detail..."
              rows={5}
              className="w-full resize-none rounded-lg border border-border-primary bg-background-secondary/30 px-3 py-2 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-axion-500"
              required
              aria-required="true"
            />
          </div>

          {createProposalStatus === "error" && createProposalError && (
            <p role="alert" className="text-sm text-rose-400">{createProposalError}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-primary px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-background-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !description.trim()}
              aria-busy={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-axion-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-axion-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {isSubmitting ? "Creating…" : "Create Proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
