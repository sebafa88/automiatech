/* AutomIA — consenso cookie + GA4 + tracciamento contatti.
   Unico file per tutto il sito: una modifica qui vale su tutte le pagine.

   È idempotente: dove il banner e GA4 sono già inline (index.html, testimonianze.html)
   non li duplica, aggiunge soltanto il tracciamento dei contatti.
   grazie.html resta com'è: ha già il suo evento form_submit.

   GA4 parte SOLO dopo consenso esplicito. Nessun cookie prima del clic su "Accetta". */
(function () {
  'use strict';

  var GA_ID = 'G-0TFQWDM4DE';
  var KEY = 'cookie-choice';

  /* ---------- 1. GA4 (una sola volta per pagina) ---------- */
  function initGA4() {
    if (window._ga4Loaded) return;
    window._ga4Loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  /* ---------- 2. Banner del consenso ---------- */
  var CSS = '#cookie-banner{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
    'background:#1E293B;color:#fff;padding:18px 24px;border-radius:12px;max-width:620px;' +
    'width:calc(100% - 48px);display:flex;align-items:center;gap:20px;z-index:9999;' +
    'box-shadow:0 8px 32px rgba(0,0,0,.25);flex-wrap:wrap}' +
    '#cookie-banner p{font-size:.85rem;color:#CBD5E1;line-height:1.5;flex:1;min-width:200px;margin:0}' +
    '#cookie-banner p a{color:#60A5FA}' +
    '.cookie-actions{display:flex;gap:10px;flex-shrink:0}' +
    '.cookie-actions button{padding:9px 18px;border-radius:7px;font-size:.85rem;font-weight:600;' +
    "font-family:'Inter',sans-serif;cursor:pointer;border:none;background:#2563EB;color:#fff;" +
    'transition:opacity .2s}' +
    '.cookie-actions button:hover{opacity:.85}' +
    '.cookie-actions .cookie-refuse{background:transparent;border:1.5px solid #475569;color:#94A3B8}';

  var HTML = '<p>Questo sito utilizza cookie tecnici per il funzionamento e Google Fonts per la ' +
    'tipografia. Nessun cookie di profilazione. <a href="privacy.html">Privacy Policy</a></p>' +
    '<div class="cookie-actions">' +
    '<button type="button" data-cookie="accept">Accetta</button>' +
    '<button type="button" class="cookie-refuse" data-cookie="refuse">Rifiuta non essenziali</button>' +
    '</div>';

  function buildBanner() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var el = document.createElement('div');
    el.id = 'cookie-banner';
    el.innerHTML = HTML;
    el.style.display = 'flex';
    document.body.appendChild(el);

    el.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cookie]');
      if (!btn) return;
      var accepted = btn.getAttribute('data-cookie') === 'accept';
      localStorage.setItem(KEY, accepted ? 'accepted' : 'refused');
      el.style.display = 'none';
      if (accepted) initGA4();
    });
  }

  function handleConsent() {
    // Banner già presente inline (index, testimonianze): quella pagina si gestisce da sé.
    if (document.getElementById('cookie-banner')) return;
    var choice = localStorage.getItem(KEY);
    if (choice === 'accepted') initGA4();
    else if (!choice) buildBanner();
  }

  /* ---------- 3. Tracciamento dei contatti ----------
     Serve per sapere quali pagine generano contatti veri, non solo visite.
     Senza questo, una campagna Ads non è misurabile.                        */
  function trackContacts() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a || typeof window.gtag !== 'function') return;
      var href = a.getAttribute('href') || '';
      var name = null;

      if (href.indexOf('wa.me') > -1 || href.indexOf('whatsapp.com') > -1) name = 'click_whatsapp';
      else if (href.indexOf('mailto:') === 0) name = 'click_email';
      else if (href.indexOf('tel:') === 0) name = 'click_telefono';
      else if (href.indexOf('prenota') > -1 || href.indexOf('calendly.com') > -1) name = 'click_prenota';
      else if (href.indexOf('#contatti') > -1) name = 'click_contatti';
      if (!name) return;

      window.gtag('event', name, {
        event_category: 'lead',
        event_label: location.pathname.replace(/^\//, '') || 'index.html',
        value: 1
      });
    }, true);
  }

  function start() { handleConsent(); trackContacts(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
