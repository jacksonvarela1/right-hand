/* Right Hand NWA: the prototype lab on the home page (styles in assets/lab.css).

   1. TABS. The ticket rail is the tab list and each prototype is a panel: one is open at a time, the first by default.
      Arrow keys, Home and End move along the tickets and open as they go; Enter, Space or a click also brings the
      prototype's stage into view. The dock on top of the lab card names the open prototype and steps to the next one.
      Opening a panel with the keyboard arrows never moves the page. A click on a ticket or a link brings the open
      prototype's bar to just under the dock; a step with the dock, deep inside a tall prototype, puts the next one in
      the same place under the dock.
   2. LINKS. Every link to #demo-<name> or #demos, on this page or arriving from another one, opens that prototype and
      lands on its stage: the address on arrival, hashchange and clicks are all handled here.
   3. LAZY LOADING. Nothing else on the page needs the prototypes, so their code arrives late: one stylesheet
      (assets/demos.css, written by tools/build-services.mjs), then assets/demo-player.js, the prototype scripts and
      assets/rail.js, in that order. They are fetched when the visitor comes within about 1.5 screens of the lab, presses
      a link that leads to it, or a few seconds after the page has loaded and gone quiet. An empty stage keeps its
      prototype's height meanwhile (assets/lab.css).

   What other files hear from this one:
     rh:show  on a panel, each time it is opened and has a box again (a prototype that measures its layout listens)
     rh:lab   on document, { detail: { index, name } }, after every change of the open prototype (assets/rail.js)
   No JS: none of this runs; the panels are stacked and the tickets are jump links. If this file fails alone, the CSS
   still shows one panel at a time and the tickets still switch it (:target). */
