// nav.js — Hamburger-Navigation, barrierefrei.
// Erwartet: ein Button [data-nav-toggle] mit aria-controls auf die Panel-ID.
//
// Wird der Kopfbereich erst zur Laufzeit gerendert (z. B. von React), ruft
// die Anwendung nach dem Einhängen window.bwNav.init() auf. Der Aufruf ist
// beliebig oft wiederholbar; bereits verdrahtete Schalter werden übersprungen.
(function () {
  function init(toggle) {
    if (toggle.getAttribute("data-nav-ready") === "true") return;
    var panel = document.getElementById(toggle.getAttribute("aria-controls"));
    if (!panel) return;
    toggle.setAttribute("data-nav-ready", "true");

    function setOpen(open) {
      panel.setAttribute("data-open", String(open));
      toggle.setAttribute("aria-expanded", String(open));
    }
    setOpen(false);

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Escape schließt und gibt den Fokus zurück
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    // Klick außerhalb schließt
    document.addEventListener("click", function (e) {
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      if (!panel.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });

    // Auswahl im Panel schließt das Menü wieder (mobiles Verhalten)
    panel.addEventListener("click", function (e) {
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      if (e.target.closest("a, button")) setOpen(false);
    });
  }

  function initAll(root) {
    (root || document).querySelectorAll("[data-nav-toggle]").forEach(init);
  }

  window.bwNav = { init: initAll };
  initAll(document);
})();
