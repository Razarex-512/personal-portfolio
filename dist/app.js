// Motion preferences are shared by the background and the rest of the site.
const motionAllowed = () => document.documentElement.dataset.motion === 'full';
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    if (motionAllowed()) entry.target.animate([{opacity:.2,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.23,1,.32,1)'});
    observer.unobserve(entry.target);
  }), {threshold:.12});
  document.querySelectorAll('.hero-copy,.internship,.work-heading h2,.work-heading p,.work-tab,.experiment,.projects-end,.about h2,.about-intro,.about-grid>div>p,.research,.toolkit,.contact h2,.contact-row,.email').forEach(el=>observer.observe(el));
}
