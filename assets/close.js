/* Right Hand NWA: closing devices (styles in assets/close.css). Loads after site.js and talks to it through RH.composer.
   1. Find your first handoff: three taps (kind of business, what eats the most time, how to meet) build a sample
      Admin Map from assets/services-data.js; "Send me my real Admin Map" pre-fills the check-up form and goes there.
   2. The floating check-up pill: desktop only, once the hero is gone, hidden over the quiz, the check-up and the footer.
   3. Micro-proof under the primary CTAs is static HTML: motion.js cascades it in and close.css draws its checks.
   4. The check-up form's success moment when the email draft opens (site.js fires rh:draft).
   Reduced motion and the Pause motion button get the same results, finished, with nothing moving. */
(function () {
  "use strict";
  var d = document, html = d.documentElement, W = window;
  var RM = matchMedia("(prefers-reduced-motion: reduce)");
  function off() { return RM.matches || html.getAttribute("data-motion") === "off"; }
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var EASE = "cubic-bezier(.23,1,.32,1)", EASE_IO = "cubic-bezier(.65,0,.35,1)";
  var LAND = W.CSS && CSS.supports && CSS.supports("animation-timing-function", "linear(0, 1)") ? "linear(0,.13 6%,.45 13%,.78 20%,.97 27%,1.04 34%,1.05 40%,1.03 48%,1.005 60%,.998 75%,1)" : EASE;

  // timed steps and WAAPI runs; pausing motion runs every step now and finishes every animation
  var pend = [], runs = [];
  function later(fn, ms) {
    if (off()) { fn(); return; }
    var j = { fn: fn };
    j.t = setTimeout(function () { var i = pend.indexOf(j); if (i >= 0) pend.splice(i, 1); fn(); }, ms);
    pend.push(j);
  }
  function cancel() { pend.forEach(function (j) { clearTimeout(j.t); }); pend = []; }
  function flush() { var p = pend; pend = []; p.forEach(function (j) { clearTimeout(j.t); j.fn(); }); }
  function anim(el, kf, o) {
    if (!el || !el.animate || off()) return null;
    o.easing = o.easing || EASE; o.fill = "backwards";   // the CSS resting state is the finished state
    var a = el.animate(kf, o);
    runs.push(a);
    a.onfinish = a.oncancel = function () { var i = runs.indexOf(a); if (i >= 0) runs.splice(i, 1); };
    return a;
  }
  d.addEventListener("rh:motion", function (e) {
    if (!e.detail || !e.detail.off) return;
    flush();
    runs.slice().forEach(function (a) { try { a.finish(); } catch (x) {} });
    // CSS transitions already under way (a check mid-draw) finish too
    $$("#first-handoff, #composer, #cta-pill").forEach(function (r) { if (r.getAnimations) r.getAnimations({ subtree: true }).forEach(function (a) { if (a.effect && a.effect.getTiming().iterations !== Infinity) try { a.finish(); } catch (x) {} }); });
  });

  /* ---------- 1. find your first handoff ---------- */
  // what eats the most time (the check-up form's own chip words) -> services from assets/services-data.js, best first
  var PAIN = {
    "Missed calls and texts": ["textback", "phone", "intake", "booking", "chat", "reminders"],
    "Email": ["inbox", "emaildraft", "newsletter", "automations", "vendoroffice"],
    "Receipts and expenses": ["receipts", "expenses", "cpa", "subscriptions", "report"],
    "Invoices and follow-ups": ["invoices", "quotefollow", "quotes", "renewals", "crm"],
    "Scheduling": ["booking", "reminders", "calendar", "staff", "vendors"],
    "Paperwork and files": ["folders", "templates", "cpa", "sops", "hiring"],
    "Setting up AI and automations": ["automations", "emaildraft", "promptkit", "workshop", "policy", "notes"],
    "Weekly numbers": ["report", "expenses", "invoices", "receipts"],
    "Reviews and Google profile": ["reviewreq", "reviewreply", "listings", "frontdoor", "social"],
    "Not sure": ["frontdoor", "report", "inbox", "receipts", "invoices", "reminders", "folders"]
  };
  (function quiz() {
    var Q = $("#qz"), out = $("#qz-out"), S = W.RH_SERVICES;
    if (!Q || !out || !S || !S.lines) return;
    var by = {}, order = [], WHO = {};
    S.lines.forEach(function (l) { l.items.forEach(function (s) { by[s.id] = s; order.push(s.id); }); });
    (S.who || []).forEach(function (w) { WHO[w.id] = w.label; });
    var KEYS = ["who", "eats", "mode"], LABEL = ["Business", "Time", "Meet", "Done"];
    var steps = $$(".qz-step", Q), num = $("[data-qz-n]", Q), lab = $("[data-qz-l]", Q), bar = $("[data-qz-bar]", Q), live = $("#qz-live");
    var rows = $(".qz-rows", out), ph = rows.innerHTML, sub = $("[data-qz-for]", out), sub0 = sub.textContent;
    var go = $(".qz-go", out), title = $("#qz-map-t"), beam = $(".qz-beam", out), town = $("#qz-town"), cta = $("[data-qz-go]", out);
    var ans = {}, cur = 1, picked = [], applied = null, tok = 0, fresh = false;

    // the best three for this pain, the ones made for this kind of business first
    function match(who, eat) {
      var list = (PAIN[eat] || PAIN["Not sure"]).filter(function (id) { return by[id]; });
      function fits(id) { return (by[id].who || []).indexOf(who) >= 0; }
      var res = list.filter(fits).concat(list.filter(function (id) { return !fits(id); }));
      order.forEach(function (id) { if (res.length < 3 && res.indexOf(id) < 0 && fits(id)) res.push(id); });
      return res.slice(0, 3);
    }
    function words(k, v) { return k === "who" ? WHO[v] || v : k === "eats" && v === "Not sure" ? "Not sure yet" : v; }
    function logSet(k, text, ok) {
      var li = $('[data-log="' + k + '"]', out); if (!li) return;
      $(".v", li).innerHTML = String(text).split("").map(function (c, i) { return '<i style="--c:' + i + '">' + esc(c) + "</i>"; }).join("");
      li.classList.add("set"); li.classList.toggle("ok", !!ok);
    }
    function logReset(k, text) { var li = $('[data-log="' + k + '"]', out); if (!li) return; $(".v", li).textContent = text; li.classList.remove("set", "ok"); }

    function show(i, focus) {
      cur = i;
      steps.forEach(function (s) { s.classList.toggle("is-on", +s.getAttribute("data-step") === i); });
      num.textContent = "0" + Math.min(i, 3); lab.textContent = LABEL[i - 1];
      bar.style.transform = "scaleX(" + (Math.min(i, 3) / 3).toFixed(4) + ")";
      var st = steps[i - 1];
      if (i < 4 && focus) {
        live.textContent = "Step " + i + " of 3. " + $("legend", st).textContent;
        var b = $('.qz-opt[aria-pressed="true"]', st) || $(".qz-opt", st); if (b) b.focus({ preventScroll: true });
      }
    }
    Q.addEventListener("click", function (e) {
      var b = e.target.closest(".qz-opt");
      if (b) { choose(b); return; }
      if (e.target.closest("[data-back]")) { tok++; show(Math.max(1, cur - 1), true); return; }
      if (e.target.closest("[data-restart]")) restart();
    });
    function choose(b) {
      var st = b.closest(".qz-step"), i = +st.getAttribute("data-step"), k = KEYS[i - 1];
      if (i !== cur || !k) return;
      $$(".qz-opt", st).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      ans[k] = b.getAttribute("data-v");
      logSet(k, words(k, ans[k]), true);
      var my = ++tok;
      later(function () { if (my !== tok) return; if (i === 3) finish(); else show(i + 1, true); }, 300);   // long enough to see the tick land
    }

    function row(id, k) {
      var s = by[id], first = s.tag === "ai" ? "AI drafted" : "We drafted";
      return '<li class="qz-row" style="--k:' + k + '"><b>' + esc(s.name) + '</b><span><i>You get back</i>' + esc((s.rows && s.rows.back) || s.sum) + '</span>' +
        '<em class="st qz-st"><i class="s1" aria-hidden="true">' + first + '</i><i class="s2" aria-hidden="true">We checked</i><i class="s3">Needs your OK</i></em></li>';
    }
    function finish() {
      picked = match(ans.who, ans.eats);
      // everything that changes size happens now, on the tap; the build after it only fades and slides
      rows.innerHTML = picked.map(row).join("");
      sub.textContent = KEYS.map(function (k) { return words(k, ans[k]); }).join(" · ") + " · sample";
      KEYS.forEach(function (k) { var dd = $('[data-sum="' + k + '"]', Q); if (dd) dd.textContent = words(k, ans[k]); });
      out.classList.add("is-done"); fresh = true;
      go.classList.remove("on");
      show(4, false);
      title.focus({ preventScroll: true });
      live.textContent = "Matched: " + picked.map(function (id) { return by[id].name; }).join(", ") + ".";
      reveal();
      logSet("match", "matching your answers", false);
      anim(beam, [{ transform: "translateY(-100%)", opacity: 1 }, { transform: "translateY(0)", opacity: 1, offset: .9 }, { transform: "translateY(0)", opacity: 0 }], { duration: 1250, delay: 140, easing: EASE_IO });
      later(function () { logSet("match", "your top 3 handoffs", true); }, 1350);
      later(function () { go.classList.add("on"); }, 1500);
    }
    // bring the map and its button into view; when both cannot fit (phones), start at the map's title
    function reveal() {
      var mb = $("#mobile-bar"), vh = innerHeight - (mb && getComputedStyle(mb).display !== "none" ? mb.offsetHeight : 0), top = 80;
      var pr = $(".qz-paper", out).getBoundingClientRect(), gr = go.getBoundingClientRect(), end = gr.bottom + 16;
      var dy = end - pr.top <= vh - top ? (end > vh ? end - vh : pr.top < top ? pr.top - top : 0) : pr.top - top;
      if (Math.abs(dy) > 8) scrollBy({ top: dy, behavior: off() ? "auto" : "smooth" });
    }
    function restart() {
      cancel(); tok++;
      ans = {}; picked = [];
      $$(".qz-opt", Q).forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      KEYS.forEach(function (k) { logReset(k, "waiting"); }); logReset("match", "waiting for three taps");
      rows.innerHTML = ph; sub.textContent = sub0;
      out.classList.remove("is-done"); go.classList.remove("on"); fresh = false;
      show(1, true);
    }
    // hand the answers to the check-up form; a second run swaps its own earlier answers out
    function apply() {
      var C = W.RH && W.RH.composer;
      if (!C || !C.prefill || !picked.length) return;
      var now = { eats: [ans.eats], modes: [ans.mode], picks: picked.slice() }, clear = {};
      if (applied) Object.keys(now).forEach(function (k) { clear[k] = applied[k].filter(function (v) { return now[k].indexOf(v) < 0; }); });
      C.prefill({ town: town ? town.value : "", eats: now.eats, modes: now.modes, picks: now.picks, clear: clear });
      applied = now; fresh = false;
    }
    // the map's own button always carries it; any other check-up link (header, pill, mobile bar) carries a result not sent yet
    d.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("[data-go=checkup]");
      if (a && (a === cta || fresh)) apply();
    }, true);
  })();

  /* ---------- 2. floating check-up pill ---------- */
  (function pill() {
    var p = $("#cta-pill"), hero = $(".hero");
    if (!p || !hero || !("IntersectionObserver" in W)) return;
    var hide = [$("#first-handoff"), $("#checkup"), $("footer")].filter(Boolean), seen = hide.map(function () { return false; }), heroIn = true;
    function paint() { p.classList.toggle("on", !heroIn && seen.indexOf(true) < 0); }
    new IntersectionObserver(function (es) { heroIn = es[es.length - 1].isIntersecting; paint(); }).observe(hero);
    // the top 84px sit under the sticky header (scroll-padding-top): a section tucked under it, or just touching that line, is not on screen
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { seen[hide.indexOf(e.target)] = e.isIntersecting; }); paint(); }, { rootMargin: "-90px 0px 0px 0px" });
    hide.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- 4. the check-up form's success moment ---------- */
  (function success() {
    var form = $("#composer"), conf = $("#c-confirm");
    if (!form || !conf) return;
    var btn = $('button[type="submit"]', form), t = 0;
    if (btn && !$(".cs-ok", btn)) btn.insertAdjacentHTML("beforeend", '<span class="cs-ok" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path pathLength="1" d="M5.5 12.5l4.2 4.2 8.8-9.4"/></svg>Draft opened</span>');
    if (!$(".cf-badge", conf)) conf.insertAdjacentHTML("afterbegin", '<span class="cf-badge" aria-hidden="true"><svg viewBox="0 0 32 32" focusable="false"><circle cx="16" cy="16" r="15"/><path pathLength="1" d="M9.5 16.5l4.2 4.2 8.8-9.4"/></svg></span><i class="cf-beam" aria-hidden="true"></i>');
    d.addEventListener("rh:draft", function () {
      clearTimeout(t);
      if (btn) { btn.classList.add("is-sent"); t = setTimeout(function () { btn.classList.remove("is-sent"); }, 4200); }
      anim(conf, [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 420 });
      anim($(".cf-badge svg", conf), [{ opacity: 0, transform: "scale(.4)" }, { opacity: 1, transform: "none" }], { duration: 560, delay: 90, easing: LAND });
      anim($(".cf-badge path", conf), [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 420, delay: 320 });
      anim($(".cf-beam", conf), [{ transform: "translateY(-100%)", opacity: 1 }, { transform: "translateY(0)", opacity: 1, offset: .85 }, { transform: "translateY(0)", opacity: 0 }], { duration: 900, delay: 120, easing: EASE_IO });
    });
  })();
})();
