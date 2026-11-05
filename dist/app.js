// Motion preferences are shared by the background and the rest of the site.
const motionAllowed = () => !matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.dataset.motion === 'full';
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    if (motionAllowed()) entry.target.animate([{opacity:.2,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.23,1,.32,1)'});
    observer.unobserve(entry.target);
  }), {threshold:.12});
  document.querySelectorAll('.hero-copy,.internship,.work-heading h2,.work-heading p,.work-story h3,.work-intro,.work-facts,.fairness-header h3,.study-diagram,.study-copy,.projects-end,.about h2,.about-intro,.about-grid>div>p,.research,.toolkit,.contact h2,.contact-row,.email').forEach(el=>observer.observe(el));
}
const menu=document.querySelector('.menu-toggle'),navigation=document.querySelector('#main-navigation');
function closeMenu(){navigation.classList.remove('open');menu.setAttribute('aria-expanded','false');}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));navigation.classList.toggle('open',open);});
navigation.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&navigation.classList.contains('open')){closeMenu();menu.focus();}});
requestAnimationFrame(()=>{if(motionAllowed())document.querySelectorAll('.hero-title>span').forEach((el,i)=>el.animate([{opacity:0,transform:'translateY(55%)',clipPath:'inset(0 0 100% 0)'},{opacity:1,transform:'none',clipPath:'inset(0)'}],{duration:900,delay:i*110,easing:'cubic-bezier(.23,1,.32,1)'}));});
const sectionObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)navigation.querySelectorAll('a').forEach(a=>{if(a.hash==='#'+e.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}),{rootMargin:'-10% 0px -55% 0px'});
document.querySelectorAll('main>section[id]').forEach(el=>sectionObserver.observe(el));
new MutationObserver(()=>{if(!motionAllowed())document.getAnimations().forEach(a=>a.cancel());}).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
