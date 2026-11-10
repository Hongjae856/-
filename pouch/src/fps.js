/* ═══════════════════════════════════════════════════════════════════
   1인칭 모듈 (다른 IDT V12 에서 이식 · 사용자 제공 11/10)
   · 변경점 : advance() 이동 거리 반환, host.eyeY() 로 계단 · 데크 눈높이 보정 (파우치 IDT 추가)
   ═══════════════════════════════════════════════════════════════════ */
// 일반 script에서 사용할 수 있는 독립 모듈. Y-up, yaw=0일 때 -Z 전방.
function createIDTFirstPerson(host) {
  const {canvas, scene} = host; // scene: canvas와 HUD의 공통 position:relative 부모
  const events = new AbortController();
  const keys = new Set();
  const ui = document.createElement('div');
  Object.assign(ui.style, {position:'absolute', inset:'0', pointerEvents:'none', zIndex:'3'});
  const dot = document.createElement('div'), label = document.createElement('div');
  const guide = document.createElement('div');
  dot.textContent = '＋';
  [dot,label,guide].forEach((el,i) => {
    Object.assign(el.style, {position:'absolute',left:'50%',top:['50%','56%','18%'][i],
      transform:'translate(-50%,-50%)',color:i===2?'#ffdc62':'white',
      textShadow:'0 1px 4px #000, 0 0 3px #000',font:'bold 16px system-ui'});
    ui.append(el);
  });
  scene.append(ui);
  let active=false, mode='walk', pose, transition, returnPose, lastMouse, lastTime;
  let target=null, monitor=null;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const blocked=()=>!!host.isBusy?.();
  const ready=()=>active && mode==='walk' && !blocked();
  function listen(element,type,handler,options={}) {
    element.addEventListener(type,handler,{...options,signal:events.signal});
  }
  function clear() {keys.clear(); lastMouse=null;}
  function lock() {
    if (!ready() || document.pointerLockElement===canvas) return;
    try {canvas.requestPointerLock?.()?.catch?.(()=>{});} catch {}
  }
  function unlock() {clear(); if(document.pointerLockElement===canvas)document.exitPointerLock();}
  function rayDistance(t) {
    const cp=Math.cos(pose.pitch);
    const direction=[-Math.sin(pose.yaw)*cp,-Math.sin(pose.pitch),-Math.cos(pose.yaw)*cp];
    let near=0, far=t.reach ?? host.reach;
    for(const [i,axis] of ['x','y','z'].entries()) {
      const half=[t.w,t.h,t.d][i]/2, offset=t[axis]-pose[axis], dir=direction[i];
      if(Math.abs(dir)<1e-8){if(Math.abs(offset)>half)return Infinity;continue;}
      const a=(offset-half)/dir,b=(offset+half)/dir;
      near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));
      if(near>far)return Infinity;
    }
    return near;
  }
  function select(list) {
    let best=null, distance=Infinity;
    for(const t of list){
      if(t.visible===false)continue;
      const hit=rayDistance(t);
      if(hit<distance && !host.occluded?.(pose,t,hit)){best=t;distance=hit;}
    }
    return best;
  }
  function travel(to,duration,next){
    transition={from:{...pose},to:{...pose,...to},start:performance.now(),duration,next};
  }
function use(){
    if(!ready())return;
    const t=select(host.targets()); if(!t)return;
    if(!t.hmiPose){host.use(t);return;}
    if(host.canOpenHMI?.(t)===false)return;
    returnPose={...pose};monitor=t;mode='approach';unlock();
    travel(t.hmiPose,350,'hmi');
  }
  function closeHMI(){
    if(mode!=='hmi' && mode!=='approach')return;
    host.hmiInteractive?.(false,monitor);mode='return';clear();travel(returnPose,260,'walk');
  }
  function advance(dt){
    const f=Number(keys.has('KeyW'))-Number(keys.has('KeyS'));
    const r=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));
    const length=Math.hypot(f,r); if(!length)return 0;
    const x0=pose.x, z0=pose.z;
    for(let left=dt;left>0;left-=.012){
      const step=host.speed*Math.min(left,.012)/length;
      const x=pose.x+step*(-Math.sin(pose.yaw)*f+Math.cos(pose.yaw)*r);
      const z=pose.z+step*(-Math.cos(pose.yaw)*f-Math.sin(pose.yaw)*r);
      if(host.canStand(x,pose.z))pose.x=x;
      if(host.canStand(pose.x,z))pose.z=z;
    }
    return Math.hypot(pose.x-x0,pose.z-z0);
  }
  // 렌더 루프에서 장면을 그리기 전에 정확히 한 번 호출한다.
  function update(now=performance.now()){
    if(!active)return;
    const dt=clamp((now-lastTime)/1000,0,.15);lastTime=now;
    if(blocked())unlock();
    if(transition){
      const {from,to,start,duration,next}=transition;
      const u=clamp((now-start)/duration,0,1), v=u*u*(3-2*u);
      for(const k of ['x','y','z','pitch','focal'])pose[k]=from[k]+(to[k]-from[k])*v;
      const yaw=to.yaw-from.yaw;
      pose.yaw=from.yaw+Math.atan2(Math.sin(yaw),Math.cos(yaw))*v;
      if(u===1){
        pose={...to};mode=next;transition=null;
        if(mode==='hmi')host.hmiInteractive?.(true,monitor);
        else {monitor=null;lock();}
      }
    } else if(ready()){
      const moved=advance(dt);
      /* [파우치 IDT 추가] 바닥 · 계단 · 2층 데크 높이를 따라 눈높이를 부드럽게 맞춘다 */
      if(host.eyeY){ const ty=host.eyeY(pose,moved,dt); pose.y+=(ty-pose.y)*Math.min(1,dt*14); }
      if(lastMouse && document.pointerLockElement!==canvas){
        const rect=canvas.getBoundingClientRect();
        if(lastMouse.x<rect.left+16)pose.yaw+=dt*.8;
        if(lastMouse.x>rect.right-16)pose.yaw-=dt*.8;
      }
    }
    host.setCamera({...pose});
    const list=ready()?host.targets():[];
    target=select(list);ui.hidden=!ready();
    label.textContent=target ? target.name+' · 좌클릭' : '';
    const goal=list.find(t=>t.goal);
    if(goal && host.showGuide?.()!==false){
      const angle=Math.atan2(-(goal.x-pose.x),-(goal.z-pose.z))-pose.yaw;
      const a=Math.atan2(Math.sin(angle),Math.cos(angle));
      guide.textContent=(Math.abs(a)<.22?'↓':a>0?'←':'→')+' '+goal.name;
    }else guide.textContent='';
    host.highlight?.(host.showGuide?.()===false?null:goal??null,target);
  }
  function look(dx,dy){pose.yaw-=dx*.0025;pose.pitch=clamp(pose.pitch+dy*.0025,-1.3,1.3);}
  listen(document,'mousemove',e=>{
    if(!ready())return;
    if(document.pointerLockElement===canvas){look(e.movementX,e.movementY);return;}
    if(e.target!==canvas){lastMouse=null;return;}
    if(lastMouse)look(e.clientX-lastMouse.x,e.clientY-lastMouse.y);
    lastMouse={x:e.clientX,y:e.clientY};
  });
