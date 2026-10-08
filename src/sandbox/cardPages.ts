import type { SandboxLanguage } from './SandboxApp';
import '../app/styles/card-pages.css';

const CARDS_PER_PAGE = 4;

export const cardPagerMarkup = (language: SandboxLanguage): string => `
  <nav class="card-pager" aria-label="${language === 'ru' ? 'Страницы карточек' : 'Card pages'}">
    <button type="button" data-card-page-step="-1" aria-label="${language === 'ru' ? 'Предыдущая страница' : 'Previous page'}">‹</button>
    <output data-card-page-counter role="status" aria-live="polite"></output>
    <button type="button" data-card-page-step="1" aria-label="${language === 'ru' ? 'Следующая страница' : 'Next page'}">›</button>
  </nav>`;

export const showCardPage = (scope: HTMLElement, requested = 0): void => {
  const cards = [...scope.querySelectorAll<HTMLButtonElement>('[data-card-page-item]')];
  const perPage = Math.max(1, Number(scope.dataset.cardsPerPage) || CARDS_PER_PAGE);
  const count = Math.max(1, Math.ceil(cards.length / perPage));
  const page = Math.max(0, Math.min(requested, count - 1));
  scope.dataset.cardPage = String(page);
  cards.forEach((card, index) => { card.hidden = Math.floor(index / perPage) !== page; });
  const prev = scope.querySelector<HTMLButtonElement>('[data-card-page-step="-1"]');
  const next = scope.querySelector<HTMLButtonElement>('[data-card-page-step="1"]');
  if (prev) prev.disabled = page === 0;
  if (next) next.disabled = page === count - 1;
  const counter = scope.querySelector<HTMLOutputElement>('[data-card-page-counter]');
  if (counter) counter.textContent = `${page + 1} / ${count}`;
  // A disabled paging control must not leave keyboard focus stranded.
  if (document.activeElement === prev && prev?.disabled || document.activeElement === next && next?.disabled) {
    cards[page * perPage]?.focus({ preventScroll: true });
  }
};
