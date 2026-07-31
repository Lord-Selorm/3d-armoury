import*as T from'three'
import{OrbitControls}from'three/addons/controls/OrbitControls.js'
import{CSS2DRenderer,CSS2DObject}from'three/addons/renderers/CSS2DRenderer.js'
import{RGBELoader}from'three/addons/loaders/RGBELoader.js'
import{GLTFLoader}from'three/addons/loaders/GLTFLoader.js'
import{FBXLoader}from'three/addons/loaders/FBXLoader.js'

const sc=new T.Scene()
const bgCol=new T.Color(0x1e1913)

const cam=new T.PerspectiveCamera(50,innerWidth/innerHeight,0.1,120)
const DEF_POS=new T.Vector3(4.5,3.2,0),DEF_TGT=new T.Vector3(-0.2,1.2,0)
cam.position.copy(DEF_POS)

const rdr=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'})
rdr.setSize(innerWidth,innerHeight)
rdr.toneMapping=T.ACESFilmicToneMapping
rdr.toneMappingExposure=1.15
rdr.shadowMap.enabled=true
rdr.shadowMap.type=T.PCFSoftShadowMap
rdr.outputColorSpace=T.SRGBColorSpace
document.body.appendChild(rdr.domElement)

const ldr=new CSS2DRenderer()
ldr.setSize(innerWidth,innerHeight)
ldr.domElement.style.position='absolute';ldr.domElement.style.top='0px'
ldr.domElement.style.pointerEvents='none'
ldr.domElement.style.zIndex='11'
document.body.appendChild(ldr.domElement)

const ctrl=new OrbitControls(cam,rdr.domElement)
ctrl.target.copy(DEF_TGT)
ctrl.enableDamping=true;ctrl.dampingFactor=.05
ctrl.minPolarAngle=.15;ctrl.maxPolarAngle=Math.PI/2.05
ctrl.minDistance=1.5;ctrl.maxDistance=25
ctrl.update()

// ── MINIMAP (2D Canvas) ──
const mapC=document.getElementById('map'),mctx=mapC.getContext('2d')
const MW=320,MH=200
let _mapRacks=[]
function resizeMap(){
  const dpr=Math.min(devicePixelRatio,2)
  mapC.width=MW*dpr;mapC.height=MH*dpr
  mctx.scale(dpr,dpr)
}
resizeMap()
function mX(x){return(x+10)/20*MW}
function mZ(z){return(z+10.5)/21*MH}

// ── FLOOR (concrete texture) ──
const flrW=40,flrD=24
const fCan=document.createElement('canvas');fCan.width=1024;fCan.height=768
const fc=fCan.getContext('2d')
fc.fillStyle='#3a352c';fc.fillRect(0,0,1024,768)
for(let i=0;i<60000;i++){
  const x=Math.random()*1024,y=Math.random()*768
  const v=30+Math.random()*25
  fc.fillStyle=`rgba(${v},${v},${v},.35)`;fc.fillRect(x,y,Math.random()*3+1,Math.random()*3+1)
}
for(let i=0;i<200;i++){
  const x=Math.random()*1024,y=Math.random()*768
  fc.fillStyle=`rgba(25,20,14,${Math.random()*.08})`
  fc.fillRect(x,y,Math.random()*60+20,Math.random()*60+20)
}
// tile lines
fc.strokeStyle='rgba(40,40,50,.15)';fc.lineWidth=1
for(let i=0;i<16;i++){fc.beginPath();fc.moveTo(i*64,0);fc.lineTo(i*64,768);fc.stroke()}
for(let i=0;i<12;i++){fc.beginPath();fc.moveTo(0,i*64);fc.lineTo(1024,i*64);fc.stroke()}
// section labels
fc.font='bold 36px monospace';fc.textAlign='center';fc.textBaseline='middle'
fc.fillStyle='rgba(60,55,50,.08)';fc.fillText('R.D.F',512,384)
fc.fillStyle='rgba(50,55,65,.08)';fc.fillText('81 SIGNAL REG',422,384)
fc.fillStyle='rgba(55,50,45,.08)';fc.fillText('SOUTHERN COMMAND',320,384)
const fTex=new T.CanvasTexture(fCan)
fTex.wrapS=fTex.wrapT=T.RepeatWrapping
fTex.repeat.set(8,6);fTex.anisotropy=8
const floorMat=new T.MeshPhysicalMaterial({map:fTex,roughness:.85,metalness:.05,envMapIntensity:.2})
const flr=new T.Mesh(new T.PlaneGeometry(flrW,flrD),floorMat)
flr.rotation.x=-Math.PI/2;flr.receiveShadow=true;flr.position.y=-.01;flr.userData.isFloor=true;sc.add(flr)

// ── RAISED PLATFORMS (elevation) ──
const platMat=new T.MeshPhysicalMaterial({color:'#3a362c',roughness:.9,metalness:0})
const rowsX=[0,-3.5,-7.5]
rowsX.forEach(x=>{
  const pw=2.4,pd=10.5,ph=.08
  const plat=new T.Mesh(new T.BoxGeometry(pw,ph,pd),platMat)
  plat.position.set(x,ph/2,0)
  plat.receiveShadow=true;plat.castShadow=true
  sc.add(plat)
  // beveled edge
  const edge=new T.Mesh(new T.BoxGeometry(pw+.02,.01,pd+.02),new T.MeshPhysicalMaterial({color:'#4a443a',roughness:.95,metalness:0}))
  edge.position.set(x,.01,0)
  sc.add(edge)
})

// ── LIGHTING ──
const ambient=new T.AmbientLight(0xfff0e0,.45);sc.add(ambient)
const kl=new T.DirectionalLight(0xffe8cc,7)
kl.position.set(10,14,6);kl.castShadow=true
kl.shadow.mapSize.set(4096,4096)
kl.shadow.camera.near=.5;kl.shadow.camera.far=24
kl.shadow.camera.left=-16;kl.shadow.camera.right=16
kl.shadow.camera.top=14;kl.shadow.camera.bottom=-6
kl.shadow.bias=-.0008;kl.shadow.normalBias=.02
sc.add(kl)
const fl1=new T.DirectionalLight(0xe8dcf0,2)
fl1.position.set(-8,10,-6);fl1.castShadow=true
fl1.shadow.mapSize.set(2048,2048)
fl1.shadow.camera.near=.5;fl1.shadow.camera.far=20
fl1.shadow.camera.left=-12;fl1.shadow.camera.right=12
fl1.shadow.camera.top=10;fl1.shadow.camera.bottom=-4
fl1.shadow.bias=-.0005;fl1.shadow.normalBias=.01
sc.add(fl1)
const rimL=new T.DirectionalLight(0xffe0b8,2.5);rimL.position.set(5,8,8);sc.add(rimL)
const blimL=new T.DirectionalLight(0xffd8a8,4);blimL.position.set(0,3,-5);sc.add(blimL)
const scl=new T.DirectionalLight(0xffdcb0,3);scl.position.set(0,5,-8);sc.add(scl)
const flimL=new T.DirectionalLight(0xf0e0f8,.6);flimL.position.set(0,1.5,5);sc.add(flimL)
const bncL=new T.DirectionalLight(0xa09080,1);bncL.position.set(0,-2,0);sc.add(bncL)
for(let x=-1;x<=1;x+=2)
  for(let z=-1;z<=1;z+=2){
    const wl=new T.DirectionalLight(0xfff8f0,.5);wl.position.set(x*5,3,z*3);sc.add(wl)
  }
const km=new T.Mesh(new T.SphereGeometry(.06,8,6),new T.MeshBasicMaterial({color:'#ffd0a0'}))
km.position.copy(kl.position);sc.add(km)

// ── FLICKERING CEILING LIGHTS ──
const flickerLights=[]
for(let i=0;i<8;i++){
  const px=(Math.random()-.5)*16, pz=(Math.random()-.5)*20
  const l=new T.PointLight(0xffeecc,7+Math.random()*3,16)
  l.position.set(px,4.2,pz)
  l.userData={baseInt:l.intensity,phase:Math.random()*100,spd:.3+Math.random()*.5}
  sc.add(l),flickerLights.push(l)
  const bMat=new T.MeshBasicMaterial({color:'#ffddaa'})
  const bulb=new T.Mesh(new T.SphereGeometry(.09,12,10),bMat)
  bulb.position.set(px,4.2,pz);sc.add(bulb)
  const gCan=document.createElement('canvas');gCan.width=64;gCan.height=64
  const gcx=gCan.getContext('2d')
  const grd=gcx.createRadialGradient(32,32,2,32,32,30)
  grd.addColorStop(0,'rgba(255,220,160,1)');grd.addColorStop(1,'rgba(255,220,160,0)')
  gcx.fillStyle=grd;gcx.fillRect(0,0,64,64)
  const glow=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(gCan),transparent:true,blending:T.AdditiveBlending,depthWrite:false}))
  glow.position.set(px,4.2,pz);glow.scale.set(.5,.5,1);sc.add(glow)
  const hMat=new T.MeshPhysicalMaterial({color:'#2b2622',roughness:.6,metalness:.4,envMapIntensity:.4})
  const housing=new T.Mesh(new T.CylinderGeometry(.15,.2,.06,12),hMat)
  housing.position.set(px,4.26,pz);sc.add(housing)
}
// ── GROUND REFLECTION (envMap sheen on floor) ──
const shedMat=new T.MeshPhysicalMaterial({
  color:'#221d16',roughness:.35,metalness:.85,transparent:true,opacity:.03,
  envMapIntensity:.2,depthWrite:false
})
const shedPlane=new T.Mesh(new T.PlaneGeometry(flrW,flrD),shedMat)
shedPlane.rotation.x=-Math.PI/2;shedPlane.position.y=.003;sc.add(shedPlane)

