// Right Hand NWA build step 3 of 3: the first paint. tools/build-services.mjs and tools/build-pages.mjs call this file
// themselves, so the usual build is still
//   node tools/build-services.mjs && node tools/build-pages.mjs
// After editing only a stylesheet or assets/boot.js, running this file alone is enough:
//   node tools/build-head.mjs
// What it does to index.html, services/index.html and about/index.html, so a page's first paint needs only its HTML:
//   1. Writes the page's stylesheets as ONE file (assets/bundle-home.css, assets/bundle-sub.css; comments stripped,
//      rules untouched and in their order). The head only preloads it. Its stylesheet link sits in the body, right
//      after the first screen (the page's first sections, see PAGES below): a browser paints everything above that
//      link without waiting for the file, shows what is below it once the file is here, and runs the deferred scripts
//      after that, so no script ever measures a half-styled page. No script is involved, so it works with JavaScript off.
//   2. Works out the page's critical CSS: every rule of that bundle that can apply to the header and the first screen,
//      and puts it inline in the head. The bundle repeats those rules, so once it has arrived the page is styled
//      exactly as if it had loaded its stylesheets the ordinary way.
//   3. Puts assets/boot.js inline in the head and adds its sha256 to script-src in the Content-Security-Policy meta.
//      (Still no 'unsafe-inline' for scripts: only this exact text may run.) The same file also loads as the first
//      deferred script; it does nothing when the inline copy has run, and does the whole job, late, when something on the
//      way stripped or changed the inline copy.
//   4. Stamps every "assets/..." address in href and src with ?v=<first 8 hex digits of the file's sha256>, so a deploy
//      never pairs new HTML with an old stylesheet or script. assets/lab.js hands its stamp on to the files it loads
//      late, so its stamp covers them too.
// What it owns in a page: the region between <!-- head:start --> and <!-- head:end -->, the one <link id="css"> in the
// body, the script-src directive and the ?v= stamps. Never edit those by hand. Running it twice in a row changes
// nothing. No dependencies, Node 18 or newer.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { p, read, must, region, prototypes } from "./lib.mjs";

/* ---------- the pages ---------- */
// css: the page's stylesheets, in cascade order. screen: the first screen ends where this top-level <section> of <main>
// opens (counted from 1), on the tallest screen we care about (the hero ends near 990px on a wide screen, so the
// section after it shows on a 1080px or 1440px tall one). Everything before it gets its styles inline, and the
// stylesheet link goes right there. On the services page the second section is the whole catalog.
export const PAGES = {
  home: { file: "index.html", up: "", bundle: "bundle-home.css", css: ["site", "motion", "close", "field", "lab"], screen: 3 },
  services: { file: "services/index.html", up: "../", bundle: "bundle-sub.css", css: ["site", "pages", "motion"], screen: 3 },
  about: { file: "about/index.html", up: "../", bundle: "bundle-sub.css", css: ["site", "pages", "motion"], screen: 3 }
};
// Classes that scripts put on <html> (assets/boot.js, motion.js, site.js, nav.js). A rule scoped under one of them is
// judged by the rest of its selector. A class that is in no page's markup and not listed here is taken to belong to
// something a script builds, and its rules go inline (the safe side: a first screen never shows a script's work unstyled).
const ROOT_STATE = new Set(["js", "js-motion", "fx", "fx-lite", "seq", "nav-on", "bar-live"]);
// Attributes that scripts set or change: a selector that asks for one may come true at any moment.
const LIVE_ATTR = /^(aria-|data-)|^(open|hidden|disabled|checked|inert|tabindex|role|style)$/;
const FONT_PRELOAD = "fonts/plus-jakarta-sans-latin-var.woff2";   // the headline's font; the mono font is found through the inline CSS

