/* Sezioni dell'area operatore (loghi-ufficiali.html e le altre in un riquadro) aperte dentro la pagina operatore (operatore.html,
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
  // Dentro la pagina operatore il riquadro della sezione è alto quanto tutto il contenuto (es. 196 loghi): una finestra
  // di conferma centrata nel riquadro finirebbe fuori dallo schermo, con solo il velo in vista. La finestra si mette al
  // centro della parte del riquadro che si vede (e segue lo scorrimento della pagina operatore finché è aperta).
  function inVista(finestra) {
    const box = finestra.querySelector('.modal-box');
    if (!box) return;
    if (!incorporata || !window.frameElement) { finestra.style.alignItems = ''; box.style.marginTop = ''; return; }
    const r = window.frameElement.getBoundingClientRect(), alto = window.parent.innerHeight;
    const da = Math.max(0, -r.top), a = Math.min(r.height, alto - r.top);
    finestra.style.alignItems = 'flex-start';
    box.style.marginTop = `${Math.max(da + 12, da + (a - da - box.offsetHeight) / 2)}px`;
  }
  const segui = () => document.querySelectorAll('.modal-overlay.active').forEach(inVista);
  // scorrimento della pagina operatore, della finestra o di un suo riquadro (in cattura: lo scorrimento di un elemento non risale)
  if (incorporata && window.frameElement) { window.parent.document.addEventListener('scroll', segui, { passive: true, capture: true }); window.parent.addEventListener('resize', segui); }
  // una finestra di conferma che si apre prende la tastiera (sul pulsante Annulla, il più prudente)
  const osserva = () => document.querySelectorAll('.modal-overlay').forEach(finestra => {
    new MutationObserver(() => {
      if (!finestra.classList.contains('active')) return;
      inVista(finestra);
      finestra.querySelector('.modal-btn-cancel')?.focus({ preventScroll: true });
    }).observe(finestra, { attributes: true, attributeFilter: ['class'] });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', osserva);
  else osserva();
  if (!incorporata) return;
  document.documentElement.classList.add('incorporata');
  // altezza e larghezza di tutto il contenuto (anche quello che uscirebbe dal riquadro): la pagina operatore adatta
  // riquadro e cornice, così non compaiono barre di scorrimento
  const manda = () => {
    window.parent.postMessage({ sezioneOperatore: location.pathname.split('/').pop(),
      altezza: Math.ceil(Math.max(document.body.getBoundingClientRect().height, document.body.scrollHeight)),
      larghezza: Math.ceil(document.body.scrollWidth) }, location.origin);
  };
  const avvia = () => {
    new ResizeObserver(manda).observe(document.body);
    manda();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia);
  else avvia();
})();