// ── MATERIALS ──
function mkWoodTex(base,rng,w){
  const c=document.createElement('canvas');c.width=256;c.height=w||128
  const cx=c.getContext('2d')
  for(let y=0;y<c.height;y++){
    const l=base+Math.sin(y*.08)*rng*.3+(Math.random()-.5)*rng*.2
    cx.fillStyle=`rgb(${l|0},${(l*.85)|0},${(l*.6)|0})`
    cx.fillRect(0,y,c.width,1)
  }
  for(let i=0;i<3;i++){
    const kx=Math.random()*c.width,ky=Math.random()*c.height
    cx.fillStyle=`rgba(0,0,0,.08)`;cx.beginPath();cx.ellipse(kx,ky,6+Math.random()*8,3+Math.random()*4,Math.random()*.5,0,Math.PI*2);cx.fill()
  }
  const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping
  t.repeat.set(2,1);t.anisotropy=4
  return t
}
const wdTex=mkWoodTex(90,25)
const wlTex=mkWoodTex(125,20)
const wkTex=mkWoodTex(75,20,64)
const wd=new T.MeshPhysicalMaterial({map:wdTex,color:0xd8c8a0,roughness:.85,metalness:0,clearcoat:.06,clearcoatRoughness:.4})
const wl=new T.MeshPhysicalMaterial({map:wlTex,color:0xe4d8b8,roughness:.78,metalness:0,clearcoat:.05,clearcoatRoughness:.5})
const wk=new T.MeshPhysicalMaterial({map:wkTex,color:0xb8a488,roughness:.9,metalness:0})

// ── BEAM HELPER ──
const _v=new T.Vector3()
function bm(g,x1,y1,z1,x2,y2,z2,t,mat){
  const dx=x2-x1,dy=y2-y1,dz=z2-z1
  const l=Math.sqrt(dx*dx+dy*dy+dz*dz)
  if(l<.001)return
  const m=new T.Mesh(new T.BoxGeometry(t||.025,t||.025,l),mat||wd)
  m.position.set((x1+x2)/2,(y1+y2)/2,(z1+z2)/2)
  if(dx||dy||dz)m.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),_v.set(dx,dy,dz).normalize())
  m.castShadow=m.receiveShadow=true
  g.add(m)
}

// ── A-FRAME RACK ──
const SLOT=.066,AB=.025
function mkRack(a1N,a2N){
  const W=Math.max(Math.max(a1N,1),Math.max(a2N,1))*SLOT+AB*2
  const H=2.0,D=.62
  const g=new T.Group()
  for(let s=-1;s<=1;s+=2){
    const ex=s*W/2
    bm(g,ex,.02,0,ex,H*.9,0,AB,wk)
    bm(g,ex,.02,-D,ex,H*.9,0,AB,wk)
    bm(g,ex,.02,D,ex,H*.9,0,AB,wk)
    bm(g,ex,.02,-D,ex,.02,D,AB,wd)
  }
  bm(g,-W/2+AB*.8,H*.92,0,W/2-AB*.8,H*.92,0,.028,wd)
  for(let i=1;i<=4;i++){
    const t=i/5,y=t*H*.88
    bm(g,-W/2+AB*.8,y,-D*(1-t),W/2-AB*.8,y,-D*(1-t),.01,wl)
  }
  for(let i=1;i<=4;i++){
    const t=i/5,y=t*H*.88
    bm(g,-W/2+AB*.8,y,D*(1-t),W/2-AB*.8,y,D*(1-t),.01,wl)
  }
  const a1W=W-AB*2
  if(a1N>0)for(let i=0;i<=a1N;i++){
    const x=-W/2+AB+i*a1W/a1N
    bm(g,x,.02,-D,x,H*.78,-D*.22,.005,wd)
  }
  const a2W=W-AB*2
  if(a2N>0)for(let i=0;i<=a2N;i++){
    const x=-W/2+AB+i*a2W/a2N
    bm(g,x,.02,D,x,H*.78,D*.22,.005,wd)
  }
  return g
}

// ── RACK DATA ──
const secs=[
  {name:'R.D.F',color:'#d4b898',racks:[
    {a1:20,a2:20,gun:'m16'},{a1:23,a2:23,gun:'m16'},{a1:20,a2:20,gun:'m16s'}
  ]},
  {name:'81 Signal Reg',color:'#b8c8d8',racks:[
    {a1:39,a2:39,gun:{a1:'m16',a2:'cq'}},{a1:15,a2:0,gun:'ak47'}
  ]},
  {name:'Southern Command',color:'#c8b8a8',racks:[
    {a1:19,a2:19,gun:'cq'},{a1:22,a2:22,gun:'cq'},{a1:21,a2:21,gun:'cq'},
    {a1:22,a2:22,gun:'cq'},    {a1:19,a2:19,gun:'g3'},{a1:19,a2:19,gun:'g3'},
    {a1:22,a2:22,gun:'m16'},{a1:20,a2:0,gun:{a1:[{type:'ak47',count:10},{type:'uzi',count:10}]}},{a1:20,a2:20,gun:'m16'},
    {a1:20,a2:0,gun:{a1:[{type:'sr25',count:7},{type:'negev',count:7},{type:'m60',count:6}]}},{a1:9,a2:0,gun:{a1:[{type:'mg42',count:3},{type:'c90',count:3},{type:'rpg',count:3}]}},{a1:10,a2:10,gun:{a1:'sr25',a2:'m16'}}
  ]}
]

function mkLabel(text,cls,color){
  const d=document.createElement('div')
  d.textContent=text;d.className='label-2d '+cls
  if(color)d.style.color=color
  return new CSS2DObject(d)
}

let _loadingState=false, _psave=()=>{}, _pupdate=()=>{}, _wireframe=false

