/* Runs before first paint (not deferred): marks JS and motion state on <html> so reveals never flash.
   The first page of a session, when it is the home page (<html data-intro>) opened without a #link, also gets
   rh-intro: motion.css holds a navy cover and motion.js plays the short intro on top of it. */
(function (d) {
  var h = d.documentElement, off = false, first = false;
  try { off = localStorage.getItem("rh-motion") === "off"; } catch (e) {}
  if (off) h.setAttribute("data-motion", "off");
  var motion = !off && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  try { first = !sessionStorage.getItem("rh-intro"); sessionStorage.setItem("rh-intro", "1"); } catch (e) {}
  var intro = motion && first && h.hasAttribute("data-intro") && !location.hash;
  h.className += " js" + (motion ? " js-motion" : "") + (intro ? " rh-intro" : "");
  // if motion.js has not taken over by 1.4 s after navigation (slow network, blocked file), drop the cover so the hero shows
  if (intro) setTimeout(function () { if (!/\bfx-intro-live\b/.test(h.className)) h.className = h.className.replace(/\s*\brh-intro\b/, ""); }, Math.max(0, 1400 - (window.performance && performance.now ? performance.now() : 0)));
})(document);
