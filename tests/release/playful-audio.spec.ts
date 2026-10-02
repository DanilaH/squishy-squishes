import { expect, test } from '@playwright/test';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';

test('material release tones differ, stay quiet and respect mute', async ({ page }) => {
  await page.addInitScript(() => {
    const NativeAudio = window.AudioContext;
    const records: { context: AudioContext; master: GainNode; pitches: number[]; analyser: AnalyserNode }[] = [];
    (window as unknown as { toyAudio: typeof records }).toyAudio = records;
    window.AudioContext = class extends NativeAudio {
      constructor(options?: AudioContextOptions) {
        super(options);
        const gainFactory = this.createGain.bind(this), oscillatorFactory = this.createOscillator.bind(this);
        const pitches: number[] = [];
        this.createGain = () => {
          const gain = gainFactory();
          if (!records.some(r => r.context === this)) {
            const analyser = this.createAnalyser(), silent = gainFactory();
            silent.gain.value = 0;
            gain.connect(analyser); analyser.connect(silent); silent.connect(this.destination);
            records.push({ context: this, master: gain, pitches, analyser });
          }
          return gain;
        };
        this.createOscillator = () => {
          const oscillator = oscillatorFactory();
          const set = oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
          oscillator.frequency.setValueAtTime = (value, time) => { pitches.push(value); return set(value, time); };
          return oscillator;
        };
      }
    };
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/squishy-squishes/');
  await page.evaluate(save => localStorage.setItem('squishy.save.v3', JSON.stringify(save)), {
    ...createDefaultSaveV3(), totalCrafts: 3,
    library: ['marshmallow', 'jelly', 'pearl'].map((materialId, i) => ({
      id: materialId, createdAt: 1700000000000 + i, shapeId: 'mochi', materialId,
      appearance: { v: 1, strokes: [], mixins: [] }, decor: createEmptyDecorDocument(),
    })),
  });
  const releases: number[] = [];
  for (const material of ['marshmallow', 'jelly', 'pearl']) {
    await page.reload();
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-hall-mounted', 'true');
    const play = page.locator(`[data-library-play-id="${material}"]`);
    if (!await play.isVisible()) await page.locator('[data-library-hall-next]').click();
    await play.click();
    const box = (await page.locator('[data-sandbox-canvas]').boundingBox())!;
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x + 55, y + 35, { steps: 16 });
    await page.mouse.up();
    const stats = await page.evaluate(async () => {
      const record = (window as unknown as { toyAudio: { context: AudioContext; master: GainNode; pitches: number[]; analyser: AnalyserNode }[] }).toyAudio.at(-1)!;
      let peak = 0;
      for (let n = 0; n < 12; n++) {
        const values = new Float32Array(record.analyser.fftSize);
        record.analyser.getFloatTimeDomainData(values);
        for (const value of values) peak = Math.max(peak, Math.abs(value));
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      }
      return { pitches: record.pitches, peak, state: record.context.state };
    });
    expect(stats.state).toBe('running');
    expect(stats.peak).toBeGreaterThan(0); expect(stats.peak).toBeLessThan(.25);
    const release = stats.pitches.filter(p => p < 250).at(-1);
    expect(release).toBeDefined(); releases.push(release!);
    await page.locator('[data-action="mute"]').click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { toyAudio: { master: GainNode }[] }).toyAudio.at(-1)!.master.gain.value)).toBeLessThan(.001);
    const before = await page.evaluate(() => (window as unknown as { toyAudio: { pitches: number[] }[] }).toyAudio.at(-1)!.pitches.length);
    await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x - 40, y, { steps: 10 }); await page.mouse.up();
    expect(await page.evaluate(() => (window as unknown as { toyAudio: { pitches: number[] }[] }).toyAudio.at(-1)!.pitches.length)).toBe(before);
    await page.locator('[data-action="mute"]').click();
  }
  expect(releases[0]!).toBeLessThan(releases[1]!);
  expect(releases[1]!).toBeLessThan(releases[2]!);
});