// ── ANIMATION / LOG / BADGE / MAP ──
let _anims=[]
// ── INSPECT (COD-style loadout viewer) ──
let _inspect=null,_inspBg=null,_dragStart=null
function startInspect(gunW,rack){
  if(_inspect)endInspect()
  sc.children.forEach(c=>{if(c.userData?.isFloor)c.visible=false})
  _inspBg=sc.background;sc.background=new T.Color(0x080810)

  const gSc=new T.Scene()
  const gCam=new T.PerspectiveCamera(30,innerWidth/innerHeight,0.1,8)
  gCam.position.set(0,.4,2.2);gCam.lookAt(0,0,0)
  gSc.add(new T.AmbientLight(0xfff5ee,.5))
  const kl=new T.DirectionalLight(0xfff0e0,14);kl.position.set(2,3,5);gSc.add(kl)
  const fl=new T.DirectionalLight(0x8888ff,.4);fl.position.set(-3,1,-4);gSc.add(fl)

  const clone=gunW.children[0].clone(true)
  clone.rotation.z=-Math.PI/2
  clone.scale.multiplyScalar(1.15)
  gSc.add(clone)

  const gRdr=new T.WebGLRenderer({
    canvas:document.getElementById('inspGun'),
    antialias:true,alpha:true,powerPreference:'high-performance'
  })
  gRdr.setSize(innerWidth,innerHeight)
  gRdr.setPixelRatio(Math.min(devicePixelRatio,2))
  gRdr.toneMapping=T.ACESFilmicToneMapping;gRdr.toneMappingExposure=.8

  document.getElementById('inspBlur').style.display='block'
  document.getElementById('inspGun').style.display='block'

  const rd=rack.userData,side=gunW.userData.side
  const gn=rd.rackId+' '+side+' #'+(gunW.userData.slot+1)
  const g=gunW.userData.gunType||(side==='A1'?rd.gunA1:rd.gunA2)
  const mName=g==='ak47'?'AK-47':g==='uzi'?'Uzi':g==='sr25'?'SR-25 (.22)':g==='negev'?'IWI Negev NG5':g==='m60'?'M60':g==='mg42'?'MG42':g==='c90'?'Instalaza C90':g==='rpg'?'RPG-7':g==='cq'?'M4A1 CQ16':g==='m16s'?'M16 (Short)':g==='g3'?'G3A3':'M16A4'
  const cal=g==='ak47'?'7.62×39mm':g==='uzi'?'9×19mm':g==='sr25'?'5.56×45mm':g==='negev'?'5.56×45mm':g==='m60'?'7.62×51mm':g==='mg42'?'7.92×57mm':g==='c90'?'90mm':g==='rpg'?'40mm':g==='g3'?'7.62×51mm':'5.56×45mm'
  const weight=g==='ak47'?'3.4 kg':g==='uzi'?'3.5 kg':g==='sr25'?'3.5 kg':g==='negev'?'7.5 kg':g==='m60'?'10.5 kg':g==='mg42'?'11.6 kg':g==='c90'?'5.1 kg':g==='rpg'?'6.3 kg':g==='g3'?'4.4 kg':'3.2 kg'
  const el=document.getElementById('inspInfo')
  el.style.display='block'
  el.innerHTML=`<b>${mName}</b><div style="display:flex;gap:14px;margin:4px 0;font-size:11px;color:#887a66"><span>📏 ${cal}</span><span>⚖ ${weight}</span></div><span style="font-size:11px;color:#6a6a7a">${gn} · Drag to rotate · Esc to exit</span>`

  _inspect={gSc,gCam,gRdr,clone,gunW,rack}
  ldr.domElement.style.display='none'
  ctrl.enabled=false
}
function endInspect(){
  if(!_inspect)return
  document.getElementById('inspBlur').style.display='none'
  document.getElementById('inspGun').style.display='none'
  document.getElementById('inspInfo').style.display='none'
  _inspect.gRdr.dispose()
  _inspect=null
  ldr.domElement.style.display=''
  ctrl.enabled=true
  sc.children.forEach(c=>{if(c.userData?.isFloor)c.visible=true})
  sc.background=_inspBg
}
function processAnims(){
  for(let i=_anims.length-1;i>=0;i--){
    const a=_anims[i];a.t+=.3
    if(a.t>=1){
      if(a.rmv!==false&&a.gw.parent)a.gw.parent.remove(a.gw)
      _anims.splice(i,1);continue
    }
    const ee=a.t*a.t*(3-2*a.t)
    a.gw.position.z=a.pSz+(a.pEz-a.pSz)*ee
    if(a.sSz!=null)a.gw.scale.setScalar(a.sSz+(a.sEz-a.sSz)*ee)
  }
}
const _log=[]
function addLog(msg){_log.push({msg,t:Date.now()})}
function updateBadge(){
  const e=document.getElementById('badge'),r=document.getElementById('rst')
  let n=0
  sc.children.forEach(c=>{if(c.userData?.isRack)n+=c.userData._rem?.length||0})
  e.style.display=n?'block':'none';r.style.display=n?'block':'none'
  document.getElementById('exportBtn').style.display=_log.length?'block':'none'
  e.innerHTML=n?` <b>${n}</b> gun${n>1?'s':''} checked out`:''
}
function drawMap(){
  const w=MW,h=MH
  mctx.clearRect(0,0,w,h)
  const bg=mctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w*.6)
  bg.addColorStop(0,'#141420');bg.addColorStop(1,'#08080e')
  mctx.fillStyle=bg;mctx.fillRect(0,0,w,h)
  for(let i=-10;i<=10;i++){const x=mX(i);mctx.strokeStyle='rgba(50,50,70,.12)';mctx.lineWidth=.5;mctx.beginPath();mctx.moveTo(x,0);mctx.lineTo(x,h);mctx.stroke()}
  for(let i=-10;i<=10;i++){const y=mZ(i);mctx.strokeStyle='rgba(50,50,70,.12)';mctx.lineWidth=.5;mctx.beginPath();mctx.moveTo(0,y);mctx.lineTo(w,y);mctx.stroke()}
  const secs=[{x:0,l:'R.D.F',c:'#d4b898'},{x:-3.5,l:'81 SIG',c:'#b8c8d8'},{x:-7.5,l:'SOUTH',c:'#c8b8a8'}]
  secs.forEach(s=>{
    const x=mX(s.x)
    mctx.fillStyle=s.c+'12';mctx.fillRect(x-9,2,46,h-4)
    mctx.strokeStyle=s.c+'25';mctx.lineWidth=.5;mctx.strokeRect(x-9,2,46,h-4)
    mctx.fillStyle=s.c;mctx.font='bold 10px monospace';mctx.textAlign='center';mctx.textBaseline='middle'
    mctx.save();mctx.translate(x+24,h/2);mctx.rotate(Math.PI/2)
    mctx.globalAlpha=.6;mctx.fillText(s.l,0,0);mctx.globalAlpha=1;mctx.restore()
  })
  _mapRacks.forEach(r=>{
    const rd=r.userData
    const x=mX(r.x-r.w/2),y=mZ(r.z-r.d/2)
    const pw=mX(r.x+r.w/2)-x,ph=mZ(r.z+r.d/2)-y
    const tot=rd.a1+rd.a2,rem=(rd.a1Rem||0)+(rd.a2Rem||0),missing=tot-rem
    const ratio=rem/tot
    let col, blink
    if(missing===0){col='#30b860';blink=false}
    else if(missing===tot){col='#ee3333';blink=true}
    else if(ratio<.25){col='#e06840';blink=true}
    else{col='#d0a840';blink=true}
    if(blink&&Date.now()%600<300)col='#441111'
    mctx.fillStyle='rgba(16,16,26,.85)'
    mctx.strokeStyle=col;mctx.lineWidth=1.5
    mctx.beginPath();mctx.roundRect(x,y,pw,ph,3);mctx.fill();mctx.stroke()
    mctx.strokeStyle='rgba(100,90,80,.3)';mctx.lineWidth=.5
    mctx.beginPath();mctx.moveTo(mX(r.x),y+2);mctx.lineTo(mX(r.x),y+ph-2);mctx.stroke()
    mctx.fillStyle=col+'55'
    mctx.font='6px monospace';mctx.textAlign='right';mctx.textBaseline='middle'
    mctx.fillText(rd.rackId,x-2,y+ph/2)
    const maxN=Math.max(rd.a1,rd.a2),slotH=ph/maxN
    const ax=mX(r.x-.29),bx=mX(r.x+.29)
    for(let s=0;s<rd.a1;s++){
      const dy=y+slotH*(s+.5)
      const co=rd._rem?.some(g=>g.userData.side==='A1'&&g.userData.slot===s)
      mctx.fillStyle=co?'#cc3333':'#44cc66'
      mctx.beginPath();mctx.arc(ax,dy,1.3,0,Math.PI*2);mctx.fill()
    }
    for(let s=0;s<rd.a2;s++){
      const dy=y+slotH*(s+.5)
      const co=rd._rem?.some(g=>g.userData.side==='A2'&&g.userData.slot===s)
      mctx.fillStyle=co?'#cc3333':'#44cc66'
      mctx.beginPath();mctx.arc(bx,dy,1.3,0,Math.PI*2);mctx.fill()
    }
  })
}
function resetAll(){
  if(!confirm('Restore every gun to its rack?'))return
  sc.children.forEach(c=>{
    if(!c.userData?.isRack)return
    const rd=c.userData
    while(rd._rem&&rd._rem.length)restoreGun(c)
  });clearAllTimers()
}
document.getElementById('rst').onclick=resetAll

// ── QR CODE ──
function drawQR(text){
  const c=document.getElementById('qrcode'),ctx=c.getContext('2d')
  ctx.fillStyle='#fff';ctx.fillRect(0,0,144,144)
  if(!text)return
  const n=text.length,nx=Math.ceil(Math.sqrt(n*8)),sz=144/nx,off=(144-nx*sz)/2
  for(let i=0;i<nx*nx;i++){
    const v=i<n*8?(text.charCodeAt(Math.floor(i/8))>>(7-i%8))&1:Math.random()>.5?1:0
    if(v){ctx.fillStyle='#222';ctx.fillRect(off+(i%nx)*sz,off+Math.floor(i/nx)*sz,sz,sz)}
  }
  function corner(x,y){ctx.fillStyle='#222';ctx.fillRect(x,y,sz*7,sz*7);ctx.fillStyle='#fff';ctx.fillRect(x+sz,y+sz,sz*5,sz*5);ctx.fillStyle='#222';ctx.fillRect(x+sz*2,y+sz*2,sz*3,sz*3)}
  corner(off,off);corner(off+nx*sz-sz*7,off);corner(off,off+nx*sz-sz*7)
}
let _qrRack=null
function updateQR(rackId){
  if(rackId){drawQR(rackId);document.getElementById('qrcode').style.display='block';_qrRack=rackId}
  else{document.getElementById('qrcode').style.display='none';_qrRack=null}
}

