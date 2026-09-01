// Google Analytics diferido: gtag.js no se pide hasta después del evento
// `load`, para que no compita con el render inicial ni con la descarga del
// LCP. El script vive en /public (origen propio) para cumplir el CSP
// `script-src 'self' https://www.googletagmanager.com` sin 'unsafe-inline'.
(function () {
  var MEASUREMENT_ID = 'G-TMZ36W875P';

  function loadGA() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID);

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    document.head.appendChild(s);
  }

  if (document.readyState === 'complete') {
    loadGA();
  } else {
    window.addEventListener('load', loadGA, { once: true });
  }
})();
