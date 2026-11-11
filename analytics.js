/*
 * analytics.js – Google Analytics 4 z banerem zgody (RODO), wspólny dla wszystkich stron.
 *
 * Jak działa:
 *  - Dopóki odwiedzający nie kliknie "Accept", nic nie jest wysyłane do Google i nie powstają
 *    żadne cookies (Consent Mode v2, tryb podstawowy – gtag.js w ogóle się nie ładuje).
 *  - Wybór (accept/reject) zapisuje się w localStorage, więc baner nie wraca przy każdej wizycie.
 *  - Każdy element z atrybutem data-cookie-settings (link w stopce) otwiera baner ponownie.
 *  - Dane trafiają do GA tylko z produkcji (PROD_HOSTS); lokalnie baner działa, a zdarzenia
 *    są tylko wypisywane w konsoli przeglądarki – do testów.
 *  - Poza automatycznym pomiarem GA (odsłony, przewijanie, linki wychodzące) wysyłamy własne
 *    zdarzenia: social_click, email_click, wittich_click.
 */
(function () {
  'use strict';

  var GA_ID = 'G-MT8GR02B52';
  var PROD_HOSTS = ['anarchydev.games', 'www.anarchydev.games'];
  var STORAGE_KEY = 'analytics-consent'; // 'granted' | 'denied'
  var COOKIE_MAX_AGE = 60 * 60 * 24 * 390; // cookies GA: ok. 13 miesięcy zamiast domyślnych 2 lat

  var isProd = PROD_HOSTS.indexOf(location.hostname) !== -1;
  // Adres polityki prywatności liczony względem tego pliku – działa z każdej podstrony i z dysku.
  var PRIVACY_URL = document.currentScript
    ? new URL('privacy/', document.currentScript.src).href
    : '/privacy/';
  var gaLoaded = false;
  var bannerEl = null;

  // --- zapis wyboru --------------------------------------------------------------------
  function getConsent() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* tryb prywatny – trudno */ }
  }

  // --- Google Analytics ----------------------------------------------------------------
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function loadGA() {
    if (gaLoaded) return;
    gaLoaded = true;
    if (!isProd) { console.info('[analytics] test: GA włączone (poza produkcją nic nie jest wysyłane)'); return; }
    window['ga-disable-' + GA_ID] = false;
    gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    gtag('js', new Date());
    gtag('config', GA_ID, { cookie_expires: COOKIE_MAX_AGE });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  function disableGA() {
    window['ga-disable-' + GA_ID] = true;
    if (gaLoaded && isProd) gtag('consent', 'update', { analytics_storage: 'denied' });
    // Usunięcie cookies GA (_ga, _ga_XXXX) – na domenie i jej nadrzędnej.
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name.indexOf('_ga') !== 0) return;
      var expire = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      document.cookie = expire;
      document.cookie = expire + '; domain=' + location.hostname;
      document.cookie = expire + '; domain=.' + location.hostname.replace(/^www\./, '');
    });
  }

  function track(name, params) {
    if (!gaLoaded || getConsent() !== 'granted') return;
    if (!isProd) { console.info('[analytics] test: zdarzenie', name, params || {}); return; }
    gtag('event', name, params || {});
  }

  // --- własne zdarzenia (kliknięcia) ------------------------------------------------------
  function linkArea(a) {
    var area = a.closest('header, nav, footer, section[id], .hero');
    if (!area) return 'page';
    return area.id || area.tagName.toLowerCase();
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    var area = linkArea(a);
    var m = href.match(/(facebook\.com|youtube\.com|discord\.gg|discord\.com)/i);
    if (m) {
      track('social_click', { network: m[1].split('.')[0].toLowerCase(), link_area: area });
    } else if (/^mailto:/i.test(href)) {
      track('email_click', { link_area: area });
    } else if (/(^|\/)wittich\/?(#.*)?$/i.test(href) && !/\/wittich\//.test(location.pathname)) {
      track('wittich_click', { link_area: area });
    }
  }, true);

  // --- baner zgody ---------------------------------------------------------------------
  var CSS =
    '#cookie-banner{position:fixed;left:10px;right:10px;bottom:10px;z-index:9999;max-width:880px;margin:0 auto;' +
    'background:#151515;color:#bbb;border:1px solid #262626;border-radius:8px;padding:18px 20px;' +
    'display:flex;gap:20px;align-items:center;box-shadow:0 8px 32px rgba(0,0,0,.6);' +
    'font:400 13px/1.6 "Roboto Mono","Roboto Mono:Regular",monospace}' +
    '#cookie-banner[hidden]{display:none}' +
    '#cookie-banner p{margin:0;flex:1}' +
    '#cookie-banner strong{color:#fff}' +
    '#cookie-banner a{color:#fff;text-decoration:underline}' +
    '#cookie-banner .cb-buttons{display:flex;gap:10px;flex-shrink:0}' +
    '#cookie-banner button{min-width:104px;padding:10px 16px;border-radius:6px;cursor:pointer;' +
    'font:700 13px/1 "Rubik","Rubik:Bold",sans-serif;letter-spacing:.04em;text-transform:uppercase;' +
    'border:2px solid #DC4043;transition:background .2s,color .2s}' +
    '#cookie-banner .cb-accept{background:#DC4043;color:#fff}' +
    '#cookie-banner .cb-accept:hover{background:#e4666a;border-color:#e4666a}' +
    '#cookie-banner .cb-reject{background:transparent;color:#fff}' +
    '#cookie-banner .cb-reject:hover{background:#DC4043}' +
    '#cookie-banner button:focus-visible{outline:2px solid #fff;outline-offset:2px}' +
    '@media (max-width:640px){#cookie-banner{flex-direction:column;align-items:stretch;gap:14px;font-size:12px}' +
    '#cookie-banner .cb-buttons button{flex:1}}';

  function buildBanner() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    bannerEl = document.createElement('div');
    bannerEl.id = 'cookie-banner';
    bannerEl.setAttribute('role', 'dialog');
    bannerEl.setAttribute('aria-label', 'Cookie consent');
    bannerEl.hidden = true;
    bannerEl.innerHTML =
      '<p><strong>Cookies?</strong> We’d like to use Google Analytics to count visits and see which ' +
      'pages you enjoy. No ads, no selling data. <a href="' + PRIVACY_URL + '">Privacy policy</a></p>' +
      '<div class="cb-buttons">' +
      '<button type="button" class="cb-reject">Reject</button>' +
      '<button type="button" class="cb-accept">Accept</button>' +
      '</div>';
    document.body.appendChild(bannerEl);

    bannerEl.querySelector('.cb-accept').addEventListener('click', function () {
      setConsent('granted');
      hideBanner();
      loadGA();
    });
    bannerEl.querySelector('.cb-reject').addEventListener('click', function () {
      setConsent('denied');
      hideBanner();
      disableGA();
    });
  }

  function showBanner() {
    if (!bannerEl) buildBanner();
    bannerEl.hidden = false;
  }
  function hideBanner() {
    if (bannerEl) bannerEl.hidden = true;
  }

  // Link "Cookie settings" w stopce.
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-cookie-settings]');
    if (!el) return;
    e.preventDefault();
    showBanner();
  });

  // --- start ---------------------------------------------------------------------------
  function init() {
    var consent = getConsent();
    if (consent === 'granted') loadGA();
    else if (consent !== 'denied') showBanner();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
