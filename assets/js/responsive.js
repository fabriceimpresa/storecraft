(() => {
  if (document.body.dataset.layout !== 'cartelli') return;
  const buttons = [...document.querySelectorAll('.made-in-italy-btn, .black-friday-btn, .xmas-btn')];
  if (!buttons.length) return;
  const phone = window.matchMedia('screen and (max-width: 760px) and (pointer: coarse)');
  const toolbar = document.createElement('div');
  toolbar.className = 'phone-theme-toolbar';
  toolbar.setAttribute('role', 'group');
  toolbar.setAttribute('aria-label', 'Temi dei cartelli');
  const groups = new Map();
  const positions = buttons.map(button => {
    const anchor = document.createComment('Posizione desktop del pulsante tema');
    button.before(anchor);
    return { button, anchor };
  });
  const sidebar = document.querySelector('.sidebar');
  sidebar.after(toolbar);
  buttons.forEach(button => {
    const index = button.dataset.cardIndex || (button.className.includes('-lower') ? '2' : '1');
    if (!groups.has(index)) {
      const group = document.createElement('div');
      group.className = 'phone-theme-group';
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', index === '2' ? 'Temi del cartello inferiore' : 'Temi del cartello superiore');
      toolbar.append(group);
      groups.set(index, group);
    }
  });
  document.body.append(toolbar);

  function fitPrintSheet() {
    const sheet = document.querySelector('#printSheet, .print-sheet, .a4-sheet');
    if (!sheet) return;
    if (!phone.matches) {
      sheet.style.removeProperty('zoom');
      return;
    }
    const bodyStyle = getComputedStyle(document.body);
    const horizontalPadding = parseFloat(bodyStyle.paddingLeft) + parseFloat(bodyStyle.paddingRight);
    const availableWidth = Math.max(1, window.innerWidth - horizontalPadding);
    sheet.style.zoom = String(Math.min(1, availableWidth / sheet.offsetWidth));
  }

  function positionGroups() {
    const sheet = document.querySelector('#printSheet, .print-sheet, .a4-sheet');
    if (!sheet) return;
    const zoom = Number.parseFloat(getComputedStyle(sheet).zoom) || 1;
    groups.forEach((group, index) => {
      const card = document.getElementById(`card${index}`);
      if (!card) return;
      const rect = card.getBoundingClientRect();
      group.hidden = rect.width === 0 || rect.height === 0;
      if (group.hidden) return;
      group.style.top = `${Math.max(8, rect.top * zoom - 50)}px`;
      group.style.right = `${Math.max(8, window.innerWidth - rect.right * zoom)}px`;
    });
  }

  function update() {
    fitPrintSheet();
    positions.forEach(({ button, anchor }) => {
      if (phone.matches) {
        const index = button.dataset.cardIndex || (button.className.includes('-lower') ? '2' : '1');
        groups.get(index).append(button);
      } else {
        anchor.after(button);
      }
    });
    positionGroups();
  }

  phone.addEventListener('change', update);
  window.addEventListener('resize', update);
  window.addEventListener('scroll', positionGroups, { passive: true });
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(positionGroups);
    ['#card1', '#card2'].forEach(selector => {
      const card = document.querySelector(selector);
      if (card) observer.observe(card);
    });
  }
  update();
})();
