// Pages keeps the same owner-reviewed profile now used by production and the
// isolated Yandex DRAFT, while retaining review-only probes and storage isolation.
import './pagesPreview';
import { installReviewVisualProfile } from './reviewVisualProfile';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app root.');

const disposeReviewVisualProfile = installReviewVisualProfile(root);
const lifecycle = new AbortController();
window.addEventListener('pagehide', (event) => {
  if (event.persisted) return;
  lifecycle.abort();
  disposeReviewVisualProfile();
}, { signal: lifecycle.signal });

if (new URLSearchParams(location.search).get('volume-probe') === '1') {
  void import('./libraryVolumeReview').then(({ mountLibraryVolumeReview }) => mountLibraryVolumeReview());
}
