import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import sharp from 'sharp';
const manifest=JSON.parse(await readFile('assets-src/pedestals/source-manifest.json','utf8'));
const scratch=await mkdtemp(join(tmpdir(),'squishy-pedestals-'));
const hash=b=>createHash('sha256').update(b).digest('hex');
await mkdir('public/assets/pedestals',{recursive:true});
const outputs=[];
try{
 for(const asset of manifest.assets){
  const source=`assets-src/pedestals/${asset.id}.png`,bytes=await readFile(source);
  const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  // Discard disconnected alpha speckles from the generator, retaining the sprite.
  const count=info.width*info.height,seen=new Uint8Array(count),queue=new Int32Array(count);let largest=[];
  for(let start=0;start<count;start++){
   if(seen[start]||data[start*4+3]<16)continue;
   let head=0,tail=1;queue[0]=start;seen[start]=1;
   while(head<tail){const p=queue[head++],x=p%info.width,y=Math.floor(p/info.width);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
     const nx=x+dx,ny=y+dy;if(nx<0||nx>=info.width||ny<0||ny>=info.height)continue;
     const n=ny*info.width+nx;if(!seen[n]&&data[n*4+3]>=16){seen[n]=1;queue[tail++]=n;}
    }
   }
   if(tail>largest.length)largest=Array.from(queue.subarray(0,tail));
  }
  if(largest.length<count*.05)throw Error(`Empty pedestal ${asset.id}`);
  const keep=new Uint8Array(count);for(const p of largest){const x=p%info.width,y=Math.floor(p/info.width);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<info.width&&ny>=0&&ny<info.height)keep[ny*info.width+nx]=1;}}
  for(let p=0;p<count;p++)if(!keep[p])data[p*4+3]=0;
  const cutout=join(scratch,`${asset.id}.png`),canonical=join(scratch,`${asset.id}.webp`);
  await sharp(data,{raw:info}).png().toFile(cutout);
  const run=spawnSync(process.execPath,['scripts/prepare-image.mjs',cutout,canonical,'--canvas=640','--padding=8','--webp-quality=80','--background=preserve','--webp-only'],{encoding:'utf8'});
  if(run.status!==0)throw Error(run.stderr+run.stdout);
  // Normalize to one camera frame after the shared pipeline's alpha validation.
  const output=`public/assets/pedestals/${asset.id}.webp`;
  await sharp(canonical).trim({threshold:8}).resize(624,348,{fit:'fill'}).extend({top:8,bottom:8,left:8,right:8,background:{r:0,g:0,b:0,alpha:0}}).webp({quality:74,alphaQuality:100}).toFile(output);
  const runtime=await readFile(output);
  outputs.push({id:asset.id,source,sourceSha256:hash(bytes),output,sha256:hash(runtime),bytes:runtime.length,width:640,height:364,hasAvifCompanion:false});
 }
 await writeFile('assets-src/pedestals/runtime-manifest.json',JSON.stringify(outputs,null,2)+'\n');
 console.log(`Prepared ${outputs.length} pedestals: ${outputs.reduce((n,a)=>n+a.bytes,0)} bytes`);
}finally{await rm(scratch,{recursive:true,force:true});}
