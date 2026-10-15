import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import sharp from 'sharp';

// Production matte extraction, followed by the shared canonical asset pipeline.
// The authored palette contains no green: the matte also fills enclosed web gaps.
const sourceRoot='assets-src/halloween';
const entries=JSON.parse(await readFile(`${sourceRoot}/source-manifest.json`,'utf8')).assets;
const temporary=join(tmpdir(),'squishy-halloween-cutouts');await mkdir(temporary,{recursive:true});
const prepared=[];
for(const entry of entries){
  const source=`${sourceRoot}/${entry.source}`,bytes=await readFile(source);
  const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const bg=data[1];if(bg<180||data[0]>30||data[2]>30)throw Error(`Unexpected matte: ${source}`);
  for(let i=0;i<data.length;i+=4){
    if(data[i+1]>150 && data[i+1]-Math.max(data[i],data[i+2])>60){data[i]=data[i+1]=data[i+2]=data[i+3]=0;continue;}
    const a=Math.min(1,Math.max(0,1-Math.max(0,data[i+1]-Math.max(data[i],data[i+2]))/bg));
    if(a<.025){data[i]=data[i+1]=data[i+2]=data[i+3]=0;continue;}
    data[i]=Math.min(255,Math.round(data[i]/a));
    data[i+1]=Math.max(0,Math.min(255,Math.round((data[i+1]-(1-a)*bg)/a)));
    data[i+2]=Math.min(255,Math.round(data[i+2]/a));data[i+3]=Math.round(a*255);
  }
  const cutout=join(temporary,`${entry.id}.png`);
  await sharp(data,{raw:info}).png().toFile(cutout);
  const room=['pumpkin-lamp','ghost-picture'].includes(entry.id);
  if(room){await writeFile(`assets-src/room/${entry.id}.png`,await readFile(cutout));}
  const outputs=entry.id==='sticker-bone'?[entry.id,'filler-bones']:entry.id==='filler-candy'?['filler-candies']:[entry.id];
  for(const id of outputs){
    const canvas=room?300:id.startsWith('filler-')?128:id.startsWith('sticker-')?256:512;
    const output=`public/assets/${room?'room':'art-quality'}/${id}.webp`;
    const result=spawnSync(process.execPath,['scripts/prepare-image.mjs',cutout,output,`--canvas=${canvas}`,`--padding=${room?8:16}`,'--background=preserve','--webp-only','--webp-quality=84','--force'],{encoding:'utf8'});
    if(result.status!==0)throw Error(result.stderr+result.stdout);
    prepared.push({id,source,sourceSha256:createHash('sha256').update(bytes).digest('hex'),output,bytes:(await readFile(output)).length,hasAvifCompanion:false});
  }
}
for(const script of ['scripts/measure-quality-art.mjs','scripts/prepare-room-assets.mjs']){const result=spawnSync(process.execPath,[script,...(script.includes('prepare-room')?['pumpkin-lamp','ghost-picture']:[])],{encoding:'utf8'});if(result.status!==0)throw Error(result.stderr+result.stdout);}
for(const asset of prepared){const bytes=await readFile(asset.output);asset.bytes=bytes.length;asset.runtimeSha256=createHash('sha256').update(bytes).digest('hex');}
await writeFile(`${sourceRoot}/runtime-manifest.json`,JSON.stringify(prepared,null,2)+'\n');
console.log(`Prepared ${prepared.length} Halloween runtime assets, ${prepared.reduce((n,x)=>n+x.bytes,0)} bytes`);
