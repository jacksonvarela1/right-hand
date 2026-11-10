/* Right Hand NWA: shared demo player.
   Every live demo on the page uses this. It owns autoplay, pause offscreen, the "only one demo plays at a time"
   conductor, hand-off to the visitor, cursors, the live region and reduced-motion stepping.

   USAGE (classic script, no modules):
     RH.demo({
       root: document.getElementById("demo-calls"),   // <section class="demo" id="demo-calls"> with a .stage inside
       title: "Missed call to booked visit",
       loops: 1,                                       // autoplay loops before it parks (default 1)
       steps: [ { d: 600, run: function (ctx) { ... } }, ... ],   // d = wait (ms) before this step runs
       reset: function (ctx) { ... },                  // put the stage back to its first frame (before every loop)
       finalState: function (ctx) { ... },             // paint the finished state (reduced motion, parking)
       onHandoff: function (ctx) { ... }               // switch the stage into interactive mode
     });

   ctx = {
     root, stage,                 // elements
     q(sel), qa(sel),             // query inside the stage
     anim(el, keyframes, opts),   // wraps el.animate(); paused/resumed with the demo; instant under reduced motion
     cursor(who, el, opts),       // who = "you" | "rh"; moves that cursor to the element's center; opts {dx, dy}
     press(who),                  // little press on the cursor
     hideCursors(),
     say(msg),                    // polite announcement (only after hand-off, or at loop end when opts.force)
     handedOff(), playing(), reduced
   }
*/
(function () {
  "use strict";
  var RH = window.RH = window.RH || {};
  var RM = matchMedia("(prefers-reduced-motion: reduce)");
  var STEPS = []; for (var i = 0; i <= 20; i++) STEPS.push(i / 20);   // fine steps, so a tall stage reports often enough
  function motionOff() { return RM.matches || document.documentElement.getAttribute("data-motion") === "off"; }
  RH.motionOff = motionOff;

  /* ---------- conductor: only the most visible demo plays, and never while the page is being scrolled ---------- */
  var players = [], moving = false, moveT = 0;
  function conduct() {
    var best = null;
    players.forEach(function (p) { if (p.ratio >= 0.5 && (!best || p.ratio > best.ratio)) best = p; });
    players.forEach(function (p) { if (p === best && !document.hidden) { if (moving) p._hold(); else p._wake(); } else p._sleep(); });
  }
  // A demo rewrites its stage as it plays. That is work a phone should not be doing in the middle of a scroll, so the
  // playing demo holds its place (same pill, same button) and carries on a moment after the page comes to rest.
  var movedAt = 0;
  function rest() { if (performance.now() - movedAt < 160) moveT = setTimeout(rest, 170); else { moving = false; conduct(); } }
  window.addEventListener("scroll", function () {
    movedAt = performance.now();   // one timer for the whole scroll, not one per scroll event
    if (!moving) { moving = true; players.forEach(function (p) { p._hold(); }); moveT = setTimeout(rest, 170); }
  }, { passive: true });
  document.addEventListener("visibilitychange", conduct);
  RH.conductor = { conduct: conduct, players: players };

  var CUR = {
    you: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 1l11 7-5 1.2L5.6 14z"/></svg><span>You</span>',
    rh: '<i aria-hidden="true"></i><span>Right Hand</span>'
  };

  RH.demo = function (cfg) {
    var root = cfg.root, stage = root.querySelector(".stage");
    if (!stage) throw new Error("demo needs a .stage");
    var steps = cfg.steps || [], loops = cfg.loops || 1;
    var bar = root.querySelector(".proto-bar");
    if (!bar) {
      bar = document.createElement("div"); bar.className = "proto-bar";
      bar.innerHTML = '<h3 class="proto-title"></h3><span class="pill"><i></i><span>Ready</span></span><button type="button" class="bar-btn" aria-pressed="false">Stop demo</button>';
      root.insertBefore(bar, stage);
    }
    if (cfg.title && bar.querySelector(".proto-title") && !bar.querySelector(".proto-title").textContent) bar.querySelector(".proto-title").textContent = cfg.title;
    var pill = bar.querySelector(".pill"), pillText = pill.querySelector("span"), btn = bar.querySelector(".bar-btn");
    var live = root.querySelector(".demo-live");
    if (!live) { live = document.createElement("p"); live.className = "sr-only demo-live"; live.setAttribute("aria-live", "off"); root.appendChild(live); }
    var cursors = {};
    ["you", "rh"].forEach(function (w) {
      var c = document.createElement("div"); c.className = "cursor cursor-" + w; c.setAttribute("aria-hidden", "true"); c.innerHTML = CUR[w];
      stage.appendChild(c); cursors[w] = c;
    });

    var st = { i: 0, loop: 0, timer: 0, due: 0, left: 0, running: false, held: false, auto: true, handed: false, done: false, anims: [] };
    var p = { ratio: 0, root: root };

    var ctx = {
      root: root, stage: stage, reduced: motionOff(),
      q: function (s) { return stage.querySelector(s); },
      qa: function (s) { return Array.prototype.slice.call(stage.querySelectorAll(s)); },
      anim: function (el, kf, opts) {
        if (!el || !el.animate) return null;
        opts = Object.assign({ duration: 300, easing: "cubic-bezier(.23,1,.32,1)", fill: "forwards" }, opts || {});
        if (motionOff()) opts.duration = 1;
        var a = el.animate(kf, opts);
        st.anims.push(a); a.addEventListener("finish", function () { var k = st.anims.indexOf(a); if (k >= 0) st.anims.splice(k, 1); });
        if (!st.running && !st.handed && st.auto) { try { a.pause(); } catch (e) {} }
        return a;
      },
      cursor: function (who, el, o) {
        var c = cursors[who]; if (!c || !el || motionOff()) return;
        if (!c.isConnected) stage.appendChild(c);   // a demo may re-render its stage
        o = o || {};
        var r = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
        var x = r.left - s.left + r.width * (o.fx == null ? .55 : o.fx) + (o.dx || 0), y = r.top - s.top + r.height * (o.fy == null ? .55 : o.fy) + (o.dy || 0);
        c.style.opacity = "1"; c.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
      },
      press: function (who) { var c = cursors[who]; if (!c) return; c.classList.add("down"); setTimeout(function () { c.classList.remove("down"); }, 130); },
      hideCursors: function () { Object.keys(cursors).forEach(function (k) { cursors[k].style.opacity = "0"; }); },
      say: function (msg, o) { if (!st.handed && !(o && o.force)) return; live.setAttribute("aria-live", "polite"); live.textContent = ""; setTimeout(function () { live.textContent = msg; }, 30); },
      handedOff: function () { return st.handed; },
      playing: function () { return st.running; }
    };

    function setPill(kind) {
      pill.className = "pill " + kind;
      pillText.textContent = kind === "playing" ? "Demo playing" : kind === "turn" ? "Your turn" : kind === "step" ? "Step " + (st.i) + " of " + steps.length : "Ready";
      btn.textContent = kind === "playing" ? "Stop demo" : motionOff() ? "Next step" : "Watch the demo";
      btn.setAttribute("aria-pressed", String(kind === "playing"));
    }
    function clearT() { clearTimeout(st.timer); st.timer = 0; }
    function sched(ms) { st.due = Date.now() + ms; st.timer = setTimeout(step, ms); }
    function step() {
      if (!st.running) return;
      if (st.i >= steps.length) {
        st.loop++;
        if (st.loop >= loops) { park(); return; }
        st.i = 0; if (cfg.reset) cfg.reset(ctx);
        sched(steps[0] ? steps[0].d : 400); return;
      }
      var s = steps[st.i++];
      try { s.run(ctx); } catch (e) { if (window.console) console.error(e); }
      sched(st.i < steps.length ? steps[st.i].d : 1200);
    }
    // quiet: a hold while the page scrolls. The clock and the animations stop; the pill and the button are left alone.
    function pause(quiet) {
      if (st.running) {
        clearT(); st.left = Math.max(0, st.due - Date.now()); st.running = false; st.anims.forEach(function (a) { try { a.pause(); } catch (e) {} });
        st.held = !!quiet; if (quiet) return;
      } else if (quiet || !st.held) return;
      st.held = false;
      setPill(st.handed ? "turn" : "ready"); pillText.textContent = st.handed ? "Your turn" : "Paused";
    }
    function resume() {
      if (st.running || st.handed || st.done || !st.auto || motionOff()) return;
      st.running = true; if (!st.held) setPill("playing"); st.held = false;
      st.anims.forEach(function (a) { try { a.play(); } catch (e) {} });
      sched(st.left || (steps[st.i] ? steps[st.i].d : 400)); st.left = 0;
    }
    function finishAnims() { st.anims.slice().forEach(function (a) { try { a.finish(); } catch (e) {} }); st.anims = []; }
    function park() { st.running = false; st.done = true; clearT(); finishAnims(); ctx.hideCursors(); if (cfg.finalState) cfg.finalState(ctx); setPill("turn"); handoff(true); }
    function handoff(silent) {
      if (st.handed) return;
      st.handed = true; st.auto = false; st.running = false; st.held = false; clearT(); finishAnims(); ctx.hideCursors();
      live.setAttribute("aria-live", "polite"); setPill("turn");
      root.classList.add("handed");
      if (cfg.onHandoff) cfg.onHandoff(ctx);
      if (!silent) conduct();
    }
    function restart() {
      clearT(); finishAnims(); st.handed = false; st.done = false; st.held = false; st.auto = true; st.i = 0; st.loop = 0; st.left = 0;
      root.classList.remove("handed"); live.setAttribute("aria-live", "off");
      if (cfg.reset) cfg.reset(ctx);
      st.running = false; resume();
    }
    p._wake = function () { if (!st.handed && !st.done && st.auto) resume(); };
    p._sleep = function () { pause(); };
    p._hold = function () { pause(true); };

    btn.addEventListener("click", function () {
      if (motionOff()) {
        // reduced motion: step through by hand
        if (st.i === 0 && cfg.reset) cfg.reset(ctx);
        if (st.i >= steps.length) { st.i = 0; if (cfg.reset) cfg.reset(ctx); }
        var s = steps[st.i++]; try { s.run(ctx); } catch (e) {}
        setPill("step"); if (st.i >= steps.length) { pillText.textContent = "Done. Your turn"; if (!st.handed) handoff(true); }
        return;
      }
      if (st.running || st.held) { handoff(); return; }
      restart();
      var r = root.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) root.scrollIntoView({ block: "center", behavior: "smooth" });
      p.ratio = 1; conduct();
    });
    // a real click, key or focus inside the stage hands it over (never pointerdown, so scrolling thumbs don't stop it)
    function takeover(e) { if (!e.isTrusted) return; if (!st.handed) handoff(); }
    stage.addEventListener("click", takeover, true);
    stage.addEventListener("keydown", takeover, true);
    stage.addEventListener("focusin", takeover);

    // first frame
    if (cfg.reset) cfg.reset(ctx);
    if (motionOff()) { if (cfg.finalState) cfg.finalState(ctx); st.handed = true; st.auto = false; root.classList.add("handed"); live.setAttribute("aria-live", "polite"); if (cfg.onHandoff) cfg.onHandoff(ctx); setPill("turn"); btn.textContent = "Next step"; }
    else setPill("ready");

    players.push(p);
    // a stage taller than twice the screen (the receipts demo on phones) can never be half visible, so filling half the screen counts too
    new IntersectionObserver(function (es) { var e = es[0], vh = e.rootBounds ? e.rootBounds.height : innerHeight; p.ratio = e.isIntersecting ? Math.max(e.intersectionRatio, Math.min(1, e.intersectionRect.height / vh)) : 0; conduct(); }, { threshold: STEPS }).observe(stage);
    return { ctx: ctx, handoff: handoff, restart: restart };
  };

  /* small helpers demos can share */
  RH.util = {
    esc: function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); },
    money: function (n) { return (Math.round(n * 100) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" }); },
    tick: function (el, from, to, ms, fmt) {
      fmt = fmt || function (v) { return String(Math.round(v)); };
      if (motionOff()) { el.textContent = fmt(to); return; }
      var t0 = performance.now();
      requestAnimationFrame(function f(t) { var k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(f); });
    },
    // FLIP: move a node from where it is to a new parent, animating the jump
    flip: function (ctx, el, parent, before) {
      var a = el.getBoundingClientRect();
      if (before) parent.insertBefore(el, before); else parent.appendChild(el);
      var b = el.getBoundingClientRect();
      return ctx.anim(el, [{ transform: "translate(" + (a.left - b.left) + "px," + (a.top - b.top) + "px)" }, { transform: "none" }], { duration: 420, easing: "linear(0,.13 6%,.45 13%,.78 20%,.97 27%,1.04 34%,1.05 40%,1.03 48%,1.005 60%,.998 75%,1)" });
    },
    CHECK: '<svg class="ck" viewBox="0 0 24 24" aria-hidden="true"><path pathLength="1" d="M6.5 12.5l3.5 3.5 7.5-8"/></svg>'
  };
})();
