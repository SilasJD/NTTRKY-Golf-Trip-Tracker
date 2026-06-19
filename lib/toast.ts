export type ToastItem = {
  id: number;
  message: string;
  tone: "error" | "info";
  retry?: () => void;
};

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let listeners: Listener[] = [];
let nextId = 1;

function emit() {
  for (const listener of listeners) listener(toasts);
}

export function subscribeToasts(listener: Listener) {
  listeners.push(listener);
  listener(toasts);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function notify(message: string, options: { tone?: "error" | "info"; retry?: () => void } = {}) {
  const id = nextId++;
  const tone = options.tone ?? "error";
  toasts = [...toasts, { id, message, tone, retry: options.retry }];
  emit();
  if (!options.retry) {
    setTimeout(() => dismissToast(id), 5000);
  }
  return id;
}

export function notifySaveError(what: string, retry?: () => void) {
  return notify(`Couldn't save ${what} — check your connection.`, { tone: "error", retry });
}
