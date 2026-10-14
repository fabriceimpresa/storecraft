/* Campi prezzo e percentuale dei pannelli, con la regola dei cartelli di Luxury (stile .input-affix di pannello.css).
   Si dichiarano sul campo:
     <input data-prezzo …>        simbolo € fisso davanti (l'utente non lo scrive), solo cifre, virgola e punto;
                                  uscendo dal campo il prezzo prende sempre due decimali (395 → 395,00; 39,9 → 39,90)
     <input data-percentuale …>   simbolo % fisso dopo e frecce ▲▼, solo numeri da 1 a 99
     <input data-numero min max>  solo le frecce ▲▼, numero intero tra min e max (es. il numero di copie delle etichette
                                  DYMO, 1–99); uscendo dal campo un valore vuoto o fuori misura torna dentro i limiti
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

  // frecce ▲▼ del modulo: ±1 entro i limiti
  function frecceDi(campo, cosa, minimo, massimo) {
    const frecce = el('div', 'percent-stepper');
    [[`Aumenta ${cosa}`, '▲', 1], [`Diminuisci ${cosa}`, '▼', -1]].forEach(([nome, segno, passo]) => {
      const tasto = el('button', '', segno);
      tasto.type = 'button';
      tasto.setAttribute('aria-label', nome);
      tasto.addEventListener('click', () => {
        const attuale = parseInt(campo.value, 10);
        campo.value = Math.min(massimo, Math.max(minimo, (Number.isNaN(attuale) ? minimo - passo : attuale) + passo));
        avvisa(campo);
        campo.focus();
      });
      frecce.append(tasto);
    });
    return frecce;
  }

  function preparaPercentuale(campo) {
    const box = riquadro(campo, 'percent-input-wrapper');
    if (!box.querySelector('.affix')) campo.after(el('span', 'affix', '%'));
    let frecce = box.querySelector('.percent-stepper');
    if (!frecce) {
      frecce = frecceDi(campo, 'percentuale', 1, 99);
      box.append(frecce);
    }
    frecce.classList.add('stepper');
  }

  const limiti = campo => {
    const minimo = parseInt(campo.getAttribute('min'), 10);
    const massimo = parseInt(campo.getAttribute('max'), 10);
    return [Number.isNaN(minimo) ? 1 : minimo, Number.isNaN(massimo) ? 99 : massimo];
  };

  function preparaNumero(campo) {
    const box = riquadro(campo, 'numero-input-wrapper');
    box.classList.add('campo-numero');
    // fondo, bordo e angoli degli altri campi dello stesso menu (un altro campo di testo, o un menu a cascata, della
    // pagina); si rileggono a pagina caricata, quando ci sono tutti i fogli di stile (anche quello del tema)
    const copia = () => {
      const altro = document.querySelector('input.form-control:not([data-numero]):not([type="range"]):not([type="checkbox"]), select.form-control');
      if (!altro) return;
      const stile = getComputedStyle(altro);
      box.style.setProperty('--numero-fondo', stile.backgroundColor);
      box.style.setProperty('--numero-bordo', stile.borderTopColor);
      box.style.setProperty('--numero-angoli', stile.borderTopLeftRadius);
    };
    copia();
    window.addEventListener('load', copia);
    const [minimo, massimo] = limiti(campo);
    campo.type = 'text';
    campo.inputMode = 'numeric';
    campo.maxLength = String(massimo).length;
    if (!box.querySelector('.stepper')) box.append(frecceDi(campo, campo.dataset.numero || 'numero', minimo, massimo));
    box.querySelector('.percent-stepper').classList.add('stepper');
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
    } else if (campo.hasAttribute('data-numero')) {
      const cifre = String(campo.value).replace(/\D/g, '').slice(0, String(limiti(campo)[1]).length);
      if (cifre !== String(campo.value)) campo.value = cifre;
    }
  }, true);

  // Uscendo dal campo numero: dentro i limiti (vuoto torna al minimo)
  document.addEventListener('focusout', evento => {
    const campo = evento.target;
    if (!(campo instanceof HTMLInputElement) || !campo.hasAttribute('data-numero')) return;
    const [minimo, massimo] = limiti(campo);
    const valore = parseInt(campo.value, 10);
    const giusto = String(Number.isNaN(valore) ? minimo : Math.min(massimo, Math.max(minimo, valore)));
    if (giusto !== campo.value) {
      campo.value = giusto;
      avvisa(campo);
    }
  });

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
    document.querySelectorAll('input[data-numero]').forEach(preparaNumero);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prepara);
  else prepara();

  window.CampiPrezzo = Object.freeze({ formattaPrezzo });
})();
