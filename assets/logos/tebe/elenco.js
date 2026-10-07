// assets/logos/tebe/elenco.js
// Elenco dei loghi ufficiali di TEBE (file in questa cartella) e brand prioritari (stagionali) del negozio.
// Il codice che usa l'elenco è comune, in assets/js/logos.js. logoimport.html e logogestione.html (nella radice)
// aggiornano LOGO_FILES: tenerlo nella forma const LOGO_FILES = [ "NOME.png", … ];
const LOGO_FILES = [
  "269TEBE.PNG",
  "DIXIE.png",
  "HAVEONE.png",
  "OKKIA.png",
  "SOUVENIR.png",
  "Tebe269.png",
  "Tebe.png",
  "TENSIONEIN.png",
  "VICOLO.png",
  "WUSIDE.png"
];

// BRAND PRIORITARI: i brand della casa TEBE, mostrati per primi in ogni menu a cascata dei loghi,
// subito dopo la voce di default, ed esclusi dal resto dell'elenco alfabetico.
const PRIORITY_BRANDS = ["269TEBE.PNG", "Tebe269.png", "Tebe.png"];