/* ---------- content stamps ---------- */
const sha = (buf, enc) => createHash("sha256").update(buf).digest(enc);
// A text file is hashed with LF line endings (what the repository stores), so the ?v= stamps do not depend on the OS.
const TEXT = /\.(css|js|mjs|svg|html|txt|json|xml)$/i;
const bytes = (f) => (TEXT.test(f) ? Buffer.from(readFileSync(p(f), "utf8").replace(/\r\n/g, "\n")) : readFileSync(p(f)));
const short = (buf) => sha(buf, "hex").slice(0, 8);
const memo = new Map();
// assets/lab.js appends its own ?v= to demo-player.js, the prototype scripts, rail.js and demos.css.
function labGroup() {
  const names = prototypes(read("index.html"));
  return ["assets/lab.js", "assets/demo-player.js", ...names.map((n) => "assets/demos/" + n + ".js"), "assets/rail.js", "assets/demos.css"];
}
export function stamp(file) {
  if (!memo.has(file)) {
    must(existsSync(p(file)), "the file " + file + " that a page points at");
    memo.set(file, file === "assets/lab.js" ? short(Buffer.concat(labGroup().map(bytes))) : short(bytes(file)));
  }
  return memo.get(file);
}

/* ---------- a small CSS reader: rules and at-rules, nothing lost ---------- */
// Returns [{ sel, body }] for style rules and [{ at, prelude, kids | body }] for at-rules, in source order.
function cssRules(css) {
  let i = 0;
  const n = css.length;
  function skip(endAt) {
    // moves i to the next endAt character that is outside strings, comments and brackets
    let depth = 0;
    for (; i < n; i++) {
      const c = css[i];
      if (c === "/" && css[i + 1] === "*") { i = css.indexOf("*/", i + 2) + 1; if (i < 1) i = n; continue; }
      if (c === '"' || c === "'") { for (i++; i < n && css[i] !== c; i++) if (css[i] === "\\") i++; continue; }
      if (c === "(" || c === "[") depth++;
      else if (c === ")" || c === "]") depth--;
      else if (depth <= 0 && endAt.includes(c)) return c;
    }
    return "";
  }
  function block() {
    // i sits just after "{": returns the raw text up to the matching "}" and leaves i after it
    const from = i;
    let depth = 1;
    while (i < n) {
      const c = skip("{}");
      if (c === "{") depth++; else if (c === "}") depth--; else break;
      if (!depth) break;
      i++;
    }
    const raw = css.slice(from, i);
    i++;
    return raw;
  }
  function list(inner) {
    const out = [];
    while (i < n) {
      const from = i, c = skip("{};");
      const prelude = css.slice(from, i).replace(/\/\*[\s\S]*?\*\//g, "").trim();
      if (c === "}") { if (inner) { i++; return out; } i++; continue; }
      if (c === ";" || c === "") { i++; if (prelude.startsWith("@")) out.push({ at: prelude.split(/\s/)[0], prelude, flat: true }); continue; }
      i++;   // past "{"
      if (prelude.startsWith("@")) {
        const at = prelude.split(/[\s(]/)[0];
        if (/^@(media|supports|container|layer|scope|document)$/.test(at)) out.push({ at, prelude, kids: list(true) });
        else out.push({ at, prelude, body: block() });
      } else out.push({ sel: prelude, body: block() });
    }
    return out;
  }
  return list(false);
}
// one line per rule, no comments; strings are left alone
const tidy = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s*\n\s*/g, " ").replace(/\s*([{};])\s*/g, "$1").replace(/;}/g, "}").trim();
const bare = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\n\s*\n/g, "\n").trim();

