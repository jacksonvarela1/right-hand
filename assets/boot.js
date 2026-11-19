/* Runs before first paint (not deferred): marks JS and motion state on <html> so reveals never flash.
   Nothing here hides the page: the hero is readable at first paint on every visit. */
(function (d) {
  var h = d.documentElement, off = false;
  try { off = localStorage.getItem("rh-motion") === "off"; } catch (e) {}
  if (off) h.setAttribute("data-motion", "off");
  var motion = !off && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  h.className += " js" + (motion ? " js-motion" : "");
  // The cross-fade between the three pages (site.css, @view-transition) is motion too: a visitor who paused motion gets a plain page change.
  if ("onpagereveal" in window) window.addEventListener("pagereveal", function (e) {
    if (e.viewTransition && h.getAttribute("data-motion") === "off") { try { e.viewTransition.skipTransition(); } catch (x) {} }
  });
})(document);
