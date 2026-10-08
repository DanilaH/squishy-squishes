import { getShape } from '../game/shapes';
import { getDecorFrame, MAX_DECOR_STICKERS, type DecorDocumentV1 } from './decor';
import { accessoryPlacements, initialAccessoryPlacements, MAX_ACCESSORY_PLACEMENTS } from './freeCraft';
import type { SandboxDraft } from './types';
import type { StagePointer } from './StageGestureRouter';
import { isBodyFillStroke } from './appearance';

type Selection = { kind: 'face' } | { kind: 'accessory' | 'sticker'; index: number };
interface EditorPort {
  get(): SandboxDraft;
  blocked(): boolean;
  set(decor: DecorDocumentV1): void;
  project(u: number, v: number): { x: number; y: number };
  accessoryHit(index: number, x: number, y: number): boolean;
  radius(): number;
  begin(): void;
  end(): void;
}
export class FreeCraftEditor {
  private selection: Selection = { kind: 'face' };
  private moreOpen = false;
  private drag: { selection: Selection; x: number; y: number; before: DecorDocumentV1 } | null = null;
  private readonly abort = new AbortController();
  constructor(private readonly root: HTMLElement, private readonly ru: boolean, private readonly port: EditorPort) {
    root.addEventListener('click', event => {
      if (this.port.blocked()) return;
      const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-object],[data-object-action]') : null;
      if (!button) return;
      const object = button.dataset.object;
      if (object) {
        const [kind, raw] = object.split(':');
        this.selection = kind === 'face' ? { kind } : { kind: kind as 'accessory' | 'sticker', index: Number(raw) };
        this.moreOpen = false; this.refresh(); return;
      }
      if (button.dataset.objectAction === 'more' || button.dataset.objectAction === 'close-more') {
        this.moreOpen = button.dataset.objectAction === 'more'; this.refresh();
        this.root.querySelector<HTMLElement>(this.moreOpen ? '[data-object-action="close-more"]' : '[data-object-action="more"]')?.focus({ preventScroll: true });
        return;
      }
      if(button.dataset.objectAction?.startsWith('color:')){const draft=this.port.get(),items=[...accessoryPlacements(draft.decor,getShape(draft.shapeId))];if(this.selection.kind==='accessory'){const item=items[this.selection.index]!;if(!item.locked){const value=button.dataset.objectAction.slice(6);items[this.selection.index]={...item,color:value==='body'?this.bodyColor():Number(value)};this.port.set({...draft.decor,accessory:null,accessories:items});this.refresh();}}return;}
      this.action(button.dataset.objectAction!);
    }, { signal: this.abort.signal });
    root.addEventListener('input', event => {
      if (this.port.blocked()) return;
      if (!(event.target instanceof HTMLInputElement) || !event.target.dataset.objectControl) return;
      const control = event.target.dataset.objectControl, value = Number(event.target.value);
      this.port.begin(); this.modify(control, value); // change/end coalesces the complete slider gesture
    }, { signal: this.abort.signal });
    root.addEventListener('change', event => {
      if (event.target instanceof HTMLInputElement && event.target.dataset.objectControl) { this.port.end(); this.refresh(); }
    }, { signal: this.abort.signal });
    root.ownerDocument.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !this.moreOpen || this.port.blocked()
        || !root.querySelector<HTMLElement>('.free-object-more')?.getClientRects().length) return;
      event.preventDefault();
      this.moreOpen = false; this.refresh();
      this.root.querySelector<HTMLElement>('[data-object-action="more"]')?.focus({ preventScroll: true });
    }, { signal: this.abort.signal });
  }
  public dispose(): void { this.abort.abort(); }
  private bodyColor(): number {
    const strokes = [...this.port.get().appearance.strokes].reverse();
    return strokes.find(isBodyFillStroke)?.c ?? strokes.find(stroke => stroke.m === 0)?.c ?? 0xf2dcae;
  }
  private face(decor = this.port.get().decor) {
    if (decor.face) return decor.face;
    const frame = getDecorFrame(getShape(this.port.get().shapeId));
    return { x: Math.round((frame.eyesLeft.u + frame.eyesRight.u) * 127.5),
      y: Math.round((frame.eyesLeft.v + frame.mouth.v) * 127.5), s: 1 };
  }
  public selectAccessory(index: number): void { this.selection = { kind: 'accessory', index }; this.moreOpen = false; this.refresh(); }
  public selectSticker(index: number): void { this.selection = { kind: 'sticker', index }; this.moreOpen = false; this.refresh(); }
  public refresh(): void {
    const panel = this.root.querySelector<HTMLElement>('[data-free-objects]'); if (!panel) return;
    const panelTop = panel.scrollTop;
    const listLeft = panel.querySelector('.free-object-list')?.scrollLeft ?? 0;
    const colorsLeft = panel.querySelector('.free-color-choices')?.scrollLeft ?? 0;
    const focused = document.activeElement instanceof HTMLElement && panel.contains(document.activeElement) ? document.activeElement : null;
    const focusKey = focused ? ['object', 'objectAction', 'objectControl'].find(key => focused.dataset[key] !== undefined) : undefined;
    const focusValue = focusKey ? focused!.dataset[focusKey] : undefined;
    const draft = this.port.get(), decor = draft.decor, items = accessoryPlacements(decor, getShape(draft.shapeId));
    if (this.selection.kind === 'accessory' && !items[this.selection.index] || this.selection.kind === 'sticker' && !decor.stickers[this.selection.index]) this.selection = { kind: 'face' };
    const selected = this.selection;
    const current = selected.kind === 'face' ? this.face() : selected.kind === 'accessory' ? items[selected.index]! : decor.stickers[selected.index]!;
    const locked = 'locked' in current && current.locked;
    const scale = selected.kind === 'sticker' ? current.s / 28 : current.s;
    const rotation = selected.kind === 'face' ? 0 : 'r' in current && typeof current.r === 'number' ? selected.kind === 'sticker' ? current.r / 255 * 360 : current.r * 180 / Math.PI : 0;
    const t = (en: string, ru: string) => this.ru ? ru : en;
    const names: Record<string, readonly [string,string]> = {'cat-ears':['Cat ears','Ушки'],'bunny-ears':['Bunny ears','Ушки зайца'],horns:['Horns','Рожки'],bow:['Bow','Бантик'],crown:['Crown','Корона'],glasses:['Glasses','Очки'],headphones:['Headphones','Наушники'],'bucket-hat':['Bucket hat','Панамка'],'petal-flower':['Flower','Цветок'],leaves:['Leaves','Листики'],butterfly:['Butterfly','Бабочка'],cream:['Cream','Сливки'],cherry:['Cherry','Вишенка'],'heart-patch':['Patch','Пластырь'],handbag:['Bag','Сумочка'],wings:['Wing','Крылышко']};
    const name = (a: string) => names[a]?.[this.ru ? 1 : 0] ?? t('Detail','Деталь');
    const objectButton = (id: string, label: string) => `<button type="button" data-object="${id}" aria-pressed="${id === (selected.kind === 'face' ? 'face' : `${selected.kind}:${selected.index}`)}">${label}</button>`;
    const atLimit = selected.kind === 'accessory' ? items.length >= MAX_ACCESSORY_PLACEMENTS
      : selected.kind === 'sticker' && decor.stickers.length >= MAX_DECOR_STICKERS;
    const limitHint = atLimit ? t('Limit reached. Delete an item to add a copy.', 'Лимит достигнут. Удали деталь, чтобы добавить копию.') : '';
    const actionButton = (action: string) => `<button type="button" data-object-action="${action}" ${action === 'lock' ? `aria-pressed="${!!locked}"` : action === 'more' ? `aria-expanded="${this.moreOpen}" aria-controls="free-object-more"` : ''} ${(action === 'reset' && locked) || (atLimit && (action === 'duplicate' || action === 'mirror')) ? 'disabled' : ''}>${({reset:t('Reset','Сброс'),lock:locked?t('Unlock','Открепить'):t('Lock','Закрепить'),duplicate:t('Copy','Копия'),mirror:t('Mirror copy','Парная копия'),delete:t('Delete','Удалить'),more:selected.kind === 'accessory' ? t('Color','Цвет') : t('More','Ещё')} as Record<string,string>)[action]}</button>`;
    panel.innerHTML = `<div class="free-object-core" ${this.moreOpen && selected.kind !== 'face' ? 'hidden inert' : ''}><div class="free-object-list" aria-label="${t('Objects', 'Объекты')}">${objectButton('face', t('Face', 'Личико'))}${items.map((item, i) => objectButton(`accessory:${i}`, `${i + 1} · ${name(item.a)}${item.locked ? ' 🔒' : ''}`)).join('')}${decor.stickers.map((item, i) => objectButton(`sticker:${i}`, `${t('Sticker', 'Наклейка')} ${i + 1}${item.locked ? ' 🔒' : ''}`)).join('')}</div>
      ${atLimit ? `<p class="decor-limit-notice" data-object-limit role="status">${limitHint}</p>` : ''}
      <div class="free-object-transforms">
        <label>${t('Size', 'Размер')} <input aria-label="${t('Size', 'Размер')}" data-object-control="scale" type="range" min="${selected.kind === 'face' ? .45 : selected.kind === 'sticker' ? .5 : .25}" max="${selected.kind === 'face' ? 1.65 : 2.5}" step=".01" value="${scale}" ${locked ? 'disabled' : ''}></label>
        ${selected.kind === 'face' ? '' : `<label>${t('Rotation', 'Поворот')} <input aria-label="${t('Rotation', 'Поворот')}" data-object-control="rotation" type="range" min="-180" max="180" step="1" value="${rotation > 180 ? rotation - 360 : rotation}" ${locked ? 'disabled' : ''}></label>`}
      </div>
      <div class="free-object-actions">${(selected.kind === 'face' ? ['reset'] : ['lock','mirror','delete','more']).map(actionButton).join('')}</div>
      </div><div class="free-object-more" id="free-object-more" role="group" aria-label="${t('Detail settings','Настройки детали')}" ${this.moreOpen && selected.kind !== 'face' ? '' : 'hidden'}>
        <div class="free-object-more-heading"><strong>${selected.kind === 'accessory' ? name(items[selected.index]!.a) : t('Sticker','Наклейка')}</strong><button type="button" data-object-action="close-more" aria-label="${t('Close settings','Закрыть настройки')}">×</button></div>
        ${selected.kind === 'accessory' ? `<div class="free-color-choices" aria-label="${t('Color','Цвет')}">${[[0xffa6cb,t('Pink','Розовый')],[0xcab0e8,t('Lavender','Лаванда')],[0xa1e2ce,t('Mint','Мята')],[0xffcea8,t('Peach','Персик')],[0xeec984,t('Gold','Золото')],[0xe8e5f0,t('Pearl','Перламутр')]].map(([color,label])=>`<button type="button" data-object-action="color:${color}" aria-label="${label}" aria-pressed="${'color' in current && current.color === color}" style="--craft-color:#${Number(color).toString(16)}" ${locked ? 'disabled' : ''}>●</button>`).join('')}<button type="button" data-object-action="color:body" aria-label="${t('Body colour','Цвет тела')}" aria-pressed="${'color' in current && current.color === this.bodyColor()}" style="--craft-color:#${this.bodyColor().toString(16)}" ${locked ? 'disabled' : ''}>●</button></div>` : ''}
        ${atLimit ? `<p class="decor-limit-notice" data-object-limit role="status">${limitHint}</p>` : ''}
        <div class="free-object-actions">${['duplicate','reset'].map(actionButton).join('')}</div>
      </div>`;
    panel.scrollTop = this.moreOpen ? 0 : panelTop;
    const list = panel.querySelector('.free-object-list');
    if (list) {
      list.scrollLeft = listLeft;
      const selectedButton = list.querySelector('[aria-pressed="true"]');
      if (selectedButton) {
        const tray = list.getBoundingClientRect(), item = selectedButton.getBoundingClientRect();
        list.scrollLeft += Math.min(0, item.left - tray.left) + Math.max(0, item.right - tray.right);
      }
    }
    const colors = panel.querySelector('.free-color-choices'); if (colors) colors.scrollLeft = colorsLeft;
    if (focusKey && focusValue) {
      const attribute = focusKey.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());
      panel.querySelector<HTMLElement>(`[data-${attribute}="${CSS.escape(focusValue)}"]`)?.focus({ preventScroll: true });
    }
    this.root.dataset.selectedObject = selected.kind === 'face' ? 'face' : `${selected.kind}:${selected.index}`;
  }
  private modify(control: string, value: number): void {
    const draft = this.port.get(), decor = draft.decor, selected = this.selection;
    if (selected.kind === 'face') { this.port.set({ ...decor, face: { ...this.face(), s: value } }); return; }
    if (selected.kind === 'accessory') {
      const items = [...accessoryPlacements(decor, getShape(draft.shapeId))], item = items[selected.index]; if (!item || item.locked) return;
      items[selected.index] = { ...item, ...(control === 'scale' ? { s: value } : { r: value * Math.PI / 180 }) };
      this.port.set({ ...decor, accessory: null, accessories: items });
    } else {
      const stickers = [...decor.stickers], item = stickers[selected.index]; if (!item || item.locked) return;
      stickers[selected.index] = { ...item, ...(control === 'scale' ? { s: Math.min(72, Math.max(14, Math.round(value * 28))) } : { r: Math.round(((value + 360) % 360) / 360 * 255) }) };
      this.port.set({ ...decor, stickers });
    }
  }
  private action(action: string): void {
    const draft = this.port.get(), decor = draft.decor, selected = this.selection;
    if (selected.kind === 'face') {
      const { face: _face, ...rest } = decor; this.port.set(rest); this.refresh(); return;
    }
    if (selected.kind === 'accessory') {
      const items = [...accessoryPlacements(decor, getShape(draft.shapeId))], item = items[selected.index]; if (!item) return;
      if (action === 'lock') { const {locked: _locked, ...rest} = item; items[selected.index] = item.locked ? rest : {...item, locked: true}; }
      else if (action === 'delete') items.splice(selected.index, 1);
      else if (action === 'reset' && !item.locked) items[selected.index] = { ...initialAccessoryPlacements(getShape(draft.shapeId), item.a).find(p => p.side === item.side) ?? initialAccessoryPlacements(getShape(draft.shapeId), item.a)[0]!, ...(item.color === undefined ? {} : {color:item.color}) };
      else if ((action === 'duplicate' || action === 'mirror') && items.length < MAX_ACCESSORY_PLACEMENTS) {
        const { locked: _locked, mirrored: _mirrored, ...copy } = item;
        items.push(action === 'mirror' ? { ...copy, x: 255 - item.x, r: -item.r, side: item.side === 'left' ? 'right' : item.side === 'right' ? 'left' : 'whole', ...(item.side === 'whole' && !item.mirrored ? {mirrored:true as const} : item.side !== 'whole' && item.mirrored ? {mirrored:true as const} : {}) } : { ...copy, ...(item.mirrored ? {mirrored:true as const} : {}), x: Math.min(255, item.x + 12) });
        this.selection = {kind:'accessory',index:items.length-1};
      }
      this.port.set({...decor, accessory:null, accessories:items});
    } else {
      const stickers = [...decor.stickers], item = stickers[selected.index]; if (!item) return;
      if (action === 'lock') { const {locked:_locked,...rest}=item; stickers[selected.index]=item.locked?rest:{...item,locked:true}; }
      else if(action==='delete')stickers.splice(selected.index,1);
      else if(action==='reset'&&!item.locked)stickers[selected.index]={...item,x:item.home?.[0]??item.x,y:item.home?.[1]??item.y,s:28,r:0};
      else if((action==='duplicate'||action==='mirror')&&stickers.length<MAX_DECOR_STICKERS){
        const {locked:_locked,...copy}=item; const x=action==='mirror'?255-item.x:Math.min(255,item.x+12);
        stickers.push({...copy,x,home:[x,item.y],...(action==='mirror'?{r:255-item.r}:{})});
        this.selection={kind:'sticker',index:stickers.length-1};
      }
      this.port.set({...decor,stickers});
    }
    this.refresh();
  }
  public begin(pointer: StagePointer): boolean {
    if (this.port.blocked()) return false;
    const draft=this.port.get(), items=accessoryPlacements(draft.decor,getShape(draft.shapeId));
    let found:Selection|null=null;
    // Explicit list selection wins when overlapping pieces are under the same finger.
    const hit=(selection:Selection):boolean=>{
      if(selection.kind==='accessory'){
        return this.port.accessoryHit(selection.index, pointer.clientX, pointer.clientY);
      }
      const p=selection.kind==='face'?this.face():draft.decor.stickers[selection.index];if(!p)return false;
      const center=this.port.project(p.x/255,p.y/255), radius=selection.kind==='face'?Math.max(30,this.port.radius()*.23*p.s):Math.max(22,p.s/256*this.port.radius());
      return Math.hypot(pointer.clientX-center.x,pointer.clientY-center.y)<=radius;
    };
    if(hit(this.selection))found=this.selection;
    else {
      for(let i=items.length-1;i>=0;i--)if(hit({kind:'accessory',index:i})){found={kind:'accessory',index:i};break;}
      if(!found)for(let i=draft.decor.stickers.length-1;i>=0;i--)if(hit({kind:'sticker',index:i})){found={kind:'sticker',index:i};break;}
      if(!found&&hit({kind:'face'}))found={kind:'face'};
    }
    if(!found)return false;
    this.selection=found;this.refresh();
    const item=found.kind==='accessory'?items[found.index]:found.kind==='sticker'?draft.decor.stickers[found.index]:null;
    if(item?.locked)return true;
    this.port.begin();this.drag={selection:found,x:pointer.clientX,y:pointer.clientY,before:draft.decor};return true;
  }
  public move(pointer:StagePointer):void{
    const drag=this.drag;if(!drag)return;
    const {selection,before}=drag, dx=(pointer.clientX-drag.x)/this.port.radius()/2*255,dy=-(pointer.clientY-drag.y)/this.port.radius()/2*255;
    const clamp=(value:number)=>Math.min(255,Math.max(0,Math.round(value)));
    if(selection.kind==='face'){
      const face=this.face(before);this.port.set({...before,face:{...face,x:clamp(face.x+dx),y:clamp(face.y+dy)}});
    }else if(selection.kind==='accessory'){
      const items=[...accessoryPlacements(before,getShape(this.port.get().shapeId))],item=items[selection.index]!;
      items[selection.index]={...item,x:clamp(item.x+dx),y:clamp(item.y+dy)};this.port.set({...before,accessory:null,accessories:items});
    }else{
      const stickers=[...before.stickers],item=stickers[selection.index]!;stickers[selection.index]={...item,home:item.home??[item.x,item.y],x:clamp(item.x+dx),y:clamp(item.y+dy)};this.port.set({...before,stickers});
    }
  }
  public end(cancelled=false):void{
    if(!this.drag)return;
    if(cancelled)this.port.set(this.drag.before);
    this.drag=null;this.port.end();this.refresh();
  }
}
