/* Runs before first paint. tools/build-head.mjs puts this file inline in the head of every page, and the page's
   Content-Security-Policy names its sha256: after any edit here, run the build, or browsers refuse the old copy.
   It marks JS and motion state on <html> so reveals never flash. Nothing here hides the page: the first screen is
   styled by the CSS inline in the head and is readable at first paint on every visit.
   It also watches over parts that only work with their own script (see the last lines).
   The same file also loads as the first deferred script. When the inline copy has run, that second run stops at its
   first line; when something on the way removed or changed the inline copy, the second run does the whole job, late. */
(function (d) {
  var h = d.documentElement, off = false;
  if (/(^| )js( |$)/.test(h.className)) return;
  try { off = localStorage.getItem("rh-motion") === "off"; } catch (e) {}
  if (off) h.setAttribute("data-motion", "off");
  var motion = !off && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  h.className += " js" + (motion ? " js-motion" : "");
  // The cross-fade between the three pages (site.css, @view-transition) is motion too: a visitor who paused motion gets a plain page change.
  if ("onpagereveal" in window) window.addEventListener("pagereveal", function (e) {
    if (e.viewTransition && h.getAttribute("data-motion") === "off") { try { e.viewTransition.skipTransition(); } catch (x) {} }
  });
  // A part of the page that only works with its own script names the class that script puts on <html>
  // (data-needs="qz-on"). If the page has loaded and the class is not there, the script never arrived or never got
  // going: the part gets class "no-js" and its stylesheet shows its plain form again, instead of controls that do nothing.
  window.addEventListener("load", function () {
    var parts = d.querySelectorAll("[data-needs]"), i;
    for (i = 0; i < parts.length; i++) if ((" " + h.className + " ").indexOf(" " + parts[i].getAttribute("data-needs") + " ") < 0) parts[i].className += " no-js";
  });
})(document);
