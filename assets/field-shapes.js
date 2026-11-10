/* Right Hand NWA: drawings the particle field (assets/field.js) samples into point clouds. */
(function () {
  "use strict";
  // every function paints on a cleared 320x320 2D context, in white only. Alpha is density.

  var PI = Math.PI;

  function ink(a) { return "rgba(255,255,255," + a + ")"; }

  // start a drawing: known state, round caps and joins, solid white
  function open(ctx) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = ink(1);
    ctx.fillStyle = ink(1);
    ctx.shadowBlur = 0;
    ctx.shadowColor = "rgba(0,0,0,0)";
    if (ctx.setLineDash) ctx.setLineDash([]);
  }

  // switch between painting and rubbing out (a clear gap keeps a detail readable as dots)
  function rub(ctx, on) {
    ctx.globalCompositeOperation = on ? "destination-out" : "source-over";
    if (on) { ctx.strokeStyle = ink(1); ctx.fillStyle = ink(1); }
  }

  // rounded rectangle path (ctx.roundRect is missing in older Safari)
  function rrect(ctx, x, y, w, h, r) {
    var m = Math.min(w, h) / 2;
    if (r > m) r = m;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function seg(ctx, x1, y1, x2, y2, w) {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function disc(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, PI * 2);
    ctx.fill();
  }

  // open polyline path from a flat list of x, y pairs
  function poly(ctx, p) {
    var i;
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    for (i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
  }

  // four-point spark path
  function spark(ctx, cx, cy, R) {
    var k = R * 0.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - R);
    ctx.quadraticCurveTo(cx + k, cy - k, cx + R, cy);
    ctx.quadraticCurveTo(cx + k, cy + k, cx, cy + R);
    ctx.quadraticCurveTo(cx - k, cy + k, cx - R, cy);
    ctx.quadraticCurveTo(cx - k, cy - k, cx, cy - R);
    ctx.closePath();
  }

  /* The logo, traced from the header mark in index.html (viewBox 4 5 56 54):
     corner bracket (filled), rounded box (stroked), check (stroked, round caps). */
  function mark(ctx) {
    var s = 264 / 56;
    open(ctx);
    ctx.translate(160 - 32 * s, 160 - 32 * s);
    ctx.scale(s, s);
    // bracket: M23 5h30a7 7 0 0 1 7 7v31a6 6 0 0 1-6 6V13a2 2 0 0 0-2-2H22V6a1 1 0 0 1 1-1Z
    ctx.beginPath();
    ctx.moveTo(23, 5);
    ctx.lineTo(53, 5);
    ctx.arcTo(60, 5, 60, 12, 7);
    ctx.lineTo(60, 43);
    ctx.arcTo(60, 49, 54, 49, 6);
    ctx.lineTo(54, 13);
    ctx.arcTo(54, 11, 52, 11, 2);
    ctx.lineTo(22, 11);
    ctx.lineTo(22, 6);
    ctx.arcTo(22, 5, 23, 5, 1);
    ctx.closePath();
    ctx.fill();
    // box
    ctx.lineWidth = 5;
    rrect(ctx, 6.5, 17.5, 39, 39, 4.5);
    ctx.stroke();
    // check
    ctx.lineWidth = 5.6;
    poly(ctx, [17.5, 39.5, 23.25, 44.5, 37, 32]);
    ctx.stroke();
    ctx.restore();
  }

  /* AI drafts: a sheet with a folded corner, text lines, the last one still being written, a spark at the pen point. */
  function doc(ctx) {
    var L = 62, T = 36, R = 258, B = 284, f = 56, r = 16;
    open(ctx);
    ctx.beginPath();
    ctx.moveTo(L + r, T);
    ctx.lineTo(R - f, T);
    ctx.lineTo(R, T + f);
    ctx.lineTo(R, B - r);
    ctx.arcTo(R, B, R - r, B, r);
    ctx.lineTo(L + r, B);
    ctx.arcTo(L, B, L, B - r, r);
    ctx.lineTo(L, T + r);
    ctx.arcTo(L, T, L + r, T, r);
    ctx.closePath();
    ctx.lineWidth = 15;
    ctx.stroke();
    // folded corner
    poly(ctx, [R - f, T, R - f, T + f, R, T + f]);
    ctx.closePath();
    ctx.fillStyle = ink(0.45);
    ctx.fill();
    ctx.lineWidth = 12;
    ctx.stroke();
    // text lines, the last one unfinished
    seg(ctx, 98, 86, 152, 86, 16);
    seg(ctx, 98, 124, 222, 124, 16);
    seg(ctx, 98, 162, 222, 162, 16);
    seg(ctx, 98, 200, 170, 200, 16);
    seg(ctx, 98, 242, 132, 242, 16);
    // spark at the writing point, with a clear ring around it, and a small one beside it
    rub(ctx, true);
    spark(ctx, 194, 240, 44);
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.fill();
    rub(ctx, false);
    ctx.fillStyle = ink(1);
    spark(ctx, 194, 240, 44);
    ctx.fill();
    spark(ctx, 232, 196, 16);
    ctx.fill();
    ctx.restore();
  }

  /* We check: a magnifying glass with a check in the lens, held over a few line items. */
  function lens(ctx) {
    var cx = 184, cy = 160, r = 82;
    open(ctx);
    // line items: a bullet and a line each
    rrect(ctx, 29, 33, 22, 22, 5); ctx.fill();
    seg(ctx, 70, 44, 283, 44, 15);
    rrect(ctx, 29, 81, 22, 22, 5); ctx.fill();
    seg(ctx, 70, 92, 283, 92, 15);
    rrect(ctx, 29, 129, 22, 22, 5); ctx.fill();
    seg(ctx, 70, 140, 150, 140, 15);
    // clear the page under the glass and the handle
    rub(ctx, true);
    disc(ctx, cx, cy, r + 20);
    seg(ctx, cx - 64, cy + 64, cx - 114, cy + 114, 50);
    rub(ctx, false);
    // glass, tinted, with a clear gap around the check
    ctx.fillStyle = ink(0.2);
    disc(ctx, cx, cy, r);
    rub(ctx, true);
    ctx.lineWidth = 42;
    poly(ctx, [cx - 38, cy + 2, cx - 12, cy + 28, cx + 40, cy - 28]);
    ctx.stroke();
    rub(ctx, false);
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, PI * 2);
    ctx.stroke();
    // handle
    seg(ctx, cx - 66, cy + 66, cx - 114, cy + 114, 32);
    // check
    ctx.lineWidth = 18;
    poly(ctx, [cx - 38, cy + 2, cx - 12, cy + 28, cx + 40, cy - 28]);
    ctx.stroke();
    ctx.restore();
  }

  /* A missed call answered by text: a phone, ringing arcs off its top corner, a text bubble with three dots. */
  function phone(ctx) {
    var i, bx = 122, by = 168, bw = 162, bh = 88, br = 26;
    open(ctx);
    // handset
    rrect(ctx, 41, 35, 118, 250, 26);
    ctx.fillStyle = ink(0.26);
    ctx.fill();
    ctx.lineWidth = 14;
    ctx.stroke();
    seg(ctx, 82, 64, 118, 64, 10);
    seg(ctx, 84, 260, 112, 260, 10);
    // ringing arcs
    ctx.lineWidth = 12;
    for (i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(154, 122, 46 + i * 32, -48 * PI / 180, 8 * PI / 180);
      ctx.stroke();
    }
    // text bubble with a tail
    function bubble() {
      ctx.beginPath();
      ctx.moveTo(bx + br, by);
      ctx.lineTo(bx + bw - br, by);
      ctx.arcTo(bx + bw, by, bx + bw, by + br, br);
      ctx.lineTo(bx + bw, by + bh - br);
      ctx.arcTo(bx + bw, by + bh, bx + bw - br, by + bh, br);
      ctx.lineTo(bx + 58, by + bh);
      ctx.lineTo(bx + 12, by + bh + 28);
      ctx.lineTo(bx + 28, by + bh);
      ctx.lineTo(bx + br, by + bh);
      ctx.arcTo(bx, by + bh, bx, by + bh - br, br);
      ctx.lineTo(bx, by + br);
      ctx.arcTo(bx, by, bx + br, by, br);
      ctx.closePath();
    }
    rub(ctx, true);
    bubble();
    ctx.lineWidth = 30;
    ctx.stroke();
    ctx.fill();
    rub(ctx, false);
    bubble();
    ctx.lineWidth = 13;
    ctx.stroke();
    disc(ctx, 164, 212, 12);
    disc(ctx, 203, 212, 12);
    disc(ctx, 242, 212, 12);
    ctx.restore();
  }

  /* Receipt: zigzag bottom edge, item lines with amounts, a heavier total, a round matched badge with a check. */
  function receipt(ctx) {
    var L = 46, R = 222, T = 36, B = 284, n = 6, w = (R - L) / n, i;
    open(ctx);
    ctx.beginPath();
    ctx.moveTo(L, B);
    ctx.lineTo(L, T + 10);
    ctx.arcTo(L, T, L + 10, T, 10);
    ctx.lineTo(R - 10, T);
    ctx.arcTo(R, T, R, T + 10, 10);
    ctx.lineTo(R, B);
    for (i = 0; i < n; i++) {
      ctx.lineTo(R - w * (i + 0.5), B - 22);
      ctx.lineTo(R - w * (i + 1), B);
    }
    ctx.closePath();
    ctx.lineWidth = 15;
    ctx.stroke();
    // item lines and amounts
    seg(ctx, 79, 78, 146, 78, 14);
    seg(ctx, 172, 78, 192, 78, 14);
    seg(ctx, 79, 116, 130, 116, 14);
    seg(ctx, 172, 116, 192, 116, 14);
    seg(ctx, 79, 154, 150, 154, 14);
    seg(ctx, 172, 154, 192, 154, 14);
    // total, heavier
    seg(ctx, 82, 204, 150, 204, 21);
    seg(ctx, 79, 241, 120, 241, 14);
    // matched badge
    rub(ctx, true);
    disc(ctx, 232, 206, 59);
    rub(ctx, false);
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(232, 206, 44, 0, PI * 2);
    ctx.stroke();
    ctx.lineWidth = 14;
    poly(ctx, [213, 207, 226, 220, 252, 192]);
    ctx.stroke();
    ctx.restore();
  }

  /* Calendar: a page on two binder rings, a header rule, a grid of day dots, one day held. */
  function calendar(ctx) {
    var cols = [74, 117, 160, 203, 246], rows = [154, 200, 246], i, j;
    open(ctx);
    // header band
    ctx.save();
    rrect(ctx, 40, 54, 240, 232, 22);
    ctx.clip();
    ctx.fillStyle = ink(0.4);
    ctx.fillRect(40, 54, 240, 58);
    ctx.restore();
    ctx.lineWidth = 12;
    rrect(ctx, 40, 54, 240, 232, 22);
    ctx.stroke();
    seg(ctx, 40, 112, 280, 112, 10);
    // binder rings
    rub(ctx, true);
    seg(ctx, 104, 38, 104, 78, 30);
    seg(ctx, 216, 38, 216, 78, 30);
    rub(ctx, false);
    seg(ctx, 104, 36, 104, 78, 14);
    seg(ctx, 216, 36, 216, 78, 14);
    // day dots, one day held
    for (j = 0; j < rows.length; j++) {
      for (i = 0; i < cols.length; i++) {
        if (i === 3 && j === 1) continue;
        disc(ctx, cols[i], rows[j], 11);
      }
    }
    rrect(ctx, 203 - 23, 200 - 23, 46, 46, 10);
    ctx.fill();
    ctx.restore();
  }

  /* The Monday report: chart axes, four rising bars, a rising trend line that ends in a dot. */
  function bars(ctx) {
    var xs = [66, 122, 178, 234], tops = [216, 186, 152, 116], i;
    open(ctx);
    // bars
    for (i = 0; i < 4; i++) {
      rrect(ctx, xs[i], tops[i], 42, 274 - tops[i] + 8, 7);
      ctx.fillStyle = ink(0.45);
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.stroke();
    }
    // axes
    ctx.lineWidth = 12;
    poly(ctx, [41, 35, 41, 280, 285, 280]);
    ctx.stroke();
    // trend line and its end dot
    ctx.lineWidth = 12;
    poly(ctx, [64, 178, 124, 142, 174, 120, 256, 56]);
    ctx.stroke();
    rub(ctx, true);
    disc(ctx, 256, 56, 26);
    rub(ctx, false);
    disc(ctx, 256, 56, 18);
    ctx.restore();
  }

  window.RHShapes = {
    size: 320,
    draw: { mark: mark, doc: doc, lens: lens, phone: phone, receipt: receipt, calendar: calendar, bars: bars }
  };
})();
