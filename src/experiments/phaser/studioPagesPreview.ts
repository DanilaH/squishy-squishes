// Both visual environments are removable Phaser review layers.
// Main production remains unchanged; Pages and the isolated Yandex DRAFT share
// this owner-reviewed profile so visual acceptance can exercise one renderer.
import './pagesPreview';
import { installReviewVisualProfile } from './reviewVisualProfile';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app root.');
installReviewVisualProfile(root, { volumeProbe: true });
