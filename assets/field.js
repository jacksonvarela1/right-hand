/* Right Hand NWA: the particle field.
   One WebGL point cloud that takes the shape of whatever the page is saying.
   - Hero: the three keys (AI drafts, We check, You approve) pick the shape. It cycles on its own until a visitor presses one.
   - Story: a pinned section where the scroll position scrubs the cloud from the pile, through four kinds of admin, to the mark.
   Rules of the road:
   - Needs WebGL. Without it the hero keeps its still logo and the story stays a plain list.
   - Reduced motion or "Pause motion": one still frame, no loop. The keys still switch shapes, at once.
   - Each loop runs only while its canvas is on screen and the tab is visible.
   Shapes come from assets/field-shapes.js (window.RHShapes), sampled here into point clouds. */
(function () {
  "use strict";
  var d = document, html = d.documentElement, W = window;
  var RM = W.matchMedia("(prefers-reduced-motion: reduce)");
  function off() { return RM.matches || html.getAttribute("data-motion") === "off"; }
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return t * t * (3 - 2 * t); }

  if (!W.WebGLRenderingContext || !W.Float32Array || !Math.imul) return;

  var SMALL = W.innerWidth < 760 || (navigator.hardwareConcurrency || 8) <= 4;
  var N = SMALL ? 7000 : 14000;
  var SH = W.RHShapes || { size: 320, draw: {} };

  /* ---------- point clouds ---------- */
  // seeded, so the cloud is the same on every visit
  function rng(seed) {
    return function () {
      seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  // left-to-right order: point i sits in roughly the same place across shapes, so a morph reads as a sweep, not an explosion
  function byX(a) {
    var n = a.length / 3, order = new Array(n), o = new Float32Array(a.length), i, j;
    for (i = 0; i < n; i++) order[i] = i;
    order.sort(function (p, q) { return a[p * 3] - a[q * 3]; });
    for (i = 0; i < n; i++) { j = order[i] * 3; o[i * 3] = a[j]; o[i * 3 + 1] = a[j + 1]; o[i * 3 + 2] = a[j + 2]; }
    return o;
  }
  function ring(seed) {
    var r = rng(seed), out = new Float32Array(N * 3), k, a, q;
    for (k = 0; k < N; k++) { a = r() * 6.2832; q = .62 + (r() - .5) * .08; out[k * 3] = Math.cos(a) * q; out[k * 3 + 1] = Math.sin(a) * q; out[k * 3 + 2] = (r() - .5) * .16; }
    return byX(out);
  }
  // a drawing from RHShapes becomes N points, denser where the drawing is more opaque
  function sample(name, seed) {
    var fn = SH.draw && SH.draw[name];
    if (!fn) return ring(seed);
    var S = SH.size || 320, c = d.createElement("canvas"), x, px, idx = [], cum = [], tot = 0, i, k, t, lo, hi, mid, id, r = rng(seed), out = new Float32Array(N * 3);
    c.width = c.height = S;
    try { x = c.getContext("2d"); x.clearRect(0, 0, S, S); fn(x); px = x.getImageData(0, 0, S, S).data; } catch (e) { return ring(seed); }
    for (i = 3; i < px.length; i += 4) if (px[i] > 20) { tot += px[i]; idx.push((i - 3) >> 2); cum.push(tot); }
    if (idx.length < 50) return ring(seed);
    for (k = 0; k < N; k++) {
      t = r() * tot; lo = 0; hi = cum.length - 1;
      while (lo < hi) { mid = (lo + hi) >> 1; if (cum[mid] < t) lo = mid + 1; else hi = mid; }
      id = idx[lo];
      out[k * 3] = ((id % S + r()) / S - .5) * 2;
      out[k * 3 + 1] = (.5 - ((id / S | 0) + r()) / S) * 2;
      out[k * 3 + 2] = (r() - .5) * .16;
    }
    return byX(out);
  }
  // the pile: loose sheets of paper tumbling in space, built in 3D
  function pile(seed) {
    var r = rng(seed), out = new Float32Array(N * 3), sheets = 30, per = Math.ceil(N / sheets), k = 0, s, i;
    for (s = 0; s < sheets && k < N; s++) {
      var cx = (r() - .5) * 2.1, cy = (r() - .5) * 1.5, cz = (r() - .5) * 1.1, w = .2 + r() * .1, h = w * 1.3,
        a = (r() - .5) * 2.2, b = (r() - .5) * 1.6, g = (r() - .5) * 1.2,
        ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cg = Math.cos(g), sg = Math.sin(g);
      for (i = 0; i < per && k < N; i++, k++) {
        var u, v, side, t, line;
        if (r() < .62) { side = r() * 4 | 0; t = r() * 2 - 1; u = side < 2 ? t : side === 2 ? -1 : 1; v = side === 0 ? -1 : side === 1 ? 1 : t; }
        else { line = r() * 5 | 0; v = -.6 + line * .3; u = -.7 + r() * (line === 4 ? .7 : 1.4); }
        var x = u * w * .5, y = v * h * .5, x1 = x * cg - y * sg, y1 = x * sg + y * cg, y2 = y1 * cb, z2 = y1 * sb;
        out[k * 3] = cx + x1 * ca + z2 * sa; out[k * 3 + 1] = cy + y2; out[k * 3 + 2] = cz + z2 * ca - x1 * sa;
      }
    }
    return byX(out);
  }
  var cache = {};
  function shape(name) {
    if (!cache[name]) cache[name] = name === "pile" ? pile(11) : sample(name, 7 + name.length * 13 + name.charCodeAt(0));
    return cache[name];
  }
  // per-point randoms: x staggers the morph left to right, z picks the few hot points, y and w vary drift and size
  var seeds = (function () {
    var r = rng(3), s = new Float32Array(N * 4), i;
    for (i = 0; i < N; i++) { s[i * 4] = .72 * (i / N) + .28 * r(); s[i * 4 + 1] = r(); s[i * 4 + 2] = r(); s[i * 4 + 3] = r(); }
    return s;
  })();

  /* ---------- the renderer ---------- */
  var VS = [
    "attribute vec3 aFrom;attribute vec3 aTo;attribute vec4 aSeed;",
    "uniform float uMix;uniform float uTime;uniform float uSize;uniform float uScale;uniform float uHot;uniform float uBurst;",
    "uniform vec2 uFit;uniform vec2 uOffset;uniform vec2 uRot;uniform vec2 uPtr;",
    "varying float vHot;varying float vA;varying float vTint;",
    "void main(){",
    " float m=clamp(uMix*1.6-aSeed.x*.6,0.,1.);m=m*m*(3.-2.*m);",
    " vec3 p=mix(aFrom,aTo,m);",
    " float fly=sin(m*3.14159265);",
    " vec3 n=vec3(sin(aSeed.y*61.+uTime*.9+p.y*4.),cos(aSeed.z*53.+uTime*.8+p.x*4.),sin(aSeed.w*47.+uTime*.7+p.x*2.));",
    " p+=n*(.009+fly*(.07+.2*aSeed.y));",
    " p.z+=fly*(aSeed.w-.5)*.8;",
    " vec2 dp=p.xy-uPtr;p.xy+=dp*(.03/(dot(dp,dp)+.03));",
    " p*=1.+uBurst*(.2+aSeed.y*.7);",
    " float cy=cos(uRot.x),sy=sin(uRot.x),cx=cos(uRot.y),sx=sin(uRot.y);",
    " p=vec3(p.x*cy+p.z*sy,p.y,p.z*cy-p.x*sy);",
    " p=vec3(p.x,p.y*cx-p.z*sx,p.z*cx+p.y*sx);",
    " float k=1./(1.-p.z*.3);",
    " gl_Position=vec4(p.xy*k*uScale*uFit+uOffset,0.,1.);",
    " float big=step(.955,aSeed.w);",
    " gl_PointSize=uSize*(.5+aSeed.w*.95+big*3.4)*k*(1.+fly*.4);",
    " vHot=step(1.-uHot,aSeed.z);vTint=aSeed.y;",
    " vA=(.45+.55*smoothstep(-.5,.5,p.z))*(1.-fly*.3)*(1.-big*.8);",
    "}"].join("\n");
  var FS = [
    "precision mediump float;",
    "varying float vHot;varying float vA;varying float vTint;",
    "void main(){",
    " vec2 c=gl_PointCoord-.5;float a=smoothstep(.25,.015,dot(c,c))*vA;",
    " vec3 col=mix(vec3(.184,.502,.929),vec3(.584,.753,.996),vTint);",
    " col=mix(col,vec3(1.,.294,.2),vHot);",
    " gl_FragColor=vec4(col*a*(.84+vHot*.16),a);",
    "}"].join("\n");

  function makeField(cv) {
    var gl = null;
    try { gl = cv.getContext("webgl", { alpha: true, antialias: false, depth: false, stencil: false }) || cv.getContext("experimental-webgl"); } catch (e) {}
    if (!gl) return null;
    var prog, loc = {}, data = [new Float32Array(N * 3)], bufs = [], pa = -1, pb = -1, cw = 0, ch = 0, cd = 0, lost = false, tmp = new Float32Array(N * 3), api = {};
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    function buf(arr, dyn) { var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, arr, dyn ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW); return b; }
    function setup() {
      var v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, FS);
      if (!v || !f) return false;
      prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
      gl.useProgram(prog);
      ["aFrom", "aTo", "aSeed"].forEach(function (n) { loc[n] = gl.getAttribLocation(prog, n); gl.enableVertexAttribArray(loc[n]); });
      ["uMix", "uTime", "uSize", "uScale", "uHot", "uBurst", "uFit", "uOffset", "uRot", "uPtr"].forEach(function (n) { loc[n] = gl.getUniformLocation(prog, n); });
      gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.clearColor(0, 0, 0, 0);
      buf(seeds); gl.vertexAttribPointer(loc.aSeed, 4, gl.FLOAT, false, 0, 0);
      bufs = data.map(function (a, i) { return buf(a, i === 0); });
      var a = pa, b = pb; pa = pb = -1; cw = ch = 0;
      if (a >= 0) api.pair(a, b);
      return true;
    }
    if (!setup()) return null;
    cv.addEventListener("webglcontextlost", function (e) { e.preventDefault(); lost = true; });
    cv.addEventListener("webglcontextrestored", function () { lost = !setup(); if (api.onrestore) api.onrestore(); });

    api.add = function (arr) { data.push(arr); bufs.push(buf(arr)); return data.length - 1; };
    api.pair = function (a, b) {
      if (a !== pa) { gl.bindBuffer(gl.ARRAY_BUFFER, bufs[a]); gl.vertexAttribPointer(loc.aFrom, 3, gl.FLOAT, false, 0, 0); pa = a; }
      if (b !== pb) { gl.bindBuffer(gl.ARRAY_BUFFER, bufs[b]); gl.vertexAttribPointer(loc.aTo, 3, gl.FLOAT, false, 0, 0); pb = b; }
    };
    // freeze the cloud where it is right now into slot 0, so a new morph can start from mid-flight without a jump
    api.snap = function (mix) {
      var A = data[pa], B = data[pb], i, j, m;
      for (i = 0; i < N; i++) {
        m = clamp(mix * 1.6 - seeds[i * 4] * .6, 0, 1); m = m * m * (3 - 2 * m); j = i * 3;
        tmp[j] = A[j] + (B[j] - A[j]) * m; tmp[j + 1] = A[j + 1] + (B[j + 1] - A[j + 1]) * m; tmp[j + 2] = A[j + 2] + (B[j + 2] - A[j + 2]) * m;
      }
      data[0].set(tmp);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufs[0]); gl.bufferSubData(gl.ARRAY_BUFFER, 0, data[0]);
      return 0;
    };
    api.box = function () { return { w: cw, h: ch, s: Math.min(cw, ch) }; };
    api.draw = function (u) {
      if (lost) return;
      var w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(W.devicePixelRatio || 1, 2), s;
      if (!w || !h) return;
      if (w !== cw || h !== ch || dpr !== cd) { cw = w; ch = h; cd = dpr; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); gl.viewport(0, 0, cv.width, cv.height); }
      s = Math.min(w, h) * (u.scale || 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(loc.uMix, u.mix); gl.uniform1f(loc.uTime, u.time); gl.uniform1f(loc.uScale, u.scale || 1);
      gl.uniform1f(loc.uSize, clamp(s / 270, 1.4, 2.9) * dpr);
      gl.uniform1f(loc.uHot, u.hot); gl.uniform1f(loc.uBurst, u.burst || 0);
      gl.uniform2f(loc.uFit, Math.min(w, h) / w, Math.min(w, h) / h);
      gl.uniform2f(loc.uOffset, u.offX || 0, u.offY || 0);
      gl.uniform2f(loc.uRot, u.rotX, u.rotY);
      gl.uniform2f(loc.uPtr, u.ptrX, u.ptrY);
      gl.drawArrays(gl.POINTS, 0, N);
    };
    return api;
  }

  // run fn every frame while el is on screen and the tab is visible; fn returns false to stop until the next wake
  function loop(el, fn) {
    var raf = 0, vis = false;
    function tick(now) { raf = 0; if (!vis || d.hidden) return; if (fn(now) !== false) raf = requestAnimationFrame(tick); }
    function wake() { if (!raf && vis && !d.hidden) raf = requestAnimationFrame(tick); }
    if ("IntersectionObserver" in W) new IntersectionObserver(function (es) { vis = es[es.length - 1].isIntersecting; wake(); }, { rootMargin: "80px" }).observe(el);
    else vis = true;
    d.addEventListener("visibilitychange", wake);
    W.addEventListener("resize", wake);
    d.addEventListener("rh:motion", wake);
    wake();
    return wake;
  }

  /* ---------- hero: three keys, one cloud ---------- */
  function hero() {
    var sec = $(".hero"), host = $("#fld"), cv = host && $("canvas", host), trio = sec && $(".trio", sec), cap = $("#fld-cap");
    if (!sec || !cv) return;
    var f = makeField(cv);
    if (!f) return;
    host.classList.add("is-live");
    var order = ["doc", "lens", "mark"], slot = { pile: f.add(shape("pile")) }, keys = [];
    order.forEach(function (n) { slot[n] = f.add(shape(n)); });
    var at = -1, to = slot.pile, mix = 1, anim = null, next = 0, held = 0, hot = .05, burst = 0, rx = 0, ry = 0, tx = 0, ty = 0, px = 9, py = 9, t0 = performance.now(), wake;
    f.pair(slot.pile, slot.pile);

    function go(i, dur) {
      var now = performance.now(), from = anim && mix < 1 ? f.snap(mix) : to;
      at = i; to = slot[order[i]];
      f.pair(from, to);
      if (off()) { mix = 1; anim = null; } else { mix = 0; anim = { t: now, d: dur || 1500 }; }
      keys.forEach(function (k, j) { k.setAttribute("aria-pressed", String(j === i)); });
      if (wake) wake();
    }
    function frame(now) {
      var still = off();
      if (anim) {
        mix = clamp((now - anim.t) / anim.d, 0, 1);
        if (mix >= 1) { anim = null; next = now + 3200; if (order[at] === "mark") { burst = .16; hot = .5; } }
      }
      if (still) { mix = 1; anim = null; }
      else if (!anim && at >= 0 && now > next && now > held) go((at + 1) % order.length);
      burst *= .9; hot += (.05 - hot) * .025;
      rx += (tx - rx) * .06; ry += (ty - ry) * .06;
      f.draw({ mix: mix, time: still ? 0 : (now - t0) / 1000, rotX: rx + (still ? 0 : Math.sin(now / 2700) * .2), rotY: ry + (still ? 0 : Math.sin(now / 3900) * .07), ptrX: px, ptrY: py, scale: .86, hot: still ? .05 : hot, burst: still ? 0 : burst });
      return !still;
    }

    // the three chips become real keys that pick the shape
    if (trio) {
      trio.classList.add("keys");
      $$("li", trio).forEach(function (li, i) {
        var b = d.createElement("button"), c = d.createElement("span");
        b.type = "button"; b.className = "key"; b.setAttribute("aria-pressed", "false"); b.setAttribute("data-k", order[i] || "");
        c.className = "cap";
        while (li.firstChild) c.appendChild(li.firstChild);
        b.appendChild(c); li.appendChild(b); keys.push(b);
        b.addEventListener("click", function () { held = performance.now() + 9000; go(i, 1100); });
      });
    }
    if (cap) cap.textContent = N.toLocaleString("en-US") + " points, drawn live " + (SMALL ? "on your screen. Tap a key." : "in your browser. Press a key.");

    if (W.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      sec.addEventListener("pointermove", function (e) {
        var r = cv.getBoundingClientRect(), b = f.box();
        if (!r.width || !b.s) return;
        var nx = ((e.clientX - r.left) / r.width - .5) * 2, ny = ((e.clientY - r.top) / r.height - .5) * 2;
        tx = clamp(nx, -1.2, 1.2) * .4; ty = clamp(ny, -1.2, 1.2) * .26;
        px = nx / (.86 * b.s / b.w); py = -ny / (.86 * b.s / b.h);
      });
      sec.addEventListener("pointerleave", function () { tx = ty = 0; px = py = 9; });
    }

    wake = loop(host, frame);
    f.onrestore = wake;
    // the first shape gathers as the page (or the first-visit intro) hands over
    function start() { if (at < 0) go(off() ? 2 : 0, 2100); }
    if (html.classList.contains("fx-intro-live") || html.classList.contains("rh-intro")) {
      var t = setTimeout(start, 4500);
      d.addEventListener("rh:intro-done", function () { clearTimeout(t); start(); });
    } else start();
    d.addEventListener("rh:motion", function () { if (at >= 0 && off()) { mix = 1; anim = null; } });
  }

  /* ---------- story: scroll scrubs the cloud through the chapters ---------- */
  function story() {
    var sec = $("#story");
    if (!sec || off()) return; // reduced or paused motion at load: the plain list stays
    var cv = $(".st-cv", sec), items = $$(".st-ch", sec), bar = $(".st-prog", sec), n = items.length;
    if (!cv || n < 2) return;
    sec.classList.add("st-live");
    var f = makeField(cv);
    if (!f) { sec.classList.remove("st-live"); return; }
    sec.style.setProperty("--st-n", n - 1);
    var slots = items.map(function (li) { return f.add(shape(li.getAttribute("data-shape") || "mark")); }), act = -1, rx = 0, tx = 0, wake;

    function frame(now) {
      var r = sec.getBoundingClientRect(), total = r.height - W.innerHeight, p = total > 0 ? clamp(-r.top / total, 0, 1) * (n - 1) : 0, still = off();
      var a = clamp(Math.round(p), 0, n - 1), i = Math.min(p | 0, n - 2), m = clamp((p - i - .2) / .6, 0, 1), wide = W.innerWidth > 860, end = ease(clamp(p - (n - 2), 0, 1));
      if (a !== act) { act = a; items.forEach(function (li, j) { li.classList.toggle("on", j === a); li.classList.toggle("was", j < a); }); }
      if (bar) bar.style.setProperty("--p", (p / (n - 1)).toFixed(4));
      if (still) m = m < .5 ? 0 : 1;
      rx += (tx - rx) * .06;
      f.pair(slots[i], slots[i + 1]);
      f.draw({
        mix: m, time: still ? 0 : now / 1000,
        rotX: rx + (p / (n - 1) - .5) * .9 + (still ? 0 : Math.sin(now / 3100) * .1), rotY: Math.sin(p * 1.7) * .12,
        ptrX: 9, ptrY: 9, scale: wide ? .74 : .7, offX: wide ? .38 : 0, offY: wide ? -.02 : .3, hot: .04 + end * .3, burst: 0
      });
      return !still;
    }
    if (W.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      sec.addEventListener("pointermove", function (e) { tx = (e.clientX / W.innerWidth - .5) * .5; });
      sec.addEventListener("pointerleave", function () { tx = 0; });
    }
    wake = loop(sec, frame);
    f.onrestore = wake;
    W.addEventListener("scroll", wake, { passive: true }); // paused motion still follows the scroll, one still frame at a time
  }

  function init() { hero(); story(); }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", init); else init();
})();
