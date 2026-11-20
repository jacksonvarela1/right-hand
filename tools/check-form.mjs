// Right Hand NWA: checks that the Google Form both site forms post to will really take their answers.
//   node tools/check-form.mjs
// Both forms post blind (Google sends no CORS headers), so a closed form, a renamed question or a new "required" rule
// would make every request vanish while the page still says "sent". Run this before each deploy and after anyone edits
// the form. It reads the form's public page only; it sends nothing. Exit code 0 = OK, 1 = something will break.
import { readFileSync } from "node:fs";
import { p } from "./lib.mjs";

const src = readFileSync(p("assets/config.js"), "utf8");
const cfg = new Function("window", src + "; return window.RH_CONFIG;")({});
const forms = [["check-up", cfg.checkup], ["sign-up", cfg.signup]].filter(([, c]) => c && c.endpoint);
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? "OK    " : "BROKEN") + "  " + msg); };

for (const [name, c] of forms) {
  const url = c.endpoint.replace(/formResponse$/, "viewform");
  let html = "";
  try { const r = await fetch(url, { redirect: "follow" }); html = await r.text(); say(r.ok, `${name}: form page answers (${r.status})`); }
  catch (e) { say(false, `${name}: form page did not load (${e.message})`); continue; }
  if (/closedform|no longer accepting responses/i.test(html)) { say(false, `${name}: the form is not accepting responses`); continue; }
  const m = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);\s*<\/script>/);
  if (!m) { say(false, `${name}: could not read the form's questions (signed-in only form?)`); continue; }
  const data = JSON.parse(m[1]);
  // each question: [id, title, help, type, [[entryId, options, required, ...validation]]]
  const questions = new Map();
  for (const q of data[1][1] || []) {
    for (const a of q[4] || []) questions.set("entry." + a[0], { title: q[1], required: a[2] === 1, validation: Array.isArray(a[4]) && a[4].length > 0 });
  }
  for (const [key, entry] of Object.entries(c.fields)) {
    const q = questions.get(entry);
    if (!q) { say(false, `${name}: ${key} -> ${entry} is not a question on the form`); continue; }
    say(!q.required && !q.validation, `${name}: ${key} -> ${entry} ("${q.title}")${q.required ? " is REQUIRED" : ""}${q.validation ? " has VALIDATION" : ""}`);
  }
  const extraRequired = [...questions].filter(([e, q]) => q.required && !Object.values(c.fields).includes(e));
  for (const [e, q] of extraRequired) say(false, `${name}: the form has a required question the site never fills: "${q.title}" (${e})`);
}
console.log(bad ? `\n${bad} problem(s): requests from the site would be lost. Fix the form or assets/config.js before deploying.` : "\nThe forms will take the site's answers.");
process.exit(bad ? 1 : 0);
