(() => {
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const root = document.documentElement;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const layer = document.createElement('div');
  layer.className = 'build-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.hidden = true;
  document.body.append(layer);
  const buildSelector = [
    '.hero-title > span', '.work-heading h2', '.experiment', '.work-story h3',
    '.work-facts dl', '.fairness-header h3', '.study-diagram', '.study-copy h4',
    '.about h2', '.research h3', '.toolkit h3', '.contact h2', '.email', '.footer-name'
  ].join(',');
  const writeSelector = [
    '.hero-copy > p', '.work-heading p', '.work-intro', '.work-facts > p',
    '.fairness-header > div > p', '.study-copy p', '.about-intro',
    '.about-grid > div:nth-child(2) > p', '.research p', '.toolkit p', '.contact-row > p'
  ].join(',');
  const pieces = [...document.querySelectorAll(buildSelector + ',' + writeSelector)];
  const writingPieces = new Set(document.querySelectorAll(writeSelector));
  const ease = getComputedStyle(root).getPropertyValue('--ease-out').trim();
  const travelEase = getComputedStyle(root).getPropertyValue('--ease-in-out').trim();
  const labels = ['layout', 'type', 'render', 'layout', 'type', 'render', 'write', 'paste', 'write', 'paste', 'write', 'paste'];
  const crew = labels.map((label, i) => {
    const node = document.createElement('div');
    node.className = 'builder-cursor';
    node.dataset.role = i < 6 ? 'build' : 'write';
    node.style.color = ['#ee7785', '#c6c2bc', '#91b8ca'][i % 3];
    node.innerHTML = '<svg viewBox="0 0 22 28"><path d="M2 2L20 17L12 18L8 26Z"/></svg><span class="builder-label"><span>' + label + '</span></span>';
    layer.append(node);
    return {node, role:i < 6 ? 'build' : 'write', assignments:0, x:innerWidth * .8 + i * 10, y:70 + i * 16, vx:0, vy:0, job:null, corner:0};
  });
  let active = false, raf = 0, previous = 0, keyboard = false;
  let width = root.clientWidth, height = innerHeight, pending = [], jobs = [];
  const compact = () => width < 768 || !finePointer.matches;
  const included = i => !compact() || i === 0 || i === 1 || i === 6 || i === 7;
  let lastScroll = -Infinity, lastPointer = -Infinity, pointerInside = false;
  const pointer = {x:width * .75, y:height * .4};
  const seen = new Set();
  const visible = new Set();
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const flag = (node, key, value) => {
    const next = String(value);
    if (node.dataset[key] !== next) node.dataset[key] = next;
  };

  function finish(job) {
    job.animations.forEach(animation => animation.cancel());
    job.el.style.willChange = '';
    job.frame?.remove();
    job.caret?.remove();
    // Restore the exact original text nodes, including whitespace and inline markup.
    job.originals?.forEach(({text, spans}) => {
      spans[0].replaceWith(text);
      spans.slice(1).forEach(span => span.remove());
    });
    crew.forEach(worker => { if (worker.job === job) worker.job = null; });
  }

  function build(el, now) {
    const role = writingPieces.has(el) ? 'write' : 'build';
    const limit = compact() ? 1 : 3;
    if (jobs.filter(job => job.kind === role).length >= limit) return false;
    const workers = crew.filter((worker, i) => !worker.job && worker.role === role && included(i)).sort((a,b) => a.assignments - b.assignments).slice(0, role === 'write' || compact() ? 1 : 2);
    if (!workers.length) return false;
    const rect = el.getBoundingClientRect();
    seen.add(el);
    if (rect.bottom < 0 || rect.top > height || el.contains(document.activeElement)) return true;
    if (role === 'write') {
      write(el, now, rect, workers[0]);
      return true;
    }
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
    const job = {kind:'build', el, frame, animations:[animation], start:now, end:now + 1450, rect, width:rect.width + 12, height:rect.height + 12};
    workers.forEach((worker, i) => {worker.job = job; worker.corner = i; worker.assignments++;});
    jobs.push(job);
    return true;
  }

  function write(el, now, rect, worker) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const texts = [];
    while (walker.nextNode()) if (walker.currentNode.textContent.trim()) texts.push(walker.currentNode);
    const words = texts.reduce((count, text) => count + (text.textContent.match(/\S+/g) || []).length, 0);
    const batchSize = Math.max(3, Math.ceil(words / 8));
    const originals = [], chunks = [];
    for (const text of texts) {
      const tokens = text.textContent.match(/\S+\s*|\s+/g) || [];
      const spans = [];
      for (let i = 0; i < tokens.length; i += batchSize) {
        const span = document.createElement('span');
        span.className = 'writer-chunk';
        span.textContent = tokens.slice(i, i + batchSize).join('');
        spans.push(span);
        const index = chunks.length;
        // Short paste bursts with a small pause between groups, never individual letters.
        chunks.push({span, at:250 + index * 65 + Math.floor(index / 3) * 65});
      }
      text.replaceWith(...spans);
      originals.push({text, spans});
    }
    if (!chunks.length) return;
    // Cache phrase endpoints once, before any animation. No word measurements per frame.
    chunks.forEach(chunk => {
      const lines = [...chunk.span.getClientRects()];
      const end = lines[lines.length - 1];
      chunk.x = end.right - rect.left;
      chunk.y = end.top - rect.top;
      chunk.height = end.height;
    });
    const animations = chunks.map(chunk => chunk.span.animate(
      [{opacity:0}, {opacity:1}],
      {duration:80, delay:chunk.at, fill:'backwards', easing:'steps(1,end)'}
    ));
    const caret = document.createElement('i');
    caret.className = 'writer-caret';
    layer.append(caret);
    const job = {kind:'write', el, rect, originals, chunks, caret, animations, start:now, end:now + chunks[chunks.length - 1].at + 300};
    worker.job = job;
    worker.assignments++;
    jobs.push(job);
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
    // Cap decorative work on high-refresh screens; compact layouts use 30fps.
    if (now - previous < (compact() ? 30 : 15)) {raf = requestAnimationFrame(tick); return;}
    const dt = Math.min((now - previous) / 1000, .032);
    previous = now;
    // Finish once; scrolling back never dismantles something already built.
    jobs = jobs.filter(job => {
      if (now > job.end || job.el.contains(document.activeElement)) {finish(job); return false;}
      return true;
    });
    if (!keyboard) {
      pending = pending.filter(el => !seen.has(el) && !build(el, now));
    }
    // Batch layout reads before writes. Only actively assembling pieces are measured.
    jobs.forEach(job => {job.rect = job.el.getBoundingClientRect();});
    jobs = jobs.filter(job => {
      if (job.rect.bottom < -80 || job.rect.top > height + 80) {finish(job); return false;}
      return true;
    });
    jobs.forEach(job => {
      if (job.kind === 'build') {
        job.frame.style.transform = `translate3d(${job.rect.left - 6}px,${job.rect.top - 6}px,0) scale(${(job.rect.width + 12) / job.width},${(job.rect.height + 12) / job.height})`;
        job.frame.style.opacity = String(clamp((job.end - now) / 400, 0, .8));
      } else {
        const elapsed = now - job.start;
        const chunk = job.chunks.findLast(part => elapsed >= part.at + 80);
        job.penX = job.rect.left + (chunk?.x || 0);
        job.penY = job.rect.top + (chunk?.y || 0);
        job.caret.style.transform = `translate3d(${job.penX}px,${job.penY}px,0) scaleY(${(chunk?.height || 20) / 20})`;
        job.caret.style.opacity = String(clamp((job.end - now) / 180, 0, 1));
      }
    });
    const idle = finePointer.matches && pointerInside && now - lastPointer > 550 && now - lastScroll > 220;
    const following = finePointer.matches && pointerInside && now - lastScroll > 220;
    let visibleCount = 0;
    crew.forEach((worker, i) => {
      if (!included(i)) {worker.node.style.opacity = '0'; return;}
      const job = worker.job;
      let x, y, opacity = 0;
      if (job && !keyboard) {
        const r = job.rect;
        x = job.kind === 'write' ? job.penX + 8 : worker.corner ? r.right + 6 : r.left - 6;
        y = job.kind === 'write' ? job.penY + 24 : worker.corner ? r.bottom + 6 : r.top - 6;
        opacity = .95;
      } else if (following && !keyboard) {
        // Irregular orbits breathe around the idle pointer, then stretch into a trailing flock.
        const phase = i * 2.39996 + now * .0005 * (i % 2 ? 1 : -1);
        const radius = (idle ? 36 : 60) + i % 4 * 17 + Math.sin(now * .0013 + i * 2) * 9;
        x = pointer.x + Math.cos(phase) * radius;
        y = pointer.y + Math.sin(phase) * radius * .7;
        opacity = idle ? .82 : .4;
      } else {
        x = width - 28 - i * 18;
        y = height * .5 + Math.sin(i * 1.8) * 50;
      }
      if (keyboard) opacity = 0;
      x = clamp(x, 10, width - 28); y = clamp(y, 10, height - 32);
      // Spring: mass 1, stiffness 100, damping 10. Retargets retain velocity.
      worker.vx += ((x - worker.x) * 100 - worker.vx * 10) * dt;
      worker.vy += ((y - worker.y) * 100 - worker.vy * 10) * dt;
      worker.x += worker.vx * dt; worker.y += worker.vy * dt;
      if (job?.kind === 'build' && now - job.start > 250) {
        // Once gripped, the cursor and the element travel as one object.
        worker.x = x; worker.y = y; worker.vx = 0; worker.vy = 0;
      }
      worker.node.style.transform = `translate3d(${worker.x.toFixed(2)}px,${worker.y.toFixed(2)}px,0)`;
      worker.node.style.opacity = String(opacity);
      flag(worker.node, 'building', !!job && !keyboard);
      flag(worker.node, 'labelLeft', worker.x > width - 100);
      flag(worker.node, 'labelUp', worker.y > height - 64);
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
  document.addEventListener('pointerdown', event => {
    // Reading, selecting and clicking always take precedence over the writing effect.
    jobs = jobs.filter(job => {
      if (job.el.contains(event.target)) {finish(job); return false;}
      return true;
    });
  }, {passive:true});
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
