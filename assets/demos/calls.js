/* Demo 01: Missed call to booked visit. Cold Hollow Heating & Air, Rogers (made-up shop, sample data).
   Right Hand texts back after a missed call and holds a slot. Only the owner confirms (the You cursor, or the visitor).
   Uses the shared player (assets/demo-player.js). Every beat is a step, so pause and hand-off stay exact. */
(function () {
  "use strict";
  var root = document.getElementById("demo-calls");
  if (!root || !window.RH || !RH.demo) return;
  var stage = root.querySelector(".stage");
  if (!stage) return;

  var PH = "(479) 555-0142", ADDR = "418 Sample St, Rogers", SRC = "Text-back after missed call, 6:52 PM";
  var T1 = "Hi, this is Cold Hollow Heating & Air in Rogers. Sorry we missed your call. Is this about a repair, a new system or a tune-up? Reply STOP to opt out.";
  var T3 = "Thanks. So the tech comes ready: is it gas or electric, and about how old?";
  var OFFER = "Here are the next open visits: Wed 8 to 10 AM, Wed 1 to 3 PM, Thu 8 to 10 AM. Which works, and what is the address?";
  var C1 = "Repair. Furnace runs but only cold air comes out.", C2 = "Gas. Maybe 12 years.";
  var ISSUE = "Repair: furnace runs, only cold air", SYS = "Gas furnace, about 12 years";
  var SL = { w8: "Wed 8 to 10 AM", w1: "Wed 1 to 3 PM", t8: "Thu 8 to 10 AM" };
  var SD = { w8: "Wed Nov 4, 8 to 10 AM", w1: "Wed Nov 4, 1 to 3 PM", t8: "Thu Nov 5, 8 to 10 AM" };
  var L = { rep: "Repair", nw: "New system quote", tu: "Tune-up", gas: "I smell gas", cost: "How much will it cost?", sg: "Gas, about 12 years", se: "Electric, about 5 years", w8: SL.w8, w1: SL.w1, t8: SL.t8, over: "Start over as a new caller" };
  var FIRST = ["rep", "nw", "tu", "gas", "cost"];
  var MENU = { start: FIRST, booked: FIRST, sys: ["sg", "se", "gas", "cost"], slots: ["w8", "w1", "t8", "cost"], held: ["cost", "gas"], urgent: ["over"] };
  var LAND = window.CSS && CSS.supports && CSS.supports("animation-timing-function", "linear(0, 1)") ? "linear(0,.13 6%,.45 13%,.78 20%,.97 27%,1.04 34%,1.05 40%,1.03 48%,1.005 60%,.998 75%,1)" : "cubic-bezier(.23,1,.32,1)";
  var IN = [{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }];
  var DOTS = '<i></i><i></i><i></i><span class="sr-only">typing</span>';
  var ROWS = [["c", "Caller"], ["i", "Issue", 1], ["s", "System", 1], ["t", "Slot"], ["a", "Address"], ["o", "Source", 1], ["u", "Status"]];
  var NOW = '<time datetime="2026-11-03T18:52">';

  var HTML = '<div class="phone"><div class="screen paper">' +
    '<div class="sb">' + NOW + 'Tue Nov 3, 6:52 PM</time><span>Business line</span></div>' +
    '<div class="call"><div class="ring"><p class="rl">Incoming call</p><p class="rn">' + PH + '</p><p class="rc">Rogers, AR</p>' +
    '<div class="wave" aria-hidden="true">' + new Array(13).join("<i></i>") + '</div><p class="rc">After hours. No one free to answer.</p></div>' +
    '<p class="miss"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 3h3l1.5 4-2 1.2a9 9 0 0 0 5.3 5.3l1.2-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5C9 17 3 11 2.5 4.6A1.5 1.5 0 0 1 4 3zM12 3l4 4m0-4l-4 4"/></svg>' +
    '<b>Missed call</b><span>' + PH + ', after hours</span>' + NOW + '6:52 PM</time></p></div>' +
    '<ol class="thread" role="log" aria-live="off" aria-label="Texts with ' + PH + '" tabindex="0"></ol>' +
    '<div class="tray" hidden><p class="cl" aria-hidden="true"></p><div class="chips" role="group" aria-label="Reply as the customer"></div></div>' +
    '</div></div><div class="side"><section class="ocard paper" aria-labelledby="dc-own"><header><h4 id="dc-own">Owner\'s view</h4><span class="tag">Sample</span></header><dl class="of">' +
    ROWS.map(function (r) { return "<div><dt>" + r[1] + '</dt><dd data-k="' + r[0] + '"' + (r[2] ? ' class="l2"' : "") + "></dd></div>"; }).join("") +
    '</dl><div class="act"><button type="button" class="cfm" disabled>' + RH.util.CHECK + "<span>Confirm visit</span></button></div>" +
    '<ol class="olog" aria-label="Owner log"></ol></section><div class="trace"><h4>How it decided</h4><ul>' +
    "<li><i></i>Never quotes prices.</li><li><i></i>Never diagnoses.</li><li><i></i>Holds the slot until you confirm.</li></ul></div></div>";

  var E = {}, conv, pend, quiet = 0, CX;

  /* ---------- building blocks (each one is instant when quiet, for finalState) ---------- */
  function A(c, el, kf, o) { return quiet ? null : c.anim(el, kf || IN, o || { duration: 240 }); }
  function build(c) {
    CX = c;
    E.cc.innerHTML = HTML;
    ["call", "ring", "miss", "thread", "tray", "cl", "chips", "ocard", "cfm", "olog"].forEach(function (k) { E[k] = E.cc.querySelector("." + k); });
    E.bars = [].slice.call(E.cc.querySelectorAll(".wave i"));
    E.tr = E.cc.querySelectorAll(".trace li");
    E.d = {};
    [].forEach.call(E.cc.querySelectorAll("dd"), function (d) { E.d[d.getAttribute("data-k")] = d; });
    E.d.u.innerHTML = '<span class="sv">Incoming call</span>';
    E.thread.setAttribute("aria-live", c.handedOff() ? "polite" : "off");
    conv = { s: "ring", m: 0, k: "w8" };
    pend = null;
  }
  function add(c, who, html) {
    var t = E.thread, li = document.createElement("li");
    li.className = "msg " + who;
    li.innerHTML = '<span class="sr-only">' + (who === "in" ? "Customer" : "Cold Hollow") + ": </span>" + html;
    t.appendChild(li);
    while (t.children.length > 14) t.removeChild(t.firstChild);
    if (!quiet) t.scrollTop = t.scrollHeight;
    A(c, li, [{ opacity: 0, transform: "translateY(10px) scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: LAND });
  }
  // fill an owner-card field; ty = type it in at 40ms a character, capped at 600ms (follows the player's clock)
  function fill(c, k, t, ty) {
    var d = E.d[k];
    if (!ty || quiet) { d.textContent = t; A(c, d); return; }
    var T = Math.min(600, t.length * 40), a = c.anim(d, [{ opacity: 1 }, { opacity: 1 }], { duration: T, easing: "linear" });
    if (!a) { d.textContent = t; return; }
    (function f() {
      if (!d.isConnected) return;
      var p = a.playState === "finished" ? 1 : Math.min(1, (a.currentTime || 0) / T);
      d.textContent = t.slice(0, Math.ceil(t.length * p));
      if (p < 1) requestAnimationFrame(f);
    })();
  }
  function status(c, t, cls) {
    E.ocard.className = "ocard paper " + cls;
    E.d.u.innerHTML = '<span class="sv">' + t + "</span>";
    A(c, E.d.u.firstChild, [{ opacity: 0, transform: "scale(.94)" }, { opacity: 1, transform: "none" }]);
  }
  function log(c, t) {
    var n = 52 + conv.m++, h = 6 + (n / 60 | 0), m = n % 60, mm = (m < 10 ? "0" : "") + m, li = document.createElement("li");
    li.innerHTML = '<time datetime="2026-11-03T' + (h + 12) + ":" + mm + '">' + h + ":" + mm + " PM</time><span>" + t + "</span>";
    E.olog.appendChild(li);
    if (E.olog.children.length > 4) E.olog.removeChild(E.olog.firstChild);
    A(c, li);
  }
  function hit(i) { E.tr[i].className = "hit"; }
  function chips(c, keys) {
    var g = E.chips, s = keys.join();
    if (g.getAttribute("data-s") === s) return;
    g.setAttribute("data-s", s);
    g.innerHTML = keys.map(function (k) { return '<button type="button" class="chip" data-k="' + k + '">' + L[k] + "</button>"; }).join("");
    [].forEach.call(g.children, function (b, i) { A(c, b, [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 240, delay: i * 60, fill: "both" }); });
    E.tray.hidden = !keys.length;
    E.cl.textContent = conv.s === "held" ? "Next: press Confirm visit on the owner card" : "Reply as the customer";
  }
  function sync(c) { if (c.handedOff()) chips(c, MENU[conv.s] || []); }

  /* ---------- the conversation ---------- */
  function missed(c) {
    E.call.className = "call on";
    A(c, E.ring, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 });
    A(c, E.miss, [{ opacity: 0, transform: "translateY(-120%)" }, { opacity: 1, transform: "none" }], { duration: 280 });
    fill(c, "c", PH);
    status(c, "Missed call. Texting back.", "rh");
    log(c, "Missed call, after hours");
    conv.s = "missed";
  }
  function opener(c) {
    var d = E.thread.querySelector(".typing");
    if (d) E.thread.removeChild(d);
    add(c, "out", T1);
    log(c, "Text-back sent");
    conv.s = "start";
  }
  function askSys(c, issue) { add(c, "out", T3); fill(c, "i", issue, 1); hit(1); conv.s = "sys"; }
  function offer(c, pre) { add(c, "out", pre + OFFER); conv.s = "slots"; chips(c, c.handedOff() ? MENU.slots : ["w8", "w1", "t8"]); }
  function pick(c, k) {
    conv.k = k;
    add(c, "in", SL[k] + ". " + ADDR + ".");
    chips(c, []);
    fill(c, "t", SD[k]);
    fill(c, "a", ADDR);
    conv.s = "picked";
  }
  function hold(c) {
    fill(c, "o", SRC);
    status(c, "Held. Needs your OK", "warn");
    E.cfm.disabled = false;
    log(c, "Held " + SL[conv.k]);
    hit(2);
    conv.s = "held";
  }
  function approve(c) {
    var b = E.cfm, ck = b.querySelector(".ck");
    b.disabled = true; b.className = "cfm done"; b.lastChild.textContent = "Visit confirmed";
    ck.classList.add("on");
    A(c, ck.firstChild, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 320 });
    status(c, "Booked", "ok");
    log(c, "You confirmed " + SL[conv.k]);
    conv.s = "conf";
  }
  function booked(c) { add(c, "out", "You're booked for " + SL[conv.k] + ". The tech will text when on the way. Reply C to change."); conv.s = "booked"; }
  function urgent(c) {
    add(c, "out", "Please leave the house now and call 911 or your gas company from outside. We are alerting the owner too.");
    fill(c, "i", "Caller smells gas");
    status(c, "Urgent: possible gas leak. Call back now.", "warn");
    E.cfm.disabled = true;
    log(c, "Urgent: caller smells gas");
    conv.s = "urgent";
  }
  function s4(c) { add(c, "in", C1); conv.s = "rep"; pend = function (c) { askSys(c, ISSUE); }; }
  function s6(c) { add(c, "in", C2); fill(c, "s", SYS); conv.s = "sys2"; pend = function (c) { offer(c, ""); }; }

  /* ---------- after hand-off: the visitor plays the customer, and the owner ---------- */
  function act(c, k) {
    if (k !== "ok" && (MENU[conv.s] || []).indexOf(k) < 0) return;
    var f = c.stage.contains(document.activeElement);
    if (k === "over" || (/^(rep|nw|tu)$/.test(k) && conv.s !== "start")) { build(c); missed(c); opener(c); }
    if (k === "ok") {
      if (conv.s !== "held") return;
      approve(c); booked(c);
      c.say("Owner card: booked. The customer got a confirmation text.");
    } else if (SL[k]) {
      pick(c, k); hold(c);
      c.say("Owner card: " + SL[k] + " is held and needs your OK. Press Confirm visit.");
    } else if (k !== "over") {
      add(c, "in", L[k] + (k === "cost" ? "" : "."));
      if (k === "rep") askSys(c, "Repair");
      else if (k === "nw" || k === "tu") { fill(c, "i", L[k], 1); offer(c, k === "nw" ? "Got it. The owner quotes new systems in person. " : "Happy to. "); }
      else if (k === "sg" || k === "se") { fill(c, "s", k === "sg" ? SYS : "Electric, about 5 years"); offer(c, ""); }
      else if (k === "gas") { urgent(c); c.say("Owner card: urgent, possible gas leak. Call back now."); }
      else { add(c, "out", "The owner sets prices. The tech confirms any visit fee before work starts.<small>Sample shop policy</small>"); hit(0); }
    }
    sync(c);
    var a = document.activeElement;
    if (f && (!c.stage.contains(a) || a.disabled)) { var b = conv.s === "held" ? E.cfm : E.chips.querySelector("button"); if (b) b.focus(); }
  }

  /* ---------- the script: [ms before this beat, beat] ---------- */
  var S = [
    [400, function (c) { E.bars.forEach(function (b, i) { c.anim(b, [{ transform: "scaleY(.3)" }, { transform: "scaleY(1)" }], { duration: 600, iterations: 3, direction: "alternate", delay: i * 50, easing: "ease-in-out", fill: "none" }); }); }],
    [1800, function (c) { missed(c); pend = opener; }],
    [800, function (c) { add(c, "out typing", DOTS); }],
    [900, function (c) { opener(c); pend = null; }],
    [900, s4],
    [1200, function (c) { askSys(c, ISSUE); c.cursor("rh", E.d.i, { fx: .1 }); pend = null; }],
    [1400, s6],
    [1200, function (c) { offer(c, ""); pend = null; }],
    [1400, function (c) { var b = E.chips.firstChild; if (b) b.className = "chip on"; pend = function (c) { pick(c, "w8"); hold(c); }; }],
    [300, function (c) { pick(c, "w8"); pend = hold; }],
    [900, function (c) { hold(c); c.cursor("rh", E.d.u, { fx: .1 }); pend = null; }],
    [300, function (c) { c.cursor("you", E.cfm); }],
    [700, function (c) { c.press("you"); approve(c); pend = booked; }],
    [800, function (c) { booked(c); pend = null; }],
    [800, function (c) { c.hideCursors(); }]
  ];

  stage.innerHTML = '<div class="cc"></div>';
  E.cc = stage.firstChild;
  var foot = root.querySelector(".stage-foot");
  if (foot && !root.querySelector(".demo-notes")) foot.insertAdjacentHTML("afterend", '<ul class="demo-notes"><li>Business texting needs carrier registration (A2P 10DLC). We set that up with you before anything sends.</li><li>Every first text names your business and says Reply STOP to opt out.</li><li>We do not set up AI voice calls to your customers.</li></ul>');

  stage.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button") : null;
    if (!b || b.disabled || !CX || !CX.handedOff()) return;
    if (b === E.cfm) act(CX, "ok");
    else if (b.getAttribute("data-k")) act(CX, b.getAttribute("data-k"));
  });

  RH.demo({
    root: root,
    title: "Missed call to booked visit",
    loops: 1,
    steps: S.map(function (s) { return { d: s[0], run: function (c) { s[1](c); sync(c); } }; }),
    reset: function (c) { build(c); pend = function (c) { missed(c); opener(c); }; c.hideCursors(); },
    finalState: function (c) {
      build(c);
      quiet = 1;
      missed(c); opener(c); s4(c); askSys(c, ISSUE); s6(c); offer(c, ""); pick(c, "w8"); hold(c); approve(c); booked(c);
      quiet = 0;
      pend = null;
      E.thread.scrollTop = E.thread.scrollHeight;
    },
    onHandoff: function (c) {
      E.thread.setAttribute("aria-live", "polite");
      while (pend) { var f = pend; pend = null; f(c); }
      sync(c);
    }
  });
})();