// ── AMBIENT SOUNDS ──
let _audioCtx=null,_audioNodes=null
function initAudio(){
  if(_audioCtx)return
  _audioCtx=new(window.AudioContext||window.webkitAudioContext)()
  const hum=_audioCtx.createOscillator();hum.type='sawtooth';hum.frequency.value=55
  const hGain=_audioCtx.createGain();hGain.gain.value=.015
  const hFilter=_audioCtx.createBiquadFilter();hFilter.type='lowpass';hFilter.frequency.value=120
  hum.connect(hFilter);hFilter.connect(hGain);hGain.connect(_audioCtx.destination);hum.start()
  const bufSize=_audioCtx.sampleRate*2,buf=_audioCtx.createBuffer(1,bufSize,_audioCtx.sampleRate)
  const d=buf.getChannelData(0)
  for(let i=0;i<bufSize;i++)d[i]=(Math.random()*2-1)*.04
  const noise=_audioCtx.createBufferSource();noise.buffer=buf;noise.loop=true
  const nGain=_audioCtx.createGain();nGain.gain.value=.008
  const nFilter=_audioCtx.createBiquadFilter();nFilter.type='bandpass';nFilter.frequency.value=400;nFilter.Q.value=.5
  noise.connect(nFilter);nFilter.connect(nGain);nGain.connect(_audioCtx.destination);noise.start()
  _audioNodes={hum,hGain,noise,nGain}
}
document.addEventListener('click',()=>initAudio(),{once:true})

// ── MAIN BUILD ──
const gltf=new GLTFLoader()
const rgl=new RGBELoader()

function loadGLB(u){return new Promise((res,rej)=>gltf.load(u,res,()=>{},rej))}
function loadHDR(u){return new Promise((res,rej)=>rgl.load(u,res,()=>{},rej))}
function loadFBX(u){
  const loader=new FBXLoader()
  return new Promise((res,rej)=>loader.load(u,res,()=>{},rej))
}
function makeWarmEnv(){
  const w=1024,h=512
  const c=document.createElement('canvas');c.width=w;c.height=h
  const x=c.getContext('2d')
  const g=x.createLinearGradient(0,0,0,h)
  g.addColorStop(0,'#3a2c1c')
  g.addColorStop(.35,'#4a3826')
  g.addColorStop(.48,'#5a4430')
  g.addColorStop(.5,'#3a2c1e')
  g.addColorStop(.65,'#2c2118')
  g.addColorStop(1,'#1e1712')
  x.fillStyle=g;x.fillRect(0,0,w,h)
  for(let i=0;i<6;i++){
    const lx=Math.random()*w,ly=20+Math.random()*80,r=40+Math.random()*60
    const rg=x.createRadialGradient(lx,ly,0,lx,ly,r)
    rg.addColorStop(0,'rgba(255,220,160,.9)')
    rg.addColorStop(1,'rgba(255,220,160,0)')
    x.fillStyle=rg;x.fillRect(lx-r,ly-r,r*2,r*2)
  }
  const t=new T.CanvasTexture(c)
  t.mapping=T.EquirectangularReflectionMapping
  t.colorSpace=T.SRGBColorSpace
  return t
}
function applyTex(group,texDir,names){
  const tl=new T.TextureLoader()
  const tex={}
  Object.entries(names).forEach(([key,name])=>{
    try{tex[key]=tl.load(texDir+name)}catch(e){}
  })
  group.traverse(c=>{
    if(!c.isMesh||!c.material)return
    const mats=Array.isArray(c.material)?c.material:[c.material]
    mats.forEach(m=>{Object.assign(m,tex);m.needsUpdate=true})
  })
}

const loadAll=Promise.all([loadGLB('models/m16.glb'),loadGLB('models/ak47.glb'),loadGLB('models/uzi.glb'),loadGLB('models/sr25.glb'),loadGLB('models/negev.glb'),loadGLB('models/m60.glb'),loadGLB('models/mg42.glb'),loadGLB('models/c90.glb'),loadGLB('models/rpg7.glb'),loadFBX('models/m4a1_oga/M4A1.fbx').then(g=>{applyTex(g,'models/m4a1_oga/',{map:'M4A1_Base_Color.png',normalMap:'M4A1_Normal.png',metalnessMap:'M4A1_Metallic.png',roughnessMap:'M4A1_Roughness.png'});return g}),loadFBX('models/g3_model/Gun.fbx').then(g=>{applyTex(g,'models/g3_model/',{map:'Texture_Base_Color.png',normalMap:'Texture_Normal.png',metalnessMap:'Texture_Metallic.png',roughnessMap:'Texture_Roughness.png',aoMap:'Texture_Mixed_AO.png'});g.traverse(c=>{if(c.isMesh&&c.material){const m=Array.isArray(c.material)?c.material:[c.material];m.forEach(m=>{m.color=new T.Color(0x2e2e2e);m.roughness=.5;m.metalness=.4;m.envMapIntensity=1.2})}});return g}),makeWarmEnv()])
const loadTimeout=new Promise(res=>setTimeout(()=>res('TIMEOUT'),15000))

