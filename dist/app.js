const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const filters = document.querySelectorAll('[data-filter]');
const projects = document.querySelectorAll('.project');
filters.forEach(button => button.addEventListener('click', event => {
  filters.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  let count = 0;
  projects.forEach(project => {
    project.hidden = button.dataset.filter !== 'all' && project.dataset.category !== button.dataset.filter;
    if (!project.hidden) {
      count++;
      if (!reduceMotion.matches && event.detail > 0) project.animate([{ opacity: .3, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 250, easing: 'cubic-bezier(.23,1,.32,1)' });
    }
  });
  document.querySelector('.project-grid').classList.toggle('is-filtered', button.dataset.filter !== 'all');
  document.getElementById('filter-status').textContent = `Showing ${count} project${count === 1 ? '' : 's'}.`;
}));
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      if (!reduceMotion.matches) entry.target.classList.add('reveal');
      observer.unobserve(entry.target);
    }
  }), { threshold: .12 });
  document.querySelectorAll('.hero-copy,.internship,.section-top h2,.section-top p,.project-art,.project-heading,.project>p,.projects-end,.about h2,.about-intro,.about-grid>div>p,.research,.toolkit,.contact h2,.contact-row,.email').forEach(el => observer.observe(el));
}

