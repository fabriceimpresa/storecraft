window.Caroselli = (() => {
  const states = new Map();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function columnStarts(container) {
    const left = container.getBoundingClientRect().left;
    const starts = [];
    Array.from(container.children).forEach(card => {
      if (!card.getClientRects().length) return;
      const start = card.getBoundingClientRect().left - left + container.scrollLeft;
      if (!starts.some(value => Math.abs(value - start) < 2)) starts.push(start);
    });
    return starts.sort((a, b) => a - b);
  }

  function nearest(starts, position) {
    return starts.reduce((best, value, index) =>
      Math.abs(value - position) < Math.abs(starts[best] - position) ? index : best, 0);
  }

  function update(container, state) {
    const max = Math.max(0, container.scrollWidth - container.clientWidth);
    state.prev.disabled = max <= 1 || container.scrollLeft <= 1;
    state.next.disabled = max <= 1 || container.scrollLeft >= max - 1;
  }

  function align(container, state) {
    if (!container.clientWidth) return;
    const starts = columnStarts(container);
    if (!starts.length) return;
    const max = Math.max(0, container.scrollWidth - container.clientWidth);
    const target = Math.min(max, Math.max(0, starts[nearest(starts, container.scrollLeft)]));
    state.target = null;
    container.scrollTo({ left: target, behavior: 'instant' });
    update(container, state);
  }

  function scroll(container, direction) {
    const state = states.get(container);
    if (!state || !container.clientWidth) return;
    const starts = columnStarts(container);
    if (!starts.length) return;
    const max = Math.max(0, container.scrollWidth - container.clientWidth);
    const step = starts.length > 1 ? starts[1] - starts[0] : container.clientWidth;
    const card = Array.from(container.children).find(child => child.getClientRects().length);
    const cardWidth = card.getBoundingClientRect().width;
    const count = Math.max(1, Math.floor((container.clientWidth - cardWidth + 2) / step) + 1);
    // I clic ravvicinati partono dalla destinazione, non dalla posizione intermedia.
    const position = state.target !== null && performance.now() - state.time < 700
      ? state.target : container.scrollLeft;
    const index = Math.max(0, Math.min(starts.length - 1, nearest(starts, position) + direction * count));
    state.target = Math.max(0, Math.min(max, starts[index]));
    state.time = performance.now();
    container.scrollTo({ left: state.target, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }

  function refresh() {
    states.forEach((state, container) => update(container, state));
  }

  function init(root = document) {
    root.querySelectorAll('.carousel-wrapper').forEach(wrapper => {
      const container = wrapper.querySelector('.carousel-container');
      const prev = wrapper.querySelector('.carousel-arrow.prev');
      const next = wrapper.querySelector('.carousel-arrow.next');
      if (!container || !prev || !next || states.has(container)) return;
      const state = { prev, next, target: null, time: 0 };
      states.set(container, state);
      prev.setAttribute('aria-controls', container.id);
      next.setAttribute('aria-controls', container.id);
      container.addEventListener('scroll', () => update(container, state), { passive: true });
      ['pointerdown', 'wheel'].forEach(type => {
        container.addEventListener(type, () => { state.target = null; }, { passive: true });
      });
      const resize = new ResizeObserver(() => align(container, state));
      resize.observe(container);
      const changes = new MutationObserver(() => align(container, state));
      changes.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
      update(container, state);
    });
  }

  return { init, refresh, scroll };
})();
