/* Runs before first paint (not deferred): marks JS and motion state on <html> so reveals never flash. */
(function (d) {
  var h = d.documentElement, off = false;
  try { off = localStorage.getItem("rh-motion") === "off"; } catch (e) {}
  if (off) h.setAttribute("data-motion", "off");
  h.className += " js" + (!off && !matchMedia("(prefers-reduced-motion: reduce)").matches ? " js-motion" : "");
})(document);
