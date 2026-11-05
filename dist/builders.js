(() => {
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const root = document.documentElement;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const layer = document.createElement('div');
  layer.className = 'build-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.hidden = true;
  document.body.append(layer);
  const pieces = [...document.querySelectorAll([
    '.hero-title > span', '.hero-copy', '.work-heading h2', '.work-heading p',
    '.experiment', '.work-story > div:first-child', '.work-facts',
    '.fairness-header h3', '.fairness-header > div', '.study-diagram', '.study-copy',
    '.about h2', '.about-intro', '.about-grid > div:nth-child(2)',
    '.toolkit h3', '.toolkit p', '.contact h2', '.contact-row', '.email', '.footer-name'
  ].join(','))];
  const ease = getComputedStyle(root).getPropertyValue('--ease-out').trim();
  const travelEase = getComputedStyle(root).getPropertyValue('--ease-in-out').trim();
  const labels = ['layout', 'type', 'render', 'layout', 'type', 'render'];
  const crew = labels.map((label, i) => {
    const node = document.createElement('div');
    node.className = 'builder-cursor';
    node.style.color = ['#ee7785', '#c6c2bc', '#91b8ca'][i % 3];
    node.innerHTML = '<svg viewBox="0 0 22 28"><path d="M2 2L20 17L12 18L8 26Z"/></svg><span class="builder-label"><span>' + label + '</span></span>';
    layer.append(node);
    return {node, x:innerWidth * .8 + i * 16, y:70 + i * 25, vx:0, vy:0, job:null, corner:0};
  });
  let active = false, raf = 0, previous = 0, keyboard = false;
  let width = root.clientWidth, height = innerHeight, pending = [], jobs = [];
  const compact = () => width < 768 || !finePointer.matches;
  let lastScroll = -Infinity, lastPointer = -Infinity, pointerInside = false;
  const pointer = {x:width * .75, y:height * .4};
  const seen = new Set();
  const visible = new Set();
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  function finish(job) {
    job.animation.cancel();
    job.el.style.willChange = '';
    job.frame.remove();
    crew.forEach(worker => { if (worker.job === job) worker.job = null; });
  }

  function build(el, now) {
    const workers = crew.filter((worker, i) => !worker.job && (!compact() || i < 3)).slice(0, compact() ? 1 : 2);
    if (!workers.length) return false;
    const rect = el.getBoundingClientRect();
    seen.add(el);
    if (rect.bottom < 0 || rect.top > height || el.contains(document.activeElement)) return true;
    const index = pieces.indexOf(el);
    const direction = index % 2 ? 1 : -1;
    const heading = el.matches('h2,h3,.hero-title > span,.footer-name');
    const visual = el.matches('.experiment,.study-diagram');
    const available = direction < 0 ? rect.left - 12 : width - rect.right - 12;
    const distance = Math.min(compact() ? 24 : 56, Math.max(0, available)) * direction;
    const frame = document.createElement('div');
    frame.className = 'build-frame';
    frame.innerHTML = '<i></i><i></i><i></i><i></i>';
    frame.style.width = rect.width + 12 + 'px';
    frame.style.height = rect.height + 12 + 'px';
    layer.prepend(frame);
    el.style.willChange = 'transform, opacity';
    // Text stays legible throughout. Real content never depends on this animation.
    const animation = el.animate([
      {opacity:.45, transform:`translate(${distance}px, ${heading ? 18 : 32}px) scale(${visual ? .95 : 1})`},
      {opacity:1, transform:'translate(0, 0) scale(1)'}
    ], {duration:800, delay:250, fill:'backwards', easing:heading ? ease : travelEase});
    const job = {el, frame, animation, start:now, rect, width:rect.width + 12, height:rect.height + 12};
    workers.forEach((worker, i) => {worker.job = job; worker.corner = i;});
    jobs.push(job);
    return true;
  }

  function wake() {
    if (active && !document.hidden && !raf) {
      previous = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }

  function tick(now) {
    raf = 0;
    if (!active || document.hidden) return;
    const dt = Math.min((now - previous) / 1000, .032);
    previous = now;
    // Finish once; scrolling back never dismantles something already built.
    jobs = jobs.filter(job => {
      if (now - job.start > 1450 || job.el.contains(document.activeElement)) {finish(job); return false;}
      return true;
    });
    if (!keyboard) {
      while (pending.length && jobs.length < (compact() ? 2 : 3)) {
        const el = pending.shift();
        if (!seen.has(el) && !build(el, now)) {pending.unshift(el); break;}
      }
    }
    // Batch layout reads before writes. Only actively assembling pieces are measured.
    jobs.forEach(job => {job.rect = job.el.getBoundingClientRect();});
    jobs = jobs.filter(job => {
      if (job.rect.bottom < -80 || job.rect.top > height + 80) {finish(job); return false;}
      return true;
    });
    jobs.forEach(job => {
      job.frame.style.transform = `translate3d(${job.rect.left - 6}px,${job.rect.top - 6}px,0) scale(${(job.rect.width + 12) / job.width},${(job.rect.height + 12) / job.height})`;
      job.frame.style.opacity = String(clamp((1450 - (now - job.start)) / 400, 0, .8));
    });
    const idle = finePointer.matches && pointerInside && now - lastPointer > 550 && now - lastScroll > 220;
    const following = finePointer.matches && pointerInside && now - lastScroll > 220;
    let visibleCount = 0;
    crew.forEach((worker, i) => {
      const job = worker.job;
      let x, y, opacity = 0;
      if (job && !keyboard) {
        const r = job.rect;
        x = worker.corner ? r.right + 6 : r.left - 6;
        y = worker.corner ? r.bottom + 6 : r.top - 6;
        opacity = .95;
      } else if (following && !keyboard) {
        // Irregular orbits breathe around the idle pointer, then stretch into a trailing flock.
        const phase = i * Math.PI * 2 / crew.length + now * .00065;
        const radius = (idle ? 42 : 65) + i * 6 + Math.sin(now * .0013 + i * 2) * 9;
        x = pointer.x + Math.cos(phase) * radius;
        y = pointer.y + Math.sin(phase) * radius * .7;
        opacity = idle ? .82 : .4;
      } else {
        x = width - 28 - i * 18;
        y = height * .5 + Math.sin(i * 1.8) * 50;
      }
      if (keyboard || (compact() && i > 2)) opacity = 0;
      x = clamp(x, 10, width - 28); y = clamp(y, 10, height - 32);
      // Spring: mass 1, stiffness 100, damping 10. Retargets retain velocity.
      worker.vx += ((x - worker.x) * 100 - worker.vx * 10) * dt;
      worker.vy += ((y - worker.y) * 100 - worker.vy * 10) * dt;
      worker.x += worker.vx * dt; worker.y += worker.vy * dt;
      if (job && now - job.start > 250) {
        // Once gripped, the cursor and the element travel as one object.
        worker.x = x; worker.y = y; worker.vx = 0; worker.vy = 0;
      }
      worker.node.style.transform = `translate3d(${worker.x.toFixed(2)}px,${worker.y.toFixed(2)}px,0)`;
      worker.node.style.opacity = String(opacity);
      worker.node.dataset.building = String(!!job && !keyboard);
      worker.node.dataset.labelLeft = String(worker.x > width - 100);
      worker.node.dataset.labelUp = String(worker.y > height - 64);
      if (opacity) visibleCount++;
    });
    // No invisible busy loop on phones, with keyboard navigation, or after pointer exit.
    if (jobs.length || pending.length || visibleCount) raf = requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        visible.add(entry.target);
        if (active && !keyboard && !seen.has(entry.target) && !pending.includes(entry.target)) pending.push(entry.target);
      } else visible.delete(entry.target);
    });
    wake();
  }, {threshold:.08, rootMargin:'0px 0px -4% 0px'});
  pieces.forEach(el => observer.observe(el));

  function sync() {
    // neural.js defaults to Off for reduced motion; an explicit Full selection opts in.
    const enabled = root.dataset.motion === 'full';
    if (active === enabled) return;
    active = enabled;
    layer.hidden = !active;
    cancelAnimationFrame(raf); raf = 0;
    jobs.forEach(finish); jobs = []; pending = [];
    if (active) {
      seen.clear();
      keyboard = false;
      pending = pieces.filter(el => visible.has(el));
      wake();
    } else crew.forEach(worker => {worker.node.style.opacity = '0';});
  }
  new MutationObserver(sync).observe(root, {attributes:true, attributeFilter:['data-motion']});
  addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    pointer.x = event.clientX; pointer.y = event.clientY;
    lastPointer = performance.now(); pointerInside = true; keyboard = false;
    wake();
  }, {passive:true});
  document.addEventListener('pointerleave', () => {pointerInside = false; wake();});
  addEventListener('blur', () => {pointerInside = false; wake();});
  addEventListener('scroll', () => {lastScroll = performance.now(); wake();}, {passive:true});
  addEventListener('keydown', event => {
    if (['Tab','ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)) {
      keyboard = true;
      pending.forEach(el => seen.add(el)); pending = [];
      jobs.forEach(finish); jobs = [];
      wake();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {cancelAnimationFrame(raf); raf = 0;}
    else wake();
  });
  addEventListener('resize', () => {
    width = root.clientWidth; height = innerHeight;
    jobs.forEach(finish); jobs = [];
    wake();
  }, {passive:true});
  finePointer.addEventListener('change', () => {pointerInside = false; wake();});
  sync();
})();
