(() => {
  const canvas = document.getElementById('cloud');
  const context = canvas.getContext('2d');
  const controls = document.querySelectorAll('[data-motion-mode]');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
  let explicitMode = null;
  try { explicitMode = localStorage.getItem('raza-neural-motion'); } catch {}
  if (!['full', 'calm', 'off'].includes(explicitMode)) explicitMode = null;
  let mode = explicitMode || (preference.matches ? 'off' : 'full');
  let width = 1, height = 1, range = 1, targetScroll = 0, scroll = 0;
  let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  let time = 0, frame = 0, previous = 0;
  const vertices = [], edges = [], neuralEdges = [], projected = [];
  const rings = 8, segments = 12;
  const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  const mix = (a, b, t) => a + (b - a) * t;
  // Three actual connected geometries share 96 vertices, so scrolling can morph them.
  for (let ring = 0; ring < rings; ring++) for (let segment = 0; segment < segments; segment++) {
    const index = ring * segments + segment;
    const latitude = Math.PI * (ring + .5) / rings;
    const angle = segment * Math.PI * 2 / segments + (ring % 2) * Math.PI / segments;
    const layer = Math.floor(index / 16), neuron = index % 16;
    const tube = ring * Math.PI * 2 / rings;
    vertices.push({
      sphere: [Math.sin(latitude) * Math.cos(angle), Math.cos(latitude), Math.sin(latitude) * Math.sin(angle)],
      network: [(layer - 2.5) * .46, ((neuron % 4) - 1.5) * .4, (Math.floor(neuron / 4) - 1.5) * .4],
      torus: [(1 + .32 * Math.cos(tube)) * Math.cos(angle), .32 * Math.sin(tube), (1 + .32 * Math.cos(tube)) * Math.sin(angle)]
    });
    projected.push({ x: 0, y: 0, z: 0, alpha: 0, scale: 1 });
    edges.push([index, ring * segments + (segment + 1) % segments]);
    if (ring < rings - 1) {
      edges.push([index, index + segments]);
      edges.push([index, (ring + 1) * segments + (segment + 1) % segments]);
    }
    if (layer < 5) {
      neuralEdges.push([index, index + 16]);
      neuralEdges.push([index, (layer + 1) * 16 + (neuron + 5) % 16]);
    }
  }
  function resize() {
    width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, width < 650 ? 1.25 : 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    measure(); draw();
  }
  function measure() {
    range = Math.max(1, document.documentElement.scrollHeight - height);
    targetScroll = Math.max(0, Math.min(1, scrollY / range));
  }
  function drawEdges(list, weight, pulses) {
    if (weight < .01) return;
    context.lineWidth = width < 650 ? .75 : 1;
    for (let i = 0; i < list.length; i++) {
      const [a, b] = list[i], start = projected[a], end = projected[b];
      const glow = mode === 'off' ? .8 : .66 + .34 * Math.sin(time * 1.4 - i * .18);
      context.globalAlpha = Math.min(start.alpha, end.alpha) * weight * (.28 + glow * .3);
      context.strokeStyle = i % 5 === 0 ? '#9b4558' : '#ae6a76';
      context.beginPath(); context.moveTo(start.x, start.y); context.lineTo(end.x, end.y); context.stroke();
      if (pulses && mode === 'full' && i % 13 === 0) {
        const position = (time * .38 + i * .071) % 1;
        const x = mix(start.x, end.x, position), y = mix(start.y, end.y, position);
        context.globalAlpha = Math.min(start.alpha, end.alpha) * weight * .9;
        context.fillStyle = '#f3b9c2'; context.beginPath(); context.arc(x, y, 2.5, 0, Math.PI * 2); context.fill();
      }
    }
  }
  function draw() {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    const full = mode === 'full';
    const stage = full ? scroll : 0;
    const network = smooth((stage - .07) / .28);
    const torus = smooth((stage - .55) / .28);
    const rotation = full ? time * .11 + stage * .7 + mouseX * .25 : .45;
    const pitch = full ? -.18 - torus * .48 + Math.sin(time * .16) * .16 + mouseY * .14 : -.12;
    const cy = Math.cos(rotation), sy = Math.sin(rotation), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const mobile = width < 650;
    const radius = Math.min(width * (mobile ? .8 : .37), height * .46);
    const centerX = width * (mobile ? .91 : .76);
    const centerY = height * .43;
    vertices.forEach((vertex, index) => {
      const x = mix(mix(vertex.sphere[0], vertex.network[0], network), vertex.torus[0], torus);
      const y = mix(mix(vertex.sphere[1], vertex.network[1], network), vertex.torus[1], torus);
      const z = mix(mix(vertex.sphere[2], vertex.network[2], network), vertex.torus[2], torus);
      const rx = x * cy - z * sy, rz = x * sy + z * cy;
      const ry = y * cp - rz * sp, depth = y * sp + rz * cp;
      const perspective = 3.7 / (3.7 - depth);
      const node = projected[index];
      node.x = centerX + rx * radius * perspective;
      node.y = centerY + ry * radius * perspective;
      node.z = depth; node.scale = perspective;
      node.alpha = (.2 + .65 * smooth((node.x / width - .23) / .55)) * (.56 + .44 * (depth + 1.5) / 3);
    });
    drawEdges(edges, 1 - network * (1 - torus), true);
    drawEdges(neuralEdges, network * (1 - torus), true);
    for (let i = 0; i < projected.length; i++) {
      const node = projected[i];
      const activation = mode === 'off' ? .55 : .45 + .55 * Math.pow((1 + Math.sin(time * 1.8 - i * .55)) / 2, 3);
      context.globalAlpha = node.alpha * (.25 + activation * .35);
      context.fillStyle = '#98374e'; context.beginPath(); context.arc(node.x, node.y, (5 + activation * 3) * node.scale, 0, Math.PI * 2); context.fill();
      context.globalAlpha = node.alpha * (.55 + activation * .45);
      context.fillStyle = '#e6a6b6'; context.beginPath(); context.arc(node.x, node.y, (1.7 + activation * .9) * node.scale, 0, Math.PI * 2); context.fill();
    }
    context.globalAlpha = 1;
  }
  function tick(now) {
    frame = 0;
    if (mode === 'off' || document.hidden || !context) return;
    const interval = mode === 'calm' ? 100 : 32;
    if (now - previous < interval) { frame = requestAnimationFrame(tick); return; }
    const dt = Math.min(now - previous, 50); previous = now;
    time += dt * .001;
    const easing = 1 - Math.exp(-dt / 180);
    scroll += (targetScroll - scroll) * easing;
    mouseX += (targetX - mouseX) * easing; mouseY += (targetY - mouseY) * easing;
    draw(); frame = requestAnimationFrame(tick);
  }
  function sync() {
    controls.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.motionMode === mode)));
    document.documentElement.dataset.motion = mode;
    cancelAnimationFrame(frame); frame = 0;
    if (mode !== 'off' && !document.hidden && context) { previous = performance.now(); frame = requestAnimationFrame(tick); }
    draw();
  }
  controls.forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.motionMode; explicitMode = mode;
    try { localStorage.setItem('raza-neural-motion', mode); } catch {}
    sync();
  }));
  preference.addEventListener('change', () => { if (!explicitMode) { mode = preference.matches ? 'off' : 'full'; sync(); } });
  addEventListener('resize', resize, { passive: true });
  addEventListener('scroll', () => { targetScroll = Math.max(0, Math.min(1, scrollY / range)); }, { passive: true });
  if (finePointer.matches) {
    addEventListener('pointermove', event => { targetX = event.clientX / width * 2 - 1; targetY = event.clientY / height * 2 - 1; }, { passive: true });
    document.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; });
  }
  document.addEventListener('visibilitychange', sync);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  resize(); sync();
})();
