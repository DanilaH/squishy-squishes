import type { CollectionRepository } from '../platform/collectionRepository';

export async function renderSaveRecovery(root: HTMLElement, repository: CollectionRepository, language: 'ru' | 'en'): Promise<void> {
  const t = (en: string, ru: string): string => language === 'ru' ? ru : en;
  const available = await repository.hasRecovery();
  root.innerHTML = `<main class="lab-shell"><section class="recipe-panel save-recovery" role="alert">
    <h1>${t('Your collection could not open', 'Не удалось открыть коллекцию')}</h1>
    <p>${t('Your data has been kept. Retry if storage was temporarily unavailable, or download a copy before recovery.', 'Ваши данные сохранены. Если хранилище временно недоступно, повторите загрузку. Перед восстановлением можно скачать копию данных.')}</p>
    <button type="button" data-recovery="retry">${t('Retry', 'Повторить загрузку')}</button>
    <button type="button" data-recovery="export">${t('Download save copy', 'Скачать копию сохранения')}</button>
    ${available ? `<button type="button" data-recovery="restore">${t('Restore previous save…', 'Восстановить предыдущую версию…')}</button>` : `<p>${t('No complete backup is available. Keep the downloaded copy for support; nothing will be reset automatically.', 'Полной резервной копии нет. Сохраните скачанный файл для обращения за помощью. Игра не будет сбрасывать ваш прогресс.')}</p>`}
    <div data-recovery-confirm hidden><p>${t('Return to the previous successful save? Your latest changes may be missing. The damaged data will be kept.', 'Вернуться к предыдущему успешному сохранению? Последние изменения могут отсутствовать. Повреждённые данные будут сохранены.')}</p>
    <button type="button" data-recovery="confirm">${t('Restore previous save', 'Восстановить предыдущую версию')}</button>
    <button type="button" data-recovery="cancel">${t('Cancel', 'Отмена')}</button></div>
    <p data-recovery-status role="status"></p>
  </section></main>`;
  const status = root.querySelector<HTMLElement>('[data-recovery-status]')!;
  const confirm = root.querySelector<HTMLElement>('[data-recovery-confirm]')!;
  root.querySelectorAll<HTMLButtonElement>('[data-recovery]').forEach(button => button.addEventListener('click', async () => {
    const action = button.dataset.recovery;
    if (action === 'retry') { location.reload(); return; }
    if (action === 'restore' || action === 'cancel') {
      confirm.hidden = action === 'cancel';
      root.querySelector<HTMLButtonElement>(action === 'cancel' ? '[data-recovery="restore"]' : '[data-recovery="confirm"]')?.focus(); return;
    }
    button.disabled = true;
    try {
      if (action === 'confirm') { await repository.restoreBackup(); location.reload(); }
      else if (action === 'export') {
        const url = URL.createObjectURL(new Blob([await repository.exportRecovery()], {type:'application/json'}));
        const link = document.createElement('a'); link.href = url; link.download = 'squishy-save-recovery.json'; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        status.textContent = t('Save copy downloaded.', 'Копия сохранения скачана.');
      }
    } catch { status.textContent = t('Storage is still unavailable. Your data has not been reset. Please try again.', 'Хранилище пока недоступно. Данные не сброшены. Попробуйте ещё раз.'); }
    finally { button.disabled = false; }
  }));
}
