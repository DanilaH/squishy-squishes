import { expect, type Page } from '@playwright/test';

/** Audit every actual control through the permitted shelf scroll, restoring it. */
export async function auditShowcase(page: Page, label: string) {
  await expect(page.locator('[data-sandbox-library]')).toHaveClass(/is-library-hall/);
  // ResizeObserver seats the table in the following animation frame. Audit the
  // committed viewport layout, rather than the previous desktop's table offset.
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const facts = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>('[data-sandbox-library]')!;
    const shelf = shell.querySelector<HTMLElement>('.sandbox-library-grid')!;
    const scene = shell.querySelector<HTMLElement>('.library-hall-scene')!;
    const table = shell.querySelector<HTMLElement>('.library-showcase-table')!;
    const rect = (node: Element) => node.getBoundingClientRect().toJSON();
    const original = shelf.scrollTop, tableBefore = rect(table), issues: string[] = [];
    const controls = [...shell.querySelectorAll<HTMLButtonElement>('button')].filter(button => !button.disabled && button.getClientRects().length);
    for (const button of controls) {
      if (shelf.contains(button)) button.scrollIntoView({behavior:'instant',block:'nearest',inline:'nearest'});
      const r = button.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      if(r.width<44 || r.height<44 || r.left<-.5 || r.right>innerWidth+.5 || r.top<-.5 || r.bottom>innerHeight+.5 || !hit || !button.contains(hit)) issues.push(button.outerHTML.slice(0,160));
    }
    const toys = [...shelf.querySelectorAll<HTMLCanvasElement>('[data-library-thumbnail]')].map(canvas => {
      const pixels=canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data;
      let visible=0,last=-1;
      for(let i=3;i<pixels.length;i+=4) if(pixels[i]!>80) {visible++;last=Math.floor((i-3)/4/canvas.width);}
      const card=canvas.closest<HTMLElement>('[data-library-toy]')!,c=canvas.getBoundingClientRect(),r=card.getBoundingClientRect();
      // The square image is bottom-aligned within its rectangular card canvas.
      const size=Math.min(c.width,c.height), bottom=c.bottom-(1-(last+1)/canvas.height)*size;
      const railTop=r.top+parseFloat(getComputedStyle(card,'::before').top);
      const contact=bottom-railTop;
      return {id:canvas.dataset.libraryThumbnail,visible,contact,width:canvas.width,height:canvas.height};
    });
    shelf.scrollTop=original;
    return { viewport:{width:innerWidth,height:innerHeight}, scroll:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,shell:shell.scrollHeight,shellClient:shell.clientHeight}, shelf:rect(shelf), tableBefore,tableAfter:rect(table),issues,toys,
      count:shelf.querySelectorAll('[data-library-toy],.library-showcase-slot').length,
      passive:getComputedStyle(scene).pointerEvents, image:getComputedStyle(scene.querySelector('.library-hall-scene__wall')!).backgroundImage,
      primary:controls.filter(button=>!shelf.contains(button)).map(rect) };
  });
  expect(facts.count, `${label}: eight ordinary shelf positions`).toBe(8);
  expect(facts.issues, `${label}: all shelf and primary controls reachable at 44px`).toEqual([]);
  expect(facts.scroll.width).toBeLessThanOrEqual(facts.viewport.width+2);
  expect(facts.scroll.height).toBeLessThanOrEqual(facts.viewport.height+2);
  expect(facts.scroll.shell).toBeLessThanOrEqual(facts.scroll.shellClient+3);
  expect(facts.tableAfter, `${label}: catalog scroll keeps table fixed`).toEqual(facts.tableBefore);
  expect(facts.passive).toBe('none');expect(facts.image).toContain('wall');
  for(const toy of facts.toys){expect(toy.visible,`${label}: ${toy.id} has real pixels`).toBeGreaterThan(2000);expect([toy.width,toy.height]).toEqual([512,512]);expect(toy.contact,`${label}: ${toy.id} rests on its shelf`).toBeGreaterThanOrEqual(-24);expect(toy.contact).toBeLessThanOrEqual(32);}
  return facts;
}
