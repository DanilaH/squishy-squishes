import{B as e,Dt as t,Et as n,H as r,K as i,N as a,P as o,Tt as s,W as c,ft as l,j as u,m as d,nt as f,ot as p}from"./phaser-pages-zAMwFjxU.js";var m=(e,r=l)=>{let a=document.createElement(`canvas`);a.width=512,a.height=512;let s=a.getContext(`2d`);if(!s)throw Error(`Unlit volume albedo context unavailable`);let c=n(e.shapeId),u=new Path2D;for(let e of t(c))e.forEach((e,t)=>{let n=256+e.x*220.16,r=259.6864-e.y*185.34400000000002;t===0?u.moveTo(n,r):u.lineTo(n,r)}),u.closePath();let d=o(`milk`),f=e=>`rgb(${e.map(e=>Math.round(e*255)).join(`,`)})`,m=s.createLinearGradient(0,0,0,512);m.addColorStop(0,f(d.high)),m.addColorStop(1,f(d.low)),s.fillStyle=m,s.fillRect(0,0,512,512);let h=document.createElement(`canvas`);h.width=512,h.height=512;let g=h.getContext(`2d`);if(!g)throw Error(`Unlit volume authored-art context unavailable`);return g.setTransform(2,0,0,2,0,0),p(g,e.appearance,{materialId:e.materialId,shapeId:e.shapeId}),i(g,e.decor,c,r),s.save(),s.clip(u),s.drawImage(h,0,0),s.restore(),a.dataset.volumeRenderer=`neutral-albedo-source-512`,a},h=(e,t)=>{let r=document.createElement(`canvas`);r.width=t.width,r.height=t.height;let i=r.getContext(`2d`);if(!i)throw Error(`2.5D thickness canvas unavailable`);let a=r.width,s=r.height,c=a*.5,l=s*.5+s*.5*.8*.018,u=a*.5*.8*1.075,d=s*.5*.8*.905,f=.955,p=n(e.shapeId).boundary.map(e=>({x:c+e.x*u,y:l-e.y*d,bx:c+e.x*u*f+21,by:l-e.y*d*f+17})),m=new Path2D,h=new Path2D;p.forEach((e,t)=>{t===0?(m.moveTo(e.x,e.y),h.moveTo(e.bx,e.by)):(m.lineTo(e.x,e.y),h.lineTo(e.bx,e.by))}),m.closePath(),h.closePath(),i.save(),i.shadowColor=`rgba(76, 49, 34, 0.23)`,i.shadowBlur=15,i.shadowOffsetX=3,i.shadowOffsetY=8,i.fillStyle=`#ad9279`,i.fill(h),i.restore();let g=o(`milk`).low,_=e=>Math.max(0,Math.min(255,Math.round(e)));for(let e=0;e<p.length;e+=1){let t=p[(e+1)%p.length],n=p[e],r=t.x-n.x,a=t.y-n.y,o=Math.hypot(r,a);if(o<.001)continue;let c=-a/o,l=r/o;if((c*21+l*17)/Math.hypot(21,17)<=.025)continue;let u=.65+.22*Math.max(0,c*-.36+l*-.38+.55)+.07*(1-(n.y+t.y)/(2*s)),d=g.map(e=>_(e*255*u)),f=new Path2D;f.moveTo(n.x,n.y),f.lineTo(t.x,t.y),f.lineTo(t.bx,t.by),f.lineTo(n.bx,n.by),f.closePath(),i.fillStyle=`rgb(${d[0]},${d[1]},${d[2]})`,i.fill(f),i.lineWidth=.7,i.strokeStyle=i.fillStyle,i.stroke(f)}return i.drawImage(t,0,0),r.dataset.volumeRenderer=`pseudo-extruded-512`,r},g=512,_=256,v=.85,ee=7,y=o(`milk`),b=(e,t=0,n=1)=>Math.max(t,Math.min(n,e)),te=new Map,x=(e,t,n)=>{let r=b(t)*_-.5,i=b(n)*_-.5,a=Math.max(0,Math.min(255,Math.floor(r))),o=Math.max(0,Math.min(255,Math.floor(i))),s=Math.min(255,a+1),c=Math.min(255,o+1),l=b(r-a),u=b(i-o),d=o*_,f=c*_,p=e[d+a]*(1-l)+e[d+s]*l,m=e[f+a]*(1-l)+e[f+s]*l;return(p*(1-u)+m*u)/255},S=()=>{let e=document.createElement(`canvas`);return e.width=g,e.height=g,e},C=(t,r)=>{let o=S(),l=o.getContext(`2d`,{willReadFrequently:!0});if(!l)throw Error(`Canvas2D unavailable for volume probe`);let u=l.createImageData(g,g),d=S().getContext(`2d`,{willReadFrequently:!0});if(!d)throw Error(`Appearance canvas unavailable for volume probe`);d.setTransform(2,0,0,2,0,0),p(d,t.appearance,{shapeId:t.shapeId,materialId:t.materialId}),i(d,t.decor,n(t.shapeId));let f=d.getImageData(0,0,g,g).data,m=te.get(t.shapeId);m||(m=s(n(t.shapeId),_,v),te.set(t.shapeId,m));let h=a(t.materialId),C=g*.5*.8*1.075,w=g*.5*.8*.905,T=259.6864,E=4/_,D=-.44,O=-.4,k=.81,A=Math.hypot(D,O,k),j=[D/A,O/A,k/A],M=[-.25,-.23,.94],N=u.data;for(let e=0;e<g;e+=1){let t=.5-(e+.5-T)/(2*w);if(t<0||t>1)continue;let n=b(t);for(let i=0;i<g;i+=1){let a=.5+(i+.5-g*.5)/(2*C);if(a<0||a>1)continue;let o=(.5-x(m,a,t))*v*2,s=b(o*Math.min(C,w)+.5);if(s<=0)continue;let c=(e*g+i)*4,l=f[c+3]/255,u=1,d=0;if(r){let e=x(m,a+E,t)-x(m,a-E,t),n=x(m,a,t+E)-x(m,a,t-E),r=Math.hypot(e,n),i=b(o/.54),s=r>1e-5?.66*(1-i)**.73:0,c=r>1e-5?e/r*s:0,l=r>1e-5?-n/r*s:0,f=Math.sqrt(Math.max(0,1-s*s));u=.65+.44*Math.max(0,c*j[0]+l*j[1]+f*j[2]),d=Math.max(0,c*M[0]+l*M[1]+f*M[2])**(12+h.roughness*14)*.055}else u=.92+.09*n-.09*b(o/.095,0,1)*.14;for(let e=0;e<3;e+=1){let t=(y.low[e]*(1-n)+y.high[e]*n)*255*(1-l)+f[c+e]*l;N[c+e]=Math.round(b(t*u+d*255,0,255))}N[c+3]=Math.round(s*255)}}l.putImageData(u,0,0);let P=S(),F=P.getContext(`2d`);if(!F)throw Error(`Volume output canvas unavailable`);if(r){let e=new Path2D;n(t.shapeId).boundary.forEach((t,n)=>{let r=g*.5+t.x*C,i=T-t.y*w;n===0?e.moveTo(r,i):e.lineTo(r,i)}),e.closePath(),F.save(),F.shadowColor=`rgba(87, 52, 34, 0.19)`,F.shadowBlur=10,F.shadowOffsetY=5,F.translate(2,ee);let r=F.createLinearGradient(0,100,0,480);r.addColorStop(0,`#e2cba9`),r.addColorStop(1,`#a98d72`),F.fillStyle=r,F.fill(e),F.restore()}if(t.decor.accessory){let r=c(n(t.shapeId),t.decor.accessory),i=r.headAnchor.u*2-1,a=(r.headAnchor.v+r.headSeatOffsetV)*2-1,o=128+i*98,s=128-a*98,l=document.createElement(`canvas`);l.width=360,l.height=240;let u=l.getContext(`2d`);u&&(u.setTransform(2,0,0,2,0,0),e(u,t.decor.accessory,180,120,t.shapeId),F.drawImage(l,(o-56)*2,(s-67.5)*2,224,150))}return F.drawImage(o,0,0),P.dataset.volumeRenderer=r?`sdf-relief-512`:`flat-control-512`,P},w=512,T=26,E=9,D=`#version 300 es
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aUv;
layout(location=3) in float aFront;
out vec3 vNormal;
out vec2 vUv;
out float vFront;
void main() {
  // Saved paint/decor/accessories are authored in Studio's front frame.
  // Keep Hall front-facing; curvature/normals provide the visible thickness.
  const float yaw = 0.0;
  const float pitch = 0.0;
  float cy = cos(yaw), sy = sin(yaw), cp = cos(pitch), sp = sin(pitch);
  vec3 p = vec3(aPosition.x * cy + aPosition.z * sy,
                aPosition.y, -aPosition.x * sy + aPosition.z * cy);
  vec3 n = vec3(aNormal.x * cy + aNormal.z * sy,
                aNormal.y, -aNormal.x * sy + aNormal.z * cy);
  p = vec3(p.x, p.y * cp - p.z * sp, p.y * sp + p.z * cp);
  n = vec3(n.x, n.y * cp - n.z * sp, n.y * sp + n.z * cp);
  vNormal = normalize(n);
  vUv = aUv;
  vFront = aFront;
  // Match the finished Studio mold and the existing neutral albedo UVs:
  // +7.5% horizontal stretch, -9.5% vertical stretch, -1.8% seat.
  gl_Position = vec4(p.x * 0.80 * 1.075, (p.y * 0.905 - 0.018) * 0.80, -p.z * 0.16, 1.0);
}`,O=`#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUv;
in float vFront;
uniform sampler2D uFront;
uniform vec3 uSideColor;
uniform vec3 uSheenColor;
uniform vec3 uRimColor;
uniform float uMaterialSeed;
uniform float uTranslucency;
uniform float uIridescence;
uniform float uRoughness;
uniform float uMetallic;
uniform float uPearlescence;
uniform float uCloudiness;
out vec4 outColor;

vec3 spectralColor(float phase) {
  return 0.52 + 0.48 * cos(6.2831853 * (phase + vec3(0.00, 0.33, 0.67)));
}

vec3 applyMaterial(vec3 base, vec2 uv, float edge) {
  float translucency = clamp(uTranslucency, 0.0, 1.0);
  float roughness = clamp(uRoughness, 0.0, 1.0);
  float cloudiness = clamp(uCloudiness, 0.0, 1.0);
  float interior = 1.0 - edge;
  float authoredLuma = dot(base, vec3(0.2126, 0.7152, 0.0722));
  float authoredMax = max(base.r, max(base.g, base.b));
  float authoredMin = min(base.r, min(base.g, base.b));
  float authoredChroma = authoredMax - authoredMin;
  float lightSurface = smoothstep(0.68, 0.94, authoredLuma);
  float warmSurface = lightSurface * smoothstep(0.02, 0.22, (base.r + base.g) * 0.5 - base.b);

  base *= 1.0 - translucency * (0.020 + interior * 0.040);
  base = mix(base, base * 0.965 + uSheenColor * 0.035, translucency * 0.14);
  float jellyIdentity = translucency * (1.0 - uIridescence) * (1.0 - uPearlescence) * (1.0 - uMetallic);
  float jellyColourProtection = smoothstep(0.10, 0.52, authoredChroma);
  float jellyTintWeight = jellyIdentity * mix(0.34, 0.10, jellyColourProtection);
  base = mix(base, vec3(0.34, 0.88, 0.84), jellyTintWeight);
  float jellyContrast = jellyIdentity * (0.075 + lightSurface * 0.070);
  base = clamp(vec3(0.5) + (base - vec3(0.5)) * (1.0 + jellyContrast), 0.0, 1.0);
  float gelWave = 0.5 + 0.5 * sin((uv.x * 1.72 + uv.y * 1.08 + uMaterialSeed * 2.31) * 6.2831853);
  base += uSheenColor * pow(gelWave, 5.5) * interior * translucency * 0.045;
  base += uRimColor * edge * translucency * (0.25 + lightSurface * 0.04);

  float cloudA = 0.5 + 0.5 * sin((uv.x * 2.2 + uv.y * 1.45 + uMaterialSeed * 1.7) * 6.2831853);
  float cloudB = 0.5 + 0.5 * sin((uv.x * 4.7 - uv.y * 3.1 + uMaterialSeed * 2.9) * 6.2831853);
  float cloudField = cloudA * 0.62 + cloudB * 0.38;
  float milkyWeight = cloudiness * (0.72 + cloudField * 0.18);
  vec3 milkyTint = mix(uSheenColor, vec3(1.0), 0.42 + cloudField * 0.10);
  vec3 cloudyBase = mix(base * (0.98 + cloudField * 0.025), milkyTint, 0.24 + cloudField * 0.10);
  base = mix(base, cloudyBase, clamp(milkyWeight, 0.0, 0.86));
  float marshmallowIdentity = cloudiness * roughness
    * (1.0 - clamp(uIridescence, 0.0, 1.0))
    * (1.0 - clamp(uPearlescence, 0.0, 1.0))
    * (1.0 - clamp(uMetallic, 0.0, 1.0));
  vec3 marshmallowTint = vec3(1.0, 0.925, 0.82);
  float marshmallowWrap = 1.0 - smoothstep(0.18, 0.82, length(uv - vec2(0.5)) * 1.32);
  float marshmallowLuma = dot(base, vec3(0.2126, 0.7152, 0.0722));
  vec3 marshmallowPowder = mix(vec3(marshmallowLuma), marshmallowTint, 0.50);
  float marshmallowPowderWeight = marshmallowIdentity * (0.34 + marshmallowWrap * 0.18 + lightSurface * 0.06);
  base = mix(base, marshmallowPowder, clamp(marshmallowPowderWeight, 0.0, 0.56));
  base += marshmallowTint * marshmallowIdentity * (0.030 + edge * 0.085 + marshmallowWrap * 0.025);

  float iridescence = clamp(uIridescence, 0.0, 1.0);
  float spectralPhase = uv.x * 0.78 + uv.y * 0.44 + uMaterialSeed * 0.61;
  float holoSweep = 0.5 + 0.5 * sin((uv.x * 1.58 - uv.y * 0.96 + uMaterialSeed * 0.93) * 6.2831853);
  float holoFine = 0.5 + 0.5 * sin((uv.x * 3.35 + uv.y * 1.70 + uMaterialSeed * 1.37) * 6.2831853);
  vec3 spectral = spectralColor(spectralPhase + holoFine * 0.07);
  base = mix(base, spectral, iridescence * (0.13 + holoSweep * 0.29 + edge * 0.12 + warmSurface * 0.07));
  base += vec3(0.72, 0.90, 1.0) * iridescence * warmSurface * holoSweep * 0.025;

  float pearlescence = clamp(uPearlescence, 0.0, 1.0);
  float pearlBand = 0.5 + 0.5 * sin((uv.x * 0.64 + uv.y * 0.42 + uMaterialSeed * 0.71) * 6.2831853);
  float pearlCross = 0.5 + 0.5 * sin((uv.x * 0.38 - uv.y * 0.58 + uMaterialSeed * 0.33) * 6.2831853);
  vec3 pearlRose = vec3(1.0, 0.62, 0.88);
  vec3 pearlCyan = vec3(0.48, 0.91, 1.0);
  vec3 pearlNacre = mix(pearlRose, pearlCyan, pearlBand);
  vec3 pearlSpectrum = mix(pearlNacre, spectralColor(spectralPhase * 0.42 + pearlCross * 0.12 + 0.10), 0.28);
  float pearlTintWeight = pearlescence * (0.34 + pearlBand * 0.22 + edge * 0.08 + lightSurface * 0.05);
  vec3 pearlSurface = mix(base * (0.985 + pearlCross * 0.020), pearlSpectrum, pearlTintWeight);
  base = mix(base, pearlSurface, pearlescence * (0.82 + edge * 0.08));
  float pearlSheen = pow(0.5 + 0.5 * sin(
    (uv.x * 0.92 - uv.y * 0.38 + uMaterialSeed * 0.81) * 6.2831853
  ), 3.2);
  vec3 pearlSheenColor = mix(pearlRose, pearlCyan, 0.5 + 0.5 * sin(
    (uv.x * 0.48 + uv.y * 0.36 + uMaterialSeed * 0.57) * 6.2831853
  ));
  float nacreSweep = 0.5 + 0.5 * sin(
    (uv.x * 0.72 + uv.y * 0.22 + uMaterialSeed * 0.67) * 6.2831853
  );
  vec3 nacreBand = mix(pearlRose, pearlCyan, nacreSweep);
  base = mix(base, mix(base, nacreBand, 0.56), pearlescence * (0.20 + edge * 0.06));
  base += pearlSheenColor * pearlescence * pearlSheen * (0.135 + edge * 0.024);

  float metallic = clamp(uMetallic, 0.0, 1.0);
  float metalBandA = 0.5 + 0.5 * sin((uv.y * 1.22 + uv.x * 0.28 + uMaterialSeed * 0.53) * 6.2831853);
  float metalBandB = 0.5 + 0.5 * sin((uv.y * 2.72 - uv.x * 0.19 + uMaterialSeed * 0.91) * 6.2831853);
  float metalHighlight = pow(metalBandA, mix(14.0, 4.6, roughness));
  float metalDarkBand = pow(1.0 - metalBandB, 3.4);
  vec3 metalDark = base * mix(0.48, 0.27, metalDarkBand);
  vec3 metalMid = base * (0.76 + metalBandA * 0.10);
  vec3 metalLight = mix(base * 1.10, uSheenColor, 0.24);
  vec3 metalSurface = mix(metalMid, metalDark, 0.20 + metalDarkBand * 0.45);
  metalSurface = mix(metalSurface, metalLight, metalHighlight * 0.84);
  return mix(base, metalSurface, metallic * 0.82);
}

void main() {
  vec3 geometricNormal = normalize(vNormal);
  // Concave silhouettes (especially Paw) are tessellated as radial rings. Using
  // those triangle normals for the front cap exposed faint spoke-shaped lighting
  // seams through Holo/Pearl paint. The authored front is a 2D Studio frame, so
  // light it with one continuous UV-space bulge instead; side/back keep the real
  // mesh normal and therefore preserve the visible 3D thickness.
  vec2 frontP = (vUv - vec2(0.5)) * vec2(1.34, 1.12);
  vec3 frontNormal = normalize(vec3(frontP * 0.34, 1.0));
  vec3 n = vFront > 0.5 ? frontNormal : geometricNormal;
  vec3 light = normalize(vec3(-0.42, 0.51, 0.75));
  float diffuse = max(dot(n, light), 0.0);
  vec4 paint = texture(uFront, vUv);
  if (paint.a < 0.025) paint = vec4(uSideColor, 1.0);

  // Front vertices encode their contour-ring radius in vFront (1..2).
  // Using that continuous ring coordinate gives a clean narrow rim without
  // consulting concave triangle normals or the intentionally overfilled albedo.
  float frontRadius = clamp(vFront - 1.0, 0.0, 1.0);
  float frontRim = vFront > 0.5
    ? smoothstep(0.80, 0.995, frontRadius)
    : (1.0 - smoothstep(0.58, 0.91, n.z));
  // Authored paint/stickers/face belong to the front Studio frame. Keep the
  // side mostly material/body coloured so edge artwork cannot echo around the
  // thickness and read as a slipped second mask.
  float materialEdge = vFront > 0.5 ? frontRim : 0.38;
  vec3 color = vFront > 0.5
    ? paint.rgb
    : mix(uSideColor, paint.rgb, 0.08);
  color = applyMaterial(color, vUv, materialEdge);
  color *= vFront > 0.5
    ? (0.80 + 0.18 * diffuse) * (1.0 - 0.14 * frontRim)
    : (0.78 + 0.20 * diffuse);

  vec3 halfDirection = normalize(light + vec3(0.0, 0.0, 1.0));
  float roughness = clamp(uRoughness, 0.0, 1.0);
  float specPower = mix(34.0, 8.0, roughness);
  float specStrength = mix(0.12, 0.035, roughness) * (1.0 + uMetallic * 0.9 + uPearlescence * 0.22);
  color += uSheenColor * pow(max(dot(n, halfDirection), 0.0), specPower) * specStrength;

  float bodyAlpha = mix(0.995, 0.64 + materialEdge * 0.28, clamp(uTranslucency, 0.0, 1.0));
  outColor = vec4(clamp(color, 0.0, 1.0), paint.a * bodyAlpha);
}`,k=(e,t,n,r,i,a,o,s,c=1)=>{e.push(t,n,r,i,a,o,.5+t*.43*c,.5+n*.362*c-.0072,s)},A=e=>{let t=n(e.shapeId).boundary,r=t.length,i=[],a=[],o=0;for(let e=0;e<r;e+=1){let n=t[e],i=t[(e+1)%r];o+=n.x*i.y-i.x*n.y}let s=o>=0?1:-1,c=t.map((e,n)=>{let i=t[(n+r-1)%r],a=t[(n+1)%r],o=a.x-i.x,c=a.y-i.y,l=Math.hypot(o,c)||1;return{x:s*c/l,y:-s*o/l}}),l=(e,t)=>{for(let n=0;n<t-1;n+=1)for(let t=0;t<r;t+=1){let i=(t+1)%r,o=e+n*r+t,s=e+n*r+i,c=e+(n+1)*r+t,l=e+(n+1)*r+i;a.push(o,c,s,s,c,l)}},u=i.length/E;for(let e=0;e<=T;e+=1){let n=e/T,a=.09+.19*Math.sqrt(Math.max(0,1-n*n));for(let e=0;e<r;e+=1){let r=t[e],o=c[e],s=.19*n/Math.sqrt(Math.max(.045,1-n*n)),l=.18*n**5,u=r.x*s*.85+o.x*l,d=r.y*s*.85+o.y*l,f=Math.hypot(u,d,1);k(i,r.x*n,r.y*n,a,u/f,d/f,1/f,1+n)}}l(u,27);let d=i.length/E,f=[{r:1,z:.09,nz:.22},{r:.997,z:.03,nz:.08},{r:.989,z:-.036,nz:-.1},{r:.976,z:-.08,nz:-.36},{r:.958,z:-.1,nz:-.64}];for(let e of f)for(let n=0;n<r;n+=1){let r=t[n],a=c[n],o=Math.hypot(a.x,a.y,e.nz);k(i,r.x*e.r,r.y*e.r,e.z,a.x/o,a.y/o,e.nz/o,0,.91/e.r)}l(d,f.length);let p=i.length/E;for(let e=0;e<=2;e+=1){let n=e/2,a=-.1-.02*Math.sqrt(Math.max(0,1-n*n));for(let e=0;e<r;e+=1){let r=t[e],o=c[e];k(i,r.x*n*.958,r.y*n*.958,a,o.x*n*.2,o.y*n*.2,-1,0)}}return l(p,3),{vertices:new Float32Array(i),indices:new Uint16Array(a)}},j=class{canvas=document.createElement(`canvas`);gl;program;vao;vertexBuffer;indexBuffer;frontTexture;constructor(){this.canvas.width=w,this.canvas.height=w;let e=this.canvas.getContext(`webgl2`,{alpha:!0,antialias:!0,preserveDrawingBuffer:!0,premultipliedAlpha:!1,depth:!0,stencil:!1,powerPreference:`low-power`});if(!e)throw Error(`WebGL2 unavailable for the isolated 3D review`);this.gl=e;let t=(t,n)=>{let r=e.createShader(t);if(!r)throw Error(`3D review shader allocation failed`);if(e.shaderSource(r,n),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS)){let t=e.getShaderInfoLog(r)??`3D review shader compilation failed`;throw e.deleteShader(r),Error(t)}return r},n=null,r=null,i=null,a=null,o=null,s=null,c=null;try{if(n=t(e.VERTEX_SHADER,D),r=t(e.FRAGMENT_SHADER,O),i=e.createProgram(),!i)throw Error(`3D review program allocation failed`);if(e.attachShader(i,n),e.attachShader(i,r),e.linkProgram(i),!e.getProgramParameter(i,e.LINK_STATUS))throw Error(e.getProgramInfoLog(i)??`3D review shader link failed`);if(a=e.createVertexArray(),o=e.createBuffer(),s=e.createBuffer(),c=e.createTexture(),!a||!o||!s||!c)throw Error(`3D review GPU resource allocation failed`);this.program=i,this.vao=a,this.vertexBuffer=o,this.indexBuffer=s,this.frontTexture=c,e.bindVertexArray(a),e.bindBuffer(e.ARRAY_BUFFER,o);let l=E*Float32Array.BYTES_PER_ELEMENT;for(let[t,n,r]of[[0,3,0],[1,3,3],[2,2,6],[3,1,8]])e.enableVertexAttribArray(t),e.vertexAttribPointer(t,n,e.FLOAT,!1,l,r*Float32Array.BYTES_PER_ELEMENT);e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,s),e.bindVertexArray(null),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,c),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.useProgram(i),e.uniform1i(e.getUniformLocation(i,`uFront`),0)}catch(t){throw a&&e.deleteVertexArray(a),o&&e.deleteBuffer(o),s&&e.deleteBuffer(s),c&&e.deleteTexture(c),i&&e.deleteProgram(i),e.getExtension(`WEBGL_lose_context`)?.loseContext(),t}finally{n&&e.deleteShader(n),r&&e.deleteShader(r)}}render(e,t){let i=this.gl;if(i.isContextLost())throw Error(`3D review WebGL context lost`);let s=A(e);i.bindVertexArray(this.vao),i.bindBuffer(i.ARRAY_BUFFER,this.vertexBuffer),i.bufferData(i.ARRAY_BUFFER,s.vertices,i.DYNAMIC_DRAW),i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,this.indexBuffer),i.bufferData(i.ELEMENT_ARRAY_BUFFER,s.indices,i.DYNAMIC_DRAW),i.activeTexture(i.TEXTURE0),i.bindTexture(i.TEXTURE_2D,this.frontTexture),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,0),i.texImage2D(i.TEXTURE_2D,0,i.RGBA,i.RGBA,i.UNSIGNED_BYTE,t),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,0),i.viewport(0,0,w,w),i.enable(i.DEPTH_TEST),i.depthFunc(i.LESS),i.disable(i.CULL_FACE),i.enable(i.BLEND),i.blendFunc(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA),i.clearColor(0,0,0,0),i.clear(i.COLOR_BUFFER_BIT|i.DEPTH_BUFFER_BIT),i.useProgram(this.program);let c={soft:[.89,.79,.67],jelly:[.62,.86,.8],holo:[.86,.78,.75],marshmallow:[.89,.84,.78],pearl:[.87,.82,.81],chrome:[.58,.59,.57]},l=a(e.materialId),u=o(`milk`),d=c[e.materialId];i.uniform3f(i.getUniformLocation(this.program,`uSideColor`),d[0],d[1],d[2]),i.uniform3f(i.getUniformLocation(this.program,`uSheenColor`),...u.sheen),i.uniform3f(i.getUniformLocation(this.program,`uRimColor`),...u.rim),i.uniform1f(i.getUniformLocation(this.program,`uMaterialSeed`),u.seed),i.uniform1f(i.getUniformLocation(this.program,`uTranslucency`),l.translucency),i.uniform1f(i.getUniformLocation(this.program,`uIridescence`),l.iridescence),i.uniform1f(i.getUniformLocation(this.program,`uRoughness`),l.roughness),i.uniform1f(i.getUniformLocation(this.program,`uMetallic`),l.metallic),i.uniform1f(i.getUniformLocation(this.program,`uPearlescence`),l.pearlescence),i.uniform1f(i.getUniformLocation(this.program,`uCloudiness`),l.cloudiness),i.drawElements(i.TRIANGLES,s.indices.length,i.UNSIGNED_SHORT,0),i.bindVertexArray(null);let f=document.createElement(`canvas`);f.width=w,f.height=w;let p=f.getContext(`2d`);if(!p)throw Error(`3D review output canvas unavailable`);return p.drawImage(this.canvas,0,0),e.decor.accessory&&r(p,n(e.shapeId),e.decor.accessory,(e,t)=>[(128+(e*2-1)*98)*2,(128-(t*2-1)*98)*2],224,150),f.dataset.volumeRenderer=`inflated-mesh-512`,f}dispose(){let e=this.gl;e.isContextLost()||(e.deleteVertexArray(this.vao),e.deleteBuffer(this.vertexBuffer),e.deleteBuffer(this.indexBuffer),e.deleteTexture(this.frontTexture),e.deleteProgram(this.program),e.getExtension(`WEBGL_lose_context`)?.loseContext())}},M=null,N=!1,P=e=>{let t=document.createElement(`canvas`);return t.width=w,t.height=w,t.getContext(`2d`)?.drawImage(e,0,0),t.dataset.volumeRenderer=`mesh-unavailable`,t},F=(e,t)=>{if(N)return P(t);try{return M??=new j,M.render(e,t)}catch(e){return console.warn(`Isolated 3D volume review unavailable; displaying the flat control.`,e),M?.dispose(),M=null,N=!0,P(t)}},ne=()=>{M?.dispose(),M=null,N=!1},I=512,L=128,re=.85,R=96,z=11,B=new Map,ie=`#version 300 es
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aUv;
layout(location=3) in float aFront;
layout(location=4) in vec2 aFieldUv;
out vec3 vNormal;
out vec2 vUv;
out float vFront;
out vec2 vFieldUv;
void main() {
  // The former -0.19 yaw hid all but a hairline of the actual 3D side.
  // The fixed three-quarter pose exposes thickness; this is NOT a perspective
  // transform of a flat image. All specimens still occupy equal CSS bounds.
  const float yaw = -0.36;
  const float pitch = -0.14;
  float cy = cos(yaw), sy = sin(yaw), cp = cos(pitch), sp = sin(pitch);
  vec3 p = vec3(aPosition.x * cy + aPosition.z * sy,
                aPosition.y, -aPosition.x * sy + aPosition.z * cy);
  vec3 n = vec3(aNormal.x * cy + aNormal.z * sy,
                aNormal.y, -aNormal.x * sy + aNormal.z * cy);
  p = vec3(p.x, p.y * cp - p.z * sp, p.y * sp + p.z * cp);
  n = vec3(n.x, n.y * cp - n.z * sp, n.y * sp + n.z * cp);
  vNormal = normalize(n);
  vUv = aUv;
  vFront = aFront;
  vFieldUv = aFieldUv;
  gl_Position = vec4(p.x * 0.80, p.y * 0.80, -p.z * 0.16, 1.0);
}`,ae=`#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUv;
in float vFront;
in vec2 vFieldUv;
uniform sampler2D uPaint;
uniform sampler2D uField;
out vec4 outColor;
void main() {
  vec3 n = normalize(vNormal);
  vec3 light = normalize(vec3(-0.42, 0.51, 0.75));
  float diffuse = max(dot(n, light), 0.0);
  if (vFront > 0.5) {
    float encoded = texture(uField, vFieldUv).r;
    float coverage = 1.0 - smoothstep(0.494, 0.506, encoded);
    if (coverage <= 0.01) discard;
    vec4 paint = texture(uPaint, vUv);
    float opacity = paint.a * coverage;
    if (opacity <= 0.015) discard;
    // Studio has its own painted lighting; avoid double-lighting or losing eyes.
    vec3 color = paint.rgb * (0.89 + 0.12 * diffuse);
    outColor = vec4(clamp(color, 0.0, 1.0), opacity);
  } else {
    // Earlier side (#f5e0c2) escaped as a bright white outline. A warmer,
    // slightly darker body side makes the silhouette's real depth legible.
    vec3 color = vec3(0.84, 0.74, 0.63) * (0.79 + 0.18 * diffuse);
    outColor = vec4(color, 1.0);
  }
}`,V=(e,t=0,n=1)=>Math.max(t,Math.min(n,e)),oe=(e,t,n)=>{let r=V((t+1)*.5)*L-.5,i=V((n+1)*.5)*L-.5,a=V(Math.floor(r),0,127),o=V(Math.floor(i),0,127),s=Math.min(127,a+1),c=Math.min(127,o+1),l=V(r-a),u=V(i-o),d=e[o*L+a]*(1-l)+e[o*L+s]*l,f=e[c*L+a]*(1-l)+e[c*L+s]*l;return(d*(1-u)+f*u)/255},H=(e,t,n)=>{let r=Math.max(0,(.5-oe(e,t,n))*re*2);return .12+.35*(1-Math.exp(-5*r))},se=(e,t)=>{let r=[],i=[],a=(e,t,n,i,a,o,s)=>{r.push(e,t,n,i,a,o,.5+e*.43,.5+t*.362-.0072,s,.5+e*.5,.5+t*.5)},o=2.08/R,s=2/L;for(let e=0;e<=R;e+=1){let n=-1.04+e*o;for(let r=0;r<=R;r+=1){let c=-1.04+r*o,l=H(t,c,n),u=(H(t,c+s,n)-H(t,c-s,n))/(2*s),d=(H(t,c,n+s)-H(t,c,n-s))/(2*s),f=Math.hypot(u,d,1);if(a(c,n,l,-u/f,-d/f,1/f,1),r<R&&e<R){let t=e*97+r,n=t+1,a=t+R+1;i.push(t,a,n,n,a,a+1)}}}let c=n(e.shapeId).boundary,l=c.length,u=0;for(let e=0;e<l;e+=1){let t=c[e],n=c[(e+1)%l];u+=t.x*n.y-n.x*t.y}let d=u>=0?1:-1,f=r.length/z,p=[{r:1,z:.12,nz:.19},{r:1.015,z:.052,nz:.055},{r:1.014,z:-.033,nz:-.08},{r:.988,z:-.097,nz:-.34},{r:.965,z:-.145,nz:-.62}];for(let e of p)for(let t=0;t<l;t+=1){let n=c[t],r=c[(t+l-1)%l],i=c[(t+1)%l],o=i.x-r.x,s=i.y-r.y,u=Math.hypot(o,s)||1,f=d*s/u,p=-d*o/u,m=Math.hypot(f,p,e.nz);a(n.x*e.r,n.y*e.r,e.z,f/m,p/m,e.nz/m,0)}for(let e=0;e<p.length-1;e+=1)for(let t=0;t<l;t+=1){let n=(t+1)%l,r=f+e*l+t,a=f+e*l+n,o=f+(e+1)*l+t,s=f+(e+1)*l+n;i.push(r,o,a,a,o,s)}if(r.length/z>=65536)throw Error(`Field mesh exceeds 16-bit index capacity`);return{vertices:new Float32Array(r),indices:new Uint16Array(i)}},ce=class{canvas=document.createElement(`canvas`);gl;program;vao;vertexBuffer;indexBuffer;paintTexture;fieldTexture;constructor(){this.canvas.width=I,this.canvas.height=I;let e=this.canvas.getContext(`webgl2`,{alpha:!0,antialias:!0,preserveDrawingBuffer:!0,premultipliedAlpha:!1,depth:!0,stencil:!1,powerPreference:`low-power`});if(!e)throw Error(`WebGL2 unavailable for the isolated height-field review`);this.gl=e;let t=(t,n)=>{let r=e.createShader(t);if(!r)throw Error(`Height-field shader allocation failed`);if(e.shaderSource(r,n),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS)){let t=e.getShaderInfoLog(r)??`Height-field shader compilation failed`;throw e.deleteShader(r),Error(t)}return r},n=t(e.VERTEX_SHADER,ie),r=t(e.FRAGMENT_SHADER,ae),i=e.createProgram();if(!i)throw Error(`Height-field program allocation failed`);if(e.attachShader(i,n),e.attachShader(i,r),e.linkProgram(i),e.deleteShader(n),e.deleteShader(r),!e.getProgramParameter(i,e.LINK_STATUS)){let t=e.getProgramInfoLog(i)??`Height-field shader link failed`;throw e.deleteProgram(i),Error(t)}this.program=i;let a=e.createVertexArray(),o=e.createBuffer(),s=e.createBuffer(),c=e.createTexture(),l=e.createTexture();if(!a||!o||!s||!c||!l)throw Error(`Height-field GPU allocation failed`);this.vao=a,this.vertexBuffer=o,this.indexBuffer=s,this.paintTexture=c,this.fieldTexture=l,e.bindVertexArray(a),e.bindBuffer(e.ARRAY_BUFFER,o);let u=z*Float32Array.BYTES_PER_ELEMENT;for(let[t,n,r]of[[0,3,0],[1,3,3],[2,2,6],[3,1,8],[4,2,9]])e.enableVertexAttribArray(t),e.vertexAttribPointer(t,n,e.FLOAT,!1,u,r*Float32Array.BYTES_PER_ELEMENT);e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,s),e.bindVertexArray(null);for(let[t,n]of[[e.TEXTURE0,c],[e.TEXTURE1,l]])e.activeTexture(t),e.bindTexture(e.TEXTURE_2D,n),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);e.useProgram(i),e.uniform1i(e.getUniformLocation(i,`uPaint`),0),e.uniform1i(e.getUniformLocation(i,`uField`),1)}render(t,r){let i=this.gl;if(i.isContextLost())throw Error(`Height-field WebGL context lost`);let a=B.get(t.shapeId);a||(a=s(n(t.shapeId),L,re),B.set(t.shapeId,a));let o=se(t,a);i.bindVertexArray(this.vao),i.bindBuffer(i.ARRAY_BUFFER,this.vertexBuffer),i.bufferData(i.ARRAY_BUFFER,o.vertices,i.DYNAMIC_DRAW),i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,this.indexBuffer),i.bufferData(i.ELEMENT_ARRAY_BUFFER,o.indices,i.DYNAMIC_DRAW),i.activeTexture(i.TEXTURE0),i.bindTexture(i.TEXTURE_2D,this.paintTexture),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,0),i.texImage2D(i.TEXTURE_2D,0,i.RGBA,i.RGBA,i.UNSIGNED_BYTE,r),i.activeTexture(i.TEXTURE1),i.bindTexture(i.TEXTURE_2D,this.fieldTexture),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,0),i.pixelStorei(i.UNPACK_ALIGNMENT,1),i.texImage2D(i.TEXTURE_2D,0,i.R8,L,L,0,i.RED,i.UNSIGNED_BYTE,a),i.viewport(0,0,I,I),i.enable(i.DEPTH_TEST),i.depthFunc(i.LESS),i.disable(i.CULL_FACE),i.enable(i.BLEND),i.blendFunc(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA),i.clearColor(0,0,0,0),i.clear(i.COLOR_BUFFER_BIT|i.DEPTH_BUFFER_BIT),i.useProgram(this.program),i.drawElements(i.TRIANGLES,o.indices.length,i.UNSIGNED_SHORT,0),i.bindVertexArray(null);let l=document.createElement(`canvas`);l.width=I,l.height=I;let u=l.getContext(`2d`);if(!u)throw Error(`Height-field output context unavailable`);if(t.decor.accessory){let r=c(n(t.shapeId),t.decor.accessory),i=128+(r.headAnchor.u*2-1)*98,a=128-((r.headAnchor.v+r.headSeatOffsetV)*2-1)*98,o=document.createElement(`canvas`);o.width=360,o.height=240;let s=o.getContext(`2d`);s&&(s.setTransform(2,0,0,2,0,0),e(s,t.decor.accessory,180,120,t.shapeId),u.drawImage(o,(i-56)*2-10,(a-67.5)*2-7,224,150))}return u.drawImage(this.canvas,0,0),l.dataset.volumeRenderer=`sdf-field-mesh-512`,l}dispose(){let e=this.gl;e.isContextLost()||(e.deleteVertexArray(this.vao),e.deleteBuffer(this.vertexBuffer),e.deleteBuffer(this.indexBuffer),e.deleteTexture(this.paintTexture),e.deleteTexture(this.fieldTexture),e.deleteProgram(this.program),e.getExtension(`WEBGL_lose_context`)?.loseContext())}},U=null,W=(e,t)=>{try{return U??=new ce,U.render(e,t)}catch(e){console.warn(`Isolated height-field review unavailable; displaying source instead.`,e),U?.dispose(),U=null;let n=document.createElement(`canvas`);return n.width=I,n.height=I,n.getContext(`2d`)?.drawImage(t,0,0),n.dataset.volumeRenderer=`field-mesh-unavailable`,n}},le=()=>{U?.dispose(),U=null,B.clear()},G=512,K=128,q=.85,ue=9,de=3,J=new Map,Y=(e,t=0,n=1)=>Math.max(t,Math.min(n,e)),X=(e,t)=>`${Math.min(e,t)}:${Math.max(e,t)}`,fe=`#version 300 es
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aUv;
layout(location=3) in float aFront;
out vec3 vNormal;
out vec2 vUv;
out float vFront;
void main() {
  const float yaw = -0.31;
  const float pitch = -0.12;
  float cy = cos(yaw), sy = sin(yaw), cp = cos(pitch), sp = sin(pitch);
  vec3 p = vec3(aPosition.x * cy + aPosition.z * sy,
                aPosition.y, -aPosition.x * sy + aPosition.z * cy);
  vec3 n = vec3(aNormal.x * cy + aNormal.z * sy,
                aNormal.y, -aNormal.x * sy + aNormal.z * cy);
  p = vec3(p.x, p.y * cp - p.z * sp, p.y * sp + p.z * cp);
  n = vec3(n.x, n.y * cp - n.z * sp, n.y * sp + n.z * cp);
  vNormal = normalize(n);
  vUv = aUv;
  vFront = aFront;
  gl_Position = vec4(p.x * 0.80, p.y * 0.80, -p.z * 0.16, 1.0);
}`,pe=`#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUv;
in float vFront;
uniform sampler2D uPaint;
out vec4 outColor;
void main() {
  vec3 n = normalize(vNormal);
  vec3 light = normalize(vec3(-0.46, 0.54, 0.71));
  float diffuse = max(dot(n, light), 0.0);
  vec3 color;
  if (vFront > 0.5) {
    vec4 paint = texture(uPaint, vUv);
    // Exact mesh contour, not alpha in a separately rasterized silhouette,
    // owns coverage. Neutral base prevents alpha halos at rotated edges.
    color = mix(vec3(0.93, 0.82, 0.68), paint.rgb, paint.a);
    color *= 0.73 + 0.32 * diffuse;
    vec3 h = normalize(light + vec3(0.0, 0.0, 1.0));
    color += vec3(1.0, 0.96, 0.87) * pow(max(dot(n, h), 0.0), 22.0) * 0.032;
  } else {
    color = vec3(0.90, 0.79, 0.66) * (0.76 + 0.24 * diffuse);
  }
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`,me=(e,t,n)=>{let r=Y((t+1)*.5)*K-.5,i=Y((n+1)*.5)*K-.5,a=Y(Math.floor(r),0,127),o=Y(Math.floor(i),0,127),s=Math.min(127,a+1),c=Math.min(127,o+1),l=Y(r-a),u=Y(i-o),d=e[o*K+a]*(1-l)+e[o*K+s]*l,f=e[c*K+a]*(1-l)+e[c*K+s]*l;return(d*(1-u)+f*u)/255},Z=(e,t,n)=>{let r=Math.max(0,(.5-me(e,t,n))*q*2);return .105+.31*(1-Math.exp(-4.7*r))},Q=(e,t,n)=>(t.x-e.x)*(n.y-e.y)-(t.y-e.y)*(n.x-e.x),he=e=>{let t=Array.from({length:e.length},(e,t)=>t),n=[],r=e.reduce((t,n,r)=>{let i=e[(r+1)%e.length];return t+n.x*i.y-i.x*n.y},0)>=0?1:-1,i=e.length*e.length;for(;t.length>3&&i-->0;){let i=!1;for(let a=0;a<t.length;a+=1){let o=t[(a+t.length-1)%t.length],s=t[a],c=t[(a+1)%t.length],l=e[o],u=e[s],d=e[c];if(Q(l,u,d)*r<=1e-9)continue;let f=!1;for(let n of t){if(n===o||n===s||n===c)continue;let t=e[n];if(Q(l,u,t)*r>1e-9&&Q(u,d,t)*r>1e-9&&Q(d,l,t)*r>1e-9){f=!0;break}}if(!f){n.push(o,s,c),t.splice(a,1),i=!0;break}}if(!i)throw Error(`Contour triangulation stalled on a degenerate polygon`)}if(t.length!==3)throw Error(`Contour triangulation did not close`);return n.push(...t),n},ge=(e,t)=>{let r=n(e.shapeId).boundary,i=r.length,a=r.map(e=>({x:e.x,y:e.y})),o=he(a),s=new Set(r.map((e,t)=>X(t,(t+1)%i))),c=new Set(Array.from({length:i},(e,t)=>t));for(let e=0;e<de;e+=1){let e=new Map,t=new Set,n=(n,r)=>{let i=X(n,r),o=e.get(i);if(o!==void 0)return o;let l=a[n],u=a[r],d=a.length;return a.push({x:(l.x+u.x)*.5,y:(l.y+u.y)*.5}),e.set(i,d),s.has(i)&&(c.add(d),t.add(X(n,d)),t.add(X(d,r))),d},r=[];for(let e=0;e<o.length;e+=3){let t=o[e],i=o[e+1],a=o[e+2],s=n(t,i),c=n(i,a),l=n(a,t);r.push(t,s,l,s,i,c,l,c,a,s,c,l)}o=r,s=t}let l=[],u=[...o],d=(e,t,n,r,i,a,o)=>{l.push(e,t,n,r,i,a,.5+e*.43,.5+t*.362-.0072,o)},f=2/K;for(let[e,n]of a.entries()){let r=n.x,i=n.y,a=c.has(e)?.105:Z(t,r,i),o=(Z(t,r+f,i)-Z(t,r-f,i))/(2*f),s=(Z(t,r,i+f)-Z(t,r,i-f))/(2*f),l=Math.hypot(o,s,1);d(r,i,a,-o/l,-s/l,1/l,1)}let p=r.reduce((e,t,n)=>{let a=r[(n+1)%i];return e+t.x*a.y-a.x*t.y},0)>=0?1:-1,m=[{radius:1,z:.105,nz:.18},{radius:1.02,z:.03,nz:.04},{radius:1.012,z:-.052,nz:-.12},{radius:.973,z:-.121,nz:-.6}],h=l.length/ue;for(let e of m)for(let t=0;t<i;t+=1){let n=r[t],a=r[(t+i-1)%i],o=r[(t+1)%i],s=o.x-a.x,c=o.y-a.y,l=Math.hypot(s,c)||1,u=p*c/l,f=-p*s/l,m=Math.hypot(u,f,e.nz);d(n.x*e.radius,n.y*e.radius,e.z,u/m,f/m,e.nz/m,0)}for(let e=0;e<m.length-1;e+=1)for(let t=0;t<i;t+=1){let n=(t+1)%i,r=h+e*i+t,a=h+e*i+n,o=h+(e+1)*i+t,s=h+(e+1)*i+n;u.push(r,o,a,a,o,s)}if(l.length/ue>=65536)throw Error(`Contour mesh exceeds Uint16 vertex capacity`);return{vertices:new Float32Array(l),indices:new Uint16Array(u)}},_e=class{canvas=document.createElement(`canvas`);gl;program;vao;vbo;ibo;paint;constructor(){this.canvas.width=G,this.canvas.height=G;let e=this.canvas.getContext(`webgl2`,{alpha:!0,antialias:!0,preserveDrawingBuffer:!0,premultipliedAlpha:!1,depth:!0,powerPreference:`low-power`});if(!e)throw Error(`Contour review requires WebGL2`);this.gl=e;let t=(t,n)=>{let r=e.createShader(t);if(!r)throw Error(`Contour shader allocation failed`);if(e.shaderSource(r,n),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS)){let t=e.getShaderInfoLog(r)??`Contour shader compilation failed`;throw e.deleteShader(r),Error(t)}return r},n=t(e.VERTEX_SHADER,fe),r=t(e.FRAGMENT_SHADER,pe),i=e.createProgram();if(!i)throw Error(`Contour program allocation failed`);if(e.attachShader(i,n),e.attachShader(i,r),e.linkProgram(i),!e.getProgramParameter(i,e.LINK_STATUS))throw Error(e.getProgramInfoLog(i)??`Contour program linking failed`);this.program=i,e.deleteShader(n),e.deleteShader(r);let a=e.createVertexArray(),o=e.createBuffer(),s=e.createBuffer(),c=e.createTexture();if(!a||!o||!s||!c)throw Error(`Contour GPU resource allocation failed`);this.vao=a,this.vbo=o,this.ibo=s,this.paint=c,e.bindVertexArray(a),e.bindBuffer(e.ARRAY_BUFFER,o);for(let[t,n,r]of[[0,3,0],[1,3,3],[2,2,6],[3,1,8]])e.enableVertexAttribArray(t),e.vertexAttribPointer(t,n,e.FLOAT,!1,36,r*4);e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,s),e.bindVertexArray(null),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,c),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.useProgram(i),e.uniform1i(e.getUniformLocation(i,`uPaint`),0)}render(t,r){let i=this.gl;if(i.isContextLost())throw Error(`Contour review context lost`);let a=J.get(t.shapeId);a||(a=s(n(t.shapeId),K,q),J.set(t.shapeId,a));let o=ge(t,a);i.bindVertexArray(this.vao),i.bindBuffer(i.ARRAY_BUFFER,this.vbo),i.bufferData(i.ARRAY_BUFFER,o.vertices,i.DYNAMIC_DRAW),i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,this.ibo),i.bufferData(i.ELEMENT_ARRAY_BUFFER,o.indices,i.DYNAMIC_DRAW),i.activeTexture(i.TEXTURE0),i.bindTexture(i.TEXTURE_2D,this.paint),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,0),i.texImage2D(i.TEXTURE_2D,0,i.RGBA,i.RGBA,i.UNSIGNED_BYTE,r),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,0),i.viewport(0,0,G,G),i.enable(i.DEPTH_TEST),i.depthFunc(i.LESS),i.disable(i.CULL_FACE),i.disable(i.BLEND),i.clearColor(0,0,0,0),i.clear(i.COLOR_BUFFER_BIT|i.DEPTH_BUFFER_BIT),i.useProgram(this.program),i.drawElements(i.TRIANGLES,o.indices.length,i.UNSIGNED_SHORT,0),i.bindVertexArray(null);let l=document.createElement(`canvas`);l.width=G,l.height=G;let u=l.getContext(`2d`);if(!u)throw Error(`Contour output context unavailable`);if(t.decor.accessory){let r=c(n(t.shapeId),t.decor.accessory),i=128+(r.headAnchor.u*2-1)*98,a=128-((r.headAnchor.v+r.headSeatOffsetV)*2-1)*98,o=document.createElement(`canvas`);o.width=360,o.height=240;let s=o.getContext(`2d`);s&&(s.setTransform(2,0,0,2,0,0),e(s,t.decor.accessory,180,120,t.shapeId),u.drawImage(o,(i-56)*2-10,(a-67.5)*2-7,224,150))}return u.drawImage(this.canvas,0,0),l.dataset.volumeRenderer=`contour-mesh-512`,l}dispose(){let e=this.gl;e.isContextLost()||(e.deleteVertexArray(this.vao),e.deleteBuffer(this.vbo),e.deleteBuffer(this.ibo),e.deleteTexture(this.paint),e.deleteProgram(this.program),e.getExtension(`WEBGL_lose_context`)?.loseContext())}},$=null,ve=(e,t)=>{try{return $??=new _e,$.render(e,t)}catch(e){console.warn(`Isolated contour mesh unavailable; showing flat control.`,e),$?.dispose(),$=null;let n=document.createElement(`canvas`);return n.width=G,n.height=G,n.getContext(`2d`)?.drawImage(t,0,0),n.dataset.volumeRenderer=`contour-mesh-unavailable`,n}},ye=()=>{$?.dispose(),$=null,J.clear()},be=[`soft-square`,`heart`,`paw`],xe=[`current`,`hires`,`relief`,`extruded`,`mesh`,`mesh-studio`,`mesh-neutral`,`mesh-field`,`mesh-field-flat`,`mesh-contour`],Se=e=>({id:`review-only-same-toy`,createdAt:0,shapeId:e,materialId:`soft`,appearance:{v:1,strokes:[{m:0,c:16751795,s:57,p:f([{u:.27,v:.37},{u:.39,v:.34},{u:.54,v:.32},{u:.65,v:.38}])}],mixins:[]},decor:{v:1,eyes:`dot`,mouth:`smile`,blush:!0,stickers:[{t:1,x:69,y:119,s:48,r:0}],accessory:`bow`}}),Ce=()=>{if(new URLSearchParams(location.search).get(`volume-probe`)!==`1`)return;let e=document.createElement(`section`);e.id=`library-volume-probe`,e.setAttribute(`aria-label`,`Squishy volume comparison`),e.innerHTML=`<style>
#library-volume-probe {position:fixed;inset:0;z-index:2147483647;overflow:auto;background:#f1dfcf;color:#4c3049;font:16px system-ui,sans-serif;padding:20px;box-sizing:border-box}
#library-volume-probe * {box-sizing:border-box}
#library-volume-probe .probe-bar {display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;max-width:1420px;margin:0 auto 20px}
#library-volume-probe h1 {font-size:clamp(20px,3vw,29px);margin:0}
#library-volume-probe .probe-grid {display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;max-width:1420px;margin:auto}
#library-volume-probe article {padding:12px;background:#fff5e9;border-radius:16px;box-shadow:0 5px 20px #92674626;min-width:0}
#library-volume-probe article canvas {display:block;width:100%;max-width:330px;aspect-ratio:1;margin:auto}
#library-volume-probe h2 {font-size:16px;margin:10px 0 5px}
#library-volume-probe p {font-size:13px;line-height:1.4;margin:5px 0}
#library-volume-probe button {padding:10px 14px;border:1px solid #b4888b;border-radius:10px;background:white;color:#4c3049;cursor:pointer}
#library-volume-probe button[aria-pressed=true] {background:#5d3b60;color:white}
#library-volume-probe .probe-shapes {display:flex;gap:6px;flex-wrap:wrap}
#library-volume-probe .probe-note {max-width:1420px;margin:0 auto 14px;font-size:13px}
@media (max-width:1100px) {#library-volume-probe .probe-grid {grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:630px) {#library-volume-probe .probe-grid {grid-template-columns:1fr}#library-volume-probe article canvas {width:min(100%,330px)}}
</style><header class="probe-bar"><h1>Squishy volume · identical toy / identical size</h1><div class="probe-shapes"><button type="button" data-shape="soft-square">Square</button><button type="button" data-shape="heart">Heart</button><button type="button" data-shape="paw">Paw</button></div><button type="button" data-legacy aria-pressed="false">Compare old 256px</button><button type="button" data-close>Close lab</button></header><p class="probe-note">01 is the actual 512px Hall volume render; old 256px is diagnostic. 02–04 are Canvas2D controls. 05–07 use identical radial geometry with a flat gradient, baked Studio lighting and genuinely unlit saved-art albedo respectively. 08/09 use identical grid geometry, while 10 triangulates the actual contour. 07 is now the Pages Hall renderer; the other paths remain experimental.</p><main class="probe-grid"><article data-variant="current"><h2>01 · Actual Hall · Volume mesh 512px</h2><p>The static volume snapshot used by saved toys in the Pages Hall.</p></article><article data-variant="hires"><h2>02 · Flat Canvas · 512px</h2><p>Saved art with simplified light; not Studio parity.</p></article><article data-variant="relief"><h2>03 · Relief · 512px</h2><p>Canvas art with SDF normals and directional lighting.</p></article><article data-variant="extruded"><h2>04 · Contour thickness · 512px</h2><p>Contour-facing 2.5D sidewall, not geometry.</p></article><article data-variant="mesh"><h2>05 · Radial mesh · flat texture</h2><p>3D radial shape with a baked base gradient.</p></article><article data-variant="mesh-studio"><h2>06 · Radial mesh · Studio texture</h2><p>Exactly the same geometry with baked Studio lighting.</p></article><article data-variant="mesh-neutral"><h2>07 · Same radial mesh · unlit albedo</h2><p>Exactly the same geometry and GPU lighting, but the source contains no baked light. Saved paint, face and sticker remain.</p></article><article data-variant="mesh-field"><h2>08 · Grid height-field · Studio</h2><p>3D masked grid with baked Studio front.</p></article><article data-variant="mesh-field-flat"><h2>09 · Same grid height-field · flat</h2><p>Exactly the same grid geometry and shader as 08; flat saved-art source.</p></article><article data-variant="mesh-contour"><h2>10 · Exact contour mesh · flat</h2><p>Ear-clipped actual silhouette, subdivided inflated front, shared side boundary. No raster alpha cutout. Experimental.</p></article></main>`,document.body.append(e);let t=`soft-square`,n=!1,r=()=>{ne(),le(),ye()},i=()=>r();window.addEventListener(`pagehide`,i,{once:!0});let a=()=>{let r=Se(t),i=document.createElement(`canvas`);u(i,r,n?256:512),i.dataset.volumeRenderer=n?`studio-shader-256`:`volume-mesh-512`;let a=document.createElement(`canvas`);a.width=512,a.height=512;let o=a.getContext(`2d`);o&&(o.setTransform(2,0,0,2,0,0),d(o,r,512));let s=C(r,!1),c=C(r,!0),l=h(r,c),f=F(r,s),p=F(r,a);p.dataset.volumeRenderer!==`mesh-unavailable`&&(p.dataset.volumeRenderer=`studio-textured-mesh-512`);let g=F(r,m(r));g.dataset.volumeRenderer!==`mesh-unavailable`&&(g.dataset.volumeRenderer=`unlit-albedo-mesh-512`);let _=W(r,a),v=W(r,s);v.dataset.volumeRenderer!==`field-mesh-unavailable`&&(v.dataset.volumeRenderer=`sdf-field-flat-mesh-512`);let ee=[i,s,c,l,f,p,g,_,v,ve(r,s)];for(let[t,n]of xe.entries()){let r=e.querySelector(`[data-variant="${n}"]`);r?.querySelector(`canvas`)?.remove(),r?.insertBefore(ee[t],r.querySelector(`h2`))}let y=e.querySelector(`[data-variant="current"] h2`);y&&(y.textContent=n?`01 · Diagnostic Studio 256px`:`01 · Actual Hall · Volume mesh 512px`);for(let t of[`mesh`,`mesh-studio`,`mesh-neutral`,`mesh-field`,`mesh-field-flat`,`mesh-contour`]){let n=e.querySelector(`[data-variant="${t}"] canvas`),r=e.querySelector(`[data-variant="${t}"] p`);r&&n instanceof HTMLCanvasElement&&n.dataset.volumeRenderer?.includes(`unavailable`)&&(r.textContent=`WebGL2 unavailable or invalid geometry: fallback only. This is NOT a 3D result.`)}for(let n of e.querySelectorAll(`[data-shape]`))n.setAttribute(`aria-pressed`,String(n.dataset.shape===t));e.querySelector(`[data-legacy]`)?.setAttribute(`aria-pressed`,String(n))};e.addEventListener(`click`,o=>{let s=o.target;if(!(s instanceof Element))return;if(s.closest(`[data-close]`)){r(),window.removeEventListener(`pagehide`,i),e.remove();let t=new URL(location.href);t.searchParams.delete(`volume-probe`),history.replaceState(history.state,``,t);return}if(s.closest(`[data-legacy]`)){n=!n,a();return}let c=s.closest(`[data-shape]`)?.dataset.shape;be.some(e=>e===c)&&(t=c,a())}),a()};export{Ce as mountLibraryVolumeReview};