import './styles.css';
import { VerticalSliceApp } from './game/VerticalSliceApp';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app root.');

const app = new VerticalSliceApp(root);
window.addEventListener('pagehide', () => app.dispose(), { once: true });
