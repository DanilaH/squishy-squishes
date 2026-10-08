/** Persistent scroll position for touch catalogs; never intercepts input. */
export function mountCatalogScrollHints(root: HTMLElement, signal: AbortSignal, selector = '.free-shape-catalog, .free-mixin-catalog, [data-base-panel="material"], [data-decor-panel="accessory"] > .sandbox-decor-grid'): () => void {
  const cleanups: (() => void)[] = [];
  const observer = new ResizeObserver(() => updates.forEach(update => update()));
  const updates: (() => void)[] = [];
  for (const catalog of root.querySelectorAll<HTMLElement>(selector)) {
    const host = catalog.parentElement!;
    host.classList.add('craft-scroll-host');
    catalog.dataset.catalogScroll = 'true';
    const rail = document.createElement('span');
    rail.className = 'craft-scroll-rail'; rail.setAttribute('aria-hidden', 'true');
    const thumb = document.createElement('span'); rail.append(thumb); host.append(rail);
    const update = (): void => {
      const height = catalog.clientHeight, overflow = catalog.scrollHeight - height;
      rail.hidden = height === 0 || overflow <= 1;
      if (rail.hidden) return;
      const box = catalog.getBoundingClientRect(), parent = host.getBoundingClientRect();
      rail.style.top = `${box.top - parent.top - host.clientTop + 3}px`;
      rail.style.left = `${box.right - parent.left - host.clientLeft - 13}px`;
      rail.style.height = `${height - 6}px`;
      const track = height - 26, size = Math.max(20, track * height / catalog.scrollHeight);
      thumb.style.height = `${size}px`;
      thumb.style.transform = `translateY(${(track - size) * Math.min(1, Math.max(0, catalog.scrollTop / overflow))}px)`;
      rail.dataset.atEnd = String(catalog.scrollTop >= overflow - 1);
    };
    updates.push(update); observer.observe(catalog);
    // A fixed tray can retain its height when a catalog is replaced by settings.
    // Observe its content as well, so the hint vanishes when scrolling is unnecessary.
    for (const child of catalog.children) if (child instanceof HTMLElement) observer.observe(child);
    catalog.addEventListener('scroll', update, { passive: true, signal });
    cleanups.push(() => rail.remove());
  }
  updates.forEach(update => update());
  return () => { observer.disconnect(); cleanups.forEach(cleanup => cleanup()); };
}
