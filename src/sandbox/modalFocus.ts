const FOCUSABLE_SELECTOR = [
  'button:not([disabled]):not([hidden])',
  '[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const focusableElements = (dialog: HTMLElement): readonly HTMLElement[] =>
  [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)]
    .filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');

export const captureModalReturnFocus = (): HTMLElement | null =>
  document.activeElement instanceof HTMLElement ? document.activeElement : null;

export const focusModal = (dialog: HTMLElement): void => {
  queueMicrotask(() => {
    if (!dialog.isConnected) return;
    const first = focusableElements(dialog)[0];
    if (first) first.focus();
    else {
      dialog.tabIndex = -1;
      dialog.focus();
    }
  });
};

export const restoreModalFocus = (element: HTMLElement | null): void => {
  if (!element?.isConnected) return;
  queueMicrotask(() => element.focus());
};

export const trapModalTab = (event: KeyboardEvent, dialog: HTMLElement): boolean => {
  if (event.key !== 'Tab') return false;
  const focusable = focusableElements(dialog);
  if (focusable.length === 0) {
    event.preventDefault();
    dialog.focus();
    return true;
  }

  const first = focusable[0]!;
  const last = focusable[focusable.length - 1]!;
  const active = document.activeElement;
  if (event.shiftKey) {
    if (active === first || !dialog.contains(active)) {
      event.preventDefault();
      last.focus();
    }
  } else if (active === last || !dialog.contains(active)) {
    event.preventDefault();
    first.focus();
  }
  return true;
};
