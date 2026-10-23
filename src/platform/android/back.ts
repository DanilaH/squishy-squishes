/** Route Android Back through existing UI actions, including their dirty-draft
 * confirmation. Never destroy the WebView or discard a draft directly. */
export function handleAndroidBack(root: ParentNode = document): boolean {
  const click = (selector: string): boolean => {
    const button = [...root.querySelectorAll<HTMLButtonElement>(selector)]
      .find(node => !node.disabled && node.getClientRects().length > 0);
    if (!button) return false;
    button.click(); return true;
  };
  if (click('[data-library-replace-cancel], [data-library-delete-cancel], [data-library-actions-close], [data-action="exit-cancel"], [data-action="tools-close"]')) return true;
  if (click('[data-room-edit-cancel]')) return true;
  if (click('[data-action="try-return"]')) return true;
  if (click('[data-action="exit-craft"]')) return true;
  if (click('[data-action="home"], [data-ideas-back], [data-room-back]')) return true;
  return [...root.querySelectorAll<HTMLElement>('[data-sandbox-app], [role="dialog"]')]
    .some(node => !node.closest('[data-library-live]') && node.getClientRects().length > 0);
}