Promise.race([loadAll,loadTimeout]).then(v=>{
  if(v==='TIMEOUT'){document.getElementById('load').innerHTML='<span style="color:#c04040">TIMEOUT</span>';return}
  const [m16g,ak47g,uzig,sr25g,negevg,m60g,mg42g,c90g,rpgg,m4a1g,g3g,hdr]=v
  const isFbx=m4a1g.isGroup

  const pmrem=new T.PMREMGenerator(rdr)
  const envMap=pmrem.fromEquirectangular(hdr).texture
  sc.environment=envMap;sc.background=bgCol
  sc.environmentIntensity=1.0
  pmrem.dispose()

  // ── PREPARE MODELS ──
  function prep(scene){
    const g=new T.Group()
    g.add(scene.clone(true))
    const bb=new T.Box3().setFromObject(g)
    const sz=new T.Vector3();bb.getSize(sz)
    if(sz.z>sz.y&&sz.z>sz.x)g.rotation.x=-Math.PI/2
    else if(sz.x>sz.y&&sz.x>sz.z)g.rotation.z=Math.PI/2
    g.updateMatrixWorld(true)
    bb.setFromObject(g);bb.getSize(sz)
    const s=.85/sz.y;g.scale.set(s,s,s)
    g.updateMatrixWorld(true)
    bb.setFromObject(g)
    const c=new T.Vector3();bb.getCenter(c)
    g.position.sub(c)
    return g
  }

  const m16t=prep(m16g.scene)
  const ak47t=prep(ak47g.scene)

  function makeShortButt(group){
    let my=Infinity,My=-Infinity
    group.traverse(c=>{if(!c.isMesh||!c.geometry.attributes.position)return;const a=c.geometry.attributes.position.array;for(let i=0;i<a.length;i+=3){if(a[i+1]<my)my=a[i+1];if(a[i+1]>My)My=a[i+1]}})
    const th=my+(My-my)*.25
    group.traverse(c=>{
      if(!c.isMesh)return
      c.geometry=c.geometry.clone()
      const p=c.geometry.attributes.position
      if(!p)return;const a=p.array
      for(let i=0;i<a.length;i+=3)if(a[i+1]<th)a[i+1]=th+(a[i+1]-th)*.3
      p.needsUpdate=true;c.geometry.computeVertexNormals()
    })
    return group
  }
  const m16sbt=makeShortButt(prep(m16g.scene))

  const m4a1t=prep(isFbx?m4a1g:m4a1g.scene);m4a1t.scale.multiplyScalar(.84)
  const g3t=prep(g3g);g3t.scale.multiplyScalar(1.02)
  const uzit=prep(uzig.scene);uzit.scale.multiplyScalar(.47)
  const sr25t=prep(sr25g.scene);sr25t.scale.multiplyScalar(1.0)
  const negevt=prep(negevg.scene)
  const m60t=prep(m60g.scene);m60t.scale.multiplyScalar(1.05)
  const mg42t=prep(mg42g.scene);mg42t.scale.multiplyScalar(1.22)
  const c90t=prep(c90g.scene);c90t.scale.multiplyScalar(1.0)
  const rpgt=prep(rpgg.scene);rpgt.scale.multiplyScalar(.95)

  // ── PLACE GUNS ──
  const silCache={}
  function silTex(gunType,w,h){
    const k=gunType+'_'+w+'_'+h
    if(silCache[k])return silCache[k]
    const c=document.createElement('canvas');c.width=128;c.height=64
    const ctx=c.getContext('2d')
    ctx.clearRect(0,0,128,64)
    ctx.fillStyle='rgba(255,255,255,.12)'
    ctx.strokeStyle='rgba(255,255,255,.25)'
    ctx.lineWidth=2
    const cx=64,cy=48,sc=.45
    const drawBarrel=(len,w)=>ctx.fillRect(cx-len*sc,cy-w/2,len*sc,w)
    const drawRect=(x,y,w,h)=>{ctx.fillRect(cx+x*sc,cy+y*sc,w*sc,h*sc);ctx.strokeRect(cx+x*sc,cy+y*sc,w*sc,h*sc)}
    const drawPath=(pts)=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(cx+p[0]*sc,cy+p[1]*sc):ctx.moveTo(cx+p[0]*sc,cy+p[1]*sc));ctx.closePath();ctx.fill();ctx.stroke()}
    ctx.beginPath()
    if(gunType==='ak47'){
      drawRect(-70,0,20,5);drawRect(-50,-8,10,18);drawRect(-50,5,8,5)
      drawRect(10,-3,60,3);drawRect(-30,-5,40,8);drawBarrel(65,2)
      drawPath([[-25,10],[-15,18],[-5,10],[-25,10]])
      drawRect(-70,-6,5,4)
    }else if(gunType==='uzi'){
      drawRect(-30,-6,40,14);drawRect(10,-3,25,3);drawBarrel(40,2)
      drawRect(-30,-1,8,5);drawPath([[-30,-8],[-38,-14],[-22,-14],[-30,-8]])
      drawRect(-22,-14,3,5)
    }else if(gunType==='negev'||gunType==='m60'){
      drawRect(-65,0,50,5);drawRect(-15,-5,20,10);drawRect(5,-3,50,3)
      drawBarrel(70,2);drawRect(-65,-6,8,4)
      drawPath([[-15,8],[0,16],[15,8],[-15,8]])
    }else if(gunType==='mg42'){
      drawRect(-70,1,55,4);drawRect(-15,-3,20,8);drawRect(5,-2,45,3)
      drawBarrel(65,3);drawRect(-55,-5,5,3)
      drawPath([[-15,7],[0,14],[15,7],[-15,7]])
    }else if(gunType==='c90'||gunType==='rpg'){
      drawRect(-55,-4,80,8);drawRect(20,-6,10,4);drawBarrel(30,3)
      drawRect(-55,-6,5,4)
    }else{
      drawRect(-65,0,20,5);drawRect(-45,-7,10,15);drawRect(-45,4,8,5)
      drawRect(5,-3,50,3);drawBarrel(55,2);drawRect(-45,-8,5,3)
      drawPath([[-20,10],[-10,18],[0,10],[-20,10]])
    }
    const tex=new T.CanvasTexture(c)
    tex.needsUpdate=true
    silCache[k]=tex
    return tex
  }
  const silMat=new T.MeshBasicMaterial({transparent:true,depthWrite:false,side:T.DoubleSide})
  function placeGuns(rack,template,n,side,slant,rackW,tint,offset=0,total=n,gunType){
    const aW=rackW-AB*2
    const H=2.0,D=.62
    const iGeo=new T.SphereGeometry(.035,10,8)
    const iGlowC=document.createElement('canvas');iGlowC.width=64;iGlowC.height=64
    const igc=iGlowC.getContext('2d');const igrd=igc.createRadialGradient(32,32,0,32,32,32)
    igrd.addColorStop(0,'rgba(255,255,255,1)');igrd.addColorStop(.15,'rgba(255,255,200,.6)');igrd.addColorStop(.5,'rgba(200,255,200,.2)');igrd.addColorStop(1,'rgba(255,255,255,0)')
    igc.fillStyle=igrd;igc.fillRect(0,0,64,64)
    const iGlowTex=new T.CanvasTexture(iGlowC)
    const sd=side===-1?'A1':'A2'
    const arr=sd==='A1'?rack.userData.a1G:rack.userData.a2G
    for(let i=0;i<n;i++){
      const x=-rackW/2+AB+(i+.5+offset)*aW/total
      const t=.32,y=t*H*.88,z=side*(D*(1-t)+.025)
      const clone=template.clone(true)
      if(tint&&tint<1)clone.traverse(c=>{
        if(c.isMesh&&c.material){
          c.material=c.material.clone()
          c.material.color.multiplyScalar(tint)
        }
      })
      const bpMat=new T.MeshPhysicalMaterial({color:'#7a6a5a',roughness:.95,metalness:0,transparent:true,opacity:.7,depthWrite:false})
      const bp=new T.Mesh(new T.PlaneGeometry(.06,.2),bpMat)
      bp.position.set(x,.32,side*.55);rack.add(bp)
      clone.traverse(c=>{
        if(c.isMesh&&c.material){
          const m=Array.isArray(c.material)?c.material:[c.material]
          const v=.94+Math.random()*.12
          m.forEach(mt=>{
            if(mt.color){
              const cc=mt.color.clone();cc.r*=v;cc.g*=v;cc.b*=v;mt.color.copy(cc)
            }
            if(mt.emissive)mt.emissiveIntensity=Math.min(mt.emissiveIntensity||0,.08)
            mt.roughness=Math.min((mt.roughness??.6)*1.05,1)
          })
        }
      })
      const w=new T.Group()
      w.add(clone)
      w.position.set(x,y,z)
      w.rotation.x=side*slant
      w.userData={isGun:true,side:sd,slot:i,gunType:gunType||''}
      const iMat=new T.MeshBasicMaterial({color:'#22ee44',transparent:true})
      const ind=new T.Mesh(iGeo,iMat)
      ind.position.set(x,y+.4,z-side*.15)
      ind.userData={isInd:true,gunW:w}
      rack.add(ind)
      const iGlow=new T.Sprite(new T.SpriteMaterial({map:iGlowTex,transparent:true,blending:T.AdditiveBlending,depthWrite:false,opacity:.35}))
      iGlow.position.set(x,y+.4,z-side*.15);iGlow.scale.set(.2,.2,1)
      rack.add(iGlow)
      w.userData.indEl=ind
      w.userData.glowEl=iGlow
      arr.push(w)
      rack.add(w)
      const st=silMat.clone();st.map=silTex(gunType||'m16',.6,.3)
      const sp=new T.Mesh(new T.PlaneGeometry(.06,.16),st)
      sp.rotation.x=-Math.PI/2;sp.position.set(x,.022,z)
      rack.add(sp)
    }
  }

  // ── BUILD & PLACE ALL RACKS ──
  const ROW_GAP=.5
  const rows=[
    {racks:secs[0].racks,x:0,label:'R.D.F',color:'#d4b898'},
    {racks:secs[1].racks,x:-3.5,label:'81 Signal Reg',color:'#b8c8d8'},
    {racks:secs[2].racks,x:-7.5,label:'Southern Command',color:'#c8b8a8'}
  ]

  let rdfIdx=0, sigIdx=0, scIdx=0
  rows.forEach((row,ri)=>{
    const rx=row.x
    let tw=0
    row.racks.forEach(r=>{tw+=Math.max(Math.max(r.a1,1),Math.max(r.a2,1))*SLOT+AB*2})
    tw+=(row.racks.length-1)*ROW_GAP

    let rz=-tw/2
    row.racks.forEach((r,idx)=>{
      const maxN=Math.max(Math.max(r.a1,1),Math.max(r.a2,1))
      const rackW=maxN*SLOT+AB*2
      const rack=mkRack(r.a1,r.a2)
      rack.rotation.y=Math.PI/2
      rack.position.set(rx,.08,rz+rackW/2)
      sc.add(rack)

      let prefix,ni
      if(rdfIdx<3){prefix='RDF';ni=++rdfIdx}
      else if(sigIdx<2){prefix='81S';ni=++sigIdx}
      else{prefix='SC';ni=++scIdx}

      const rackId=`${prefix} R${ni}`
      const gunA1=typeof r.gun==='string'?r.gun:r.gun.a1
      const gunA2=typeof r.gun==='string'?r.gun:r.gun.a2
      rack.userData={isRack:true,rackId,a1:r.a1,a2:r.a2,a1Rem:r.a1,a2Rem:r.a2,a1G:[],a2G:[],secIdx:ri,gunA1,gunA2}

      const fmtGun=(g)=>Array.isArray(g)?g.map(x=>`${x.type.toUpperCase()}×${x.count}`).join('+'):g.toUpperCase()
      const lbl=mkLabel(rackId,'label-rack','#e8d8c0')
      lbl.position.set(rx,2.5,rz+rackW/2);sc.add(lbl)
      rack.userData.labelEl=lbl.element
      const labZoff=.45
      if(r.a1){
        const a1l=mkLabel('A1','label-rack','#e0d0b8')
        a1l.position.set(rx-labZoff,1.0,rz+rackW/2);sc.add(a1l)
      }
      if(r.a2){
        const a2l=mkLabel('A2','label-rack','#e0d0b8')
        a2l.position.set(rx+labZoff,1.0,rz+rackW/2);sc.add(a2l)
      }

      const getModel=(g)=>g==='ak47'?ak47t:g==='m16s'?m16sbt:g==='cq'?m4a1t:g==='g3'?g3t:g==='uzi'?uzit:g==='sr25'?sr25t:g==='negev'?negevt:g==='m60'?m60t:g==='mg42'?mg42t:g==='c90'?c90t:g==='rpg'?rpgt:m16t
      const slant=.6
      const placeSide=(count,modelArr,side)=>{
        if(!count)return
        if(Array.isArray(modelArr)){
          let off=0
          const total=count
          modelArr.forEach(({type,count:c})=>{
            placeGuns(rack,getModel(type),c,side,slant,rackW,1,off,total,type)
            off+=c
          })
        }else{
          placeGuns(rack,getModel(modelArr),count,side,slant,rackW,1,0,count,modelArr)
        }
      }
      placeSide(r.a1,gunA1,-1)
      placeSide(r.a2,gunA2,1)

      const gMat=new T.MeshBasicMaterial({
        color:'#ff0000',transparent:true,opacity:0
      })
      const gBar=new T.Mesh(new T.BoxGeometry(rackW-AB*1.6,.05,.05),gMat)
      gBar.position.set(0,1.88,0)
      rack.add(gBar)
      rack.userData.glowEl=gBar

      _mapRacks.push({userData:rack.userData,x:rx,z:rz+rackW/2,w:.62,d:rackW})

      rz+=rackW+ROW_GAP
    })

    const sl=mkLabel(row.label,'label-section',row.color)
    sl.position.set(rx,4.2,0)
    sc.add(sl)
    row._secEl=sl.element
  })

  // ── PERSISTENCE ──
  const _secEls=rows.map(r=>r._secEl)
  _pupdate=()=>{
    const sums=rows.map(()=>({total:0,rem:0}))
    sc.children.forEach(c=>{
      if(!c.userData?.isRack)return
      const rd=c.userData
      const s=sums[rd.secIdx]
      if(!s)return
      s.total+=rd.a1+rd.a2;s.rem+=rd.a1Rem+rd.a2Rem
    })
    sums.forEach((s,i)=>{
      _secEls[i].textContent=rows[i].label+`  ${s.rem}/${s.total}`
    })
  }
  _psave=()=>{
    const st={}
    sc.children.forEach(c=>{
      if(!c.userData?.isRack)return
      const rd=c.userData
      if(!rd._rem||!rd._rem.length)return
      const arr=[]
      rd._rem.forEach(gw=>arr.push({s:gw.userData.side,si:gw.userData.slot}))
      st[rd.rackId]=arr
    })
    localStorage.setItem('armoury',JSON.stringify(st))
  }
  function loadState(){
    const raw=localStorage.getItem('armoury')
    if(!raw)return
    const st=JSON.parse(raw);_loadingState=true
    sc.children.forEach(c=>{
      if(!c.userData?.isRack)return
      const rd=c.userData,items=st[rd.rackId]
      if(!items)return
      items.forEach(({s,si})=>{
        const arr=s==='A1'?rd.a1G:rd.a2G
        const gw=arr[si]
        if(gw&&gw.parent)checkoutGun(gw)
      })
    })
    _loadingState=false
    _pupdate();updateBadge();drawMap()
  }

  // ── DONE ──
  document.getElementById('load').style.display='none'
  loadState()
}).catch(e=>{
  document.getElementById('load').innerHTML='<span style="color:#c04040">ERROR: '+(e.message||e)+'</span>'
  console.error(e)
})

