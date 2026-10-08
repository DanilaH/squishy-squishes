import { createAppearanceStroke, type AppearancePoint, type AppearanceStrokeV1 } from './appearance';

export const PAINT_PATTERNS = [
  { id: 'spots', en: 'Spots', ru: 'Пятна', icon: '●' },
  { id: 'stripes', en: 'Melon stripes', ru: 'Полоски арбуза', icon: '≋' },
  { id: 'patches', en: 'Patches', ru: 'Заплатки', icon: '▧' },
  { id: 'seams', en: 'Plush seams', ru: 'Швы', icon: '┼' },
] as const;
export type PaintPatternId = typeof PAINT_PATTERNS[number]['id'];

/** Patterns are ordinary pigment strokes: old V3 readers understand every byte. */
export const createPaintPattern = (id: PaintPatternId, color: number): readonly AppearanceStrokeV1[] => {
  const result: AppearanceStrokeV1[] = [];
  const line = (size: number, points: readonly AppearancePoint[], ink=color) => result.push(createAppearanceStroke(0,ink,size,points));
  const lighter = [16,8,0].reduce((rgb,shift) => rgb | Math.round(((color>>shift)&255)*.60+255*.40)<<shift,0);
  if(id==='stripes')for(let i=0;i<8;i++) {
    line(8+(i%3)*2,Array.from({length:49},(_,j)=>({u:.06+i*.126+Math.sin(j*.2+i*1.7)*.018,v:j/48})));
  }else if(id==='spots')for(let i=0;i<17;i++) {
    const u=.09+i%5*.19+Math.sin(i*3)*.025,v=.10+Math.floor(i/5)*.25;
    const radius=.04+(i%3)*.013;
    line(7,Array.from({length:121},(_,j)=>{const a=j/120*Math.PI*12,r=radius*j/120*(.83+.17*Math.sin(a*3+i));return {u:u+Math.cos(a)*r,v:v+Math.sin(a)*r};}));
  }else if(id==='patches')for(const [u,v,r] of [[.22,.64,.13],[.72,.35,.11],[.61,.82,.085]] as const) {
    const pts:AppearancePoint[]=[];
    for(let row=0;row<10;row++){const y=v-r+row*r*2/9;pts.push({u:u+(row%2?r:-r),v:y},{u:u+(row%2?-r:r),v:y});}
    line(10,pts);
    for(const dir of [-1,1])for(let j=0;j<6;j++){
      const d=-r+j*r*2/5;
      line(2,[{u:u+d-.007,v:v+dir*r-.011},{u:u+d+.007,v:v+dir*r+.011}],lighter);
      line(2,[{u:u+dir*r-.011,v:v+d-.007},{u:u+dir*r+.011,v:v+d+.007}],lighter);
    }
  }else{
    const seam=(v:number)=>.47+Math.sin(v*Math.PI*2)*.08;
    line(2,Array.from({length:65},(_,i)=>({u:seam(i/64),v:i/64})));
    for(let i=0;i<25;i++){const v=.02+i*.04,u=seam(v);line(3,[{u:u-.018,v:v-.010},{u:u+.018,v:v+.010}]);}
  }
  return result;
};
