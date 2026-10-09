/* Sezioni dell'area operatore (logoimport.html, logogestione.html) aperte dentro la pagina operatore (operatore.html,
   indirizzo con ?incorporata): classe incorporata su <html> (operatore.css toglie cornice, titolo e ✕) e altezza del
   contenuto comunicata alla pagina operatore, che adatta il riquadro e la cornice oro. Aperte da sole non fanno niente. */
(() => {
  if (!new URLSearchParams(location.search).has('incorporata') || window.parent === window) return;
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
