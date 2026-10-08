import type { Page } from '@playwright/test';
const SCROLL_TRAYS = '.free-shape-catalog, .free-mixin-catalog, [data-decor-panel="accessory"] .sandbox-decor-grid, .free-object-panel, .free-light-panel, [data-base-panel="material"], .sandbox-palette-grid, .sandbox-decor-section';
/** Every control must be reachable; only agreed catalogs/settings may scroll. */
export const reachableControlIssues = async (page: Page): Promise<string[]> => {
  const scroll = await page.locator(SCROLL_TRAYS).evaluateAll(nodes => nodes.map(node => ({ top: node.scrollTop, left: node.scrollLeft })));
  const issues = await page.locator('.sandbox-controls button:visible, .sandbox-topbar button:visible').evaluateAll((nodes, selector) => {
    const issues: string[] = [];
    for (const node of nodes) {
      if (node.closest(selector)) node.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' });
      const r = node.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      const id = (node as HTMLElement).dataset.action || node.textContent?.trim() || 'button';
      const errors: string[] = [];
      if (r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1) errors.push(`${id}: outside viewport`);
      if (r.width < 43.9 || r.height < 43.9) errors.push(`${id}: touch target smaller than 44px`);
      if (!hit || !node.contains(hit)) errors.push(`${id}: target intercepted`);
      for (const y of [r.top + 2, r.bottom - 2]) {
        const edge = document.elementFromPoint(r.x + r.width / 2, y);
        if (!edge || !node.contains(edge)) errors.push(`${id}: top/bottom clipped`);
      }
      issues.push(...errors);
    }
    return issues;
  }, SCROLL_TRAYS);
  await page.locator(SCROLL_TRAYS).evaluateAll((nodes, values) => nodes.forEach((node, i) => {
    node.scrollTop = values[i]!.top; node.scrollLeft = values[i]!.left;
  }), scroll);
  return issues;
};
