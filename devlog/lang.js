/* Przełącznik języka w dziale Devlog: angielski domyślnie, polski pod #pl w adresie.
   Treść w obu językach jest w HTML (elementy .i18n z atrybutem lang), CSS ukrywa niewybraną.
   Nic nie zapisujemy w przeglądarce – wybór niesie tylko adres (#pl). */
(function () {
    var root = document.documentElement;

    function apply(lang) {
        var pl = lang === 'pl';
        root.classList.toggle('lang-pl', pl);
        root.lang = pl ? 'pl' : 'en';
        var title = root.getAttribute(pl ? 'data-title-pl' : 'data-title-en');
        if (title) document.title = title;

        document.querySelectorAll('[data-set-lang]').forEach(function (b) {
            var on = b.getAttribute('data-set-lang') === lang;
            b.classList.toggle('active', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });

        // Linki wewnątrz działu zachowują wybrany język
        document.querySelectorAll('a[data-keep-lang]').forEach(function (a) {
            var href = a.getAttribute('href').split('#')[0];
            a.setAttribute('href', pl ? href + '#pl' : href);
        });
    }

    function current() {
        return location.hash === '#pl' ? 'pl' : 'en';
    }

    document.querySelectorAll('[data-set-lang]').forEach(function (b) {
        b.addEventListener('click', function () {
            var lang = b.getAttribute('data-set-lang');
            history.replaceState(null, '', location.pathname + location.search + (lang === 'pl' ? '#pl' : ''));
            apply(lang);
            if (window.siteTrack) window.siteTrack('language_switch', { language: lang, page_path: location.pathname });
        });
    });

    window.addEventListener('hashchange', function () { apply(current()); });
    apply(current());
})();
