/* Campi prezzo e percentuale dei pannelli, con la regola dei cartelli di Luxury (stile .input-affix di pannello.css).
   Si dichiarano sul campo:
     <input data-prezzo …>        simbolo € fisso davanti (l'utente non lo scrive), solo cifre, virgola e punto;
                                  uscendo dal campo il prezzo prende sempre due decimali (395 → 395,00; 39,9 → 39,90)
     <input data-percentuale …>   simbolo % fisso dopo e frecce ▲▼, solo numeri da 1 a 99
   Il modulo crea il riquadro attorno al campo; se il campo è già in un riquadro della pagina (.input-affix con il suo
   simbolo .affix, come nelle pagine di Luxury, oppure .currency-input-group / .percent-input-wrapper) usa quello,
   conservando simbolo e frecce della pagina (.percent-stepper, con i suoi clic).
   La pagina continua a leggere il valore con oninput: il valore arriva già ripulito e, uscendo dal campo, il modulo
   lo riscrive con i due decimali e manda di nuovo l'evento input, così cartello e stato si aggiornano.
   Va incluso con defer (oppure in fondo alla pagina). */
(() => {
  const el = (tag, cls, text) => {
    const nodo = document.createElement(tag);
    if (cls) nodo.className = cls;
    if (text) nodo.textContent = text;
    return nodo;
  };

  function formattaPrezzo(valore) {
    const pulito = valore.replace(/[^\d,.]/g, '').replace(/\./g, ',');
    if (!/\d/.test(pulito)) return '';
    const [interi, ...resto] = pulito.split(',');
    const decimali = resto.join('').replace(/\D/g, '');
    return `${interi || '0'},${decimali.padEnd(2, '0').slice(0, 2)}`;
  }

  const avvisa = campo => campo.dispatchEvent(new Event('input', { bubbles: true }));

  // riquadro .input-affix: quello della pagina trasformato, oppure uno nuovo attorno al campo
  function riquadro(campo, vecchiaClasse) {
    const padre = campo.parentElement;
    if (padre.classList.contains('input-affix')) return padre;
    if (padre.classList.contains(vecchiaClasse)) {
      padre.classList.replace(vecchiaClasse, 'input-affix');
      return padre;
    }
    const nuovo = el('div', 'input-affix');
    campo.before(nuovo);
    nuovo.append(campo);
    return nuovo;
  }

  function preparaPrezzo(campo) {
    const box = riquadro(campo, 'currency-input-group');
    const simbolo = box.querySelector('.currency-prefix, .affix');
    if (simbolo) simbolo.className = 'affix';
    else box.prepend(el('span', 'affix', '€'));
    campo.type = 'text';
    campo.inputMode = 'decimal';
  }

  function preparaPercentuale(campo) {
    const box = riquadro(campo, 'percent-input-wrapper');
    if (!box.querySelector('.affix')) campo.after(el('span', 'affix', '%'));
    let frecce = box.querySelector('.percent-stepper');
    if (!frecce) {
      // frecce del modulo: ±1 entro 1–99
      frecce = el('div', 'percent-stepper');
      [['Aumenta percentuale', '▲', 1], ['Diminuisci percentuale', '▼', -1]].forEach(([nome, segno, passo]) => {
        const tasto = el('button', '', segno);
        tasto.type = 'button';
        tasto.setAttribute('aria-label', nome);
        tasto.addEventListener('click', () => {
          const attuale = parseInt(campo.value, 10);
          campo.value = Math.min(99, Math.max(1, (Number.isNaN(attuale) ? 0 : attuale) + passo));
          avvisa(campo);
          campo.focus();
        });
        frecce.append(tasto);
      });
      box.append(frecce);
    }
    frecce.classList.add('stepper');
  }

  // Ripulitura prima del gestore oninput della pagina (fase di cattura sul documento)
  document.addEventListener('input', evento => {
    const campo = evento.target;
    if (!(campo instanceof HTMLInputElement)) return;
    if (campo.hasAttribute('data-prezzo')) {
      const pulito = campo.value.replace(/[^\d,.]/g, '');
      if (pulito !== campo.value) campo.value = pulito;
    } else if (campo.hasAttribute('data-percentuale')) {
      const cifre = String(campo.value).replace(/\D/g, '').slice(0, 2);
      if (cifre !== String(campo.value)) campo.value = cifre;
    }
  }, true);

  // Uscendo dal campo prezzo: sempre due decimali
  document.addEventListener('focusout', evento => {
    const campo = evento.target;
    if (!(campo instanceof HTMLInputElement) || !campo.hasAttribute('data-prezzo')) return;
    const formattato = formattaPrezzo(campo.value);
    if (formattato !== campo.value) {
      campo.value = formattato;
      avvisa(campo);
    }
  });

  function prepara() {
    document.querySelectorAll('input[data-prezzo]').forEach(preparaPrezzo);
    document.querySelectorAll('input[data-percentuale]').forEach(preparaPercentuale);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prepara);
  else prepara();

  window.CampiPrezzo = Object.freeze({ formattaPrezzo });
})();
