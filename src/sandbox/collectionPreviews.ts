import { renderLibraryThumbnail } from './libraryThumbnail';
import type { SavedSquishy } from './types';

/** One scheduled raster per frame; distant cards release their backing store. */
export function mountCollectionPreviews(scope: ParentNode, library: readonly SavedSquishy[]): () => void {
  const toys = new Map(library.map(toy => [toy.id, toy]));
  const canvases = [...scope.querySelectorAll<HTMLCanvasElement>('[data-library-thumbnail]')];
  const queued = new Set<HTMLCanvasElement>(); let frame = 0;
  const renderNext = () => {
    frame = 0; const canvas = queued.values().next().value as HTMLCanvasElement | undefined;
    if (canvas) {
      queued.delete(canvas); const toy = toys.get(canvas.dataset.libraryThumbnail ?? '');
      if (toy && canvas.isConnected && canvas.dataset.previewVisible === 'true') renderLibraryThumbnail(canvas, toy, 512);
    }
    if (queued.size) frame = requestAnimationFrame(renderNext);
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const canvas = entry.target as HTMLCanvasElement;
      canvas.dataset.previewVisible = String(entry.isIntersecting);
      if (entry.isIntersecting) queued.add(canvas);
      else { queued.delete(canvas); canvas.width = canvas.height = 1; }
    }
    if (!frame && queued.size) frame = requestAnimationFrame(renderNext);
  }, { rootMargin: '160px' });
  for (const canvas of canvases) { canvas.width = canvas.height = 1; observer.observe(canvas); }
  return () => { observer.disconnect(); cancelAnimationFrame(frame); queued.clear(); };
}
