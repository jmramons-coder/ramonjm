export type ToastVariant = "success" | "error" | "warning" | "info" | "discovery" | "neutral";

export type ToastMessage = {
  id: string | number;
  message: string;
  variant: ToastVariant;
  pending?: boolean;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  /** Null keeps the message visible until it is dismissed or replaced. */
  duration?: number | null;
  dismissible?: boolean;
};

const DEFAULT_DURATIONS: Record<ToastVariant, number | null> = {
  success: 5_000,
  error: null,
  warning: null,
  info: 5_000,
  discovery: 7_000,
  neutral: 5_000,
};

/** Progress and failures remain actionable; hover/focus pauses temporary messages. */
export function toastDuration(toast: ToastMessage): number | null {
  if (toast.pending || toast.variant === "error" || toast.variant === "warning" || toast.duration === null) return null;
  if (typeof toast.duration === "number" && Number.isFinite(toast.duration) && toast.duration > 0) {
    return Math.max(toast.duration, 1_000);
  }
  return DEFAULT_DURATIONS[toast.variant];
}

export function toastAnnouncement(variant: ToastVariant): "alert" | "status" {
  return variant === "error" || variant === "warning" ? "alert" : "status";
}

/** Update an action in place; keep persistent notifications until explicitly dismissed. */
export function enqueueToast(queue: readonly ToastMessage[], incoming: ToastMessage): ToastMessage[] {
  const existing = queue.findIndex((toast) => toast.id === incoming.id);
  if (existing >= 0) return queue.map((toast, index) => index === existing ? incoming : toast);

  // Automatic retries can repeat the same failure. Distinct actionable messages
  // and pending operation IDs remain independent even when their wording matches.
  const remaining = !incoming.pending && !incoming.action
    ? queue.filter((toast) => toast.pending || toast.action || toast.message !== incoming.message
      || toast.variant !== incoming.variant || toastDuration(toast) !== toastDuration(incoming))
    : [...queue];
  if (incoming.pending || incoming.variant === "error" || incoming.variant === "warning") return [incoming, ...remaining];
  if (remaining[0] && toastDuration(remaining[0]) === null) return [...remaining, incoming];
  return [incoming, ...remaining.slice(1)];
}

export function dismissQueuedToast(queue: readonly ToastMessage[], id: ToastMessage["id"]): ToastMessage[] {
  return queue.filter((toast) => toast.id !== id);
}