listen(canvas,'pointerdown',e=>{
    if(!ready())return;
    if(e.button===0){use();lock();}
    if(e.button===2)host.returnPart?.();
  });
  listen(canvas,'contextmenu',e=>{if(ready())e.preventDefault();});
  listen(window,'keydown',e=>{
    if(!active || blocked())return;
    if(e.code==='Escape' && ['approach','hmi'].includes(mode)){
      e.preventDefault();closeHMI();return;
    }
    if(e.target?.closest?.('input,textarea,select,[contenteditable=true]'))return;
    if(mode!=='walk')return;
    const actions={KeyE:use,F1:host.hint,KeyR:host.returnPart,KeyH:host.help,Tab:host.menu};
    if(!['KeyW','KeyA','KeyS','KeyD'].includes(e.code) && !actions[e.code])return;
    e.preventDefault();
    if(actions[e.code]){if(!e.repeat)actions[e.code]();}else keys.add(e.code);
  },{capture:true});
  listen(window,'keyup',e=>keys.delete(e.code));
  listen(window,'blur',clear);listen(document,'visibilitychange',clear);
  listen(document,'pointerlockchange',clear);
  function stop(){
    active=false;unlock();host.hmiInteractive?.(false,monitor);
    host.highlight?.(null,null);ui.hidden=true;transition=monitor=null;mode='walk';
  }
  ui.hidden=true;
  return {start(spawn){stop();pose={yaw:0,pitch:0,focal:.78,...spawn};
    active=true;lastTime=performance.now();update(lastTime);lock();},
    update,use,closeHMI,stop,get mode(){return mode;},
    dispose(){stop();events.abort();ui.remove();}};
}

// 기존 HMI DOM을 월드 모니터의 네 모서리에 투영한다.
// corners는 scene 내부 CSS 픽셀 좌표로 변환한 좌상·우상·우하·좌하 4점.
// 카메라 뒤, 근평면 통과, 패널 뒷면 또는 비가시 상태는 null을 전달한다.
function placeIDTMonitor(element,corners,width,height) {
  if(!corners || corners.length!==4){element.style.visibility='hidden';return;}
  const source=[[0,0],[width,0],[width,height],[0,height]];
  const rows=[];
  source.forEach(([x,y],i)=>{
    const {x:u,y:v}=corners[i];
    rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);
  });
  for(let col=0;col<8;col++){
    let pivot=col;
    for(let row=col+1;row<8;row++)
      if(Math.abs(rows[row][col])>Math.abs(rows[pivot][col]))pivot=row;
    [rows[col],rows[pivot]]=[rows[pivot],rows[col]];
    const divisor=rows[col][col];
    if(!Number.isFinite(divisor)||Math.abs(divisor)<1e-9){element.style.visibility='hidden';return;}
    for(let j=col;j<=8;j++)rows[col][j]/=divisor;
    for(let row=0;row<8;row++)if(row!==col){
      const factor=rows[row][col];
      for(let j=col;j<=8;j++)rows[row][j]-=factor*rows[col][j];
    }
  }
  const [a,b,c,d,e,f,g,h]=rows.map(row=>row[8]);
  Object.assign(element.style,{position:'absolute',left:'0',top:'0',width:width+'px',
    height:height+'px',transformOrigin:'0 0',visibility:'visible',
    transform:'matrix3d('+[a,d,0,g,b,e,0,h,0,0,1,0,c,f,0,1].join(',')+')'});
}
