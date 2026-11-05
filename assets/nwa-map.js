/* Right Hand NWA hero: "the corridor check-in".
   A schematic of Northwest Arkansas (not to scale, cities placed from real latitude and longitude) feeding a sample
   Right Hand queue. Plays once per session in about 2.6 seconds, then the last row waits for the visitor to approve. */
(function () {
  "use strict";
  var host = document.getElementById("nwa-map");
  if (!host) return;
  var html = document.documentElement;
  function off() { return matchMedia("(prefers-reduced-motion: reduce)").matches || html.getAttribute("data-motion") === "off"; }
  function P(lat, lon) { return [Math.round(30 + (lon + 94.62) / 0.57 * 500), Math.round(30 + (36.52 - lat) / 0.50 * 460)]; }
  // name, lat, lon, label side
  var CITY = [
    ["Bella Vista", 36.481, -94.273, "l"], ["Bentonville", 36.372, -94.209, "l"], ["Rogers", 36.332, -94.118, "r"],
    ["Springdale", 36.187, -94.129, "r"], ["Fayetteville", 36.063, -94.157, "r"], ["Siloam Springs", 36.188, -94.540, "b"]
  ];
  var SMALL = [[36.454, -94.115], [36.360, -94.285], [36.255, -94.131], [36.042, -94.247], [36.133, -94.165], [36.300, -94.230]];
  var I49 = [[36.505, -94.300], [36.440, -94.240], [36.375, -94.185], [36.330, -94.160], [36.255, -94.148], [36.190, -94.146], [36.130, -94.160], [36.075, -94.170], [36.020, -94.178]];
  var WEST = [[36.187, -94.150], [36.180, -94.260], [36.200, -94.400], [36.188, -94.530]];
  function curve(pts) {
    var p = pts.map(function (a) { return P(a[0], a[1]); }), d = "M" + p[0][0] + " " + p[0][1];
    for (var i = 1; i < p.length - 1; i++) { var mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2; d += " Q" + p[i][0] + " " + p[i][1] + " " + mx + " " + my; }
    var l = p[p.length - 1]; return d + " L" + l[0] + " " + l[1];
  }
  var Q = [
    ["Rogers", "Missed call", "Text-back ready in your wording"],
    ["Springdale", "Receipt photo", "Matched to the card charge"],
    ["Bella Vista", "Invoice past due", "Friendly reminder drafted"],
    ["Bentonville", "Booking request", "Slot held until you confirm"],
    ["Fayetteville", "Weekly numbers", "Monday report ready"],
    ["Siloam Springs", "Quote request", "Reply drafted. Needs your OK."]
  ];
  var s = ['<div class="nwa-layout"><svg class="nwa-svg" viewBox="0 0 560 520" role="img" aria-labelledby="nwa-t"><title id="nwa-t">Schematic map of Northwest Arkansas: Interstate 49 runs from Bella Vista through Bentonville, Rogers, Springdale and Fayetteville, with Siloam Springs to the west.</title>'];
  s.push('<defs><pattern id="nwa-dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="currentColor" opacity=".18"/></pattern></defs><rect width="560" height="520" fill="url(#nwa-dots)"/>');
  s.push('<path class="nwa-area" d="M60 300 C 70 210, 230 150, 300 60 C 340 10, 520 20, 540 110 C 560 220, 530 420, 470 495 C 420 540, 330 520, 320 470 C 300 400, 200 400, 120 390 C 70 385, 55 345, 60 300 Z"/>');
  s.push('<path class="nwa-hwy-bg" d="' + curve(WEST) + '"/><path class="nwa-hwy-bg" d="' + curve(I49) + '"/>');
  s.push('<path class="nwa-hwy" pathLength="100" d="' + curve(I49) + '"/><path class="nwa-hwy west" pathLength="100" d="' + curve(WEST) + '"/>');
  var sh = P(36.29, -94.152);
  s.push('<g class="nwa-shield" transform="translate(' + (sh[0] - 40) + ' ' + (sh[1] - 11) + ')"><rect width="34" height="26" rx="6"/><text x="17" y="18.5" text-anchor="middle">49</text></g>');
  SMALL.forEach(function (c) { var p = P(c[0], c[1]); s.push('<circle class="nwa-small" cx="' + p[0] + '" cy="' + p[1] + '" r="3.4"/>'); });
  CITY.forEach(function (c, i) {
    var p = P(c[1], c[2]), side = c[3];
    var tx = side === "r" ? p[0] + 16 : side === "l" ? p[0] - 16 : p[0] - 10, ty = side === "b" ? p[1] + 34 : p[1] + 7, anchor = side === "r" ? "start" : side === "l" ? "end" : "start";
    s.push('<g class="nwa-city" style="--i:' + i + '" data-city="' + c[0] + '"><circle class="nwa-pulse" cx="' + p[0] + '" cy="' + p[1] + '" r="7"/><circle class="nwa-dot" cx="' + p[0] + '" cy="' + p[1] + '" r="8"/><text x="' + tx + '" y="' + ty + '" text-anchor="' + anchor + '">' + c[0] + '</text></g>');
  });
  s.push('</svg>');
  s.push('<div class="queue"><p class="q-head"><span>Right Hand queue</span><span class="mono">Tue Nov 3 · sample</span></p><ol class="q-list">');
  Q.forEach(function (r, i) {
    var last = i === Q.length - 1;
    s.push('<li class="q-row' + (last ? " q-ask" : "") + '" style="--i:' + i + '" data-city="' + r[0] + '"><span class="q-city">' + r[0] + '</span><b class="q-task">' + r[1] + '</b><span class="q-note">' + r[2] + '</span>' +
      (last ? '<button type="button" class="btn sm q-approve">Approve</button>' : '<span class="q-st"><svg class="ck" viewBox="0 0 24 24" aria-hidden="true"><path pathLength="1" d="M6.5 12.5l3.5 3.5 7.5-8"/></svg>Prepared</span>') + '<span class="q-scan" aria-hidden="true"></span></li>');
  });
  s.push('</ol><p class="sr-only" aria-live="polite" data-hero-live></p></div></div>');
  s.push('<p class="map-cap">Northwest Arkansas. Schematic, not to scale. Sample tasks.</p>');
  host.innerHTML = s.join("");

  var rows = host.querySelectorAll(".q-row"), cities = {}, ask = host.querySelector(".q-ask"), btn = host.querySelector(".q-approve"), live = host.querySelector("[data-hero-live]");
  host.querySelectorAll(".nwa-city").forEach(function (g) { cities[g.getAttribute("data-city")] = g; });
  var timers = [];
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function finish() {
    timers.forEach(clearTimeout); timers = [];
    host.classList.add("drawn", "done");
    rows.forEach(function (r) { r.classList.add("in", "ready"); });
    Object.keys(cities).forEach(function (k) { cities[k].classList.remove("live"); });
  }
  function play() {
    host.classList.add("drawn");
    rows.forEach(function (r, i) {
      var c = cities[r.getAttribute("data-city")];
      at(950 + i * 140, function () { r.classList.add("in"); if (c) { c.classList.add("live"); setTimeout(function () { c.classList.remove("live"); }, 900); } });
      at(1750 + i * 130, function () { r.classList.add("scan"); });
      at(1930 + i * 130, function () { r.classList.add("ready"); });
    });
    at(2700, finish);
  }
  var seen = false;
  try { seen = sessionStorage.getItem("rh-hero") === "1"; } catch (e) {}
  if (off() || seen) finish();
  else {
    host.classList.add("armed");
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect(); try { sessionStorage.setItem("rh-hero", "1"); } catch (e) {}
      play();
    }, { threshold: .35 });
    io.observe(host);
  }
  document.addEventListener("rh:motion", function (e) { if (e.detail && e.detail.off) finish(); });
  btn.addEventListener("click", function () {
    finish();
    ask.classList.add("approved");
    ask.querySelector(".q-note").textContent = "Approved by you";
    btn.outerHTML = '<span class="q-st ok"><svg class="ck" viewBox="0 0 24 24" aria-hidden="true"><path pathLength="1" d="M6.5 12.5l3.5 3.5 7.5-8"/></svg>Approved</span>';
    var st = ask.querySelector(".q-st"); requestAnimationFrame(function () { st.classList.add("on"); });
    live.textContent = "";
    setTimeout(function () { live.textContent = "Approved. That is the job: we prepare, you approve."; }, 30);
  });
})();
