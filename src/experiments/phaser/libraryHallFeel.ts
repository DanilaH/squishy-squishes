import './libraryHallFeel.css';

/** Pages-only Hall motion. DOM state owns transitions; no RAF, timers or extra GPU contexts. */
export const mountLibraryHallFeel = (root: HTMLElement): void => {
  let lastCount: number | null = null;
  let lastRoom: string | null = null;
  let shell: HTMLElement | null = null;
  let activePointer: HTMLElement | null = null;

  const clearInteraction = (): void => {
    activePointer?.classList.remove('library-hall-interacting');
    activePointer = null;
  };
  const inspect = (): void => {
    const nextShell = root.querySelector<HTMLElement>('[data-sandbox-library][data-library-hall-mounted="true"]');
    if (!nextShell) return;
    const count = Number(nextShell.dataset.libraryCount ?? 0);
    const room = nextShell.dataset.libraryHallRoom ?? '1';
    const cards = [...nextShell.querySelectorAll<HTMLElement>('.sandbox-library-card[data-library-toy]')];
    const countIncreased = lastCount !== null && count > lastCount;
    const pageChanged = !countIncreased && lastRoom !== null && room !== lastRoom;
    if (countIncreased || pageChanged) {
      for (const card of cards) card.classList.remove('is-library-arrival', 'is-library-page-enter');
      if (countIncreased) {
        // The Hall itself navigates to the new toy's room; never animate a
        // historical save on the first boot or the unrelated empty podium.
        const arrival = cards[count - 1];
        if (arrival && !arrival.hidden) arrival.classList.add('is-library-arrival');
      } else {
        for (const card of cards) if (!card.hidden) card.classList.add('is-library-page-enter');
      }
    }
    lastCount = count;
    lastRoom = room;
    shell = nextShell;
    nextShell.classList.toggle('is-library-hidden', document.hidden);
  };

  const observer = new MutationObserver(inspect);
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-library-count', 'data-library-hall-room'],
  });
  inspect();
  document.addEventListener('visibilitychange', () => {
    shell?.classList.toggle('is-library-hidden', document.hidden);
    if (document.hidden) clearInteraction();
  });
  root.addEventListener('pointerdown', (event) => {
    if (!(event.target instanceof Node) || !shell?.contains(event.target)) return;
    clearInteraction();
    activePointer = shell;
    shell.classList.add('library-hall-interacting');
  }, { capture: true });
  window.addEventListener('pointerup', clearInteraction, { capture: true });
  window.addEventListener('pointercancel', clearInteraction, { capture: true });
  window.addEventListener('blur', clearInteraction);
  root.addEventListener('animationend', (event) => {
    if (!(event.target instanceof Element)) return;
    const card = event.target.closest<HTMLElement>('.sandbox-library-card');
    if (!card) return;
    if (event.animationName === 'library-toy-arrival') card.classList.remove('is-library-arrival');
    if (event.animationName === 'library-toy-page-enter') card.classList.remove('is-library-page-enter');
  });
};
