(() => {
  if (!CSS.supports('appearance', 'base-select')) return;
  const states = new Map();

  function cleanup(select) {
    const state = states.get(select);
    if (!state) return;
    state.observer.disconnect();
    states.delete(select);
  }

  function init(select) {
    if (select.multiple || select.size > 1) return;
    const value = select.value;
    const selectedIndex = select.selectedIndex;
    let options = select.querySelector(':scope > .menu-cascata-options');
    if (options) {
      Array.from(select.children).filter(child => child.matches('option, optgroup'))
        .forEach(child => options.append(child));
      if (selectedIndex < 0) select.selectedIndex = -1;
      else select.value = value;
      return;
    }
    cleanup(select);
    options = document.createElement('div');
    options.className = 'menu-cascata-options';
    options.append(...select.children);
    const track = document.createElement('div');
    track.className = 'menu-cascata-track';
    track.setAttribute('aria-hidden', 'true');
    const thumb = document.createElement('div');
    thumb.className = 'menu-cascata-thumb';
    track.append(thumb);
    select.append(options, track);
    if (selectedIndex < 0) select.selectedIndex = -1;
    else select.value = value;
    select.classList.add('menu-cascata');

    function update() {
      const maxScroll = options.scrollHeight - options.clientHeight;
      track.hidden = maxScroll <= 1;
      const travel = Math.max(0, track.clientHeight - 42);
      thumb.style.top = `${3 + (maxScroll > 0 ? options.scrollTop / maxScroll * travel : 0)}px`;
    }
    options.addEventListener('scroll', update);
    const observer = new ResizeObserver(update);
    observer.observe(options);
    let drag = null;
    track.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      const travel = track.clientHeight - 42;
      const maxScroll = options.scrollHeight - options.clientHeight;
      if (travel <= 0 || maxScroll <= 0) return;
      if (event.target !== thumb) {
        const y = event.clientY - track.getBoundingClientRect().top - 21;
        options.scrollTop = Math.max(0, Math.min(1, y / travel)) * maxScroll;
      }
      drag = { y: event.clientY, scroll: options.scrollTop, ratio: maxScroll / travel };
      track.setPointerCapture(event.pointerId);
    });
    track.addEventListener('pointermove', event => {
      if (drag) options.scrollTop = drag.scroll + (event.clientY - drag.y) * drag.ratio;
    });
    track.addEventListener('pointerup', () => { drag = null; });
    track.addEventListener('pointercancel', () => { drag = null; });
    track.addEventListener('lostpointercapture', () => { drag = null; });
    track.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
    });
    track.addEventListener('wheel', event => {
      event.preventDefault();
      options.scrollTop += event.deltaY * (event.deltaMode === 1 ? 28 : event.deltaMode === 2 ? options.clientHeight : 1);
    }, { passive: false });
    states.set(select, { observer });
  }

  function refresh() {
    states.forEach((state, select) => {
      if (!select.isConnected) cleanup(select);
    });
    document.querySelectorAll('select').forEach(init);
  }
  refresh();
  new MutationObserver(refresh).observe(document.body, { childList: true, subtree: true });
})();
