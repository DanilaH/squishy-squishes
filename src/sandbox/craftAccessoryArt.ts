import type { AccessoryId } from './decor';

const NEW_IDS = new Set<AccessoryId>(['glasses','headphones','bucket-hat','petal-flower','leaves','butterfly','cream','cherry','heart-patch','handbag','wings']);
/** Code-native padded forms share one logical canvas and light, with no late asset requests. */
export const drawCraftAccessory = (ctx:CanvasRenderingContext2D,id:AccessoryId,width:number,height:number,icon=false):boolean=>{
  if(!NEW_IDS.has(id))return false;
  ctx.save();ctx.scale(width/180,height/120);
  if(icon){ctx.translate(0,-8);}
  ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=2;
  ctx.shadowColor='rgba(103,66,106,.20)';ctx.shadowBlur=3;ctx.shadowOffsetY=2;
  const puff=(path:Path2D,colors:readonly[string,string,string],stroke=true)=>{
    const gradient=ctx.createLinearGradient(35,25,118,116);gradient.addColorStop(0,colors[0]);gradient.addColorStop(.48,colors[1]);gradient.addColorStop(1,colors[2]);
    ctx.fillStyle=gradient;ctx.fill(path);if(stroke){ctx.strokeStyle='rgba(104,75,111,.30)';ctx.stroke(path);}
  };
  const ellipse=(x:number,y:number,rx:number,ry:number,angle=0)=>{const p=new Path2D();p.ellipse(x,y,rx,ry,angle,0,Math.PI*2);return p;};
  const shine=(x:number,y:number,rx=8,ry=3)=>{ctx.save();ctx.shadowColor='transparent';ctx.fillStyle='rgba(255,255,255,.76)';ctx.fill(ellipse(x,y,rx,ry,-.35));ctx.restore();};
  const pink=['#fff0f2','#f4adc9','#c971a4'] as const,mint=['#eefbe0','#a8d0a0','#669b85'] as const,pearl=['#fffdf1','#e6dfed','#aaa3c9'] as const;
  if(id==='glasses'){
    ctx.shadowColor='transparent';ctx.strokeStyle='#ad85b5';ctx.lineWidth=5;
    for(const x of [63,117]){ctx.beginPath();ctx.ellipse(x,69,22,21,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#f5ddea';ctx.lineWidth=2;ctx.stroke();ctx.strokeStyle='#ad85b5';ctx.lineWidth=5;}
    ctx.beginPath();ctx.moveTo(85,67);ctx.quadraticCurveTo(90,60,95,67);ctx.moveTo(40,67);ctx.lineTo(30,59);ctx.moveTo(140,67);ctx.lineTo(150,59);ctx.stroke();
    shine(51,54,5,2);shine(105,54,5,2);
  }else if(id==='headphones'){
    ctx.strokeStyle='#a989c0';ctx.lineWidth=13;ctx.beginPath();ctx.arc(90,80,44,Math.PI,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#ead8f3';ctx.lineWidth=7;ctx.stroke();
    for(const x of [46,134]){puff(ellipse(x,83,14,25),pearl);puff(ellipse(x,83,9,17),pink);shine(x-4,73,3,7);}
  }else if(id==='bucket-hat'){
    puff(new Path2D('M 51 95 Q 53 70 61 49 Q 90 35 120 49 Q 128 70 129 95 Z'),mint);
    puff(new Path2D('M 46 83 Q 89 97 134 83 L 151 104 Q 90 123 29 104 Z'),mint);
    ctx.strokeStyle='rgba(72,124,103,.30)';ctx.beginPath();ctx.moveTo(53,84);ctx.quadraticCurveTo(90,97,127,84);ctx.stroke();shine(73,55,12,4);
    puff(ellipse(113,77,9,8),pink);
  }else if(id==='petal-flower'){
    for(let i=0;i<5;i++){const angle=i*Math.PI*2/5-Math.PI/2;puff(ellipse(90+Math.cos(angle)*21,76+Math.sin(angle)*21,19,15,angle),pink);}
    puff(ellipse(90,76,12,12),['#fff8d2','#edce87','#bf9b63']);shine(86,70,4,2);
  }else if(id==='leaves'){
    for(const dir of [-1,1]){ctx.save();if(dir===1){ctx.translate(180,0);ctx.scale(-1,1);}puff(new Path2D('M 58.5 110 C 20 102 16 63 30 42 C 63 52 76 84 58.5 110 Z'),mint);
      ctx.strokeStyle='rgba(239,253,222,.75)';ctx.beginPath();ctx.moveTo(58,107);ctx.quadraticCurveTo(40,78,31,49);ctx.stroke();ctx.restore();}
  }else if(id==='butterfly'){
    for(const dir of [-1,1]){ctx.save();ctx.translate(90,82);ctx.scale(dir,1);puff(new Path2D('M 0 0 C 4 -48 55 -51 43 -15 C 65 4 29 33 0 9 Z'),['#fceaff','#cbb0e7','#987dc1']);shine(26,-26);ctx.restore();}
    puff(ellipse(90,78,6,22),pink);ctx.strokeStyle='#b17fa4';ctx.beginPath();ctx.moveTo(88,57);ctx.quadraticCurveTo(81,46,75,49);ctx.moveTo(92,57);ctx.quadraticCurveTo(99,46,105,49);ctx.stroke();
  }else if(id==='cream'){
    puff(new Path2D('M 46 110 C 27 95 45 81 58 80 C 49 66 66 55 75 54 C 67 44 91 31 99 23 C 106 47 119 52 112 65 C 134 66 137 83 127 89 C 154 100 138 112 123 114 Z'),['#fffef2','#f4e9de','#cfb9ce']);
    ctx.shadowColor='transparent';ctx.strokeStyle='rgba(167,143,168,.34)';ctx.beginPath();ctx.moveTo(59,82);ctx.quadraticCurveTo(95,95,125,88);ctx.moveTo(76,55);ctx.quadraticCurveTo(90,71,111,65);ctx.stroke();shine(70,94,12,4);shine(86,47,4,8);
  }else if(id==='cherry'){
    ctx.strokeStyle='#729878';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(87,67);ctx.quadraticCurveTo(88,43,104,28);ctx.stroke();
    puff(new Path2D('M 100 38 Q 107 17 132 27 Q 123 45 100 38 Z'),mint);
    puff(new Path2D('M 90 68 C 61 49 51 92 72 109 C 84 116 96 116 108 104 C 127 77 111 55 90 68 Z'),['#ffe7ee','#ed779e','#b4487e']);shine(75,76,7,4);
  }else if(id==='heart-patch'){
    const p=new Path2D();p.roundRect(43,52,94,44,13);puff(p,['#fff4dc','#e4caa5','#bd9c96']);
    ctx.setLineDash([2,4]);ctx.strokeStyle='rgba(137,102,109,.38)';ctx.stroke(p);ctx.setLineDash([]);
    puff(new Path2D('M 90 86 C 61 73 73 53 90 65 C 108 53 120 73 90 86 Z'),pink);shine(79,69,4,2);
  }else if(id==='handbag'){
    ctx.strokeStyle='#aa86b1';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(38,26);ctx.quadraticCurveTo(105,43,121,88);ctx.stroke();ctx.strokeStyle='#f7dce9';ctx.lineWidth=3;ctx.stroke();
    const p=new Path2D();p.roundRect(65,70,65,42,13);puff(p,pink);
    puff(new Path2D('M 67 73 Q 97 91 128 73 L 123 88 Q 96 103 71 87 Z'),pink);
    puff(ellipse(98,91,5,5),['#fff9d1','#e5c47d','#b69a63']);shine(80,98,9,3);
  }else if(id==='wings'){
    for(const dir of [-1,1]){ctx.save();if(dir===1){ctx.translate(180,0);ctx.scale(-1,1);}puff(new Path2D('M 58.5 110 C 41 109 13 91 18 76 C 3 65 15 47 23 51 C 15 34 30 24 39 37 C 42 17 60 20 60 42 C 79 48 72 72 66 88 Z'),pearl);
      ctx.shadowColor='transparent';ctx.strokeStyle='rgba(159,142,187,.42)';ctx.beginPath();ctx.moveTo(55,100);ctx.quadraticCurveTo(35,83,25,69);ctx.moveTo(58,91);ctx.quadraticCurveTo(43,65,34,48);ctx.moveTo(62,79);ctx.quadraticCurveTo(58,56,53,40);ctx.stroke();shine(37,52,5,3);ctx.restore();}
  }
  ctx.restore();return true;
};
