import '../app/styles/first-craft-guide.css';
import type { OnboardingState } from '../platform/onboarding';
import type { SandboxDraft } from './types';

/** Contextual guidance observes committed editor state; it never drives or blocks stages. */
export class FirstCraftGuide {
  private observer:MutationObserver;
  private abort=new AbortController();
  private timer:ReturnType<typeof setTimeout>|undefined;
  private lastDraft='';
  private lastHint='';
  private disposed=false;
  private saved=false;
  private savedSqueezes=0;
  private squeezed=false;
  private fillingVisit=false;
  private active:boolean;
  constructor(private root:HTMLElement,private ru:boolean,private state:OnboardingState,
    private getDraft:()=>SandboxDraft,private commit:(state:OnboardingState)=>void) {
    this.active=state.status==='active';
    this.observer=new MutationObserver(records=>{ if(records.some(record=>record.type==='childList'||record.oldValue!==(record.target as Element).getAttribute(record.attributeName!))) this.update(); });
    this.observer.observe(root,{subtree:true,childList:true,attributes:true,attributeOldValue:true,attributeFilter:['data-stage','data-paint-strokes','data-save-complete','data-save-failed','data-sandbox-squeezes','data-crafting','data-decor-section','data-try-on','hidden']});
    root.addEventListener('click',event=>{
      if(this.root.querySelector('[data-sandbox-app]')?.getAttribute('aria-busy')==='true')return;
      const button=event.target instanceof Element?event.target.closest('button'):null;
      if(button?.hasAttribute('data-guide-skip')) {this.active=false;this.fillingVisit=false;this.change({status:this.state.status==='done'?'done':'skipped',fillingsSeen:true,roomSeen:true});this.clear();}
      queueMicrotask(()=>{this.update();this.checkpoint();});
    },{signal:this.abort.signal});
    root.addEventListener('pointerup',()=>queueMicrotask(()=>{this.update();this.checkpoint();}),{signal:this.abort.signal});
    root.addEventListener('input',()=>queueMicrotask(()=>{this.update();this.checkpoint();}),{signal:this.abort.signal});
    window.addEventListener('pagehide',()=>this.checkpoint(),{signal:this.abort.signal});
    this.update();
  }
  private text(ru:string,en:string){return this.ru?ru:en;}
  private change(patch:Partial<OnboardingState>){this.state={...this.state,...patch};this.commit(this.state);}
  private clear(){
    this.root.querySelector('[data-guide-skip]')?.remove();
    for(const node of this.root.querySelectorAll('[data-guide-target]'))node.removeAttribute('data-guide-target');
    const hint=this.root.querySelector<HTMLElement>('[data-sandbox-hint]');
    if(hint?.dataset.guideOriginal!==undefined){hint.textContent=hint.dataset.guideOriginal;delete hint.dataset.guideOriginal;delete hint.dataset.guideHint;delete hint.dataset.guideStage;this.root.querySelector('.sandbox-copy')?.append(hint);}
    this.lastHint='';
  }
  private checkpoint(){
    if(this.disposed||this.saved)return;
    const draft=this.getDraft(),raw=JSON.stringify(draft);
    if(raw!==this.lastDraft){this.lastDraft=raw;this.change({draft});}
  }
  private update(){
    if(this.disposed)return;
    const shell=this.root.querySelector<HTMLElement>('[data-sandbox-app]');if(!shell)return;
    const stage=shell.dataset.stage,draft=this.getDraft();
    if(shell.dataset.saveComplete==='true'&&!this.saved){this.saved=true;this.savedSqueezes=Number(shell.dataset.sandboxSqueezes)||0;this.change({draft:null});}
    if(!this.saved){clearTimeout(this.timer);this.timer=setTimeout(()=>this.checkpoint(),300);}
    let message='',target='',step='';
    if(this.active){
      if(!this.root.querySelector('[data-guide-skip]')){
        const button=document.createElement('button');button.type='button';button.dataset.guideSkip='';button.className='first-craft-skip';button.textContent=this.text('Пропустить','Skip tutorial');
        this.root.querySelector('.sandbox-topbar')?.prepend(button);
      }
      if(shell.dataset.tryOn==='true'){step='try';target='[data-action="try-return"]';message=this.text('Помни сквиш. Затем вернись к крафту.','Squeeze it, then return to craft.');}
      else if(this.saved&&stage==='squeeze'){
        if(Number(shell.dataset.sandboxSqueezes)>this.savedSqueezes&&!this.squeezed){
          this.squeezed=true;this.active=false;this.change({status:'done',fillingsSeen:true});this.clear();
          this.root.querySelector('[data-action="home"]')?.setAttribute('data-guide-target','');
        }else{
          step='squeeze';target='[data-sandbox-canvas]';
          message=this.text('Зажми и потяни сквиш — он уже сохранён.','Press and pull — your squishy is saved.');
        }
      }else if(stage==='shape'){
        step='base';target='[data-craft-section="paint"]';message=this.text('Выбери форму. Затем открой «Раскраска».','Pick a shape, then open Paint.');
      }else if(stage==='paint'){
        const painted=draft.appearance.strokes.length>0;
        if(painted&&!this.state.painted){this.change({painted:true});}
        step=painted?'undo':'paint';target=painted?'[data-craft-section="decor"]':'[data-sandbox-canvas]';
        const canUndo=!this.root.querySelector<HTMLButtonElement>('.craft-actions [data-action="draft-undo"]')?.disabled;
        message=painted?(canUndo?this.text('↶ отменяет мазок. Попробуй украшения.','↶ undoes a stroke. Next, try Decor.'):this.text('Раскраска восстановлена. Попробуй украшения.','Painting restored. Next, try Decor.')):this.text('Выбери цвет и рисуй на сквише.','Pick a color and draw on your squishy.');
      }else if(stage==='decor'){
        const decorated=Boolean(draft.decor.eyes||draft.decor.mouth||draft.decor.accessories?.length||draft.decor.stickers.length||draft.decor.accessory);
        if(decorated&&!this.state.decorated){this.change({decorated:true});}
        const selected=this.root.querySelector<HTMLElement>('[data-accessory-selection]:not([hidden]),[data-sticker-selection]:not([hidden])');
        step=selected?'arrange':decorated?'save':'decor';target=decorated?'.craft-actions [data-action="save"]':'.sandbox-decor-tabs';
        message=selected?this.text('Тяни деталь в рамке. Размер и поворот — ниже.','Drag the framed detail. Resize or rotate below.'):decorated?this.text('Готово? Сохрани сквиш, чтобы помять его.','Save your squishy, then squeeze it.'):this.text('Добавь лицо, стикер или аксессуар.','Add a face, sticker or accessory.');
      }
    }
    if(stage!=='mixins')this.fillingVisit=false;
    if(shell.dataset.tryOn!=='true'&&stage==='mixins'&&(!this.state.fillingsSeen||this.fillingVisit)){this.fillingVisit=true;step='fillings';message=this.text('Выбери наполнитель и рисуй на сквише.','Pick a filling and draw on your squishy.');if(!this.state.fillingsSeen)this.change({fillingsSeen:true});}
    if(message&&shell.dataset.saveFailed==='true'){step='save-error';target='.craft-actions [data-action="save"]';message=this.text('Не удалось сохранить. Попробуй ещё раз.','Save failed. Try again.');}
    if(message){
      const hint=this.root.querySelector<HTMLElement>('[data-sandbox-hint]');
      if(hint&&message!==this.lastHint){if(hint.dataset.guideOriginal===undefined||hint.dataset.guideStage!==stage){hint.dataset.guideOriginal=hint.textContent??'';hint.dataset.guideStage=stage;}hint.textContent=message;hint.dataset.guideHint=step;hint.setAttribute('aria-live','polite');shell.append(hint);this.lastHint=message;}
      for(const node of this.root.querySelectorAll('[data-guide-target]'))node.removeAttribute('data-guide-target');
      this.root.querySelector(target||'.sandbox-mixin-grid')?.setAttribute('data-guide-target','');
    }else if(this.lastHint){this.clear();}
  }
  dispose(){this.checkpoint();this.disposed=true;clearTimeout(this.timer);this.observer.disconnect();this.abort.abort();this.clear();}
}
