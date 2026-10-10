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
      if(shell.dataset.tryOn==='true'){step='try';target='[data-action="try-return"]';message=this.text('Это примерка: помни сквиш и вернись к крафту, чтобы продолжить.','Try it out: squeeze your squishy, then return to craft to keep creating.');}
      else if(this.saved&&stage==='squeeze'){
        if(Number(shell.dataset.sandboxSqueezes)>this.savedSqueezes&&!this.squeezed){this.squeezed=true;this.change({status:'done'});}
        step=this.squeezed?'room':'squeeze';target=this.squeezed?'[data-action="home"]':'[data-sandbox-canvas]';
        message=this.squeezed?this.text('Готово! Вернись в комнату — твой сквиш уже на постаменте.','All done! Back to room — your squishy now lives there.'):this.text('Зажми и потяни сквиш, чтобы помять его. Он уже сохранён.','Press and pull your squishy to squeeze it. It is already saved.');
      }else if(stage==='shape'){
        step='base';target='[data-craft-section="paint"]';message=this.text('Это твой первый сквиш. Выбери форму или оставь эту, затем попробуй раскраску.','Your first squishy. Pick a shape or keep this one, then try Paint.');
      }else if(stage==='paint'){
        const painted=draft.appearance.strokes.length>0;
        if(painted&&!this.state.painted){this.change({painted:true});}
        step=painted?'undo':'paint';target=painted?'[data-craft-section="decor"]':'[data-sandbox-canvas]';
        const canUndo=!this.root.querySelector<HTMLButtonElement>('.craft-actions [data-action="draft-undo"]')?.disabled;
        message=painted?(canUndo?this.text('Мазок можно отменить кнопкой ↶. Теперь попробуй украшения.','Undo a stroke with ↶. Next, try Decor.'):this.text('Твоя раскраска восстановлена. Можно добавить ещё цвета или попробовать украшения.','Your painting is restored. Add more color or try Decor.')):this.text('Выбери цвет и проведи пальцем по сквишу. Можно рисовать как угодно.','Pick a color and draw on your squishy. Make it your way.');
      }else if(stage==='decor'){
        const decorated=Boolean(draft.decor.eyes||draft.decor.mouth||draft.decor.accessories?.length||draft.decor.stickers.length||draft.decor.accessory);
        if(decorated&&!this.state.decorated){this.change({decorated:true});}
        const selected=this.root.querySelector<HTMLElement>('[data-accessory-selection]:not([hidden]),[data-sticker-selection]:not([hidden])');
        step=selected?'arrange':decorated?'save':'decor';target=decorated?'.craft-actions [data-action="save"]':'.sandbox-decor-tabs';
        message=selected?this.text('Рамка — выбранная деталь. Тяни её; размер и поворот — ниже. Сохрани, когда готово.','The frame marks your detail. Drag it; size and rotation are below. Save when ready.'):decorated?this.text('Сохрани сквиш — он попадёт в коллекцию, и его можно будет помять.','Save your squishy to keep it in your collection and squeeze it.'):this.text('Добавь лицо, стикер или аксессуар. Разделы можно менять в любом порядке.','Add a face, sticker or accessory. You can switch sections in any order.');
      }
    }
    if(stage!=='mixins')this.fillingVisit=false;
    if(shell.dataset.tryOn!=='true'&&stage==='mixins'&&(!this.state.fillingsSeen||this.fillingVisit)){this.fillingVisit=true;step='fillings';message=this.text('Выбери наполнитель и проведи по сквишу. Размер и плотность — в настройках.','Choose a filling and draw on your squishy. Adjust size and density in Settings.');if(!this.state.fillingsSeen)this.change({fillingsSeen:true});}
    if(message&&shell.dataset.saveFailed==='true'){step='save-error';target='.craft-actions [data-action="save"]';message=this.text('Не удалось сохранить. Черновик здесь — попробуй ещё раз.','Save failed. Your draft is here — try again.');}
    if(message){
      const hint=this.root.querySelector<HTMLElement>('[data-sandbox-hint]');
      if(hint&&message!==this.lastHint){if(hint.dataset.guideOriginal===undefined||hint.dataset.guideStage!==stage){hint.dataset.guideOriginal=hint.textContent??'';hint.dataset.guideStage=stage;}hint.textContent=message;hint.dataset.guideHint=step;shell.append(hint);this.lastHint=message;}
      for(const node of this.root.querySelectorAll('[data-guide-target]'))node.removeAttribute('data-guide-target');
      this.root.querySelector(target||'.sandbox-mixin-grid')?.setAttribute('data-guide-target','');
    }else if(this.lastHint){this.clear();}
  }
  dispose(){this.checkpoint();this.disposed=true;clearTimeout(this.timer);this.observer.disconnect();this.abort.abort();this.clear();}
}
