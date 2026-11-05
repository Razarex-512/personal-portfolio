// Navigation stays independent of the optional cursor choreography.
const menu=document.querySelector('.menu-toggle'),navigation=document.querySelector('#main-navigation');
function closeMenu(){navigation.classList.remove('open');menu.setAttribute('aria-expanded','false');}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));navigation.classList.toggle('open',open);});
navigation.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&navigation.classList.contains('open')){closeMenu();menu.focus();}});
const sectionObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)navigation.querySelectorAll('a').forEach(a=>{if(a.hash==='#'+e.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}),{rootMargin:'-10% 0px -55% 0px'});
document.querySelectorAll('main>section[id]').forEach(el=>sectionObserver.observe(el));
