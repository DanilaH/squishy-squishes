// Both visual environments are removable Phaser review layers.
// Main production remains unchanged; Pages and the isolated Yandex DRAFT share
// this owner-reviewed profile so visual acceptance can exercise one renderer.
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