// ── WASD MOVEMENT ──
const keys={}
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true})
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false})
const _fw=new T.Vector3(),_rt=new T.Vector3()
function moveCam(){
  if(!Object.keys(keys).length||_focus)return
  let any=false;for(const k in keys)if(keys[k]){any=true;break}
  if(!any)return
  const spd=.3
  _fw.set(0,0,-1).applyQuaternion(cam.quaternion);_fw.y=0;_fw.normalize()
  _rt.set(1,0,0).applyQuaternion(cam.quaternion);_rt.y=0;_rt.normalize()
  if(_walkMode){
    const mv=new T.Vector3()
    if(keys['w']||keys['arrowup'])mv.add(_fw)
    if(keys['s']||keys['arrowdown'])mv.addScaledVector(_fw,-1)
    if(keys['a']||keys['arrowleft'])mv.addScaledVector(_rt,-1)
    if(keys['d']||keys['arrowright'])mv.add(_rt)
    if(mv.length()>.01){
      mv.normalize().multiplyScalar(spd)
      cam.position.add(mv)
      if(!_pointerLocked){ctrl.target.add(mv);ctrl.target.y=1.4}
    }
    return
  }
  if(keys['w']||keys['arrowup'])ctrl.target.addScaledVector(_fw,spd)
  if(keys['s']||keys['arrowdown'])ctrl.target.addScaledVector(_fw,-spd)
  if(keys['a']||keys['arrowleft'])ctrl.target.addScaledVector(_rt,-spd)
  if(keys['d']||keys['arrowright'])ctrl.target.addScaledVector(_rt,spd)
  if(keys['q'])ctrl.target.y+=spd
  if(keys['e'])ctrl.target.y-=spd
}

// ── CLICK TO FOCUS ──
const _rc=new T.Raycaster(),_pt=new T.Vector2()
let _focus=null
function _animCam(){
  if(!_focus)return false
  _focus.t+=.06
  if(_focus.t>=1){
    cam.position.copy(_focus.dPos);ctrl.target.copy(_focus.dTgt)
    _focus=null;return false
  }
  const ee=_focus.t*_focus.t*(3-2*_focus.t)
  cam.position.lerpVectors(_focus.sPos,_focus.dPos,ee)
  ctrl.target.lerpVectors(_focus.sTgt,_focus.dTgt,ee)
  return true
}
function startFocus(pos,tgt){
  _focus={sPos:cam.position.clone(),dPos:pos,sTgt:ctrl.target.clone(),dTgt:tgt,t:0}
}
function showToast(msg){
  const el=document.getElementById('toast')
  el.textContent=msg;el.style.opacity='1'
  clearTimeout(el._tt);el._tt=setTimeout(()=>el.style.opacity='0',3000)
}
function checkoutGun(gunW){
  if(!gunW.parent)return
  const rack=gunW.parent
  while(rack&&!rack.userData?.isRack)rack=rack.parent
  if(!rack)return
  const rd=rack.userData
  if(!rd._rem)rd._rem=[]
  rd._rem.push(gunW)
  const side=gunW.userData.side
  const k=side.toLowerCase()+'Rem'
  rd[k]--
  gunW.userData._opos=gunW.position.clone()
  gunW.userData._oscl=gunW.scale.clone()
  const sz=gunW.position.z,ez=sz+(side==='A1'?-.3:.3)
  _anims.push({gw:gunW,pSz:sz,pEz:ez,sSz:1,sEz:.4,t:0})
  if(gunW.userData.indEl){const m=gunW.userData.indEl.material;m.color.set('#ff3b30');m.opacity=1;m.visible=true}
  if(gunW.userData.glowEl){gunW.userData.glowEl.material.color.set('#ff4444')}
  updateRackLabel(rd)
  if(!_loadingState){
    _psave();_pupdate();updateBadge();drawMap();addLog(`${rd.rackId} ${side} #${gunW.userData.slot+1} → OUT`)
    const wp=new T.Vector3();gunW.getWorldPosition(wp)
    burst(wp,12,'#ff8844')
    _lastAct={type:'checkout',gunW,rack,side,slot:gunW.userData.slot+1,rd,k}
    const timer=setTimeout(()=>{if(gunW&&!gunW.parent){restoreSpecificGun(gunW,rack);showToast(`⏱ Auto-restored ${rd.rackId} ${side} #${gunW.userData.slot+1}`)}},_autoRestoreMs)
    _autoTimers.push({timer,gunW})
  }
  showToast(`${rd.rackId} ${side} — 1 checked out (${rd[k]} left)`)
}
function restoreGun(rack){
  const rd=rack.userData
  if(!rd._rem||!rd._rem.length)return
  const gunW=rd._rem.pop()
  clearAutoTimer(gunW)
  const side=gunW.userData.side
  const k=side.toLowerCase()+'Rem'
  rd[k]++;animateIn(gunW,rack,side)
  if(gunW.userData.indEl){const m=gunW.userData.indEl.material;m.color.set('#22ee44');m.opacity=1;m.visible=true}
  if(gunW.userData.glowEl){gunW.userData.glowEl.material.color.set('#44ff66')}
  updateRackLabel(rd)
  if(!_loadingState){
    const wp=new T.Vector3();gunW.getWorldPosition(wp)
    burst(wp,8,'#44ff88')
    _psave();_pupdate();updateBadge();drawMap();addLog(`${rd.rackId} ${side} #${gunW.userData.slot+1} ← IN`)
    _lastAct=null
  }
  showToast(`${rd.rackId} ${side} — 1 returned (${rd[k]} left)`)
}
function clearAutoTimer(gunW){
  for(let i=_autoTimers.length-1;i>=0;i--){
    if(_autoTimers[i].gunW===gunW){clearTimeout(_autoTimers[i].timer);_autoTimers.splice(i,1);break}
  }
}
function restoreSpecificGun(gunW,rack){
  const rd=rack.userData
  const idx=rd._rem?rd._rem.indexOf(gunW):-1
  if(idx===-1)return
  rd._rem.splice(idx,1)
  clearAutoTimer(gunW)
  const side=gunW.userData.side
  const k=side.toLowerCase()+'Rem'
  rd[k]++;animateIn(gunW,rack,side)
  if(gunW.userData.indEl){const m=gunW.userData.indEl.material;m.color.set('#22ee44');m.opacity=1;m.visible=true}
  if(gunW.userData.glowEl){gunW.userData.glowEl.material.color.set('#44ff66')}
  updateRackLabel(rd)
  const wp=new T.Vector3();gunW.getWorldPosition(wp);burst(wp,8,'#44ff88')
  _psave();_pupdate();updateBadge();drawMap();addLog(`${rd.rackId} ${side} #${gunW.userData.slot+1} ← IN`)
  _lastAct=null
  showToast(`${rd.rackId} ${side} — 1 returned (${rd[k]} left)`)
}
function animateIn(gunW,rack,side){
  const op=gunW.userData._opos||gunW.position.clone()
  const os=gunW.userData._oscl||gunW.scale.clone()
  const oz=op.z+(side==='A1'?-.3:.3)
  gunW.position.set(op.x,op.y,oz)
  gunW.scale.set(os.x,os.y,os.z).multiplyScalar(.4)
  rack.add(gunW)
  _anims.push({gw:gunW,pSz:oz,pEz:op.z,sSz:.4,sEz:1,t:0,rmv:false})
}
function updateRackLabel(rd){
  const a1=rd.a1,a2=rd.a2,a1R=rd.a1Rem,a2R=rd.a2Rem
  rd.labelEl.textContent=rd.rackId+(a2?`  A1:${a1R}/${a1} A2:${a2R}/${a2}`:`  A1:${a1R}/${a1}`)
  const missing=(a1-a1R)+(a2-a2R)
  if(rd.glowEl){
    if(missing>0){
      rd.glowEl.material.opacity=1;rd.glowEl.material.color.set('#ff0000')
    }else{rd.glowEl.material.opacity=0}
  }
}
// ── PARTICLE BURST ──
const _bursts=[]
const bGeo=new T.SphereGeometry(.015,4,4)
function burst(pos,count,color){
  const mat=new T.MeshBasicMaterial({color,transparent:true,opacity:1,blending:T.AdditiveBlending,depthWrite:false})
  const group=new T.Group()
  for(let i=0;i<count;i++){
    const m=new T.Mesh(bGeo,mat.clone())
    m.position.set(0,0,0);const theta=Math.random()*Math.PI*2,phi=Math.acos(2*Math.random()-1)
    m.userData={dx:Math.sin(phi)*Math.cos(theta)*.25,dy:Math.sin(phi)*Math.sin(theta)*.25,dz:Math.cos(phi)*.25}
    group.add(m)
  }
  group.position.copy(pos);sc.add(group)
  _bursts.push({g:group,t:0})
}
function processBursts(){
  for(let i=_bursts.length-1;i>=0;i--){
    const b=_bursts[i];b.t+=.04
    if(b.t>=1){sc.remove(b.g);b.g.traverse(c=>{if(c.isMesh){c.geometry.dispose();c.material.dispose()}});_bursts.splice(i,1);continue}
    b.g.children.forEach(m=>{
      m.position.x+=m.userData.dx*.04;m.position.y+=m.userData.dy*.04;m.position.z+=m.userData.dz*.04
      if(m.material)m.material.opacity=1-b.t
    })
  }
}

