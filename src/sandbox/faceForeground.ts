import { getShapeContours, type ShapeDefinition } from '../game/shapes';

/** Small transparent face tiles follow the SAME projected mesh, above free accessories. */
export const drawFaceForeground = (context:CanvasRenderingContext2D, source:HTMLCanvasElement,
  shape:ShapeDefinition, project:(u:number,v:number)=>{x:number;y:number}):void=>{
  const bytes=source.getContext('2d')!.getImageData(0,0,256,256).data;
  context.save();context.beginPath();
  for(const contour of getShapeContours(shape)){
    contour.forEach((point,index)=>{const p=project((point.x+1)/2,(point.y+1)/2);if(index===0)context.moveTo(p.x,p.y);else context.lineTo(p.x,p.y);});context.closePath();
  }
  context.clip();
  const triangle=(uv:readonly(readonly[number,number])[])=>{
    const [a,b,c]=uv.map(([u,v])=>({sx:u*256,sy:(1-v)*256,...project(u,v)}));
    if(!a||!b||!c)return;
    const sx1=b.sx-a.sx,sy1=b.sy-a.sy,sx2=c.sx-a.sx,sy2=c.sy-a.sy,det=sx1*sy2-sx2*sy1;
    const dx1=b.x-a.x,dy1=b.y-a.y,dx2=c.x-a.x,dy2=c.y-a.y;
    const aa=(dx1*sy2-dx2*sy1)/det,bb=(dy1*sy2-dy2*sy1)/det,cc=(dx2*sx1-dx1*sx2)/det,dd=(dy2*sx1-dy1*sx2)/det;
    context.save();context.beginPath();context.moveTo(a.x,a.y);context.lineTo(b.x,b.y);context.lineTo(c.x,c.y);context.closePath();context.clip();
    context.transform(aa,bb,cc,dd,a.x-aa*a.sx-cc*a.sy,a.y-bb*a.sx-dd*a.sy);context.drawImage(source,0,0);context.restore();
  };
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    let painted=false;
    for(let py=y*16;py<(y+1)*16&&!painted;py++)for(let px=x*16;px<(x+1)*16;px++)if(bytes[(py*256+px)*4+3]){painted=true;break;}
    if(!painted)continue;
    const u=x/16,v=1-(y+1)/16,u1=(x+1)/16,v1=1-y/16;
    triangle([[u,v],[u,v1],[u1,v]]);triangle([[u1,v],[u,v1],[u1,v1]]);
  }
  context.restore();
};
