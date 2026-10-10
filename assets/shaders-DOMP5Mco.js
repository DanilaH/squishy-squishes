var e=Math.PI*2,t=112,n=128,r=112,i=128,a=72,o=()=>Array.from({length:t},(n,r)=>{let i=r/t*e,a=Math.cos(i),o=Math.sin(i);return{x:Math.sign(a)*Math.sqrt(Math.abs(a))*.98,y:Math.sign(o)*Math.sqrt(Math.abs(o))*.98}}),s=(e,t=.94)=>{let n=1/0,r=-1/0,i=1/0,a=-1/0;for(let t of e)n=Math.min(n,t.x),r=Math.max(r,t.x),i=Math.min(i,t.y),a=Math.max(a,t.y);let o=(n+r)*.5,s=(i+a)*.5,c=Math.max(1e-4,r-n),l=Math.max(1e-4,a-i),u=t*2/Math.max(c,l);return e.map(e=>({x:(e.x-o)*u,y:(e.y-s)*u}))},c=()=>s(Array.from({length:n},(t,r)=>{let i=r/n*e,a=Math.sin(i);return{x:16*a*a*a,y:13*Math.cos(i)-5*Math.cos(i*2)-2*Math.cos(i*3)-Math.cos(i*4)}}),.94),l=()=>s(Array.from({length:r},(t,n)=>{let i=n/r*e,a=Math.cos(i),o=Math.sin(i),s=1+Math.cos(i*2)*.055,c=.8+Math.cos(i*2)*.03,l=Math.max(0,-o)**4*.055;return{x:a*s,y:o*c+l}}),.94),u=()=>s(Array.from({length:i},(t,n)=>{let r=n/i*e,a=Math.cos(r),o=Math.sin(r),s=.88+Math.cos(r*2)*.14-Math.cos(r*4)*.025,c=Math.max(0,-o)**6*.1;return{x:a*s,y:o*s*1.03-c}}),.94),d=e=>{if(e<-.52){let t=Math.min(1,Math.max(0,(e+.94)/.42));return .32*Math.sqrt(Math.max(0,1-(1-t)**2))}if(e<-.18)return .32;if(e<.08)return .32+.06*((e+.18)/.26);let t=Math.min(1,Math.max(0,(e-.08)/.86)),n=.9*Math.sin(t*Math.PI)**.55;return Math.max(.38*(1-t),n)},f=()=>{let e=Array.from({length:a},(e,t)=>{let n=-.94+t/71*1.88;return{x:d(n),y:n}}),t=e.slice(1,-1).reverse().map(e=>({x:-e.x,y:e.y}));return s([...e,...t],.94)},p=()=>{let t=[{x:0,y:-.23,rx:.7,ry:.64},{x:-.57,y:.24,rx:.245,ry:.275},{x:-.2,y:.43,rx:.235,ry:.32},{x:.2,y:.43,rx:.235,ry:.32},{x:.57,y:.24,rx:.245,ry:.275}];return s(Array.from({length:192},(n,r)=>{let i=r/192*e,a=Math.cos(i),o=Math.sin(i),s=0;for(let e of t){let t=(a/e.rx)**2+(o/e.ry)**2,n=-2*(a*e.x/e.rx**2+o*e.y/e.ry**2),r=(e.x/e.rx)**2+(e.y/e.ry)**2-1,i=n*n-4*t*r;i>=0&&(s=Math.max(s,(-n+Math.sqrt(i))/(2*t)))}return{x:a*s,y:o*s}}))},m=e=>s(e.flatMap(([e,t,n,r])=>Array.from({length:20},(i,a)=>{let o=a/20,s=1-o;return{x:s**3*e.x+3*s*s*o*t.x+3*s*o*o*n.x+o**3*r.x,y:s**3*e.y+3*s*s*o*t.y+3*s*o*o*n.y+o**3*r.y}}))),h=()=>m([[{x:-.12,y:.69},{x:-.26,y:.84},{x:-.15,y:.98},{x:0,y:.98}],[{x:0,y:.98},{x:.18,y:1.01},{x:.27,y:.81},{x:.14,y:.67}],[{x:.14,y:.67},{x:.55,y:.65},{x:.91,y:.36},{x:.94,y:-.03}],[{x:.94,y:-.03},{x:.98,y:-.6},{x:.54,y:-.81},{x:0,y:-.81}],[{x:0,y:-.81},{x:-.54,y:-.81},{x:-.98,y:-.6},{x:-.94,y:-.03}],[{x:-.94,y:-.03},{x:-.91,y:.36},{x:-.55,y:.65},{x:-.12,y:.69}]]),g=()=>m([[{x:0,y:.72},{x:.34,y:.77},{x:.8,y:.78},{x:.85,y:.36}],[{x:.85,y:.36},{x:.91,y:-.06},{x:.4,y:-.8},{x:.12,y:-.87}],[{x:.12,y:-.87},{x:.04,y:-.9},{x:-.04,y:-.9},{x:-.12,y:-.87}],[{x:-.12,y:-.87},{x:-.4,y:-.8},{x:-.91,y:-.06},{x:-.85,y:.36}],[{x:-.85,y:.36},{x:-.8,y:.78},{x:-.34,y:.77},{x:0,y:.72}]]),_=(t,n,r=!1)=>Array.from({length:128},(i,a)=>{let o=a/128*e*(r?-1:1);return{x:Math.cos(o)*t,y:Math.sin(o)*n}}),v=e=>[e.boundary,...e.holes??[]],y=()=>s(_(1,.79).map(e=>({x:e.x,y:e.y+(e.y>0?.09*Math.cos(e.x*Math.PI*2)**2:.04)}))),b=()=>m([[{x:0,y:.93},{x:.55,y:1.02},{x:.93,y:.72},{x:.87,y:.26}],[{x:.87,y:.26},{x:1,y:.06},{x:.72,y:-.03},{x:.58,y:.08}],[{x:.58,y:.08},{x:.44,y:-.24},{x:.23,y:-.74},{x:.08,y:-.89}],[{x:.08,y:-.89},{x:.04,y:-.95},{x:-.04,y:-.95},{x:-.08,y:-.89}],[{x:-.08,y:-.89},{x:-.23,y:-.74},{x:-.44,y:-.24},{x:-.58,y:.08}],[{x:-.58,y:.08},{x:-.72,y:-.03},{x:-1,y:.06},{x:-.87,y:.26}],[{x:-.87,y:.26},{x:-.93,y:.72},{x:-.55,y:1.02},{x:0,y:.93}]]),x=()=>m([[{x:0,y:.92},{x:.3,y:.99},{x:.58,y:.81},{x:.59,y:.61}],[{x:.59,y:.61},{x:.89,y:.65},{x:1,y:.22},{x:.83,y:.09}],[{x:.83,y:.09},{x:.79,y:-.14},{x:.66,y:-.64},{x:.55,y:-.75}],[{x:.55,y:-.75},{x:.39,y:-.84},{x:-.39,y:-.84},{x:-.55,y:-.75}],[{x:-.55,y:-.75},{x:-.66,y:-.64},{x:-.79,y:-.14},{x:-.83,y:.09}],[{x:-.83,y:.09},{x:-1,y:.22},{x:-.89,y:.65},{x:-.59,y:.61}],[{x:-.59,y:.61},{x:-.58,y:.81},{x:-.3,y:.99},{x:0,y:.92}]]),S=()=>m([[{x:-.88,y:.54},{x:-.99,y:.54},{x:-.99,y:.39},{x:-.9,y:.1}],[{x:-.9,y:.1},{x:-.65,y:-.8},{x:.65,y:-.8},{x:.9,y:.1}],[{x:.9,y:.1},{x:.99,y:.39},{x:.99,y:.54},{x:.88,y:.54}],[{x:.88,y:.54},{x:.45,y:.58},{x:-.45,y:.58},{x:-.88,y:.54}]]),C=e=>m([[{x:-.77,y:.18},{x:-.83,y:.49},{x:-.69,y:e?1.18:.79},{x:-.49,y:e?1.18:.72}],[{x:-.49,y:e?1.18:.72},{x:-.31,y:e?1.18:.75},{x:-.25,y:.66},{x:-.23,y:.5}],[{x:-.23,y:.5},{x:-.12,y:.54},{x:.12,y:.54},{x:.23,y:.5}],[{x:.23,y:.5},{x:.25,y:.66},{x:.31,y:e?1.18:.75},{x:.49,y:e?1.18:.72}],[{x:.49,y:e?1.18:.72},{x:.69,y:e?1.18:.79},{x:.83,y:.49},{x:.77,y:.18}],[{x:.77,y:.18},{x:1,y:-.13},{x:.78,y:-.71},{x:0,y:-.72}],[{x:0,y:-.72},{x:-.78,y:-.71},{x:-1,y:-.13},{x:-.77,y:.18}]]),w=[{id:`soft-square`,label:`Soft Cube`,boundary:o()},{id:`heart`,label:`Soft Heart`,boundary:c()},{id:`mochi`,label:`Mochi`,boundary:l()},{id:`peach`,label:`Peach Puff`,boundary:u()},{id:`mushroom`,label:`Mushroom`,boundary:f()},{id:`paw`,label:`Paw`,boundary:p()},{id:`dumpling`,label:`Dumpling`,boundary:h()},{id:`strawberry`,label:`Strawberry`,boundary:g()},{id:`bun`,label:`Puffy Bun`,boundary:y()},{id:`ice-cream`,label:`Ice Cream`,boundary:b()},{id:`cupcake`,label:`Cupcake`,boundary:x()},{id:`watermelon`,label:`Watermelon`,boundary:S()},{id:`mochi-cat`,label:`Mochi Cat`,boundary:C(!1)},{id:`mochi-bunny`,label:`Mochi Bunny`,boundary:C(!0)},{id:`donut`,label:`Donut`,boundary:_(.94,.87),holes:[_(.3,.28,!0)]}],T=new Set([`soft-square`,`heart`]),E=w.filter(e=>T.has(e.id)),D=Object.fromEntries(w.map(e=>[e.id,e])),O=e=>D[e],k=(e,t)=>{let n=-1/0;for(let r=0;r<e.boundary.length;r++){let i=e.boundary[r],a=e.boundary[(r+1)%e.boundary.length];if(!(t<Math.min(i.x,a.x)-1e-6||t>Math.max(i.x,a.x)+1e-6)){if(Math.abs(a.x-i.x)<1e-6)n=Math.max(n,i.y,a.y);else{let e=(t-i.x)/(a.x-i.x);n=Math.max(n,i.y+(a.y-i.y)*e)}}}return n},A=(e,t,n)=>{let r=!1;for(let i=0,a=e.length-1;i<e.length;a=i,i+=1){let o=e[i],s=e[a];o.y>n!=s.y>n&&t<(s.x-o.x)*(n-o.y)/(s.y-o.y)+o.x&&(r=!r)}return r},j=(e,t,n)=>A(e.boundary,t,n)&&!(e.holes??[]).some(e=>A(e,t,n)),M=(e,t,n,r,i,a)=>{let o=i-n,s=a-r,c=o*o+s*s,l=c<=1e-9?0:Math.min(1,Math.max(0,((e-n)*o+(t-r)*s)/c));return Math.hypot(e-(n+o*l),t-(r+s*l))},N=(e,t=128,n=.22)=>{let r=new Uint8Array(t*t),i=v(e);for(let a=0;a<t;a+=1){let o=(a+.5)/t*2-1;for(let s=0;s<t;s+=1){let c=(s+.5)/t*2-1,l=1/0;for(let e of i)for(let t=0;t<e.length;t+=1){let n=e[t],r=e[(t+1)%e.length];l=Math.min(l,M(c,o,n.x,n.y,r.x,r.y))}let u=(j(e,c,o)?-1:1)*l,d=Math.min(1,Math.max(0,.5+u/(n*2)));r[a*t+s]=Math.round(d*255)}}return r},P=(e,t=42)=>v(e).map(e=>e.map((e,n)=>`${n===0?`M`:`L`}${50+e.x*t},${50-e.y*t}`).join(` `)+` Z`).join(` `),F=[`studio`,`soft`,`sunset`,`moon`],I=e=>e?[e.x,e.y,F.indexOf(e.preset),1]:[0,0,0,0],L=e=>{if(typeof e!=`object`||!e)throw TypeError(`Light settings are invalid.`);let t=e;if(!F.includes(t.preset)||typeof t.x!=`number`||typeof t.y!=`number`||!Number.isFinite(t.x)||!Number.isFinite(t.y)||Math.abs(t.x)>1||Math.abs(t.y)>1)throw TypeError(`Light settings are invalid.`);return{preset:t.preset,x:t.x,y:t.y}},R=e=>Math.min(1,Math.max(0,Number.isFinite(e)?e:0)),z=(e,t,n,r,i={})=>{let a=R(e),o=R(t),s=Math.abs(a-o),c=Math.max(1e-4,i.minElapsedSeconds??.008),l=Math.max(c,Number.isFinite(n)&&Number.isFinite(r)?Math.max(0,(n-r)/1e3):c),u=Math.max(1e-4,i.velocityForMax??4),d=R(s/l/u),f=Math.max(0,i.minActiveProgress??.005),p=Math.max(0,i.minActiveProgressDelta??5e-4);return{progress:a,progressDelta:s,elapsedSeconds:l,normalizedVelocity:d,active:a>f&&s>p,completed:a>=1}},B=.92,V=.58,H=.92,ee=.72,te=.22,ne=.3,re=12,ie=7,ae=92,U=44,oe=10.5,se=.085,ce=.14,le=.045,W=.22,ue=12,de=18,G=1.05,K=.24,q=.1,J=220,Y=1.08,fe=.45,pe=.38,me=30,X={soft:{knee:.65,travel:1,rest:1,damping:1.4,pressRadius:.46,dent:.2,ring:.07,holdDent:.12,bulge:.085,kick:.65,poke:.7,stretch:.45,compression:.38},jelly:{knee:1.2,travel:3.1,rest:.95,damping:.48,pressRadius:.46,dent:.2,ring:.07,holdDent:0,bulge:.085,kick:1,poke:1,stretch:.45,compression:.38},marshmallow:{knee:.35,travel:.65,rest:.45,damping:1.3,pressRadius:.6,dent:.38,ring:.04,holdDent:1.2,bulge:.065,kick:.25,poke:.45,stretch:.26,compression:.38},pearl:{knee:.3,travel:.78,rest:2,damping:.85,pressRadius:.4,dent:.1,ring:.14,holdDent:0,bulge:.14,kick:.9,poke:.9,stretch:.26,compression:.45},holo:{knee:.32,travel:.58,rest:2.2,damping:1.25,pressRadius:.4,dent:.16,ring:.045,holdDent:0,bulge:.07,kick:.65,poke:.75,stretch:.4,compression:.3},chrome:{knee:.06,travel:.32,rest:2.3,damping:1.8,pressRadius:.26,dent:.12,ring:.02,holdDent:0,bulge:.085,kick:.3,poke:.35,stretch:.12,compression:.12}},he=(e,t,n)=>Math.min(n,Math.max(t,e)),Z=e=>he(e,0,1),Q=e=>{let t=Z(e);return t*t*(3-2*t)},$=class{vertices=[];triangleIndices;lineIndices;shape;pointerId=null;grabStartX=0;grabStartY=0;pointerX=0;pointerY=0;viewportFollowEnabled=!1;bodyOffsetX=0;bodyOffsetY=0;grabPointerStartX=0;grabPointerStartY=0;grabBodyStartX=0;grabBodyStartY=0;sheenX=0;sheenY=0;gestureX=0;gestureY=0;pressDepth=0;compression=0;previousCompression=0;previousSampleAt;normalizedVelocity=0;maxDisplacement=0;maxGestureCompression=0;squeezes=0;gestureDurationMs=0;second=null;pinchStartX=0;pinchStartY=0;multiTouch=!1;hadSecond=!1;stretch=0;stroking=0;motionSpeed=0;strokeGraceMs=0;previousPointerX=0;previousPointerY=0;material=`soft`;previousField=new Float32Array(578);capturedField=new Float32Array(578);foamMemory=new Float32Array(578);foamMemoryWeight=0;capturedX=0;capturedY=0;setTactileFeatures(e,t=`soft`){t!==this.material&&(this.foamMemoryWeight=0),this.multiTouch&&!e&&this.cancel(),this.multiTouch=e,this.material=t}pointerOwner(){return this.pointerId}constructor(e=O(`soft-square`),t=0){this.shape=e,this.previousSampleAt=t;let n=[],r=[];for(let e=0;e<=16;e+=1)for(let t=0;t<=16;t+=1){let n=t/16,r=e/16,i=n*2-1,a=r*2-1;this.vertices.push({restX:i,restY:a,x:i,y:a,vx:0,vy:0,u:n,v:r})}for(let e=0;e<16;e+=1)for(let t=0;t<16;t+=1){let r=e*17+t,i=r+1,a=r+17,o=a+1;n.push(r,a,i,i,a,o)}for(let e=0;e<=16;e+=1)for(let t=0;t<16;t+=1){let n=e*17+t;r.push(n,n+1)}for(let e=0;e<=16;e+=1)for(let t=0;t<16;t+=1){let n=t*17+e;r.push(n,n+17)}this.triangleIndices=new Uint16Array(n),this.lineIndices=new Uint16Array(r)}setShape(e){e.id!==this.shape.id&&(this.cancel(),this.bodyOffsetX=0,this.bodyOffsetY=0,this.shape=e)}resetTiming(e){this.previousSampleAt=e}setViewportFollowEnabled(e){!e&&this.viewportFollowEnabled&&this.pointerId===null&&this.recenterViewportFollow(),this.viewportFollowEnabled=e}viewportFollowOffset(){return{x:this.bodyOffsetX,y:this.bodyOffsetY}}recenterViewportFollow(){let e=this.bodyOffsetX,t=this.bodyOffsetY;if(this.cancel(),Math.hypot(e,t)>1e-5){let n=0,r=0;for(let i of this.vertices)i.x-=e,i.y-=t,n+=i.vx,r+=i.vy;n/=Math.max(1,this.vertices.length),r/=Math.max(1,this.vertices.length);for(let e of this.vertices)e.vx-=n,e.vy-=r}this.bodyOffsetX=0,this.bodyOffsetY=0,this.grabBodyStartX=0,this.grabBodyStartY=0}pointToUv(e,t){let n=e-this.bodyOffsetX,r=t-this.bodyOffsetY;return j(this.shape,n,r)?{u:Z(n*.5+.5),v:Z(r*.5+.5)}:null}surfacePointToUv(e,t,n=0){for(let n=0;n<this.triangleIndices.length;n+=3){let r=this.vertices[this.triangleIndices[n]],i=this.vertices[this.triangleIndices[n+1]],a=this.vertices[this.triangleIndices[n+2]],o=i.x-r.x,s=i.y-r.y,c=a.x-r.x,l=a.y-r.y,u=o*l-s*c;if(Math.abs(u)<1e-9)continue;let d=e-r.x,f=t-r.y,p=(d*l-f*c)/u,m=(o*f-s*d)/u;if(p<-1e-7||m<-1e-7||p+m>1+1e-7)continue;let h=r.u+(i.u-r.u)*p+(a.u-r.u)*m,g=r.v+(i.v-r.v)*p+(a.v-r.v)*m;if(j(this.shape,h*2-1,g*2-1))return{u:Z(h),v:Z(g)}}if(!(n>0))return null;let r=n**2,i=null;for(let n of v(this.shape))for(let a=0;a<n.length;a++){let o=n[a],s=n[(a+1)%n.length],c=this.projectUvToLocal(o.x*.5+.5,o.y*.5+.5),l=this.projectUvToLocal(s.x*.5+.5,s.y*.5+.5),u=l.x-c.x,d=l.y-c.y,f=Z(((e-c.x)*u+(t-c.y)*d)/Math.max(1e-9,u*u+d*d)),p=(e-c.x-u*f)**2+(t-c.y-d*f)**2;p<=r&&(r=p,i={u:(o.x+(s.x-o.x)*f)*.5+.5,v:(o.y+(s.y-o.y)*f)*.5+.5})}return i}projectUvToLocal(e,t){let n=Z(e)*16,r=Z(t)*16,i=Math.min(15,Math.floor(n)),a=Math.min(15,Math.floor(r)),o=Math.min(16,i+1),s=Math.min(16,a+1),c=n-i,l=r-a,u=this.vertices[a*17+i],d=this.vertices[a*17+o],f=this.vertices[s*17+i],p=this.vertices[s*17+o];return c+l<=1?{x:u.x+(d.x-u.x)*c+(f.x-u.x)*l,y:u.y+(d.y-u.y)*c+(f.y-u.y)*l}:{x:p.x+(f.x-p.x)*(1-c)+(d.x-p.x)*(1-l),y:p.y+(f.y-p.y)*(1-c)+(d.y-p.y)*(1-l)}}begin(e,t,n,r=0){let i=this.multiTouch?this.surfacePointToUv(t,n,r):this.pointToUv(t,n);if(!i)return!1;let a=i.u*2-1,o=i.v*2-1;return this.pointerId===null?(this.pointerId=e,this.grabStartX=a,this.grabStartY=o,this.pointerX=t,this.pointerY=n,this.grabPointerStartX=t,this.grabPointerStartY=n,this.grabBodyStartX=this.bodyOffsetX,this.grabBodyStartY=this.bodyOffsetY,this.captureField(),this.maxGestureCompression=0,this.gestureDurationMs=0,this.hadSecond=!1,this.previousPointerX=t,this.previousPointerY=n,this.motionSpeed=0,this.strokeGraceMs=0,this.sheenX+=(a-this.sheenX)*.55,this.sheenY+=(o-this.sheenY)*.55,!0):!this.multiTouch||this.second||e===this.pointerId||Math.hypot(t-this.pointerX,n-this.pointerY)<.12?!1:(this.second={id:e,x:t,y:n,startX:t,startY:n,anchorX:a,anchorY:o},this.pinchStartX=this.pointerX,this.pinchStartY=this.pointerY,this.hadSecond=!0,this.captureField(),!0)}move(e,t,n){if(e===this.second?.id){this.second.x=t,this.second.y=n;return}e===this.pointerId&&(this.pointerX=t,this.pointerY=n)}end(e,t=!1){if(this.second&&(e===this.pointerId||e===this.second.id))return e===this.pointerId&&(this.pointerId=this.second.id,this.pointerX=this.second.x,this.pointerY=this.second.y,this.grabStartX=this.second.anchorX,this.grabStartY=this.second.anchorY),this.second=null,this.grabPointerStartX=this.pointerX,this.grabPointerStartY=this.pointerY,this.grabBodyStartX=this.bodyOffsetX,this.grabBodyStartY=this.bodyOffsetY,this.captureField(),this.previousPointerX=this.pointerX,this.previousPointerY=this.pointerY,null;if(e!==this.pointerId)return null;let n=Math.hypot(this.pointerX-this.grabPointerStartX,this.pointerY-this.grabPointerStartY),r=t&&!this.hadSecond&&n<=q&&this.gestureDurationMs<=J,i=Z(Math.max(this.maxGestureCompression,this.pressDepth*W));i>=.08&&(this.squeezes+=1,(!r||!this.multiTouch)&&this.applyReleaseImpulse()),r&&this.applyPokeImpulse();let a=this.multiTouch&&this.material===`marshmallow`&&this.gestureDurationMs>350;if(this.cancel(),a){this.foamMemoryWeight=.25+.4*Q((this.gestureDurationMs-350)/1e3);for(let e=0;e<this.vertices.length;e++){let t=this.vertices[e];this.foamMemory[e*2]=t.x-t.restX-this.bodyOffsetX,this.foamMemory[e*2+1]=t.y-t.restY-this.bodyOffsetY}}return r?Math.max(i,.16):i}roomLoad={nx:0,ny:0,pressure:0,tension:0,ax:0,ay:0,gx:0,gy:-1,held:!1,spin:0};setRoomLoad(e,t,n,r,i,a,o,s,c=!1,l=0){this.roomLoad={nx:e,ny:t,pressure:Z(n),tension:Z(r),ax:i,ay:a,gx:o,gy:s,held:c,spin:l}}applyCollisionImpulse(e,t,n){let r=X[this.material];for(let i of this.vertices){let a=Math.max(0,-(i.restX*e+i.restY*t)),o=Math.min(.7,n)*r.poke*a*a*2.4;i.vx+=e*o,i.vy+=t*o}}applyPokeImpulse(){for(let e of this.vertices){let t=e.restX-this.grabStartX,n=e.restY-this.grabStartY,r=Math.hypot(t,n),i=Q(1-r/this.pressRadius())**2;if(i<=0)continue;let a=r>1e-4?1/r:0,o=r>1e-4?t*a:0,s=r>1e-4?n*a:1,c=Y*(this.multiTouch?X[this.material].poke:1)*i*(.55+this.pressDepth*.45);e.vx+=o*c,e.vy+=s*c}}cancel(){this.foamMemoryWeight=0,this.pointerId=null,this.second=null,this.stroking=0,this.stretch=0,this.motionSpeed=0,this.strokeGraceMs=0}grabRadius(){return B*(1-(this.multiTouch?Q((Math.hypot(this.grabStartX,this.grabStartY)-.4)/.55):0)*.28)}pressRadius(){return this.multiTouch?X[this.material].pressRadius:V}captureField(){this.capturedX=this.pointerX-this.bodyOffsetX-this.grabStartX,this.capturedY=this.pointerY-this.bodyOffsetY-this.grabStartY;for(let e=0;e<this.vertices.length;e++){let t=this.vertices[e];this.capturedField[e*2]=t.x-t.restX-this.bodyOffsetX,this.capturedField[e*2+1]=t.y-t.restY-this.bodyOffsetY}}resistedTravel(e){if(!this.multiTouch)return Math.min(e,H);let{knee:t,travel:n}=X[this.material];if(e<=t)return e;let r=n-t,i=e-t;return t+r*i/(r+i)}applyReleaseImpulse(){let e=this.pointerX-this.bodyOffsetX-this.grabStartX,t=this.pointerY-this.bodyOffsetY-this.grabStartY;this.multiTouch&&(e-=this.capturedX,t-=this.capturedY);let n=Math.hypot(e,t);if(n>0){let r=this.resistedTravel(n)/n;e*=r,t*=r}for(let n of this.vertices){let r=n.restX-this.grabStartX,i=n.restY-this.grabStartY,a=Math.hypot(r,i),o=Q(1-a/this.grabRadius())**2,s=Q(1-a/this.pressRadius())**2;if(n.vx-=e*o*G*(this.multiTouch?X[this.material].kick:1),n.vy-=t*o*G*(this.multiTouch?X[this.material].kick:1),a>1e-4){let e=this.pressDepth*s*K;n.vx+=r/a*e,n.vy+=i/a*e}}}advance(e,t){let n=Math.min(Math.max(.001,e/1e3),1/30),r=this.pointerId!==null;r&&(this.gestureDurationMs+=Math.max(0,e));let i=r?Math.hypot(this.pointerX-this.previousPointerX,this.pointerY-this.previousPointerY)/n:0;this.previousPointerX=this.pointerX,this.previousPointerY=this.pointerY,this.motionSpeed+=(i-this.motionSpeed)*(1-Math.exp(-10*n));let a=this.multiTouch&&r&&!this.second&&this.gestureDurationMs>180&&this.motionSpeed>.06&&this.motionSpeed<.8&&Math.hypot(this.pointerX-this.grabPointerStartX,this.pointerY-this.grabPointerStartY)<.32;this.strokeGraceMs=a?90:Math.max(0,this.strokeGraceMs-Math.max(0,e));let o=a||this.strokeGraceMs>0&&r&&!this.second&&this.motionSpeed<.8;this.stroking+=(+!!o-this.stroking)*(1-Math.exp(-8*n));let s=this.multiTouch&&this.material===`marshmallow`,c=this.multiTouch&&this.material===`jelly`,l=this.multiTouch&&this.material===`chrome`,u=X[this.material],d=this.multiTouch?u.rest:1,f=this.multiTouch?u.damping:1;this.foamMemoryWeight*=Math.exp(-Math.max(0,t-this.previousSampleAt)/1400),this.foamMemoryWeight<1e-4&&(this.foamMemoryWeight=0);let p=this.second,m=p?p.startX-this.pinchStartX:1,h=p?p.startY-this.pinchStartY:0,g=Math.max(.12,Math.hypot(m,h)),_=m/g,v=h/g,y=he(p?((p.x-this.pointerX)*_+(p.y-this.pointerY)*v)/g-1:0,-(this.multiTouch?u.compression:pe),this.multiTouch?u.stretch:fe);this.stretch=p?Math.max(0,y)/fe:0;let b=r&&this.viewportFollowEnabled&&!p?this.grabBodyStartX+(this.pointerX-this.grabPointerStartX)*te:p?this.bodyOffsetX:0,x=r&&this.viewportFollowEnabled&&!p?this.grabBodyStartY+(this.pointerY-this.grabPointerStartY)*te:p?this.bodyOffsetY:0,S=Math.hypot(b,x),C=l?.08:ne;if(S>C){let e=C/S;b*=e,x*=e}this.viewportFollowEnabled&&(x=Math.max(-.08,x));let w=Math.min(...this.shape.boundary.map(e=>e.y))-.1,T=1-Math.exp(-(r?re:ie)*n);this.bodyOffsetX+=(b-this.bodyOffsetX)*T,this.bodyOffsetY+=(x-this.bodyOffsetY)*T,!r&&Math.hypot(this.bodyOffsetX,this.bodyOffsetY)<5e-4&&(this.bodyOffsetX=0,this.bodyOffsetY=0);let E=r?this.pointerX-this.bodyOffsetX:this.grabStartX,D=r?this.pointerY-this.bodyOffsetY:this.grabStartY,O=p?this.pinchStartX+(this.pointerX+p.x-(this.pinchStartX+p.startX))*.5:this.pointerX,k=p?this.pinchStartY+(this.pointerY+p.y-(this.pinchStartY+p.startY))*.5:this.pointerY,A=r?O-this.bodyOffsetX-this.grabStartX:0,j=r?k-this.bodyOffsetY-this.grabStartY:0;r&&this.multiTouch&&(A-=this.capturedX,j-=this.capturedY);let M=Math.hypot(A,j);if(M>0){let e=this.resistedTravel(M)/M;A*=e,j*=e}let N=Math.hypot(A,j),P=1-Math.exp(-(r?ue:de)*n);this.pressDepth+=((r?1-this.stroking*.65:0)-this.pressDepth)*P;let F=r?Z(N/H):0,I=r?Z(Math.max(F,Math.abs(y),this.pressDepth*W)):0;r?this.compression=I:(this.compression+=(I-this.compression)*(1-Math.exp(-5.25*n)),this.compression<5e-4&&(this.compression=0)),this.maxGestureCompression=Math.max(this.maxGestureCompression,this.compression);let L=r&&N>.02?A/N:0,R=r&&N>.02?j/N:0,B=1-Math.exp(-(r?11:5)*n);this.gestureX+=(L-this.gestureX)*B,this.gestureY+=(R-this.gestureY)*B;let V=1-Math.exp(-(r?9:3)*n);this.sheenX+=((r?this.multiTouch?this.grabStartX:E:0)-this.sheenX)*V,this.sheenY+=((r?this.multiTouch?this.grabStartY:D:0)-this.sheenY)*V;let G=z(this.compression,this.previousCompression,t,this.previousSampleAt,{velocityForMax:4,minActiveProgress:.005,minActiveProgressDelta:5e-4});this.previousCompression=this.compression,this.previousSampleAt=t,this.normalizedVelocity=G.normalizedVelocity;let K=Math.max(1e-4,N),q=A/K,J=j/K;if(this.multiTouch)for(let e=0;e<this.vertices.length;e++){let t=this.vertices[e];this.previousField[e*2]=t.x-t.restX,this.previousField[e*2+1]=t.y-t.restY}let Y=0;for(let e=0;e<this.vertices.length;e++){let t=this.vertices[e],i=t.restX+this.bodyOffsetX,a=t.restY+this.bodyOffsetY,o=i,m=a,h=i,g=a;!r&&s&&this.foamMemoryWeight&&(h+=this.foamMemory[e*2]*this.foamMemoryWeight,g+=this.foamMemory[e*2+1]*this.foamMemoryWeight);let b=this.roomLoad,x=this.material===`jelly`?.62:this.material===`marshmallow`?.4:this.material===`soft`?.28:this.material===`pearl`?.16:this.material===`holo`?.12:.035;if(b.pressure||b.tension||b.held){let e=t.restX*b.nx+t.restY*b.ny,n=t.restX-e*b.nx,r=t.restY-e*b.ny,i=x*b.pressure,a=.65+Z(.5-e*.5)*.7,s=-b.nx*e*i*a+n*i*.65,c=-b.ny*e*i*a+r*i*.65;if(b.held){let e=t.restX-b.ax,n=t.restY-b.ay,r=Math.hypot(e,n),i=Math.min(1.8,r*r*.65);s+=x*(b.gx*i*.58+e*b.spin*.42),c+=x*(b.gy*i*.58+n*b.spin*.42);let a=Math.max(.001,Math.hypot(b.gx,b.gy)),o=b.gx/a,l=b.gy/a,u=e*-l+n*o,d=Math.min(.24,x*(a+b.spin)*.12);s-=-l*u*d,c-=o*u*d}else if(b.tension&&!b.spin){let e=Math.max(.001,Math.hypot(b.ax,b.ay)),n=e>.12?-b.ax/e:b.gx,r=e>.12?-b.ay/e:b.gy,i=(t.restX-b.ax)*n+(t.restY-b.ay)*r;s+=n*i*b.tension*x,c+=r*i*b.tension*x}h+=s,g+=c,o+=s,m+=c}let S=0;if(r){let n=t.restX-this.grabStartX,r=t.restY-this.grabStartY,i=Math.hypot(n,r),a=Q(1-i/this.grabRadius()),s=c&&!p?Q((N-.08)/.22):0,l=n*q+r*J,d=-n*J+r*q,f=Q(1+l/.9)**2*Math.exp(-((d/.52)**2)),_=a*a*(1-s)+f*s;if(this.multiTouch){let t=_+(1-_)*Math.exp(-this.gestureDurationMs/180);h+=this.capturedField[e*2]*t,g+=this.capturedField[e*2+1]*t,o=h,m=g}let v=this.pressRadius(),y=Q(1-i/v)**2,b=Q((this.gestureDurationMs-250)/1e3),x=this.multiTouch?u.dent*(1+u.holdDent*b):ce;if(S=Math.max(_,y*.9),o+=A*_*(1+s*.17)-n*y*this.pressDepth*x,m+=j*_*(1+s*.17)-r*y*this.pressDepth*x,i>1e-4){let e=n/i,t=r/i,a=Q(1-Math.abs(i-v*.72)/(v*.38))*this.pressDepth*(this.multiTouch?u.ring:le)*(1-y*.65);o+=e*a,m+=t*a}let C=Math.max(1e-4,Math.hypot(t.restX,t.restY)),w=t.restX/C,T=t.restY/C,E=1-Math.abs(w*q+T*J),D=F*(this.multiTouch?u.bulge:se)*E*(1-_*.75);if(o+=w*D,m+=T*D,this.multiTouch&&!p){let e=-n*J+r*q,t=F*.1*a;o+=J*e*t,m-=q*e*t}}if(p){let e=t.restX*_+t.restY*v,n=-t.restX*v+t.restY*_,r=(1+y)**-.5-1;o+=_*e*y-v*n*r,m+=v*e*y+_*n*r,S=Math.max(S,.65)}let C=Math.min(t.restY-.08,w);this.viewportFollowEnabled&&(m=Math.max(C,m));let T=r?ae+153*S:0,E=b.held||b.pressure>.01||b.spin>.01,D=p?me:oe*f*(E?.78:1),O=Math.exp(-(D*(.88+S*.12))*n),k=(o-t.x)*T+(h-t.x)*U*d,M=(m-t.y)*T+(g-t.y)*U*d,P=0,I=0;if(this.multiTouch){let t=0;for(let n=0;n<4;n++){if(n===0&&e%17==0||n===1&&e%17==16)continue;let r=e+(n===0?-1:n===1?1:n===2?-17:17);r<0||r>=this.vertices.length||(P+=this.previousField[r*2],I+=this.previousField[r*2+1],t++)}P=(P/t-this.previousField[e*2])*12,I=(I/t-this.previousField[e*2+1])*12}t.vx=(t.vx+(k+P)*n)*O,t.vy=(t.vy+(M+I)*n)*O,t.x+=t.vx*n,t.y+=t.vy*n;let L=t.x-i,R=t.y-a,z=Math.hypot(L,R),B=this.multiTouch&&c?3.1:l?.3:ee;if(z>B){let e=B/z;t.x=i+L*e,t.y=a+R*e,t.vx*=.55,t.vy*=.55}this.viewportFollowEnabled&&t.y<C&&(t.y=C,t.vy=Math.max(0,t.vy)),Y=Math.max(Y,Math.hypot(t.x-i,t.y-a))}let $=e=>{let t=.15*(2/16)**2;for(let n=0;n<this.triangleIndices.length;n+=3){let r=this.vertices[this.triangleIndices[n]],i=this.vertices[this.triangleIndices[n+1]],a=this.vertices[this.triangleIndices[n+2]],o=(i.restX-r.restX)*(1-e)+(i.x-r.x)*e,s=(i.restY-r.restY)*(1-e)+(i.y-r.y)*e,c=(a.restX-r.restX)*(1-e)+(a.x-r.x)*e,l=(a.restY-r.restY)*(1-e)+(a.y-r.y)*e;if(s*c-o*l<t)return!1}return!0};if(!$(1)){let e=0,t=1;for(let n=0;n<10;n++){let n=(e+t)*.5;$(n)?e=n:t=n}for(let t of this.vertices){let n=t.restX+this.bodyOffsetX,r=t.restY+this.bodyOffsetY;t.x=n+(t.x-n)*e,t.y=r+(t.y-r)*e,t.vx*=e,t.vy*=e}Y*=e}if(this.viewportFollowEnabled){let e=1/0;for(let t of this.shape.boundary)e=Math.min(e,this.projectUvToLocal((t.x+1)/2,(t.y+1)/2).y);let t=Math.max(0,w-e);if(t>0){for(let e of this.vertices)e.y+=t;this.bodyOffsetY+=t}}return this.maxDisplacement=Y,{active:r,compression:this.compression,pressDepth:this.pressDepth,normalizedVelocity:this.normalizedVelocity,tactileActive:G.active||this.stroking>.2,tactileProgress:Math.max(G.progress,this.stroking*.08),maxDisplacement:this.maxDisplacement,gestureX:this.gestureX,gestureY:this.gestureY,sheenX:this.sheenX,sheenY:this.sheenY,squeezes:this.squeezes,stretch:this.stretch,stroking:this.stroking,pointers:this.pointerId===null?0:this.second?2:1}}snapshot(){return{active:this.pointerId!==null,compression:this.compression,pressDepth:this.pressDepth,normalizedVelocity:this.normalizedVelocity,tactileActive:!1,tactileProgress:this.compression,maxDisplacement:this.maxDisplacement,gestureX:this.gestureX,gestureY:this.gestureY,sheenX:this.sheenX,sheenY:this.sheenY,squeezes:this.squeezes,stretch:this.stretch,stroking:this.stroking,pointers:this.pointerId===null?0:this.second?2:1}}},ge=`#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;
layout(location = 1) in vec2 aUv;

uniform vec2 uScale;
uniform vec2 uWorldOffset;
uniform float uMoldProgress;

out vec2 vUv;

float containAxis(float value) {
  const float freeEdge = 0.88;
  const float reserve = 0.08;
  float magnitude = abs(value);
  if (magnitude <= freeEdge) return value;
  float excess = magnitude - freeEdge;
  float contained = freeEdge + (reserve * excess) / (reserve + excess);
  return sign(value) * contained;
}

void main() {
  vUv = aUv;
  float mold = smoothstep(0.0, 1.0, clamp(uMoldProgress, 0.0, 1.0));
  vec2 stagePosition = aPosition;
  stagePosition.x *= 1.0 + mold * 0.075;
  stagePosition.y *= 1.0 - mold * 0.095;
  stagePosition.y -= mold * 0.018;

  // Keep even an aggressively stretched squishy recoverable. The normal motion range is
  // untouched; only the last 12% of clip-space gains progressively stronger resistance.
  vec2 clipPosition = stagePosition * uScale;
  clipPosition = vec2(containAxis(clipPosition.x), containAxis(clipPosition.y));
  gl_Position = vec4(clipPosition + uWorldOffset, 0.0, 1.0);
}
`,_e=(e={})=>{let t=e.edgeDarkening??.26,n=e.finalBodyLighting??``,r=e.extraUniforms??``,i=e.finalComposite??``,a=e.finalBodyAlpha??``;return`#version 300 es
precision highp float;

in vec2 vUv;

uniform sampler2D uShapeField;
uniform sampler2D uAppearanceTexture;
uniform bool uAppearanceEnabled;
uniform vec2 uPointerUv;
uniform vec2 uStrainDirection;
uniform vec2 uFillingDrift;
uniform vec3 uColorLow;
uniform vec3 uColorHigh;
uniform vec3 uSheenColor;
uniform vec3 uRimColor;
uniform float uCompression;
uniform float uPressDepth;
uniform float uFillingAmount;
uniform float uFillingStyle;
uniform float uFillProgress;
uniform float uMoldProgress;
uniform float uMaterialSeed;
uniform float uTranslucency;
uniform float uIridescence;
uniform float uRoughness;
uniform float uMetallic;
uniform float uPearlescence;
uniform float uCloudiness;
uniform bool uWireframePass;
uniform vec4 uCraftLight;
${r}

out vec4 outColor;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec3 spectralColor(float phase) {
  return 0.52 + 0.48 * cos(6.2831853 * (phase + vec3(0.00, 0.33, 0.67)));
}

vec2 fillingCell(vec2 uv, float seed, float style) {
  float pearl = step(1.5, style);
  float density = mix(10.4, 7.7, pearl);
  vec2 scaled = uv * density + vec2(seed * 3.1, seed * 5.7);
  return floor(scaled);
}

float beadField(vec2 uv, float seed, float amount, float style) {
  float pearl = step(1.5, style);
  float density = mix(10.4, 7.7, pearl);
  vec2 scaled = uv * density + vec2(seed * 3.1, seed * 5.7);
  vec2 cell = floor(scaled);
  vec2 local = fract(scaled) - 0.5;
  float occupiedThreshold = mix(0.34, 0.50, pearl);
  float occupied = step(occupiedThreshold, hash21(cell + seed * 17.0));
  vec2 jitter = vec2(
    hash21(cell + vec2(11.3, 7.1) + seed),
    hash21(cell + vec2(3.7, 19.9) + seed)
  ) - 0.5;
  jitter *= mix(0.34, 0.24, pearl);
  float distanceToCenter = length(local - jitter);
  float innerRadius = mix(0.095, 0.125, pearl);
  float outerRadius = mix(0.165, 0.215, pearl);
  float bead = 1.0 - smoothstep(innerRadius, outerRadius, distanceToCenter);

  float revealOrder = hash21(cell + vec2(29.1, 13.7) + seed * 43.0);
  float reveal = smoothstep(revealOrder, min(1.0, revealOrder + 0.075), clamp(amount, 0.0, 1.0));
  reveal *= smoothstep(0.0, 0.035, amount);
  return bead * occupied * reveal;
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float shapeField = texture(uShapeField, vUv).r;
  float shapeAlpha = 1.0 - smoothstep(0.49, 0.515, shapeField);
  if (shapeAlpha <= 0.001) discard;
  float shape = smoothstep(0.0, 0.5, shapeField);

  float fillProgress = clamp(uFillProgress, 0.0, 1.0);
  float meniscus = sin(vUv.x * 17.0 + uMaterialSeed * 9.0) * 0.010;
  meniscus += sin(vUv.x * 31.0 + uMaterialSeed * 21.0) * 0.004;
  float fillLine = mix(-0.08, 1.08, fillProgress) + meniscus;
  if (vUv.y > fillLine) discard;

  if (uWireframePass) {
    outColor = vec4(1.0, 1.0, 1.0, 0.22 * shapeAlpha);
    return;
  }

  float vertical = smoothstep(0.0, 1.0, vUv.y);
  vec3 base = mix(uColorLow, uColorHigh, vertical);
  if (uAppearanceEnabled) {
    vec4 appearance = texture(uAppearanceTexture, vUv);
    base = mix(base, appearance.rgb, clamp(appearance.a, 0.0, 1.0));
  }

  float authoredLuma = dot(base, vec3(0.2126, 0.7152, 0.0722));
  float authoredMax = max(base.r, max(base.g, base.b));
  float authoredMin = min(base.r, min(base.g, base.b));
  float authoredChroma = authoredMax - authoredMin;
  float lightSurface = smoothstep(0.68, 0.94, authoredLuma);
  float warmSurface = lightSurface * smoothstep(0.02, 0.22, (base.r + base.g) * 0.5 - base.b);

  float edge = smoothstep(0.5, 1.0, shape);
  base *= 1.0 - edge * ${t.toFixed(3)};

  // Translucent materials should read as dense gel rather than a white exposure pass.
  // Preserve authored colour, darken optical depth slightly, then add narrow internal
  // caustics and a stronger coloured rim. A future physical background can make the
  // alpha more transparent without having to rebuild the identity from scratch.
  float translucency = clamp(uTranslucency, 0.0, 1.0);
  float interior = 1.0 - edge;
  float opticalDepth = smoothstep(0.0, 1.0, interior);
  base *= 1.0 - translucency * (0.020 + opticalDepth * 0.040);
  base = mix(base, base * 0.965 + uSheenColor * 0.035, translucency * 0.14);
  // Give the genuinely see-through Jelly material a cool gummy tint without
  // washing Holo/Pearl/Chrome, which identify themselves through other lobes.
  float jellyIdentity = translucency
    * (1.0 - clamp(uIridescence, 0.0, 1.0))
    * (1.0 - clamp(uPearlescence, 0.0, 1.0))
    * (1.0 - clamp(uMetallic, 0.0, 1.0));
  float jellyColourProtection = smoothstep(0.10, 0.52, authoredChroma);
  float jellyTintWeight = jellyIdentity * mix(0.34, 0.10, jellyColourProtection);
  base = mix(base, vec3(0.34, 0.88, 0.84), jellyTintWeight);
  float jellyContrast = jellyIdentity * (0.075 + lightSurface * 0.070);
  base = clamp(vec3(0.5) + (base - vec3(0.5)) * (1.0 + jellyContrast), 0.0, 1.0);
  float gelWave = 0.5 + 0.5 * sin(
    (vUv.x * 1.72 + vUv.y * 1.08 + uMaterialSeed * 2.31 + uCompression * 0.12) * 6.2831853
  );
  float gelCaustic = pow(gelWave, 5.5) * interior * translucency;
  base += uSheenColor * gelCaustic * 0.045;
  // Broad softbox reflections make dense gel feel rounded and touchable.
  // They use the same UV/deformation field and leave opaque materials untouched.
  // A small strain-led shift lets the reflection glide across the stretched
  // body instead of becoming a static sticker. It reuses existing uniforms.
  vec2 reflectionShift = clamp(uStrainDirection, vec2(-1.0), vec2(1.0))
    * min(uCompression, 0.6) * 0.055;
  vec2 gelHighlightUv = vUv - vec2(0.34, 0.72) - reflectionShift;
  float gelSoftbox = exp(-dot(gelHighlightUv * vec2(9.0, 17.0), gelHighlightUv * vec2(9.0, 17.0)));
  vec2 gelBounceUv = vUv - vec2(0.70, 0.28) + reflectionShift * 0.65;
  float gelBounce = exp(-dot(gelBounceUv * vec2(13.0, 8.0), gelBounceUv * vec2(13.0, 8.0)));
  base = mix(base, uSheenColor, jellyIdentity * interior * (gelSoftbox * 0.34 + gelBounce * 0.09));
  base += uRimColor * edge * translucency * (0.25 + lightSurface * 0.04);

  float roughness = clamp(uRoughness, 0.0, 1.0);
  float cloudiness = clamp(uCloudiness, 0.0, 1.0);
  float cloudA = 0.5 + 0.5 * sin((vUv.x * 2.2 + vUv.y * 1.45 + uMaterialSeed * 1.7) * 6.2831853);
  float cloudB = 0.5 + 0.5 * sin((vUv.x * 4.7 - vUv.y * 3.1 + uMaterialSeed * 2.9) * 6.2831853);
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
  float marshmallowWrap = 1.0 - smoothstep(0.18, 0.82, length(vUv - vec2(0.5)) * 1.32);
  float marshmallowLuma = dot(base, vec3(0.2126, 0.7152, 0.0722));
  vec3 marshmallowPowder = mix(vec3(marshmallowLuma), marshmallowTint, 0.50);
  float marshmallowPowderWeight = marshmallowIdentity * (0.34 + marshmallowWrap * 0.18 + lightSurface * 0.06);
  base = mix(base, marshmallowPowder, clamp(marshmallowPowderWeight, 0.0, 0.56));
  base += marshmallowTint * marshmallowIdentity * (0.030 + edge * 0.085 + marshmallowWrap * 0.025);

  float iridescence = clamp(uIridescence, 0.0, 1.0);
  float spectralPhase = vUv.x * 0.78 + vUv.y * 0.44 + uMaterialSeed * 0.61 + uCompression * 0.18;
  float holoSweep = 0.5 + 0.5 * sin((vUv.x * 1.58 - vUv.y * 0.96 + uMaterialSeed * 0.93) * 6.2831853);
  float holoFine = 0.5 + 0.5 * sin((vUv.x * 3.35 + vUv.y * 1.70 + uMaterialSeed * 1.37) * 6.2831853);
  vec3 spectral = spectralColor(spectralPhase + holoFine * 0.07);
  float spectralWeight = iridescence * (0.13 + holoSweep * 0.29 + edge * 0.12 + warmSurface * 0.07);
  base = mix(base, spectral, spectralWeight);
  base += vec3(0.72, 0.90, 1.0) * iridescence * warmSurface * holoSweep * 0.025;

  float pearlescence = clamp(uPearlescence, 0.0, 1.0);
  float pearlBand = 0.5 + 0.5 * sin((vUv.x * 0.64 + vUv.y * 0.42 + uMaterialSeed * 0.71 + uCompression * 0.05) * 6.2831853);
  float pearlCross = 0.5 + 0.5 * sin((vUv.x * 0.38 - vUv.y * 0.58 + uMaterialSeed * 0.33) * 6.2831853);
  vec3 pearlRose = vec3(1.0, 0.62, 0.88);
  vec3 pearlCyan = vec3(0.48, 0.91, 1.0);
  vec3 pearlNacre = mix(pearlRose, pearlCyan, pearlBand);
  vec3 pearlSpectrum = mix(pearlNacre, spectralColor(spectralPhase * 0.42 + pearlCross * 0.12 + 0.10), 0.28);
  float pearlTintWeight = pearlescence * (0.34 + pearlBand * 0.22 + edge * 0.08 + lightSurface * 0.05);
  vec3 pearlSurface = mix(base * (0.985 + pearlCross * 0.020), pearlSpectrum, pearlTintWeight);
  base = mix(base, pearlSurface, pearlescence * (0.82 + edge * 0.08));
  float pearlSheen = pow(0.5 + 0.5 * sin(
    (vUv.x * 0.92 - vUv.y * 0.38 + uMaterialSeed * 0.81 + uCompression * 0.04) * 6.2831853
  ), 3.2);
  vec3 pearlSheenColor = mix(pearlRose, pearlCyan, 0.5 + 0.5 * sin(
    (vUv.x * 0.48 + vUv.y * 0.36 + uMaterialSeed * 0.57) * 6.2831853
  ));
  float nacreSweep = 0.5 + 0.5 * sin(
    (vUv.x * 0.72 + vUv.y * 0.22 + uMaterialSeed * 0.67 + uCompression * 0.03) * 6.2831853
  );
  vec3 nacreBand = mix(pearlRose, pearlCyan, nacreSweep);
  base = mix(base, mix(base, nacreBand, 0.56), pearlescence * (0.20 + edge * 0.06));
  base += pearlSheenColor * pearlescence * pearlSheen * (0.135 + edge * 0.024);

  float metallic = clamp(uMetallic, 0.0, 1.0);
  // Metallic keeps the authored hue. Two reflected bands provide the material
  // cue: a broad dark environment band plus one narrow tinted highlight.
  float metalBandA = 0.5 + 0.5 * sin((vUv.y * 1.22 + vUv.x * 0.28 + uMaterialSeed * 0.53 + uCompression * 0.10) * 6.2831853);
  float metalBandB = 0.5 + 0.5 * sin((vUv.y * 2.72 - vUv.x * 0.19 + uMaterialSeed * 0.91) * 6.2831853);
  float metalHighlight = pow(metalBandA, mix(14.0, 4.6, roughness));
  float metalDarkBand = pow(1.0 - metalBandB, 3.4);
  vec3 metalDark = base * mix(0.48, 0.27, metalDarkBand);
  vec3 metalMid = base * (0.76 + metalBandA * 0.10);
  vec3 metalLight = mix(base * 1.10, uSheenColor, 0.24);
  vec3 metalSurface = mix(metalMid, metalDark, 0.20 + metalDarkBand * 0.45);
  metalSurface = mix(metalSurface, metalLight, metalHighlight * 0.84);
  base = mix(base, metalSurface, metallic * 0.82);

  float fillAmount = clamp(uFillingAmount, 0.0, 1.0);
  float bead = beadField(vUv - uFillingDrift, uMaterialSeed, fillAmount, uFillingStyle);
  vec2 fillCell = fillingCell(vUv - uFillingDrift, uMaterialSeed, uFillingStyle);
  float beadShade = 0.78 + hash21(fillCell + uMaterialSeed * 31.0) * 0.22;
  float pearl = step(1.5, uFillingStyle);
  vec3 foamColor = mix(vec3(0.89, 0.92, 0.96), uSheenColor, 0.28) * beadShade;
  vec3 pearlTint = mix(vec3(0.94, 0.96, 1.0), spectralColor(hash21(fillCell) + uMaterialSeed), 0.28);
  vec3 beadColor = mix(foamColor, pearlTint * (0.90 + beadShade * 0.16), pearl);
  float fillReveal = 1.0 + translucency * (0.28 + interior * 0.40);
  float beadStrength = clamp(bead * mix(0.72, 0.84, pearl) * fillReveal, 0.0, 0.96);
  beadStrength *= mix(1.0, 0.38, metallic);
  base = mix(base, beadColor, beadStrength);
  base += uSheenColor * bead * pearl * (0.08 + translucency * 0.04) * mix(1.0, 0.42, metallic);
  base -= vec3(0.045) * bead * edge * (1.0 - pearl * 0.45);

  vec2 sheenDelta = vUv - uPointerUv;
  float directionAmount = clamp(length(uStrainDirection), 0.0, 1.0);
  vec2 strainDirection = directionAmount > 0.001 ? normalize(uStrainDirection) : vec2(1.0, 0.0);
  vec2 strainNormal = vec2(-strainDirection.y, strainDirection.x);
  float along = dot(sheenDelta, strainDirection);
  float across = dot(sheenDelta, strainNormal);
  float isotropicMetric = dot(sheenDelta, sheenDelta) * 18.0;
  float strainedMetric = along * along * 11.0 + across * across * 24.0;
  float sheenMetric = mix(isotropicMetric, strainedMetric, directionAmount * 0.78);
  sheenMetric *= mix(1.45, 0.58, roughness);
  float sheen = exp(-sheenMetric);
  sheen *= (0.09 + uCompression * 0.17 + uPressDepth * 0.035) * mix(1.14, 0.42, roughness);
  sheen *= 1.0 + metallic * 0.85 + pearlescence * 0.20;
  base += uSheenColor * sheen;

  float pressDistance = distance(vUv, uPointerUv);
  float dent = exp(-pressDistance * pressDistance * 52.0) * uPressDepth;
  base *= 1.0 - dent * 0.11;
  float pressRing = exp(-pow(pressDistance - 0.115, 2.0) * 180.0) * uPressDepth;
  // Keep the reaction visible around the finger, with a broad soft rim for
  // powdery materials and a narrower coloured reflection for gel/pearl.
  float touchSpread = mix(0.15, 0.21, roughness);
  float touchHalo = exp(-pow(pressDistance - touchSpread, 2.0)
    * mix(210.0, 115.0, roughness)) * min(uPressDepth, 1.0) * interior;
  base += uRimColor * pressRing * 0.075;
  base = mix(base, mix(base, uSheenColor, 0.32), touchHalo * mix(0.24, 0.09, roughness));

  float centerGlow = exp(-dot(p, p) * 1.7) * 0.07;
  base += uRimColor * centerGlow;

  float rim = smoothstep(0.68, 1.0, shape) * (1.0 - smoothstep(0.92, 1.0, shape));
  base += uRimColor * rim * (0.10 + uCompression * 0.10 + uMoldProgress * 0.06 + translucency * 0.07);

  float meniscusBand = 1.0 - smoothstep(0.0, 0.025, abs(vUv.y - fillLine));
  meniscusBand *= 1.0 - step(0.995, fillProgress);
  base += uSheenColor * meniscusBand * 0.12;

  ${n}
  // Opt-in owner lighting. A missing field preserves every legacy material pixel.
  if (uCraftLight.w > 0.5) {
    vec2 grad = vec2(texture(uShapeField, vUv + vec2(0.008,0.0)).r - texture(uShapeField, vUv - vec2(0.008,0.0)).r,
      texture(uShapeField, vUv + vec2(0.0,0.008)).r - texture(uShapeField, vUv - vec2(0.0,0.008)).r);
    vec3 normal = normalize(vec3((vUv - 0.5) * 1.3 + grad * 5.0, 0.72));
    vec3 lamp = normalize(vec3(uCraftLight.xy * 1.5, 1.0));
    float diffuse = max(0.0, dot(normal,lamp));
    float highlight = pow(max(0.0,dot(reflect(-lamp,normal),vec3(0.0,0.0,1.0))),mix(30.0,7.0,roughness));
    vec3 lampColor = uCraftLight.z > 2.5 ? vec3(0.84,0.91,1.0) : uCraftLight.z > 1.5 ? vec3(1.0,0.79,0.68) : uCraftLight.z > 0.5 ? vec3(1.0,0.86,0.94) : vec3(1.0,0.98,0.89);
    base *= 0.76 + diffuse * 0.26;
    base += lampColor * highlight * (0.10 + metallic * 0.18 + translucency * 0.10);
    base = mix(base, base * lampColor, 0.16);
  }
  ${i}
  // Dense gummy gel keeps a little room transmission without losing its
  // pastel pigment against the bright stage reflection.
  float bodyAlpha = mix(0.985, 0.78 + edge * 0.18, translucency);
  ${a}
  outColor = vec4(base, bodyAlpha * shapeAlpha);
}
`},ve=_e();export{F as a,E as c,O as d,v as f,P as h,$ as i,w as l,j as m,ve as n,I as o,k as p,ge as r,L as s,_e as t,N as u};