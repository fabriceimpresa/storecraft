/* STAMPA DIRETTA VIA WEB SERVICE LOCALE DI DYMO CONNECT (https://127.0.0.1:41951) */
(function (global) {
  const HOSTS = ['127.0.0.1', 'localhost'];
  const PORT = 41951;
  const PATH = 'DYMO/DLS/Printing';
  const CHECK_TIMEOUT = 3000;
  const COMMAND_TIMEOUT = 10000;

  let activeHost = null;

  class DymoServiceError extends Error {}

  async function request(host, cmd, options, timeout) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(`https://${host}:${PORT}/${PATH}/${cmd}`, { ...options, signal: controller.signal });
      const text = await res.text();
      if (!res.ok) throw new DymoServiceError(`${cmd} fallito (HTTP ${res.status}): ${text}`);
      return text;
    } finally {
      clearTimeout(timer);
    }
  }

  // Prova 127.0.0.1 e poi localhost; ritenta sull'altro host solo se la connessione non parte
  // (mai dopo un errore HTTP o un timeout, per non inviare due volte la stessa stampa).
  async function dymoFetch(cmd, options = {}, timeout = COMMAND_TIMEOUT) {
    const hosts = activeHost ? [activeHost, ...HOSTS.filter(h => h !== activeHost)] : HOSTS;
    for (const host of hosts) {
      try {
        const text = await request(host, cmd, options, timeout);
        activeHost = host;
        return text;
      } catch (err) {
        if (err instanceof DymoServiceError) throw err;
        if (err.name === 'AbortError') throw new Error('DYMO Connect non risponde (timeout)');
      }
    }
    throw new Error('servizio DYMO Connect non raggiungibile');
  }

  function childText(node, tag) {
    const el = node.getElementsByTagName(tag)[0];
    return el ? el.textContent.trim() : '';
  }

  async function dymoGetPrinters() {
    const xml = await dymoFetch('GetPrinters', {}, CHECK_TIMEOUT);
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    return [...doc.getElementsByTagName('LabelWriterPrinter')].map(node => ({
      name: childText(node, 'Name'),
      modelName: childText(node, 'ModelName'),
      isConnected: childText(node, 'IsConnected').toLowerCase() === 'true'
    }));
  }

  // Restituisce la LabelWriter connessa (preferendo la 450), null se nessuna è connessa.
  // Lancia un errore se il servizio non è raggiungibile.
  async function dymoFindPrinter() {
    const connected = (await dymoGetPrinters()).filter(p => p.isConnected);
    return connected.find(p => /450/.test(p.modelName)) || connected[0] || null;
  }

  // Etichetta 11354 (57 x 32 mm) con un'unica immagine a piena etichetta. Unità: twips (1/1440").
  // Il web service non riconosce il nome "11354 Multi-Purpose": si usa l'equivalente USA 30334,
  // identico nelle dimensioni (2-1/4 x 1-1/4 in).
  function buildLabelXml11354(base64Png) {
    return `<?xml version="1.0" encoding="utf-8"?>
<DieCutLabel Version="8.0" Units="twips">
  <PaperOrientation>Portrait</PaperOrientation>
  <Id>Multipurpose</Id>
  <PaperName>30334 2-1/4 in x 1-1/4 in</PaperName>
  <DrawCommands>
    <RoundRectangle X="0" Y="0" Width="3255" Height="1871" Rx="270" Ry="270"/>
  </DrawCommands>
  <ObjectInfo>
    <ImageObject>
      <Name>ETICHETTA</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <BackColor Alpha="0" Red="255" Green="255" Blue="255"/>
      <LinkedObjectName></LinkedObjectName>
      <Rotation>Rotation0</Rotation>
      <IsMirrored>False</IsMirrored>
      <IsVariable>False</IsVariable>
      <Image>${base64Png}</Image>
      <ScaleMode>Uniform</ScaleMode>
      <BorderWidth>0</BorderWidth>
      <BorderColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <HorizontalAlignment>Center</HorizontalAlignment>
      <VerticalAlignment>Middle</VerticalAlignment>
    </ImageObject>
    <Bounds X="0" Y="0" Width="3255" Height="1871"/>
  </ObjectInfo>
</DieCutLabel>`;
  }

  async function dymoPrintPng(printerName, base64Png, copies = 1) {
    const body = new URLSearchParams({
      printerName,
      printParamsXml: `<LabelWriterPrintParams><Copies>${copies}</Copies><PrintQuality>BarcodeAndGraphics</PrintQuality></LabelWriterPrintParams>`,
      labelXml: buildLabelXml11354(base64Png),
      labelSetXml: ''
    });
    return dymoFetch('PrintLabel', { method: 'POST', body });
  }

  global.DymoDirect = { dymoGetPrinters, dymoFindPrinter, dymoPrintPng, buildLabelXml11354 };
})(window);
