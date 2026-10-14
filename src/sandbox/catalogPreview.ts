import { REWARD_VIDEO_ICON as ICON } from '../app/rewardIcon';
import { catalogKey, type CatalogPort } from '../platform/catalogOwnership';
import type { SandboxDraft } from './types';
import type { DraftHistory } from './draftHistory';
import '../app/styles/catalog-preview.css';


export class CatalogPreview {
  private pending: { key: string; category: string; id: string; before: SandboxDraft; label: string } | null = null;
  private busy = false;
  private bar: HTMLElement;
  private abort = new AbortController();
  constructor(private root: HTMLElement, private port: CatalogPort, private ru: boolean, private get:()=>SandboxDraft, private apply:(draft:SandboxDraft)=>void, private history:DraftHistory, private blocked:()=>boolean) {
    this.bar=document.createElement('aside');this.bar.className='catalog-preview';this.bar.hidden=true;this.bar.dataset.catalogPreview='';this.bar.setAttribute('aria-live','polite');
    root.querySelector('.sandbox-controls')?.prepend(this.bar);
    if(!this.bar.isConnected)root.querySelector('[data-sandbox-app]')!.append(this.bar);
    this.mark();
    root.addEventListener('click',this.click,{capture:true,signal:this.abort.signal});
  }
  private selection(button:HTMLElement):{category:string;id:string}|null{
    for(const [data,category] of [['shape','shape'],['material','material'],['decorAccessory','accessory'],['decorEyes','eyes'],['decorMouth','mouth']]){
      const id=button.dataset[data!];if(id!==undefined)return{category:category!,id};
    }return null;
  }
  private mark():void{
    for(const button of this.root.querySelectorAll<HTMLButtonElement>('button')){
      const selection=this.selection(button);if(!selection)continue;
      const key=catalogKey(selection.category,selection.id),locked=!!key&&!this.port.owns(key);
      button.dataset.catalogLocked=String(locked);
      button.querySelector('[data-catalog-badge]')?.remove();
      if(locked){const badge=document.createElement('small');badge.dataset.catalogBadge='';badge.className='catalog-badge';badge.innerHTML=`${ICON}<span>${this.ru?'Примерить бесплатно':'Try free'}</span>`;button.append(badge);}
    }
  }
  private click=(event:MouseEvent):void=>{
    const button=event.target instanceof Element?event.target.closest<HTMLButtonElement>('button'):null;if(!button)return;
    if(this.busy){event.stopImmediatePropagation();event.preventDefault();return;}
    if(this.blocked()||button.disabled)return;
    if(button.hasAttribute('data-preview-open')){event.stopImmediatePropagation();void this.open();return;}
    if(button.hasAttribute('data-preview-restore')){event.stopImmediatePropagation();this.restore();return;}
    const selection=this.selection(button);
    if(selection){
      const key=catalogKey(selection.category,selection.id);
      if(this.pending) {
        const anotherLockedItem = key && key !== this.pending.key && !this.port.owns(key);
        const replacesCurrentChoice = selection.category === this.pending.category
          && (selection.category !== 'accessory' || selection.id === 'none' || key === this.pending.key);
        if(anotherLockedItem || replacesCurrentChoice) this.restore();
      }
      if(key&&!this.port.owns(key)){
        if(!this.pending)this.pending={...selection,key,before:structuredClone(this.get()),label:button.getAttribute('aria-label')??button.querySelector('small:not([data-catalog-badge]), :scope > span:last-of-type')?.textContent?.trim()??selection.id};
        if(key.startsWith('face:')) this.pending.label = ({'face:love':this.ru?'Влюблённый':'In love','face:cat':this.ru?'Хитрый котик':'Sly kitty','face:vampire':this.ru?'Вампирчик':'Little vampire','face:zombie':this.ru?'Сквиш-зомби':'Zombie squishy'} as Record<string,string>)[key] ?? this.pending.label;
        this.port.track('catalog_preview',key);this.render();
      }
    }
    if(this.pending && ['draft-undo','draft-redo','paint-undo','decor-undo','mixin-undo'].includes(button.dataset.action??'')){
      event.stopImmediatePropagation();event.preventDefault();this.restore();return;
    }
    if(this.pending && button.dataset.action === 'save'){
      event.stopImmediatePropagation();event.preventDefault();this.render();this.bar.querySelector<HTMLButtonElement>('[data-preview-open]')?.focus();
    }
    if(this.pending && ['new','edit-saved','exit-confirm','home'].includes(button.dataset.action??''))this.restore();
  };
  private removePreview(draft:SandboxDraft):SandboxDraft{
    const pending=this.pending;if(!pending)return draft;
    const {category,id,before}=pending;
    if(pending.key.startsWith('face:')) return {...draft,decor:{...draft.decor,
      eyes: draft.decor.eyes && catalogKey('eyes',draft.decor.eyes) === pending.key ? before.decor.eyes : draft.decor.eyes,
      mouth: draft.decor.mouth && catalogKey('mouth',draft.decor.mouth) === pending.key ? before.decor.mouth : draft.decor.mouth,
    }};
    if(category==='shape')return draft.shapeId===id?{...draft,shapeId:before.shapeId}:draft;
    if(category==='material')return draft.materialId===id?{...draft,materialId:before.materialId}:draft;
    if(category==='eyes'||category==='mouth')return draft.decor[category]===id?{...draft,decor:{...draft.decor,[category]:before.decor[category]}}:draft;
    if(category==='accessory')return{...draft,decor:{...draft.decor,accessory:draft.decor.accessory===id?before.decor.accessory:draft.decor.accessory,...(draft.decor.accessories?{accessories:draft.decor.accessories.filter(p=>p.a!==id)}:{})}};
    return draft;
  }
  private restore():void{
    if(!this.pending)return;
    const draft=this.removePreview(this.get());this.history.rebase(d=>this.removePreview(d));
    this.pending=null;this.apply(draft);this.bar.hidden=true;
  }
  private render(message?:string):void{
    if(!this.pending)return;this.bar.hidden=false;this.bar.replaceChildren();
    const label=document.createElement('strong');label.textContent=`${this.ru?'Примерка':'Preview'} · ${this.pending.label}`;this.bar.append(label);
    const hint=document.createElement('small');hint.textContent=message??(this.ru?'Навсегда, для всех сквишей. Сначала открой или убери примерку.':'Forever, for every squishy. Unlock or remove this preview before saving.');this.bar.append(hint);
    const open=document.createElement('button');open.type='button';open.dataset.previewOpen='';open.innerHTML=`${ICON}<span>${this.ru?'Открыть за рекламу':'Unlock for an ad'}</span>`;open.disabled=this.busy;
    const restore=document.createElement('button');restore.type='button';restore.dataset.previewRestore='';restore.textContent=this.ru?'Убрать примерку':'Remove preview';restore.disabled=this.busy;
    this.bar.append(open,restore);
  }
  private async open():Promise<void>{
    if(!this.pending||this.busy)return;const key=this.pending.key;this.busy=true;this.render();
    try{
      const earned=await this.port.unlock(key);
      if(this.abort.signal.aborted)return;
      if(earned){this.port.track('catalog_unlock',key);this.pending=null;this.bar.hidden=true;this.mark();}
      else this.render(this.ru?'Реклама недоступна или закрыта. Примерка сохранена.':'Ad unavailable or closed. Your preview is still here.');
    }catch{if(!this.abort.signal.aborted)this.render(this.ru?'Не удалось сохранить открытие. Если награда получена, повтор будет без новой рекламы.':'Could not save the unlock. An earned reward retries without another ad.');}
    finally{this.busy=false;if(this.pending&&!this.abort.signal.aborted)this.bar.querySelectorAll('button').forEach(button=>button.disabled=false);}
  }
  /** Never persist an unowned preview into the resumable tutorial draft. */
  public get hasPending():boolean { return this.pending !== null; }
  public cancel():void { this.restore(); }
  snapshot():SandboxDraft{return this.removePreview(this.get());}
  dispose():void{this.abort.abort();this.bar.remove();}
}
