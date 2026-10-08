/** Code-native details use the same canvas, light and deformation as existing decor. */
const TAU = Math.PI * 2;
const INK = '#503e50';
const path = (ctx: CanvasRenderingContext2D, points: readonly (readonly [number, number])[], close = false): void => {
  ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); if(close)ctx.closePath();
};
export const drawExpandedEye = (ctx: CanvasRenderingContext2D, id: string, x: number, y: number, left: boolean): boolean => {
  if(!['angry','sly','cross','sparkling'].includes(id))return false;
  ctx.save();ctx.translate(x,y);ctx.strokeStyle=INK;ctx.fillStyle=INK;ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';
  if(id==='cross') {
    path(ctx,[[-7,-7],[7,7]]);ctx.stroke();path(ctx,[[-7,7],[7,-7]]);ctx.stroke();
  } else if(id==='sparkling') {
    path(ctx,[[0,-11],[3,-3],[10,0],[3,3],[0,11],[-3,3],[-10,0],[-3,-3]],true);ctx.fill();
    ctx.fillStyle='#fff8e7';ctx.beginPath();ctx.arc(-2,-2,2,0,TAU);ctx.fill();
  } else {
    ctx.beginPath();ctx.ellipse(0,2,8,7,0,0,TAU);ctx.fillStyle='#fff9ef';ctx.fill();ctx.stroke();
    ctx.fillStyle=INK;ctx.beginPath();ctx.ellipse(id==='sly'?4:0,3,3.5,4,0,0,TAU);ctx.fill();
    const dir=left?1:-1;
    path(ctx,[[-9,-6-dir*3],[9,-6+dir*3]]);ctx.lineWidth=4;ctx.stroke();
    if(id==='sly'){path(ctx,[[-9,0],[9,0]]);ctx.lineWidth=3;ctx.stroke();}
  }
  ctx.restore();return true;
};
export const drawExpandedMouth = (ctx: CanvasRenderingContext2D,id:string,x:number,y:number):boolean => {
  if(!['tongue','fangs','flat','sewn'].includes(id))return false;
  ctx.save();ctx.translate(x,y);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=INK;ctx.fillStyle=INK;ctx.lineWidth=3;
  if(id==='flat'||id==='sewn') {
    path(ctx,[[-12,1],[12,1]]);ctx.stroke();
    if(id==='sewn')for(const dx of [-8,0,8]){path(ctx,[[dx-2,-3],[dx+2,5]]);ctx.lineWidth=2;ctx.stroke();}
  }else{
    ctx.beginPath();ctx.moveTo(-12,0);ctx.quadraticCurveTo(0,17,12,0);ctx.closePath();ctx.fill();ctx.stroke();
    if(id==='tongue'){
      ctx.beginPath();ctx.moveTo(-5,5);ctx.lineTo(-5,12);ctx.quadraticCurveTo(0,20,5,12);ctx.lineTo(5,5);ctx.closePath();ctx.fillStyle='#ed94b4';ctx.fill();ctx.lineWidth=1.5;ctx.stroke();
      path(ctx,[[0,7],[0,12]]);ctx.strokeStyle='#b66187';ctx.stroke();
    }else for(const dx of [-7,7]){path(ctx,[[dx-3,0],[dx,8],[dx+3,0]],true);ctx.fillStyle='#fff9e7';ctx.fill();}
  }
  ctx.restore();return true;
};
export const drawExpandedSticker = (ctx:CanvasRenderingContext2D,id:string,size:number):boolean => {
  if(!['candy','donut','strawberry','lightning','flame','skull','planet','eye','ghost'].includes(id))return false;
  ctx.save();ctx.scale(size/40,size/40);ctx.lineWidth=1.6;ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle='#715571';
  const fill=(color:string)=>{ctx.fillStyle=color;ctx.fill();ctx.stroke();};
  const circle=(x:number,y:number,r:number,color:string)=>{ctx.beginPath();ctx.arc(x,y,r,0,TAU);fill(color);};
  if(id==='candy'){
    path(ctx,[[-8,-6],[-18,-10],[-16,0],[-18,10],[-8,6]],true);fill('#b9a3df');
    path(ctx,[[8,-6],[18,-10],[16,0],[18,10],[8,6]],true);fill('#b9a3df');
    ctx.beginPath();ctx.ellipse(0,0,12,9,-.25,0,TAU);fill('#f5a8c8');path(ctx,[[-3,-7],[3,7]]);ctx.strokeStyle='#fff1df';ctx.lineWidth=4;ctx.stroke();
  }else if(id==='donut'){
    ctx.beginPath();ctx.arc(0,0,16,0,TAU);ctx.arc(0,0,6,0,TAU,true);fill('#e9bf8f');
    ctx.beginPath();ctx.arc(0,0,13,0,TAU);ctx.arc(0,0,7,0,TAU,true);fill('#f0a5c6');
    for(const [x,y] of [[-8,-6],[8,-6],[-8,7],[7,8]] as const){path(ctx,[[x,y],[x+3,y-1]]);ctx.strokeStyle='#fff8da';ctx.lineWidth=2;ctx.stroke();}
  }else if(id==='strawberry'){
    ctx.beginPath();ctx.moveTo(0,17);ctx.bezierCurveTo(-26,1,-14,-17,0,-10);ctx.bezierCurveTo(14,-17,26,1,0,17);fill('#e889aa');
    path(ctx,[[-10,-10],[-5,-16],[0,-12],[5,-16],[10,-10],[0,-6]],true);fill('#a7c99a');
    ctx.fillStyle='#fff5d5';for(const [x,y] of [[-6,-1],[6,-1],[-3,7],[3,7]] as const){ctx.beginPath();ctx.ellipse(x,y,1,2,0,0,TAU);ctx.fill();}
  }else if(id==='lightning'){
    path(ctx,[[2,-18],[-12,3],[-2,3],[-6,18],[13,-5],[3,-5]],true);fill('#f4d78c');
  }else if(id==='flame'){
    ctx.beginPath();ctx.moveTo(0,-18);ctx.bezierCurveTo(3,-2,17,-6,14,8);ctx.bezierCurveTo(10,22,-15,20,-14,4);ctx.quadraticCurveTo(-11,-4,-7,-9);ctx.quadraticCurveTo(-8,3,0,-18);fill('#efa68e');
    ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(13,17,0,17);ctx.quadraticCurveTo(-11,14,0,0);ctx.fillStyle='#ffe5a3';ctx.fill();
  }else if(id==='skull'){
    ctx.beginPath();ctx.ellipse(0,-3,15,13,0,0,TAU);fill('#eee8df');ctx.beginPath();ctx.roundRect(-9,5,18,11,3);fill('#eee8df');
    circle(-6,-3,4,INK);circle(6,-3,4,INK);path(ctx,[[-2,5],[0,2],[2,5]],true);fill(INK);
    for(const x of [-4,4]){path(ctx,[[x,10],[x,16]]);ctx.stroke();}
  }else if(id==='planet'){
    circle(0,0,12,'#bba6df');ctx.save();ctx.rotate(-.4);ctx.beginPath();ctx.ellipse(0,0,20,6,0,0,TAU);ctx.strokeStyle='#e5bd85';ctx.lineWidth=4;ctx.stroke();ctx.restore();circle(-5,-5,2,'#ede1f5');
  }else if(id==='eye'){
    ctx.beginPath();ctx.moveTo(-18,0);ctx.quadraticCurveTo(0,-20,18,0);ctx.quadraticCurveTo(0,20,-18,0);fill('#fff6ed');circle(0,0,8,'#a6cebd');circle(0,0,4,INK);circle(-2,-3,1.5,'#fff');
  }else{
    ctx.beginPath();ctx.moveTo(-13,17);ctx.lineTo(-13,-2);ctx.bezierCurveTo(-13,-22,13,-22,13,-2);ctx.lineTo(13,17);ctx.lineTo(6,12);ctx.lineTo(0,17);ctx.lineTo(-6,12);ctx.closePath();fill('#f2edf5');
    circle(-5,-3,2.5,INK);circle(5,-3,2.5,INK);ctx.beginPath();ctx.ellipse(0,5,2,3,0,0,TAU);ctx.fillStyle=INK;ctx.fill();
  }
  ctx.restore();return true;
};
export const drawExpandedAccessory = (ctx:CanvasRenderingContext2D,id:string,width:number,height:number,icon=false):boolean => {
  if(!['antennae','mushroom-hat','witch-hat','halo','eye-patch','bolt'].includes(id))return false;
  ctx.save();ctx.scale(width/180,height/120);if(icon)ctx.translate(0,-8);
  ctx.lineWidth=2;ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle='#806480';ctx.shadowColor='rgba(92,66,107,.18)';ctx.shadowBlur=3;ctx.shadowOffsetY=2;
  const puff=(p:Path2D,top:string,bottom:string)=>{const g=ctx.createLinearGradient(55,25,120,112);g.addColorStop(0,top);g.addColorStop(1,bottom);ctx.fillStyle=g;ctx.fill(p);ctx.stroke(p);};
  const oval=(x:number,y:number,rx:number,ry:number)=>{const p=new Path2D();p.ellipse(x,y,rx,ry,0,0,TAU);return p;};
  if(id==='antennae'){
    ctx.strokeStyle='#a990bb';ctx.lineWidth=7;
    for(const dir of [-1,1]){ctx.beginPath();ctx.moveTo(90+dir*20,110);ctx.bezierCurveTo(90+dir*18,86,90+dir*48,75,90+dir*44,47);ctx.stroke();puff(oval(90+dir*44,43,13,13),'#f3edff','#b2a1d8');}
  }else if(id==='mushroom-hat'){
    puff(oval(90,105,57,10),'#fff4e2','#cfb3c8');puff(new Path2D('M 27 100 C 24 36 153 36 153 100 Q 90 115 27 100 Z'),'#ffdedb','#d67e9d');
    for(const [x,y,r] of [[61,80,9],[94,61,10],[121,87,7]] as const)puff(oval(x,y,r,r*.65),'#fffaf0','#eadbcf');
  }else if(id==='witch-hat'){
    puff(new Path2D('M 53 96 L 83 22 Q 100 34 120 26 L 107 46 L 129 96 Z'),'#d6c5e8','#8d75ac');
    puff(new Path2D('M 53 86 L 127 86 L 131 99 L 49 99 Z'),'#f5dca0','#d5b177');puff(oval(90,106,65,10),'#c8b3df','#8d75ac');
  }else if(id==='halo'){
    ctx.strokeStyle='#b99b64';ctx.lineWidth=9;ctx.beginPath();ctx.ellipse(90,75,50,13,-.1,0,TAU);ctx.stroke();ctx.strokeStyle='#ffe9a5';ctx.lineWidth=5;ctx.stroke();
  }else if(id==='eye-patch'){
    ctx.strokeStyle='#8d7b98';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(29,48);ctx.lineTo(149,97);ctx.stroke();
    puff(new Path2D('M 41 55 Q 63 48 81 57 L 80 75 Q 62 95 43 74 Z'),'#c4b0d5','#806b99');
    ctx.strokeStyle='#e4d8ee';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(49,59);ctx.lineTo(72,60);ctx.stroke();
  }else{
    puff(new Path2D('M 78 60 L 111 60 L 111 77 L 78 77 Z'),'#eceaf7','#a7a1bc');
    puff(new Path2D('M 105 49 L 132 49 L 143 60 L 143 77 L 132 88 L 105 88 Z'),'#e7e3f3','#9992af');
    ctx.strokeStyle='#7c758f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(122,58);ctx.lineTo(128,78);ctx.stroke();
  }
  ctx.restore();return true;
};
