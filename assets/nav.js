/* Right Hand NWA: navigation shared by all three pages (styles in assets/site.css). Loaded on the home page and by the
   two generated pages; it needs no other script.
   1. The menu sheet (dialog#site-menu). Every [data-menu-open] link (the header button, the phone bar) opens it as a
      modal: the browser traps focus inside it while it is open and hands focus back to the button that opened it.
      It closes on Escape, on a tap on any link inside it, on its close button and on a tap on the backdrop.
      Until this script has run (and where <dialog> is missing) the same markup is a plain block of links above the
      footer, and the Menu links simply jump to it: html.nav-on is what turns it into a sheet.
   2. The phone bar (#mobile-bar): shown once the page's hero has scrolled out of view, hidden while the check-up form
      is on screen and while a text field has focus (so it never sits on top of what a visitor is typing).
      html.bar-live is what gives the bar its place in the page, so without this script there is no bar and no gap.
   4. On the services page each service is a closed <details>: a link that points at one (services/#receipts) opens it.
   3. Any [data-motion-proxy] button presses the header's Pause motion button, which narrow screens hide.
   Rules of the road: classic script, ES5, no dependencies; each part returns quietly when its markup is missing. */
(function () {
  "use strict";
  var d = document, html = d.documentElement, W = window;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }

  /* ---------- 1. menu sheet ---------- */
  (function menu() {
    var dlg = $("#site-menu"), openers = $$("[data-menu-open]");
    if (!dlg || !openers.length || typeof dlg.showModal !== "function") return;
    html.classList.add("nav-on");
    function mark(on) { openers.forEach(function (o) { o.setAttribute("aria-expanded", String(on)); }); }
    function open() { if (!dlg.open) { dlg.showModal(); mark(true); } }
    function close() { if (dlg.open) dlg.close(); }
    openers.forEach(function (o) {
      // a link without the script (it jumps to the block of links), a button with it
      o.setAttribute("role", "button"); o.setAttribute("aria-haspopup", "dialog"); o.setAttribute("aria-controls", "site-menu"); o.setAttribute("aria-expanded", "false");
      o.addEventListener("click", function (e) { e.preventDefault(); open(); });
      o.addEventListener("keydown", function (e) { if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); open(); } });
    });
    dlg.addEventListener("close", function () { mark(false); });
    dlg.addEventListener("click", function (e) {
      // the sheet's own box fills the dialog, so a click that lands on the dialog element itself is a click on the backdrop
      if (e.target === dlg) { var r = dlg.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(); return; }
      if (e.target.closest("[data-menu-close]") || e.target.closest("a[href]")) close();   // a link closes the sheet, then the browser follows it
    });
  })();

  /* ---------- 2. phone bar ---------- */
  (function bar() {
    var bar = $("#mobile-bar");
    if (!bar || !("IntersectionObserver" in W)) return;
    html.classList.add("bar-live");
    var hero = $(".hero, .page-hero"), form = $("#checkup"), heroOut = !hero, formIn = false, typing = false;
    var TEXT = /^(text|email|tel|url|search|number|password|)$/;
    function field(el) { return !!el && (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && TEXT.test(el.getAttribute("type") || ""))); }
    function paint() { bar.classList.toggle("on", heroOut && !formIn && !typing); }
    if (hero) new IntersectionObserver(function (es) { heroOut = !es[es.length - 1].isIntersecting; paint(); }).observe(hero);
    if (form) new IntersectionObserver(function (es) { formIn = es[es.length - 1].isIntersecting; paint(); }).observe(form);
    d.addEventListener("focusin", function (e) { typing = field(e.target); paint(); });
    d.addEventListener("focusout", function () { typing = false; paint(); });
    paint();
  })();

  /* ---------- 3. Pause motion, from places the header button cannot be ---------- */
  (function proxy() {
    var mb = $("#motion-btn"), px = $$("[data-motion-proxy]");
    if (!mb || !px.length) return;
    function paint() { var o = html.getAttribute("data-motion") === "off"; px.forEach(function (b) { b.setAttribute("aria-pressed", String(o)); b.textContent = o ? "Play motion" : "Pause motion"; }); }
    px.forEach(function (b) { b.addEventListener("click", function () { mb.click(); paint(); }); });
    d.addEventListener("rh:motion", paint);
    paint();
  })();

  /* ---------- 4. a link to a closed service card opens it ---------- */
  (function cards() {
    if (!$("details.svc-doc")) return;
    function openAt() {
      var id = location.hash.slice(1), el = id && d.getElementById(id), card = el && el.closest("details.svc-doc");
      if (!card || card.open) return;
      card.open = true;
      // the page above may have moved while it opened: put the card back under the header
      requestAnimationFrame(function () { card.scrollIntoView({ block: "start" }); });
    }
    W.addEventListener("hashchange", openAt);
    openAt();
  })();
})();
