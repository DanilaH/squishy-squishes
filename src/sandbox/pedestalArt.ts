import {PEDESTALS} from '../game/pedestals';
export const pedestalUrl=(id:string):string=>`${import.meta.env.BASE_URL}assets/pedestals/${id}.webp`;
const decoded=new Map<string,HTMLImageElement>();
let loading:Promise<void>|null=null;
export const pedestalReady=(id:string):boolean=>id==='standard'||decoded.has(id);
/** Required room art is decoded before Library becomes interactive. */
export const preloadPedestals=():Promise<void>=>loading??=Promise.allSettled(PEDESTALS.filter(p=>p.id!=='standard'&&!decoded.has(p.id)).map(async p=>{
 const image=new Image();image.src=pedestalUrl(p.id);await image.decode();
 if(!image.naturalWidth||!image.naturalHeight)throw Error(`Empty pedestal: ${p.id}`);
 decoded.set(p.id,image);
})).then(results=>{if(results.some(r=>r.status==='rejected'))throw Error('Some pedestals could not load');}).catch(error=>{loading=null;throw error;});