// ── UNDO ──
let _lastAct=null
function undoLast(){
  if(!_lastAct||_lastAct.type!=='checkout')return
  const {gunW,rack,side}=_lastAct
  if(gunW&&!gunW.parent){restoreSpecificGun(gunW,rack);showToast(`↩ Undid checkout of ${_lastAct.rd.rackId} ${side} #${_lastAct.slot}`)}
}
// ── AUTO RESTORE ──
const _autoTimers=[],_autoRestoreMs=120000
function clearAllTimers(){_autoTimers.forEach(t=>clearTimeout(t.timer));_autoTimers.length=0}
// ── SEARCH ──
document.getElementById('search').addEventListener('input',function(){
  const q=this.value.trim().toUpperCase()
  if(!q){this.style.borderColor='#5a4a3a';return}
  let found=null
  sc.children.forEach(c=>{
    if(!c.userData?.isRack)return
    if(c.userData.rackId.includes(q))found=c
  })
  if(found){
    this.style.borderColor='#44cc66'
    const bb=new T.Box3().setFromObject(found);const c=new T.Vector3();bb.getCenter(c)
    const sz=new T.Vector3();bb.getSize(sz)
    startFocus(c.clone().add(new T.Vector3(sz.z*.8,sz.y*.8,0)),c)
  }else this.style.borderColor='#cc4444'
})
// ── STATISTICS ──
function computeStats(){
  let total=0,checked=0,act={}
  sc.children.forEach(c=>{
    if(!c.userData?.isRack)return
    const rd=c.userData;total+=rd.a1+rd.a2
    const rem=(rd.a1Rem||0)+(rd.a2Rem||0);checked+=total-rem
    const s=rd.rackId.split(' ')[0];act[s]=(act[s]||0)+(rd._rem?.length||0)
  })
  const topSec=Object.entries(act).sort((a,b)=>b[1]-a[1])
  return {total,checked,pct:total?Math.round(checked/total*100):0,top:topSec[0]}
}
function showStats(){
  const el=document.getElementById('stats')
  if(el.style.display==='flex'){el.style.display='none';return}
  const s=computeStats()
  document.getElementById('statsBody').innerHTML=`
    <div class=sRow><span>Total capacity</span><span class=sVal>${s.total}</span></div>
    <div class=sRow><span>Checked out</span><span class=sVal style="color:${s.checked?'#e07040':'#60b860'}">${s.checked} (${s.pct}%)</span></div>
    <div class=sRow><span>On racks</span><span class=sVal>${s.total-s.checked}</span></div>
    <div class=sRow><span>Most active section</span><span class=sVal>${s.top?s.top[0]+' ('+s.top[1]+')':'—'}</span></div>
    <div class=sRow><span>Audit entries</span><span class=sVal>${_log.length}</span></div>
  `
  el.style.display='flex'
}
// ── DATA EXPORT ──
document.getElementById('exportBtn').onclick=()=>{
  if(!_log.length){showToast('No audit entries to export');return}
  let csv='Time,Action\n'+_log.map(x=>`"${new Date(x.t).toLocaleString()}","${x.msg}"`).join('\n')
  const blob=new Blob([csv],{type:'text/csv'})
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='armoury_audit.csv';a.click()
  URL.revokeObjectURL(a.href);showToast('CSV exported')
}
// ── WALKING MODE ──
let _walkMode=false,_pointerLocked=false
const _euler=new T.Euler(0,0,0,'YXZ')
function toggleWalk(){
  _walkMode=!_walkMode
  document.getElementById('walkInd').style.display=_walkMode?'block':'none'
  document.getElementById('walkInd').className=_walkMode?'on':''
  if(_walkMode){
    ctrl.target.set(cam.position.x,1.4,cam.position.z-2);ctrl.update()
    _euler.setFromQuaternion(cam.quaternion)
    showToast('Click on the view to lock mouse · ESC to release')
  }else{
    if(_pointerLocked)document.exitPointerLock()
    ctrl.enabled=true
  }
}
rdr.domElement.addEventListener('click',()=>{
  if(_walkMode&&!_pointerLocked)rdr.domElement.requestPointerLock()
})
document.addEventListener('pointerlockchange',()=>{
  _pointerLocked=document.pointerLockElement===rdr.domElement
  if(_pointerLocked){
    ctrl.enabled=false
    _euler.setFromQuaternion(cam.quaternion)
  }else if(_walkMode){
    ctrl.enabled=true
  }
})
document.addEventListener('mousemove',e=>{
  if(!_pointerLocked)return
  _euler.y-=e.movementX*.002
  _euler.x-=e.movementY*.002
  _euler.x=Math.max(-Math.PI/2.5,Math.min(Math.PI/2.5,_euler.x))
  cam.quaternion.setFromEuler(_euler)
})
// ── PRESET VIEWS ──
const _presets={
  '1':{pos:DEF_POS.clone(),tgt:DEF_TGT.clone()},
  '2':{pos:new T.Vector3(0,9,0),tgt:new T.Vector3(0,0,0)},
  '3':{pos:new T.Vector3(3,2,6),tgt:new T.Vector3(0,1.2,0)},
  '4':{pos:new T.Vector3(-8.5,2,0),tgt:new T.Vector3(-7.5,1.2,0)}
}

