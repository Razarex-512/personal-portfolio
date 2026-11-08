(() => {
  const bench = document.querySelector('.workbench');
  const tabs = [...document.querySelectorAll('.work-tab')];
  const panels = [...document.querySelectorAll('.work-panel')];
  const tablist = document.querySelector('.project-tabs');
  const fullMotion = () => document.documentElement.dataset.motion === 'full';
  const compactLayout = matchMedia('(max-width:700px)');
  const depthControl = document.getElementById('control-depth');
  const batchControl = document.getElementById('control-inference');
  let viewAngle = Number(depthControl.value) / 100, batchSize = Number(batchControl.value), stillTime = 1.6;
  const depthShades = Array.from({length:64},(_,i)=>`hsl(${345+i/63*12} 45% ${32+i/63*56}%)`);
  let current = 0, time = 0, last = 0, raf = 0, visible = false, phrase = 0, depthColor = false;
  let panelAnimation = null;
  const phrases = ['library?', 'parking?', 'tuition?'];
  const states = panels.map(panel => {const canvas=panel.querySelector('canvas');return {canvas,ctx:canvas?.getContext('2d'),width:1,height:1};});
  const easing = 'cubic-bezier(.23,1,.32,1)';
  bench.classList.add('enhanced');
  tablist.setAttribute('role','tablist');
  tabs.forEach(tab=>tab.setAttribute('role','tab'));
  panels.forEach(panel=>{panel.setAttribute('role','tabpanel');panel.tabIndex=0;});
  const position=bench.querySelector('.project-position');
  const permalink=bench.querySelector('.project-permalink');
  function select(index,{historyMode='none',animate=false,keyboard=false}={}) {
    if(index<0||index>=panels.length)return;
    const previous=panels[current];
    const restoreFocus=previous.contains(document.activeElement);
    document.dispatchEvent(new CustomEvent('project:beforechange',{detail:{panel:previous}}));
    panelAnimation?.cancel();
    current=index;time=0;stillTime=1.6;
    tabs.forEach((tab,i)=>{
      tab.removeAttribute('aria-current');
      tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;
      panels[i].hidden=i!==index;
    });
    if(restoreFocus)tabs[index].focus({preventScroll:true});
    const hash='#project-'+tabs[index].dataset.project;
    if(historyMode==='push'&&location.hash!==hash)history.pushState(null,'',hash);
    position.textContent=`${index+1} of ${panels.length}`;
    permalink.href=hash;
    permalink.setAttribute('aria-label','Link to '+tabs[index].querySelector('.tab-name').textContent);
    if(animate&&!keyboard&&document.documentElement.dataset.motion!=='off'){
      panelAnimation=panels[index].animate([{opacity:.6},{opacity:1}],{duration:180,easing});
    }
    document.dispatchEvent(new CustomEvent('project:change',{detail:{panel:panels[index],animate:animate&&fullMotion()&&!keyboard}}));
    resize();start();
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',event=>select(index,{historyMode:'push',animate:true,keyboard:event.detail===0}));
    tab.addEventListener('keydown',event=>{
      let next=index;
      if(event.key==='ArrowRight')next=(index+1)%tabs.length;
      else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=tabs.length-1;
      else return;
      event.preventDefault();
      tabs[next].focus({preventScroll:true});
      select(next,{historyMode:'push',keyboard:true});
    });
  });
  function linkedIndex(){
    const key=location.hash.replace(/^#(?:project-|panel-|tab-)?/,'');
    return tabs.findIndex(tab=>tab.dataset.project===key);
  }
  function followLink(){
    const index=linkedIndex();
    if(index<0)return;
    select(index);
    requestAnimationFrame(()=>tablist.scrollIntoView({block:'start',behavior:'instant'}));
  }
  addEventListener('hashchange',followLink);
  addEventListener('popstate',followLink);
  const status=document.createElement('p');status.className='sr-only';status.setAttribute('aria-live','polite');bench.append(status);
  document.querySelectorAll('.experiment-action').forEach((button,index)=>button.addEventListener('click',()=>{
    current=index;time=0;stillTime=stillTime===1.6?3.2:1.6;
    if(index===0){depthColor=!depthColor;button.firstChild.textContent=depthColor?'Depth view':'Color view';status.textContent=depthColor?'Showing color view.':'Showing depth view.';}
    if(index===1)status.textContent='Batch restarted. Conceptual comparison, not measured performance.';
    if(index===2){phrase=(phrase+1)%phrases.length;status.textContent='Input: '+phrases[phrase];}
    if(index===3)status.textContent='Illustrating a request from React through Node.js to the data layer.';
    draw();start();
  }));
  depthControl.addEventListener('input',()=>{
    viewAngle=Number(depthControl.value)/100;
    depthControl.setAttribute('aria-valuetext',`${Math.round((viewAngle-.5)*80)} degrees`);draw();
  });
  depthControl.setAttribute('aria-valuetext','0 degrees');
  batchControl.addEventListener('input',()=>{
    batchSize=Number(batchControl.value);batchControl.setAttribute('aria-valuetext',`${batchSize} tasks`);draw();
  });
  batchControl.setAttribute('aria-valuetext',`${batchSize} tasks`);
  const studyAttribute=document.querySelector('#study-attribute');
  studyAttribute?.addEventListener('change',()=>{
    document.querySelector('.study-variable').textContent=studyAttribute.value+' varied';
    document.querySelector('.study-feedback').textContent=studyAttribute.value+' changes; the symptoms and prompt stay fixed.';
  });
  // Preserve the real project content; the canvases illustrate concepts rather than inventing results.
  const cloud=[];
  for(let x=-1.6;x<=1.6;x+=.08)for(let z=-1;z<=1;z+=.08)cloud.push([x,.72,z]);
  for(let x=-1.6;x<=1.6;x+=.08)for(let y=-.9;y<.72;y+=.08)cloud.push([x,y,1]);
  for(let z=-1;z<=1;z+=.08)for(let y=-.9;y<.72;y+=.08)cloud.push([-1.6,y,z]);
  for(const box of [[-.7,.1,.55,.6],[.55,-.4,.42,.9]]){
    const [bx,bz,size,tall]=box;
    for(let x=bx-size/2;x<bx+size/2;x+=.065)for(let z=bz-size/2;z<bz+size/2;z+=.065)cloud.push([x,.72-tall,z]);
    for(let y=.72-tall;y<.72;y+=.065)for(let n=-size/2;n<size/2;n+=.065){cloud.push([bx+n,y,bz-size/2]);cloud.push([bx+size/2,y,bz+n]);}
  }
  function resize(){
    states.forEach((state,index)=>{
    if(!state.canvas||panels[index].hidden)return;
    const rect=state.canvas.parentElement.getBoundingClientRect();
    if(!rect.width)return;
    state.width=rect.width;state.height=rect.height;
    const dpr=Math.min(devicePixelRatio||1,compactLayout.matches?1.25:1.5);
    state.canvas.width=Math.round(rect.width*dpr);state.canvas.height=Math.round(rect.height*dpr);
    state.ctx?.setTransform(dpr,0,0,dpr,0,0);
    if(state.ctx)panels[index].querySelector('.experiment').classList.add('ready');
    });
    draw();
  }
  function line(c,x1,y1,x2,y2,color='#59404b',width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
  function dot(c,x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
  function label(c,text,x,y,size=14,color='#d8c6cd',align='left'){c.font=`${size}px Onest,Arial,sans-serif`;c.fillStyle=color;c.textAlign=align;c.fillText(text,x,y);}
  function box(c,x,y,w,h,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,5);c.fill();}
  function depth(c,w,h,t){
    const amount=viewAngle;
    const yaw=-.45+(amount-.5)*1.4+Math.sin(t*.24)*.09;
    const cy=Math.cos(yaw),sy=Math.sin(yaw),tilt=.35;
    const scale=Math.min(w*.25,h*.4);
    for(let i=0;i<cloud.length;i+=w<500?2:1){
      const [x,y,z]=cloud[i],rx=x*cy+z*sy,rz=-x*sy+z*cy;
      const py=y*Math.cos(tilt)-rz*Math.sin(tilt),pz=y*Math.sin(tilt)+rz*Math.cos(tilt);
      const perspective=4/(4+pz),xx=w*.52+rx*scale*perspective,yy=h*.49+py*scale*perspective;
      const brightness=Math.max(.22,Math.min(1,(1.9-pz)/3));
      c.globalAlpha=.35+brightness*.6;
      c.fillStyle=depthColor?(y<0?'#8eafbe':z>.9?'#a6c9b1':'#70b8be'):depthShades[Math.round(brightness*63)];
      const r=1.05+brightness*.6;c.fillRect(xx,yy,r,r);
    }
    c.globalAlpha=1;
    label(c,depthColor?'Color representation':'Spatial depth',24,h-25,13);
    const lx=w-112;
    for(let i=0;i<10;i++){c.fillStyle=`hsl(350 45% ${32+i*6}%)`;c.fillRect(lx+i*8,h-34,6,8);}
  }
  function inference(c,w,h,t){
    const count=batchSize;
    const phase=(t*.22)%1;
    const left=24,right=w-24,area=right-left;
    label(c,'CPU',left,60,26,'#f1efec');label(c,'One task at a time',left,85,13);
    label(c,'GPU',left,h*.57,26,'#f1efec');label(c,'Tasks in parallel',left,h*.57+25,13);
    const gap=5,bw=(area-(count-1)*gap)/count;
    const blockHeight=h<320?30:44, cpuTop=h<320?94:112;
    for(let i=0;i<count;i++){
      const x=left+i*(bw+gap),done=phase>i/count,active=Math.floor(phase*count)===i;
      box(c,x,cpuTop,bw,blockHeight,done?'#df8d9f':'#38242e');
      if(active)box(c,x,cpuTop,bw,blockHeight,'#fff0e9');
      const gpuDone=(phase*4)%1>(i%4)/4;
      box(c,x,h*.57+50,bw,blockHeight,gpuDone?'#df8d9f':'#38242e');
      if(i%4===Math.floor((phase*4)%1*4))box(c,x,h*.57+50,bw,blockHeight,'#fff0e9');
    }
    label(c,`${count} illustrative tasks`,left,h-20,13);
    if(w>500)label(c,'Same work. Different execution.',right,h-20,13,'#b9a4ad','right');
  }
  function language(c,w,h,t){
    const words=[...phrases[phrase]],top=55;
    const gap=8,tw=(w-48-(words.length-1)*gap)/words.length;
    words.forEach((word,i)=>{box(c,24+i*(tw+gap),top,tw,42,'#3a2832');c.font=`${Math.max(13,Math.min(16,w/30))}px Onest,Arial,sans-serif`;c.textAlign='center';c.fillStyle='#f4e5e7';c.fillText(word,24+i*(tw+gap)+tw/2,top+27,tw-10);});
    const layers=[words.length,4,4,1],ys=[top+42,h*.43,h*.64,h*.82];
    for(let k=0;k<layers.length-1;k++)for(let i=0;i<layers[k];i++)for(let j=0;j<layers[k+1];j++){
      const x1=24+(w-48)*(i+.5)/layers[k],x2=24+(w-48)*(j+.5)/layers[k+1];
      line(c,x1,ys[k],x2,ys[k+1],'#513641');
      if((i+j)%3===0){const p=(t*.5+k*.3)%1;dot(c,x1+(x2-x1)*p,ys[k]+(ys[k+1]-ys[k])*p,2,'#f6bac5');}
    }
    for(let k=1;k<layers.length;k++)for(let i=0;i<layers[k];i++){
      const x=24+(w-48)*(i+.5)/layers[k];dot(c,x,ys[k],9,'#452c38');dot(c,x,ys[k],3.8+Math.sin(t*2+i)*1.2,'#e9a3b3');
    }
    label(c,'Characters → decoder → next token',w/2,h-15,13,'#d8c6cd','center');
  }
  function rental(c,w,h,t){
    const names=['React','Node.js','Data'],subs=['Interface','Request','Response'];
    const nodeWidth=Math.min(140,(w-64)/3),gap=(w-48-nodeWidth*3)/2;
    const y=h*.61;
    // A drawn vehicle and route anchor the architecture to this project's subject.
    const carX=w/2,carY=h*.24;
    c.strokeStyle='#f0c8cf';c.lineWidth=2;c.beginPath();c.roundRect(carX-55,carY-25,110,50,15);c.stroke();
    c.strokeStyle='#9b6b7d';c.beginPath();c.roundRect(carX-28,carY-19,54,38,9);c.stroke();
    for(const dx of [-35,35])for(const dy of [-28,28])box(c,carX+dx-8,carY+dy-4,16,8,'#dca4b3');
    line(c,carX,carY+34,carX,y-15,'#63424e');
    for(let i=0;i<3;i++){
      const x=24+i*(nodeWidth+gap);box(c,x,y,nodeWidth,64,'#3a2732');
      label(c,names[i],x+nodeWidth/2,y+27,Math.max(14,Math.min(20,w/22)),'#f5e9ed','center');label(c,subs[i],x+nodeWidth/2,y+47,13,'#bba3af','center');
      if(i<2)line(c,x+nodeWidth,y+32,x+nodeWidth+gap,y+32,'#a27488',2);
    }
    const p=(t*.27)%1,xx=24+(w-48)*p;
    dot(c,xx,y-12,5,'#f9dce0');
    label(c,['Choose a vehicle','Send to the backend','Return the response'][Math.min(2,Math.floor(p*3))],w/2,h-18,13,'#d8c6cd','center');
  }
  function draw(){const s=states[current];if(!s?.ctx)return;s.ctx.clearRect(0,0,s.width,s.height);[depth,inference,language,rental][current]?.(s.ctx,s.width,s.height,fullMotion()?time:stillTime);}
  function tick(now){raf=0;if(document.hidden||!visible||!fullMotion())return;if(now-last>=30){time+=Math.min(now-last,60)/1000;last=now;draw(true);}raf=requestAnimationFrame(tick);}
  function start(){cancelAnimationFrame(raf);raf=0;draw();if(visible&&!document.hidden&&fullMotion()&&states[current]?.ctx){last=performance.now();raf=requestAnimationFrame(tick);}}
  new ResizeObserver(resize).observe(document.querySelector('.work-panels'));
  // Visibility only pauses the illustration. It never changes selection.
  const panelObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;start();},{threshold:0});
  panelObserver.observe(document.querySelector('.work-panels'));
  new MutationObserver(()=>{panelAnimation?.cancel();start();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
  document.addEventListener('visibilitychange',start);
  const toolkit=document.querySelector('.toolkit p');
  toolkit.textContent.split(',').forEach((word,i)=>{if(i===0)toolkit.textContent='';const item=document.createElement('span');item.textContent=word.trim().replace(/^and /,'').replace(/\.$/,'');toolkit.append(item);});
  const initial=linkedIndex();
  select(initial>=0?initial:0);
  if(initial>=0)requestAnimationFrame(()=>tablist.scrollIntoView({block:'start',behavior:'instant'}));
})();