(function (w, d) {
  "use strict";
  var html = d.documentElement, sec = d.getElementById("demos");
  if (!sec) return;
  var lab = sec.querySelector(".lab"), list = sec.querySelector(".rail-list");
  var panels = Array.prototype.slice.call(sec.querySelectorAll(".lab > .demo[id]"));
  if (!lab || !list || !panels.length) return;
  var tabs = panels.map(function (p) { return list.querySelector('a[href="#' + p.id + '"]'); });
  if (tabs.some(function (t) { return !t; })) return;   // a panel without its ticket: leave the stacked, linked page alone
  var names = panels.map(function (p) { return p.id.replace(/^demo-/, ""); });
  var dock = lab.querySelector(".lab-dock"), cta = lab.querySelector(".lab-cta [data-ask]");
  var dockN = dock && dock.querySelector(".dock-n"), dockT = dock && dock.querySelector(".dock-t"), dockAt = dock && dock.querySelector(".dock-at");
  var RM = w.matchMedia ? w.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  function off() { return RM.matches || html.getAttribute("data-motion") === "off"; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function fire(el, name, detail) { try { el.dispatchEvent(new CustomEvent(name, { detail: detail || null })); } catch (e) {} }

  /* ---------- 3. lazy loading ---------- */
  // every late file sits next to this one; a ?v= stamp on this file's own address is passed on to them
  var me = d.currentScript || d.querySelector('script[src*="lab.js"]');
  var src = (me && me.getAttribute("src")) || "assets/lab.js";
  var base = src.replace(/[^\/]*$/, ""), ver = (src.match(/\?.*$/) || [""])[0];
  var state = 0;   // 0 nothing asked for, 1 on its way, 2 running
  function scripts(first) {
    // the prototype about to be looked at first, so the one on screen is the first to come alive
    var order = [names[first]].concat(names.filter(function (n, i) { return i !== first; }));
    return [base + "demo-player.js"].concat(order.map(function (n) { return base + "demos/" + n + ".js"; }), [base + "rail.js"]);
  }
  function load(first) {
    if (state) return;
    state = 1;
    lab.classList.add("lab-loading");
    var urls = scripts(typeof first === "number" && first >= 0 ? first : cur), left = urls.length, started = false;
    function failed() { lab.classList.remove("lab-loading"); lab.classList.add("lab-failed"); }
    function run() {
      if (started) return;
      started = true;
      urls.forEach(function (u) {
        var s = d.createElement("script");
        s.src = u + ver; s.async = false;   // injected scripts run in the order they are added only with async off
        s.onload = function () { if (!--left) { state = 2; lab.classList.remove("lab-loading"); shown(panels[cur]); } };
        s.onerror = failed;
        d.head.appendChild(s);
      });
    }
    // The scripts wait for the stylesheet, so a prototype never builds itself unstyled; they download meanwhile.
    urls.forEach(function (u) { var l = d.createElement("link"); l.rel = "preload"; l.as = "script"; l.href = u + ver; d.head.appendChild(l); });
    var css = d.createElement("link");
    css.rel = "stylesheet"; css.href = base + "demos.css" + ver;
    css.onload = run; css.onerror = failed;
    d.head.appendChild(css);
    setTimeout(run, 4000);   // a browser that never reports the stylesheet still gets its prototypes
  }

  /* ---------- 1. tabs ---------- */
  var cur = 0;
  (function () {
    var m = /^#demo-([a-z0-9-]+)$/i.exec(location.hash), i = m ? names.indexOf(m[1]) : -1;
    if (i >= 0) cur = i;
  })();
  list.setAttribute("role", "tablist");
  list.setAttribute("aria-orientation", "horizontal");
  tabs.forEach(function (t, i) {
    t.parentNode.setAttribute("role", "presentation");
    t.setAttribute("role", "tab");
    t.setAttribute("aria-controls", panels[i].id);
    var go = t.querySelector(".tk-go"); if (go) go.setAttribute("aria-hidden", "true");   // "Open" and "Showing" repeat what the tab role and state say
    panels[i].setAttribute("role", "tabpanel");
  });
  function paint() {
    tabs.forEach(function (t, i) {
      var on = i === cur;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      var lbl = t.querySelector(".tk-go-t"); if (lbl) lbl.textContent = on ? "Showing" : "Open";
      panels[i].classList.toggle("is-open", on);
    });
    var title = tabs[cur].querySelector(".tk-title");
    if (dockN) dockN.textContent = pad(cur + 1);
    if (dockT) dockT.textContent = title ? title.textContent : names[cur];
    if (cta) cta.setAttribute("data-ask", panels[cur].getAttribute("data-ask") || "");
  }
  // wide screens: a short mark on the card's top edge, under the open ticket, ties the two together
  function mark() {
    if (list.scrollWidth > list.clientWidth + 2) { lab.classList.remove("lab-mark"); return; }
    var a = tabs[cur].parentNode.getBoundingClientRect(), l = lab.getBoundingClientRect(), wd = Math.min(72, a.width);
    lab.style.setProperty("--lab-x", Math.round(a.left - l.left + (a.width - wd) / 2) + "px");
    lab.style.setProperty("--lab-w", Math.round(wd) + "px");
    lab.classList.add("lab-mark");
  }
  paint();
  lab.classList.add("lab-live");
  mark();
  var markT = 0;
  w.addEventListener("resize", function () { clearTimeout(markT); markT = setTimeout(mark, 150); });

  // the strip of tickets on phones and tablets: bring the open one into view, sideways only
  function reveal(instant) {
    if (list.scrollWidth <= list.clientWidth + 2) return;
    var item = tabs[cur].parentNode, lr = list.getBoundingClientRect(), ir = item.getBoundingClientRect();
    if (ir.left >= lr.left + 8 && ir.right <= lr.right - 8) return;
    var x = list.scrollLeft + (ir.left - lr.left) - Math.max(18, (lr.width - ir.width) / 2);
    jump(list, { left: Math.max(0, x) }, !instant);
  }
  // behavior "instant" skips the page's smooth scrolling; browsers that do not know the word get the plain call
  function jump(el, to, smooth) {
    to.behavior = smooth && !off() ? "smooth" : "instant";
    try { el.scrollTo(to); } catch (e) { if (to.top != null) el.scrollTo(0, to.top); else el.scrollLeft = to.left; }
  }
  // a prototype that had started on its own goes back to its first frame when its panel closes, and plays from the top next time
  function rewind(panel) {
    var C = w.RH && w.RH.conductor;
    if (C) C.players.forEach(function (p) { if (p.root === panel && p._rewind) p._rewind(); });
  }
  function shown(panel) { fire(panel, "rh:show"); }
  var beam = null, clip = null, inT = 0;
  function entrance(panel) {
    if (off() || !html.classList.contains("js-motion")) return;
    clearTimeout(inT);
    panels.forEach(function (p) { p.classList.remove("is-in"); });
    void panel.offsetWidth;   // so the same panel can assemble twice in a row
    panel.classList.add("is-in");
    inT = setTimeout(function () { panel.classList.remove("is-in"); }, 700);
    if (!lab.animate) return;
    if (!beam) {
      clip = d.createElement("span"); clip.className = "lab-clip"; clip.setAttribute("aria-hidden", "true");
      beam = d.createElement("i"); beam.className = "lab-beam"; clip.appendChild(beam); lab.appendChild(clip);
    }
    var h = Math.min(lab.offsetHeight, (w.innerHeight || 800) * 1.2) + 62;
    beam.animate([{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(" + h + "px)", opacity: 1, offset: .85 }, { transform: "translateY(" + h + "px)", opacity: 0 }],
      { duration: Math.min(520, 320 + h * .14), easing: "cubic-bezier(.65,0,.35,1)" });
  }

  // what covers the top of the screen where the lab is: the header while it is sticky, and the dock
  function cover() {
    var top = d.querySelector(".top"), h = 0;
    if (top && w.getComputedStyle(top).position === "sticky") h = top.offsetHeight;
    return h + (dock ? dock.offsetHeight : 0);
  }
  // Bring the open prototype's stage into view. The bar goes right under the dock; when the head, the bar and the whole
  // stage fit on the screen together, the panel is shown from its head instead.
  // (Places are read from the layout, not from the boxes on screen: a panel that is still assembling is drawn a few
  // pixels off its place.)
  function place(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
  function land(smooth) {
    var p = panels[cur], bar = p.querySelector(".proto-bar") || p, st = p.querySelector(".stage") || p;
    var c = cover(), top = place(p), whole = place(st) + st.offsetHeight - top <= (w.innerHeight || 0) - c - 8;
    var y = Math.max(0, Math.round(whole ? top - c : place(bar) - c - 8));
    if (Math.abs((w.pageYOffset || 0) - y) >= 1) jump(w, { top: y }, smooth);
  }
  // is the dock holding its place under the header, with the top of the lab card scrolled away above it?
  function docked() { return !!dock && lab.getBoundingClientRect().top < dock.getBoundingClientRect().top - 1; }

  /* open panel i. o.land: also bring its stage into view (smoothly unless o.instant). o.keep: do not touch the address. */
  function open(i, o) {
    o = o || {};
    i = (i + panels.length) % panels.length;
    if (i !== cur) {
      var was = panels[cur], stuck = docked();
      cur = i;
      paint();
      mark();
      rewind(was);
      shown(panels[cur]);
      fire(d, "rh:lab", { index: cur, name: names[cur] });
      // Deep inside one prototype, the next one opens in its place under the dock: the page is put there at once,
      // because the old scroll position means nothing in a panel of another height.
      if (stuck && !o.land) land(false);
      entrance(panels[cur]);
      reveal(false);
      if (!o.keep) { try { history.replaceState(null, "", "#" + panels[cur].id); } catch (e) {} }
    }
    if (state < 2) load(-1);
    if (o.land) land(!o.instant);
  }

  list.addEventListener("keydown", function (e) {
    var t = e.target.closest ? e.target.closest('[role="tab"]') : null, i = t ? tabs.indexOf(t) : -1, n = -1;
    if (i < 0 || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = i + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = i - 1;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = tabs.length - 1;
    else if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); open(i, { land: true }); return; }
    else return;
    e.preventDefault();
    open(n);
    tabs[cur].focus({ preventScroll: true });
  });
  if (dock) dock.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-step]") : null;
    if (!b) return;
    if (dockAt) dockAt.setAttribute("aria-live", "polite");   // from here on a screen reader hears which prototype opened
    open(cur + (+b.getAttribute("data-step") || 1));
  });

  /* ---------- 2. links ---------- */
  // which panel a same-page link points at: an index, -1 for the section itself, null for anything else
  function target(a) {
    var h = a.hash || "";
    if (!h || a.host !== location.host || a.pathname !== location.pathname) return null;
    if (h === "#demos") return -1;
    var i = names.indexOf(h.replace(/^#demo-/, ""));
    return /^#demo-/.test(h) && i >= 0 ? i : null;
  }
  d.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a[href*="#demo"]') : null, i = a ? target(a) : null;
    if (i === null) return;
    e.preventDefault();
    if (i < 0) { try { history.replaceState(null, "", "#demos"); } catch (er) {} open(cur, { land: true, keep: true }); }
    else open(i, { land: true });
    // a ticket keeps keyboard focus; any other link hands it to the open panel's ticket, without scrolling to it
    if (a.getAttribute("role") !== "tab") tabs[cur].focus({ preventScroll: true });
  });
  w.addEventListener("hashchange", function () {
    var h = location.hash, i = names.indexOf(h.replace(/^#demo-/, ""));
    if (h === "#demos") open(cur, { land: true, keep: true });
    else if (/^#demo-/.test(h) && i >= 0) open(i, { land: true, keep: true });
  });
  // getting ready before the tap lands: any press on a link that leads here starts the download
  d.addEventListener("pointerdown", function (e) {
    if (state || !e.target.closest) return;
    var a = e.target.closest('a[href*="#demo"]');
    if (a) load(target(a));
  }, { passive: true, capture: true });

  /* ---------- arriving ---------- */
  var arrived = /^#demos?(-|$)/.test(location.hash);
  if (arrived) {
    // The address named the lab. The browser scrolls to the section or the panel by itself, smoothly, and does so again
    // while the page loads; the page above is also still finding its final height (fonts, the hero, the prototype
    // arriving). So the landing on the stage is held: checked every frame until just after the page has loaded, then
    // whenever the page changes size, until the visitor touches anything or a few seconds have passed.
    var settle = function () { land(false); }, ro = null, hold = 0;
    var watch = function () { if (!settle) return; settle(); if (!hold || Date.now() < hold) w.requestAnimationFrame(watch); };
    var release = function () {
      if (!settle) return;
      settle = null;
      if (ro) ro.disconnect();
    };
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (ev) { w.addEventListener(ev, release, { passive: true, once: true, capture: true }); });
    load(-1);
    reveal(true);
    settle();
    if (w.requestAnimationFrame) w.requestAnimationFrame(watch);
    if ("ResizeObserver" in w) { ro = new ResizeObserver(function () { if (settle) settle(); }); ro.observe(d.body); }
    var loaded = function () { hold = Date.now() + 700; if (settle) settle(); setTimeout(release, 3000); };
    if (d.readyState === "complete") loaded(); else w.addEventListener("load", loaded);
  } else {
    reveal(true);
    if ("IntersectionObserver" in w) {
      var io = new IntersectionObserver(function (es) {
        if (es.some(function (x) { return x.isIntersecting; })) { io.disconnect(); load(-1); }
      }, { rootMargin: "150% 0px 150% 0px" });
      io.observe(sec);
    } else load(-1);
    // quiet time after the page has loaded: fetch them anyway, unless the visitor asked the browser to save data
    var idle = function () {
      var c = w.navigator && w.navigator.connection;
      if (state || (c && c.saveData)) return;
      if (w.requestIdleCallback) w.requestIdleCallback(function () { load(-1); }, { timeout: 2500 }); else load(-1);
    };
    var soon = function () { setTimeout(idle, 3500); };
    if (d.readyState === "complete") soon(); else w.addEventListener("load", soon);
  }
})(window, document);