/* ---------- a small HTML reader: every element with its place in the tree ---------- */
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
function elements(html) {
  const all = [], stack = [];
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
  let m;
  while ((m = re.exec(html))) {
    if (!m[2]) continue;
    const tag = m[2].toLowerCase();
    if (m[1]) { for (let k = stack.length - 1; k >= 0; k--) if (stack[k].tag === tag) { stack.length = k; break; } continue; }
    const attrs = new Map();
    for (const a of m[3].matchAll(/([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) attrs.set(a[1].toLowerCase(), a[2] ?? a[3] ?? a[4] ?? "");
    const parent = stack[stack.length - 1] || null;
    const el = { tag, id: attrs.get("id") || "", cls: new Set((attrs.get("class") || "").split(/\s+/).filter(Boolean)), attrs, parent, prev: parent ? parent.last || null : null, pos: m.index };
    if (parent) parent.last = el;
    all.push(el);
    if (tag === "script" || tag === "style") { const end = html.toLowerCase().indexOf("</" + tag, re.lastIndex); re.lastIndex = end < 0 ? html.length : end; }
    if (!VOID.has(tag) && !m[4]) stack.push(el);
  }
  return all;
}

/* ---------- selectors ---------- */
function splitTop(s, sep) {
  const out = [];
  let depth = 0, from = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"' || c === "'") { for (i++; i < s.length && s[i] !== c; i++) if (s[i] === "\\") i++; }
    else if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (!depth && c === sep) { out.push(s.slice(from, i)); from = i + 1; }
  }
  out.push(s.slice(from));
  return out.map((x) => x.trim()).filter(Boolean);
}
// "a > b.c d" -> [{ comb: "", c }, { comb: ">", c }, { comb: " ", c }]
function complex(sel) {
  const parts = [];
  let i = 0, comb = "", cur = "";
  const push = () => { if (cur) { parts.push({ comb: parts.length ? comb || " " : "", c: compound(cur) }); cur = ""; comb = ""; } };
  while (i < sel.length) {
    const c = sel[i];
    if (c === "[" || c === "(") { const close = c === "[" ? "]" : ")"; let depth = 0, j = i; for (; j < sel.length; j++) { if (sel[j] === '"' || sel[j] === "'") { const q = sel[j]; for (j++; j < sel.length && sel[j] !== q; j++) if (sel[j] === "\\") j++; } else if (sel[j] === c) depth++; else if (sel[j] === close && !--depth) break; } cur += sel.slice(i, j + 1); i = j + 1; continue; }
    if (c === ">" || c === "+" || c === "~") { push(); comb = c; i++; continue; }
    if (/\s/.test(c)) { push(); i++; continue; }
    cur += c; i++;
  }
  push();
  return parts;
}
function compound(s) {
  const c = { tag: "", id: "", classes: [], attrs: [], pseudos: [] };
  const re = /^(?:(\*|[a-zA-Z][\w-]*)|#((?:[\w-]|\\.)+)|\.((?:[\w-]|\\.)+)|\[\s*([\w-]+)\s*(?:([~|^$*]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+)))?\s*[is]?\s*\]|(::?)([\w-]+)(\((?:[^()"']|"[^"]*"|'[^']*'|\((?:[^()]|\([^()]*\))*\))*\))?)/;
  let rest = s, m;
  while (rest && (m = re.exec(rest))) {
    if (m[1]) c.tag = m[1].toLowerCase();
    else if (m[2]) c.id = m[2];
    else if (m[3]) c.classes.push(m[3]);
    else if (m[4]) c.attrs.push({ name: m[4].toLowerCase(), op: m[5] || "", val: m[6] ?? m[7] ?? m[8] ?? "" });
    else if (m[10]) c.pseudos.push({ name: m[10].toLowerCase(), arg: m[11] ? m[11].slice(1, -1) : "", el: m[9] === "::" });
    rest = rest.slice(m[0].length);
  }
  if (rest) c.odd = true;   // something this reader does not know: the rule is kept, to be safe
  return c;
}

/* ---------- which rules can apply to the first screen ---------- */
// where the first screen ends: the place in the markup where the Nth top-level section of <main> opens (or where <main> closes)
function screenEnd(html, screen, all) {
  const secs = (all || elements(html)).filter((e) => e.tag === "section" && e.parent && e.parent.tag === "main");
  return secs.length >= screen ? secs[screen - 1].pos : must(html.lastIndexOf("</main>") + 1, "</main>") - 1;
}
function matcher(html, screen, others) {
  const all = elements(html);
  const root = must(all.find((e) => e.tag === "html"), "<html>"), body = must(all.find((e) => e.tag === "body"), "<body>");
  // the first screen: the header and the first sections (everything in <body> before the stylesheet link)
  const cut = screenEnd(html, screen, all);
  const first = all.filter((e) => e === root || e === body || (e.pos > body.pos && e.pos < cut));
  const knownClass = new Set(), knownId = new Set();
  // every class and id in the markup of all three pages: what is on another page is known, and is not on this one
  [all].concat(others.map(elements)).forEach((list) => list.forEach((e) => { e.cls.forEach((c) => knownClass.add(c)); if (e.id) knownId.add(e.id); }));

  const rootOnly = (c) => !c.tag && !c.id && c.classes.length && c.classes.every((x) => ROOT_STATE.has(x));
  // made by a script: nothing in the markup can tell where it will sit
  const scripted = (c) => !c.odd && (!c.tag || c.tag === "*") && !(c.id && knownId.has(c.id)) && !c.classes.some((x) => knownClass.has(x) || ROOT_STATE.has(x)) &&
    !c.attrs.some((a) => !LIVE_ATTR.test(a.name)) && !c.pseudos.some((q) => q.name === "root") && (c.classes.length > 0 || (c.id && !knownId.has(c.id)));
  function attr(a, e) {
    if (LIVE_ATTR.test(a.name)) return true;
    if (!e.attrs.has(a.name)) return false;
    const v = e.attrs.get(a.name);
    switch (a.op) {
      case "": return true;
      case "=": return v === a.val;
      case "~=": return v.split(/\s+/).includes(a.val);
      case "|=": return v === a.val || v.startsWith(a.val + "-");
      case "^=": return !!a.val && v.startsWith(a.val);
      case "$=": return !!a.val && v.endsWith(a.val);
      case "*=": return !!a.val && v.includes(a.val);
    }
    return true;
  }
  function one(c, e) {
    if (c.odd) return true;
    // on <html> the state classes and every attribute may be there at any moment; a class from the markup never is
    if (e === root) return (!c.tag || c.tag === "*" || c.tag === "html") && !(c.id && c.id !== e.id) && c.classes.every((x) => ROOT_STATE.has(x) || !knownClass.has(x));
    if (rootOnly(c) || c.pseudos.some((q) => q.name === "root")) return false;
    if (c.tag && c.tag !== "*" && c.tag !== e.tag) return false;
    if (c.id && c.id !== e.id && knownId.has(c.id)) return false;
    for (const x of c.classes) if (!e.cls.has(x) && (knownClass.has(x) || ROOT_STATE.has(x))) return false;
    for (const a of c.attrs) if (!attr(a, e)) return false;
    for (const q of c.pseudos) if (/^(is|where|matches|-webkit-any|-moz-any)$/.test(q.name) && !splitTop(q.arg, ",").some((s) => { const ps = cutScripted(complex(s)); return !ps.length || from(ps, ps.length - 1, e); })) return false;
    return true;   // :not(), :has(), :hover, :nth-child() and the rest may all be true
  }
  function from(parts, i, e) {
    if (!one(parts[i].c, e)) return false;
    if (!i) return true;
    const comb = parts[i].comb;
    if (comb === ">") return !!e.parent && from(parts, i - 1, e.parent);
    if (comb === "+") return !!e.prev && from(parts, i - 1, e.prev);
    if (comb === "~") { for (let s = e.prev; s; s = s.prev) if (from(parts, i - 1, s)) return true; return false; }
    for (let a = e.parent; a; a = a.parent) if (from(parts, i - 1, a)) return true;
    return false;
  }
  // What a script builds, and everything inside it, cannot be placed in the tree: the selector is judged up to there.
  // What follows it can still rule the selector out: a class or id from the markup that no element of the first
  // screen carries (".st-live .st-ch": the story is further down).
  const named = (c) => !c.odd && ((c.id && knownId.has(c.id)) || c.classes.some((x) => knownClass.has(x)));
  const cutScripted = (parts) => { const k = parts.findIndex((x) => scripted(x.c)); return k < 0 ? parts : parts.slice(0, k); };
  const tailFits = (parts) => { const k = parts.findIndex((x) => scripted(x.c)); return k < 0 || parts.slice(k + 1).every((x) => !named(x.c) || first.some((e) => one(x.c, e))); };
  const seen = new Map();
  return function applies(selectorList) {
    return splitTop(selectorList, ",").some((sel) => {
      if (seen.has(sel)) return seen.get(sel);
      const whole = complex(sel), parts = cutScripted(whole);
      // nothing left, or only root state ("html.js", ".js-motion"): it stands for the scripted thing that was cut off
      const hit = tailFits(whole) && (!parts.length || first.some((e) => from(parts, parts.length - 1, e)));
      seen.set(sel, hit);
      return hit;
    });
  };
}

function criticalCss(html, cfg, rules, others) {
  const applies = matcher(html, cfg.screen, others);
  const frames = new Map(), kept = [];
  const walk = (list, out) => list.forEach((r) => {
    if (r.sel) { if (applies(r.sel)) out.push(r.sel.replace(/\s*\n\s*/g, " ") + "{" + tidy(r.body) + "}"); }
    else if (r.kids) { if (/^@media\s+print\b/.test(r.prelude)) return; const inner = []; walk(r.kids, inner); if (inner.length) out.push(r.prelude.replace(/\s+/g, " ") + "{" + inner.join("") + "}"); }
    else if (r.at === "@keyframes" || r.at === "@-webkit-keyframes") frames.set(r.prelude.split(/\s+/)[1], r.prelude + "{" + tidy(r.body) + "}");
    else if (r.flat) out.push(r.prelude + ";");
    else out.push(r.prelude + "{" + tidy(r.body) + "}");   // @font-face, @view-transition, @property: small, and needed from the first frame
  });
  walk(rules, kept);
  let css = kept.join("\n");
  // only the keyframes those rules name
  const used = [...frames].filter(([name]) => new RegExp("animation[^;{}]*[:,\\s]" + name.replace(/[-]/g, "\\-") + "(?![\\w-])").test(css)).map((x) => x[1]);
  if (used.length) css += "\n" + used.join("\n");
  return css;
}

/* ---------- the bundles ---------- */
const bundles = new Map();
function bundle(cfg) {
  if (!bundles.has(cfg.bundle)) {
    const fonts = (css) => css.replace(/url\((["']?)(fonts\/[^)"'?#]+)\1\)/g, (m, q, f) => "url(" + f + "?v=" + stamp("assets/" + f) + ")");
    const text = "/* GENERATED by tools/build-head.mjs from " + cfg.css.map((n) => "assets/" + n + ".css").join(", ") + " (in that order).\n" +
      "   Do not edit this file: edit those and run the build. The pages load this one file; their first screen's rules are also inline in each page. */\n" +
      cfg.css.map((n) => "/* " + n + ".css */\n" + fonts(bare(read("assets/" + n + ".css")))).join("\n") + "\n";
    const file = "assets/" + cfg.bundle;
    if (!existsSync(p(file)) || readFileSync(p(file), "utf8") !== text) writeFileSync(p(file), text);
    memo.delete(file);
    bundles.set(cfg.bundle, { text, rules: cssRules(text) });
  }
  return bundles.get(cfg.bundle);
}

/* ---------- one page ---------- */
// The inline copy of assets/boot.js: the same statements without the comments (the header block and whole-line //
// comments) and without indentation. The hash in the CSP is the hash of exactly this text.
export function bootScript() {
  const code = read("assets/boot.js").replace(/^\s*\/\*[\s\S]*?\*\/\s*/, "").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("//")).join("\n");
  must(!/<\/script|<!--/i.test(code), "assets/boot.js free of </script and <!-- (it is put inline)");
  must(/^\(function/.test(code) && /\}\)\(document\);$/.test(code), "assets/boot.js as one (function (d) { ... })(document); with a comment block on top");
  return { code, hash: "sha256-" + sha(code, "base64") };
}
// Returns the page with its head region, its CSP and its ?v= stamps brought up to date. Works on a page fresh from a
// template and on its own output alike. key: "home", "services" or "about". fresh: the markup of pages that are about
// to be written, { services: html, ... }; a page not named there is read from disk (the class names of all three pages
// decide what counts as a script's work, see ROOT_STATE above).
export function finish(html, key, fresh = {}) {
  const cfg = must(PAGES[key], "a page called " + key);
  const others = Object.keys(PAGES).filter((k) => k !== key).map((k) => fresh[k] ?? (existsSync(p(PAGES[k].file)) ? read(PAGES[k].file) : ""));
  const up = cfg.up, b = bundle(cfg), boot = bootScript();
  const href = (file) => up + file + "?v=" + stamp(file);
  // 1. the Content-Security-Policy: scripts from this site, plus the one inline script with exactly this text
  must(/<meta http-equiv="Content-Security-Policy" content="[^"]*script-src [^;"]*/.test(html), "script-src in the CSP meta of " + cfg.file);
  html = html.replace(/(<meta http-equiv="Content-Security-Policy" content="[^"]*script-src )[^;"]*/, "$1'self' '" + boot.hash + "'");
  // 2. the stylesheet link in the body, right where the first screen ends (taken out first, so a second run puts it back the same)
  const css = href("assets/" + cfg.bundle);
  html = html.replace(/<link rel="stylesheet" href="[^"]*" id="css">\n\n/g, "");
  const at = screenEnd(html, cfg.screen);
  html = html.slice(0, at) + '<link rel="stylesheet" href="' + css + '" id="css">\n\n' + html.slice(at);
  // 3. the head region
  const inline = criticalCss(html, cfg, b.rules, others).replace(/url\((fonts\/[^)]+)\)/g, "url(" + up + "assets/$1)");
  must(!/<\/style/i.test(inline), "critical CSS free of </style");
  html = region(html, "head", "\n" + [
    '<link rel="preload" href="' + css + '" as="style">',
    '<link rel="preload" href="' + href("assets/" + FONT_PRELOAD) + '" as="font" type="font/woff2" crossorigin>',
    "<style>\n" + inline + "\n</style>",
    "<script>" + boot.code + "</script>"
  ].join("\n") + "\n");
  // 4. every other address under assets/ gets its stamp (the two above already carry theirs)
  html = html.replace(/\b(href|src)="((?:\.\.\/)*assets\/[^"?#]+)(?:\?v=[0-9a-f]+)?(#[^"]*)?"/g, (m, attr, path, hash) => attr + '="' + path + "?v=" + stamp(path.replace(/^(\.\.\/)+/, "")) + (hash || "") + '"');
  return html;
}

// All three pages at once, each judged against the markup of the other two. fresh: pages straight from their templates
// (tools/build-pages.mjs hands over the two it has just made); the rest are read from disk. Writes only what changed.
export function finishAll(fresh = {}) {
  const src = Object.fromEntries(Object.entries(PAGES).map(([key, cfg]) => [key, fresh[key] ?? read(cfg.file)]));
  return Object.entries(PAGES).map(([key, cfg]) => {
    const after = finish(src[key], key, src);
    const changed = !existsSync(p(cfg.file)) || read(cfg.file) !== after;
    if (changed) writeFileSync(p(cfg.file), after);
    const inline = after.match(/<!-- head:start -->[\s\S]*?<style>([\s\S]*?)<\/style>/)[1];
    return cfg.file + " " + Buffer.byteLength(after) + " bytes (critical CSS " + Buffer.byteLength(inline) + ", " + cfg.bundle + " " + Buffer.byteLength(bundle(cfg).text) + ")" + (changed ? " written" : "");
  });
}

/* ---------- run directly ---------- */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log("build-head: " + finishAll().join("; ") + "; inline script " + bootScript().hash);
}
