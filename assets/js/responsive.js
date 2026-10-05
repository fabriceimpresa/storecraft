(() => {
  if (document.body.dataset.layout !== 'cartelli') return;
  const buttons = [...document.querySelectorAll('.made-in-italy-btn, .black-friday-btn, .xmas-btn')];
  if (!buttons.length) return;
  const phone = window.matchMedia('screen and (max-width: 760px) and (pointer: coarse)');
  const toolbar = document.createElement('div');
  toolbar.className = 'phone-theme-toolbar';
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
      const label = document.createElement('span');
      label.className = 'phone-theme-label';
      label.textContent = index === '2' ? 'Cartello inferiore' : 'Cartello superiore';
      group.append(label);
      toolbar.append(group);
      groups.set(index, group);
    }
  });
  function update() {
    positions.forEach(({ button, anchor }) => {
      if (phone.matches) {
        const index = button.dataset.cardIndex || (button.className.includes('-lower') ? '2' : '1');
        groups.get(index).append(button);
      } else {
        anchor.after(button);
      }
    });
  }
  phone.addEventListener('change', update);
  update();
})();
