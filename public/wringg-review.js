const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(index, focus=false) {
  tabs.forEach((tab,i) => {
    const active = index===i;
    tab.setAttribute('aria-selected',String(active));
    tab.tabIndex=active?0:-1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden=!active;
  });
  if(focus)tabs[index].focus();
}
tabs.forEach((tab,i)=>{
  tab.addEventListener('click',()=>selectTab(i));
  tab.addEventListener('keydown',event=>{
    const target={ArrowRight:(i+1)%tabs.length,ArrowLeft:(i+tabs.length-1)%tabs.length,Home:0,End:tabs.length-1}[event.key];
    if(target!==undefined){event.preventDefault();selectTab(target,true)}
  });
});
const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.main-nav');
const landing=document.querySelector('.landing');
if(toggle&&nav&&landing){
 const setMenu=open=>{
   toggle.setAttribute('aria-expanded',String(open));
   toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');
   nav.classList.toggle('open',open);
   landing.classList.toggle('menu-open',open);
 };
 toggle.addEventListener('click',()=>setMenu(toggle.getAttribute('aria-expanded')!=='true'));
 nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){setMenu(false);toggle.focus();}});
}
// Keep continuous rotation on a separate layer inside the original machine.
const spin=document.querySelector('.spin-button');
const motion=document.querySelector('.motion-control');
const drum=document.querySelector('.drum-load');
const heroArt=document.querySelector('.hero-art');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reducedMotion.matches;
let fast=false;
let angle=0;
let speed=paused?0:50;
let lastTime=0;
let frameId=0;
let inView=true;
function updateMotionControls(){
  landing.classList.toggle('motion-paused',paused);
  motion.setAttribute('aria-pressed',String(paused));
  motion.firstChild.textContent=paused?'Resume motion ':'Pause motion ';
  motion.querySelector('span').textContent=paused?'▶':'Ⅱ';
  spin.setAttribute('aria-pressed',String(fast));
  spin.firstChild.textContent=fast?'Slow the spin ':'Give life a spin ';
}
function stopMotionFrame(){cancelAnimationFrame(frameId);frameId=0;lastTime=0;}
function requestMotionFrame(){if(!frameId&&!paused&&inView&&!document.hidden)frameId=requestAnimationFrame(animateDrum);}
function animateDrum(now){
  frameId=0;
  if(paused||!inView||document.hidden){lastTime=0;return;}
  const dt=lastTime?Math.min((now-lastTime)/1000,.05):0;
  lastTime=now;
  const target=fast?220:50;
  speed+=(target-speed)*(1-Math.exp(-dt*2.8));
  angle=(angle+speed*dt)%360;
  drum.style.transform=`rotate(${angle.toFixed(3)}deg)`;
  requestMotionFrame();
}
spin.addEventListener('click',()=>{
  fast=!fast;
  paused=false;
  updateMotionControls();
  requestMotionFrame();
});
motion.addEventListener('click',()=>{
  paused=!paused;
  if(paused)stopMotionFrame();else{speed=0;requestMotionFrame();}
  updateMotionControls();
});
reducedMotion.addEventListener('change',()=>{
  paused=reducedMotion.matches;
  fast=false;
  if(paused)stopMotionFrame();else requestMotionFrame();
  updateMotionControls();
});
new IntersectionObserver(entries=>{
  inView=entries[0].isIntersecting;
  if(inView)requestMotionFrame();else stopMotionFrame();
},{threshold:.01}).observe(heroArt);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden)stopMotionFrame();else requestMotionFrame();
});
updateMotionControls();
requestMotionFrame();