let _clickPos=null;let _prevHover=null
rdr.domElement.addEventListener('mousemove',e=>{
  _pt.x=(e.clientX/innerWidth)*2-1;_pt.y=-(e.clientY/innerHeight)*2+1
  _rc.setFromCamera(_pt,cam)
  let gun=null
  for(const i of _rc.intersectObjects(sc.children,true)){
    let o=i.object
    while(o.parent&&!o.userData?.isGun)o=o.parent
    if(o.userData?.isGun&&!_anims.some(a=>a.gw===o)){gun=o;break}
    if(!o.userData?.isGun)break
  }
  if(gun!==_prevHover){
    if(_prevHover&&_prevHover.userData.indEl){
      const m=_prevHover.userData.indEl.material
      m.color.set(_prevHover.userData._origCol||'#22ee44')
    }
    _prevHover=gun
    if(gun&&gun.userData.indEl){
      const m=gun.userData.indEl.material
      if(gun.userData._origCol==null)gun.userData._origCol='#'+m.color.getHexString()
      m.color.set('#ffffff')
    }
    rdr.domElement.style.cursor=gun?'pointer':'default'
  }
})
rdr.domElement.addEventListener('mousedown',e=>{_clickPos={x:e.clientX,y:e.clientY}})
rdr.domElement.addEventListener('click',e=>{
  if(_clickPos&&(Math.abs(e.clientX-_clickPos.x)>4||Math.abs(e.clientY-_clickPos.y)>4)){_clickPos=null;return}
  _clickPos=null
  _pt.x=(e.clientX/innerWidth)*2-1;_pt.y=-(e.clientY/innerHeight)*2+1
  _rc.setFromCamera(_pt,cam)
  let gun=null, ind=null, hit=null
  for(const i of _rc.intersectObjects(sc.children,true)){
    let o=i.object
    while(o.parent&&!o.userData?.isGun&&!o.userData?.isInd&&!o.userData?.isRack)o=o.parent
    if(o.userData?.isGun&&!_anims.some(a=>a.gw===o)){gun=o}
    else if(o.userData?.isInd)ind=o
    else if(o.userData?.isRack)hit=o
    break
  }
  if(e.ctrlKey&&gun){let rack=gun.parent;while(rack&&!rack.userData?.isRack)rack=rack.parent;if(rack)startInspect(gun,rack);return}
  if(gun){checkoutGun(gun);return}
  if(ind){
    const gw=ind.userData.gunW
    if(gw&&!gw.parent){
      let rack=ind.parent
      while(rack&&!rack.userData?.isRack)rack=rack.parent
      if(rack)restoreSpecificGun(gw,rack)
    }
    return
  }
  if(hit){
    const bb=new T.Box3().setFromObject(hit)
    const c=new T.Vector3();bb.getCenter(c)
    const sz=new T.Vector3();bb.getSize(sz)
    const dist=Math.max(sz.x,sz.y,sz.z)*.9
    const dir=new T.Vector3();cam.getWorldDirection(dir)
    dir.y=0;dir.normalize()
    const dp=c.clone().addScaledVector(dir,-dist)
    dp.y=c.y+sz.y*.1
    startFocus(dp,c)
  }else{
    startFocus(DEF_POS.clone(),DEF_TGT.clone())
  }
})
window.addEventListener('keydown',e=>{
  const hel=document.getElementById('help'),lPanel=document.getElementById('log')
  if(e.key==='Escape'){const s=document.getElementById('search');if(s.style.display==='block'){s.style.display='none';s.value='';return}if(_inspect){endInspect();return}lPanel.style.display='none';if(hel.style.display!=='none'){hel.style.display='none';return}startFocus(DEF_POS.clone(),DEF_TGT.clone())}
  if(e.key==='h'||e.key==='H'||e.key==='?')hel.style.display=hel.style.display==='none'?'flex':'none'
  if(e.key==='l'||e.key==='L'){
    if(lPanel.style.display==='none'||lPanel.style.display===''){
      const b=document.getElementById('lBody')
      b.innerHTML=_log.length?_log.map(x=>`<div class=lItem><span class=lTime>${new Date(x.t).toLocaleTimeString()}</span><span class=lAct>${x.msg}</span></div>`).join(''):'<div class=lEmp>No activity yet</div>'
      lPanel.style.display='flex'
    }else{lPanel.style.display='none'}
  }
  if(e.key==='r'||e.key==='R')resetAll()
  if(e.ctrlKey&&(e.key==='z'||e.key==='Z')){undoLast();e.preventDefault()}
  if(e.key==='t'||e.key==='T')showStats()
  if(e.key==='m'||e.key==='M')toggleWalk()
  if(e.key==='u'||e.key==='U'){
    _wireframe=!_wireframe
    sc.children.forEach(c=>{
      if(!c.userData?.isRack)return
      c.traverse(m=>{if(m.isMesh&&m.material){const mat=Array.isArray(m.material)?m.material:[m.material];mat.forEach(mt=>mt.wireframe=_wireframe)}})
    })
    showToast(_wireframe?'Wireframe ON':'Wireframe OFF')
  }
  if((e.key==='/'||e.key==='F')&&!e.ctrlKey){document.getElementById('search').style.display='block';document.getElementById('search').focus();e.preventDefault()}
  if(e.key>='1'&&e.key<='4'){const p=_presets[e.key];if(p)startFocus(p.pos.clone(),p.tgt.clone())}
})
document.addEventListener('contextmenu',e=>e.preventDefault())
rdr.domElement.addEventListener('contextmenu',e=>{
  _pt.x=(e.clientX/innerWidth)*2-1;_pt.y=-(e.clientY/innerHeight)*2+1
  _rc.setFromCamera(_pt,cam)
  for(const i of _rc.intersectObjects(sc.children,true)){
    let o=i.object
    while(o.parent&&!o.userData?.isRack)o=o.parent
    if(o.userData?.isRack){restoreGun(o);break}
  }
})
// ── SEARCH BLUR HIDE ──
document.getElementById('search').addEventListener('blur',()=>{setTimeout(()=>{document.getElementById('search').style.display='none'},200)})
// ── MINIMAP ──
document.getElementById('map').addEventListener('click',e=>{
  const s=document.getElementById('search')
  if(s.style.display==='block'){s.style.display='none';s.value=''}
  const rect=e.target.getBoundingClientRect()
  const cx=(e.clientX-rect.left)/rect.width*MW
  const cy=(e.clientY-rect.top)/rect.height*MH
  for(const r of _mapRacks){
    const rd=r.userData
    const x=mX(r.x-r.w/2),y=mZ(r.z-r.d/2)
    const pw=mX(r.x+r.w/2)-x,ph=mZ(r.z+r.d/2)-y
    if(cx>=x&&cx<=x+pw&&cy>=y&&cy<=y+ph){
      sc.children.forEach(c=>{
        if(c.userData?.rackId===rd.rackId){
          const bb=new T.Box3().setFromObject(c)
          const center=new T.Vector3();bb.getCenter(center)
          const sz=new T.Vector3();bb.getSize(sz)
          const dist=Math.max(sz.x,sz.y,sz.z)*.9
          const dir=new T.Vector3();cam.getWorldDirection(dir)
          dir.y=0;dir.normalize()
          const dp=center.clone().addScaledVector(dir,-dist)
          dp.y=center.y+sz.y*.1
          startFocus(dp,center)
        }
      });break
    }
  }
})
document.getElementById('map').addEventListener('mouseenter',()=>{
  if(!_qrRack)updateQR('ARMOURY')
})
document.getElementById('map').addEventListener('mouseleave',()=>{
  if(_qrRack&&_qrRack!=='ARMOURY'&&_qrRack!=='RDF · 81 SIG · SC')return
  updateQR(null)
})
document.getElementById('qrcode').addEventListener('click',()=>{updateQR(null)})

// ── MOUSE DRAG FOR GUN INSPECTION ──
document.getElementById('inspGun').addEventListener('mousedown',e=>{
  if(!_inspect)return
  _dragStart={x:e.clientX,y:e.clientY,rx:_inspect.clone.rotation.x,ry:_inspect.clone.rotation.y,rz:_inspect.clone.rotation.z}
})
document.addEventListener('mousemove',e=>{
  if(!_inspect||!_dragStart)return
  const dx=e.clientX-_dragStart.x,dy=e.clientY-_dragStart.y
  _inspect.clone.rotation.y=_dragStart.ry+dx*.008
  _inspect.clone.rotation.x=_dragStart.rx+dy*.008
})
document.addEventListener('mouseup',()=>{_dragStart=null})

// ── TICK ──
function tick(){
  requestAnimationFrame(tick)
  moveCam();processAnims();processBursts()
  const t=Date.now()*.001
  flickerLights.forEach(l=>{l.intensity=l.userData.baseInt*(.7+.3*Math.sin(t*l.userData.spd+l.userData.phase))})
  sc.children.forEach(c=>{
    if(!c.userData?.isRack)return
    const rd=c.userData,g=rd.glowEl
    if(!g)return
    const missing=(rd.a1-rd.a1Rem)+(rd.a2-rd.a2Rem)
    if(missing>0){
      g.material.opacity=1
    }else{g.material.opacity=0}
  })
  if(_walkMode&&cam.position.y<.2)cam.position.y=.2
  if(_inspect){
    if(!_dragStart)_inspect.clone.rotation.y+=.008
    _inspect.gRdr.render(_inspect.gSc,_inspect.gCam)
  }
  if(!_animCam()&&!_inspect)ctrl.update()
  rdr.render(sc,cam);ldr.render(sc,cam)
}
tick()
setInterval(()=>{if(sc.children.length)drawMap()},600)

addEventListener('resize',()=>{
  cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()
  rdr.setSize(innerWidth,innerHeight);ldr.setSize(innerWidth,innerHeight)
  if(_inspect){_inspect.gCam.aspect=innerWidth/innerHeight;_inspect.gCam.updateProjectionMatrix();_inspect.gRdr.setSize(innerWidth,innerHeight)}
})
