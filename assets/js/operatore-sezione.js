/* Sezioni dell'area operatore (logoimport.html, logogestione.html) aperte dentro la pagina operatore (operatore.html,
   indirizzo con ?incorporata): classe incorporata su <html> (operatore.css toglie cornice, titolo e ✕) e altezza del
   contenuto comunicata alla pagina operatore, che adatta il riquadro e la cornice oro.
   Tastiera: una finestra di conferma che si apre porta il fuoco su Annulla, Esc la chiude (come Annulla); senza
   finestre aperte, dentro la pagina operatore Esc torna al menu. */
(() => {
  const incorporata = new URLSearchParams(location.search).has('incorporata') && window.parent !== window;
  document.addEventListener('keydown', evento => {
    if (evento.key !== 'Escape') return;
    const finestra = document.querySelector('.modal-overlay.active');
    if (finestra) {
      evento.preventDefault();
      finestra.querySelector('.modal-btn-cancel')?.click();
    } else if (incorporata) {
      window.parent.postMessage({ esc: true }, location.origin);
    }
  });
  // una finestra di conferma che si apre prende la tastiera (sul pulsante Annulla, il più prudente)
  const osserva = () => document.querySelectorAll('.modal-overlay').forEach(finestra => {
    new MutationObserver(() => {
      if (finestra.classList.contains('active')) finestra.querySelector('.modal-btn-cancel')?.focus();
    }).observe(finestra, { attributes: true, attributeFilter: ['class'] });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', osserva);
  else osserva();
  if (!incorporata) return;
  document.documentElement.classList.add('incorporata');
  const manda = () => {
    window.parent.postMessage({ sezioneOperatore: location.pathname.split('/').pop(),
      altezza: Math.ceil(document.body.getBoundingClientRect().height) }, location.origin);
  };
  const avvia = () => {
    new ResizeObserver(manda).observe(document.body);
    manda();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia);
  else avvia();
})();
