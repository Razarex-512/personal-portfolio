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

// A single bounded background canvas. Geometry is precomputed; no layout reads per frame.
const canvas = document.getElementById('cloud');
const ctx = canvas.getContext('2d');
const toggle = document.getElementById('motion-toggle');
const title = document.querySelector('.monument');
const points = [];
const columns = 58, rows = 30;
for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
  const i = row * columns + col;
  const phi = Math.acos(1 - 2 * (i + .5) / (rows * columns));
  const theta = i * Math.PI * (3 - Math.sqrt(5));
  points.push({ u: col / (columns - 1), v: row / (rows - 1), sx: Math.sin(phi) * Math.cos(theta), sy: Math.cos(phi), sz: Math.sin(phi) * Math.sin(theta) });
}
let width = 1, height = 1, scrollRange = 1, progress = 0, targetProgress = 0;
let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
let paused = reduceMotion.matches, frame = 0, time = 0, lastTime = 0;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
function resize() {
  width = innerWidth; height = innerHeight;
  const ratio = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
  scrollRange = Math.max(1, document.documentElement.scrollHeight - height);
  targetProgress = clamp(scrollY / scrollRange);
  if (paused) draw();
}
function draw() {
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  const small = width < 650;
  const p = paused ? .08 : progress;
  const sphere = smooth((p - .08) / .28) * (1 - smooth((p - .6) / .28));
  const angle = -.22 + p * 1.65 + pointerX * .09;
  const ca = Math.cos(angle), sa = Math.sin(angle);
  const radius = Math.min(width * .36, height * .5);
  const cx = width * (small ? .7 : .74) + pointerX * 18;
  const cy = height * (.46 + Math.sin(p * Math.PI) * .12) + pointerY * 12;
  const step = small ? 2 : 1;
  ctx.fillStyle = '#80cfe8';
  for (let i = 0; i < points.length; i += step) {
    const a = points[i];
    const waveX = (a.u - .5) * radius * 3.1;
    const waveZ = (a.v - .5) * radius * 1.8;
    const waveY = Math.sin(a.u * 8 + time) * radius * .15 + Math.cos(a.v * 7 + time * .6) * radius * .12;
    const x = waveX + (a.sx * radius - waveX) * sphere;
    const y = waveY + (a.sy * radius - waveY) * sphere;
    const z = waveZ + (a.sz * radius - waveZ) * sphere;
    const rx = x * ca - z * sa;
    const rz = x * sa + z * ca;
    const scale = 1 + rz / (radius * 8);
    const screenX = cx + rx * scale;
    const screenY = cy + (y + rz * .38) * scale;
    const readability = .22 + .78 * smooth((screenX / width - .25) / .5);
    ctx.globalAlpha = (.16 + .33 * ((rz / (radius * 2)) + .5)) * readability;
    ctx.beginPath(); ctx.arc(screenX, screenY, Math.max(.65, 1.15 * scale), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function tick(now) {
  frame = 0;
  if (paused || document.hidden || !ctx) return;
  const dt = Math.min(now - lastTime, 40); lastTime = now;
  const settle = 1 - Math.exp(-dt / 130);
  time += dt * .00022;
  progress += (targetProgress - progress) * settle;
  pointerX += (targetX - pointerX) * settle;
  pointerY += (targetY - pointerY) * settle;
  draw(); frame = requestAnimationFrame(tick);
}
function sync() {
  toggle.textContent = paused ? 'Play background motion' : 'Pause background motion';
  toggle.setAttribute('aria-pressed', String(!paused));
  document.documentElement.dataset.motion = paused ? 'paused' : 'playing';
  if (paused || document.hidden) { cancelAnimationFrame(frame); frame = 0; }
  else if (!frame && ctx) { lastTime = performance.now(); frame = requestAnimationFrame(tick); }
}
toggle.addEventListener('click', () => { paused = !paused; sync(); });
reduceMotion.addEventListener('change', () => { paused = reduceMotion.matches; sync(); draw(); });
addEventListener('resize', resize, { passive: true });
addEventListener('scroll', () => {
  targetProgress = clamp(scrollY / scrollRange);
  if (!paused && !reduceMotion.matches) title.style.transform = `translateY(${Math.min(scrollY * .07, 45)}px) scale(${1 - Math.min(scrollY / 1000, 1) * .035})`;
}, { passive: true });
if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
  addEventListener('pointermove', event => { targetX = event.clientX / width * 2 - 1; targetY = event.clientY / height * 2 - 1; }, { passive: true });
  document.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; });
}
document.addEventListener('visibilitychange', sync);
if ('ResizeObserver' in window) new ResizeObserver(() => { scrollRange = Math.max(1, document.documentElement.scrollHeight - height); }).observe(document.body);
resize(); draw(); sync();
