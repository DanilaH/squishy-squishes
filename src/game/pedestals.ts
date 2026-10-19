/** Stable room cosmetic IDs; only Standard follows the room palette. */
export const PEDESTALS = [
 {id:'standard',ru:'Классический',en:'Classic',tintable:true},
 {id:'ufo',ru:'НЛО',en:'UFO',tintable:false},
 {id:'shell',ru:'Ракушка',en:'Seashell',tintable:false},
 {id:'mushroom-stump',ru:'Грибной пень',en:'Mushroom stump',tintable:false},
 {id:'aquarium',ru:'Аквариум',en:'Aquarium',tintable:false},
 {id:'cake',ru:'Торт',en:'Cake',tintable:false},
 {id:'cauldron',ru:'Ведьминский котёл',en:'Witch’s cauldron',tintable:false},
 {id:'pumpkin',ru:'Тыквенный',en:'Pumpkin',tintable:false},
 {id:'ghost',ru:'Призрачный',en:'Ghost',tintable:false},
 {id:'crystal',ru:'Аметист',en:'Amethyst',tintable:false},
 {id:'ice',ru:'Ледяной',en:'Ice',tintable:false},
 {id:'donut',ru:'Пончик',en:'Donut',tintable:false},
 {id:'cushion-throne',ru:'Подушка-трон',en:'Throne cushion',tintable:false},
] as const;
export type PedestalId = typeof PEDESTALS[number]['id'];
export const pedestalRewardKey=(id:string):string|null=>id==='standard'||!PEDESTALS.some(p=>p.id===id)?null:`pedestal:${id}`;
export const PEDESTAL_REWARD_KEYS=PEDESTALS.flatMap(p=>{const key=pedestalRewardKey(p.id);return key?[key]:[];});
