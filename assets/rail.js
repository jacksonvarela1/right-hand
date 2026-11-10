/* Ticket rail: swings the order tickets at the top of Live demos (styles in rail.css).
   Each ticket is a damped pendulum that pivots where its ring sits on the rail. One requestAnimationFrame loop
   moves all of them with rotate() only, and it stops when every ticket hangs still, when the rail is off screen
   and when the tab is hidden.
   What pushes them: a first swing when the rail scrolls into view, page scroll speed, sideways scroll speed of the
   phone scroller, and the pointer landing on a ticket (its neighbours lean away).
   No JS, reduced motion or the Pause motion button: nothing here runs and the tickets hang still at their rest
   angles. Links are never touched, so a click follows the href as usual. */
(function (w, d) {
  "use strict";
  var html = d.documentElement;
  var RM = w.matchMedia ? w.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var raf = w.requestAnimationFrame, caf = w.cancelAnimationFrame;

  // spring, in degrees and seconds
  var K = 96;            // stiffness: about 1.5 swings a second
  var ZETA = 0.26;       // damping ratio: a first swing dies out in about 1.5 s
  var HOT_K = 1.9, HOT_C = 2.6;   // a hovered ticket is held: stiffer and close to critically damped
  var MAX_A = 11;        // never swing further than this
  var DT_MAX = 0.034;    // clamp the step so a slow frame cannot blow the spring up
  var GY = 0.16, GX = 0.5, F_MAX = 440;   // push per px/s of page scroll and of sideways scroll, and its ceiling
  var EASE = 0.06;       // seconds the push takes to build and fade
  var LAG = 0.04;        // seconds of delay per ticket, so a push travels left to right
  var KICK_IN = 88, STAGGER = 75, KICK_NEAR = 55;   // first swing, its delay per ticket, and the neighbour nudge (deg/s)
  var VARY = [1, 0.93, 1.07, 0.97, 0.9, 1.04];      // tickets hang at slightly different lengths, so they drift out of step

  function allowed() {
    return !!raf && !RM.matches && html.getAttribute("data-motion") !== "off" && /(^|\s)js-motion(\s|$)/.test(html.className);
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function init() {
    var root = d.querySelector(".rail");
    if (!root || root.getAttribute("data-rail") === "on") return;
    var list = root.querySelector(".rail-list") || root;
    var links = Array.prototype.slice.call(root.querySelectorAll(".tk-link"));
    if (!links.length) return;
    root.setAttribute("data-rail", "on");

    var S = links.map(function (link, i) {
      var el = link.querySelector(".tk-swing") || link;
      var rest = parseFloat(w.getComputedStyle(el).getPropertyValue("--tk-rest")) || 0;
      var k = K * VARY[i % VARY.length];
      return { el: el, rest: rest, a: rest, v: 0, f: 0, k: k, c: 2 * ZETA * Math.sqrt(k), hover: false, focus: false, drawn: null, nudged: 0 };
    });
    var queue = [];              // delayed kicks: { i, v, at }
    var live = false;            // motion is allowed
    var onScreen = !("IntersectionObserver" in w);
    var seen = onScreen;         // enough of the rail is showing for the first swing
    var entered = false;
    var id = 0, last = 0, lastY = 0, lastX = 0, push = 0;

    function draw(s, force) {
      var a = Math.round(s.a * 1000) / 1000;
      if (!force && a === s.drawn) return;
      s.drawn = a;
      s.el.style.transform = "rotate(" + a + "deg)";
    }
    function stop() { if (id) { caf(id); id = 0; } }
    // fresh: scrolling may have gone unwatched (off screen, hidden tab, motion off), so start from where the page is now.
    // A scroll event wakes the loop without it, so the very scroll that woke it still counts as a push.
    function wake(fresh) {
      if (!live || !onScreen || d.hidden || id) return;
      last = 0;
      if (fresh === true) { lastY = w.pageYOffset || 0; lastX = list.scrollLeft || 0; }
      id = raf(frame);
    }
    function kick(i, v, delay) {
      var s = S[i];
      if (!s) return;
      if (delay) queue.push({ i: i, v: v, at: w.performance.now() + delay });
      else s.v += v;
    }
    // the rail gets bumped at its left end and the swing runs down the row
    function entrance(scale) {
      for (var i = 0; i < S.length; i++) kick(i, -KICK_IN * scale * (1 - i * 0.045), i * STAGGER + 1);
    }
    // the pointer lands on ticket i: the tickets either side lean away from it
    function nudge(i, scale) {
      var now = w.performance.now();
      if (now - S[i].nudged < 260) return;
      S[i].nudged = now;
      kick(i - 1, KICK_NEAR * scale); kick(i + 1, -KICK_NEAR * scale);
      kick(i - 2, KICK_NEAR * scale * 0.38); kick(i + 2, -KICK_NEAR * scale * 0.38);
    }

    function frame(t) {
      id = 0;
      var real = last ? (t - last) / 1000 : 0;
      last = t;
      if (real <= 0) real = 1 / 60;                      // first frame after waking has no gap to measure
      var dt = real > DT_MAX ? DT_MAX : real;

      // scroll speed becomes a sideways push, smoothed, then handed down the row with a small delay per ticket
      var y = w.pageYOffset || 0, x = list.scrollLeft || 0;
      var drive = clamp(-((y - lastY) * GY + (x - lastX) * GX) / real, -F_MAX, F_MAX);
      lastY = y; lastX = x;
      push += (drive - push) * (1 - Math.exp(-dt / EASE));
      var src = push, al = 1 - Math.exp(-dt / LAG);

      for (var q = queue.length - 1; q >= 0; q--) if (t >= queue[q].at) { S[queue[q].i].v += queue[q].v; queue.splice(q, 1); }

      var busy = queue.length > 0 || Math.abs(push) > 1;
      for (var i = 0; i < S.length; i++) {
        var s = S[i], hot = s.hover || s.focus, target = hot ? 0 : s.rest;
        s.f += (src - s.f) * al; src = s.f;
        // semi-implicit Euler: speed first, then angle from the new speed
        var acc = -(hot ? s.k * HOT_K : s.k) * (s.a - target) - (hot ? s.c * HOT_C : s.c) * s.v + (hot ? 0.25 : 1) * s.f;
        s.v += acc * dt;
        s.a += s.v * dt;
        if (s.a > MAX_A) { s.a = MAX_A; if (s.v > 0) s.v = 0; } else if (s.a < -MAX_A) { s.a = -MAX_A; if (s.v < 0) s.v = 0; }
        if (Math.abs(s.a - target) > 0.02 || Math.abs(s.v) > 0.3 || Math.abs(s.f) > 1) busy = true;
        draw(s);
      }
      if (busy) { id = raf(frame); return; }
      // everything hangs still: park each ticket exactly on its target and let the loop sleep
      push = 0;
      for (var j = 0; j < S.length; j++) { var p = S[j]; p.a = (p.hover || p.focus) ? 0 : p.rest; p.v = 0; p.f = 0; draw(p); }
    }

    function setLive(on) {
      if (on === live) return;
      live = on;
      if (!on) {
        // motion off: stop at once and hand every ticket back to its CSS rest transform
        stop(); queue.length = 0; push = 0;
        S.forEach(function (s) { s.a = s.rest; s.v = 0; s.f = 0; s.drawn = null; s.el.style.transform = ""; });
        return;
      }
      S.forEach(function (s) { s.a = (s.hover || s.focus) ? 0 : s.rest; s.v = 0; s.f = 0; draw(s, true); });
      if (seen) { entrance(entered ? 0.5 : 1); entered = true; }
      wake(true);
    }

    links.forEach(function (link, i) {
      var s = S[i];
      function over(e) { if (e.pointerType === "touch") return; s.hover = true; if (live) { nudge(i, 1); wake(); } }
      function out() { if (!s.hover) return; s.hover = false; wake(); }
      if ("onpointerenter" in link) { link.addEventListener("pointerenter", over); link.addEventListener("pointerleave", out); }
      else { link.addEventListener("mouseenter", over); link.addEventListener("mouseleave", out); }
      link.addEventListener("focus", function () {
        var ring = true;
        try { ring = link.matches(":focus-visible"); } catch (e) {}
        if (!ring) return;
        s.focus = true;
        if (live) { nudge(i, 0.6); wake(); }
      });
      link.addEventListener("blur", function () { if (!s.focus) return; s.focus = false; wake(); });
    });

    w.addEventListener("scroll", wake, { passive: true });
    if (list !== root) list.addEventListener("scroll", wake, { passive: true });
    d.addEventListener("visibilitychange", function () { if (d.hidden) stop(); else wake(true); });
    d.addEventListener("rh:motion", function (e) { setLive(!(e.detail && e.detail.off) && allowed()); });
    var onRM = function () { setLive(allowed()); };
    if (RM.addEventListener) RM.addEventListener("change", onRM); else if (RM.addListener) RM.addListener(onRM);

    if ("IntersectionObserver" in w) {
      new IntersectionObserver(function (es) {
        var e = es[es.length - 1];
        onScreen = e.isIntersecting;
        seen = onScreen && e.intersectionRatio >= 0.3;
        if (!onScreen) { stop(); return; }
        if (live && seen && !entered) { entered = true; entrance(1); }
        wake(true);
      }, { threshold: [0, 0.3, 0.6] }).observe(root);
    }
    setLive(allowed());
  }

  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", init); else init();
})(window, document);
