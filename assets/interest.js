/* Right Hand NWA: interest pop-up. One small dialog, shown once per visitor, never during interaction. */
(function () {
  "use strict";
  // Sign-ups go to a Google Form owned by righthandnwa@gmail.com (responses tab plus email alerts).
  var ENDPOINT = "https://docs.google.com/forms/d/e/1FAIpQLScthXfEx8WRH-UOFJgcvtD2Zo4NrtUutI3HHeGuptyLz_Jd5w/formResponse";
  var FIELDS = { email: "entry.848100374", business: "entry.1907144585", city: "entry.736194494", interests: "entry.537803960", source: "entry.2127818100" };
  var INSTAGRAM = "https://www.instagram.com/righthandnwa/";
  var KEY = "rhnwa-interest";
  var DAYS = 30;
  var RM = matchMedia("(prefers-reduced-motion: reduce)");
  // The inline form (#signup) saves to the same list as the pop-up. It tells the page what is happening through
  // "rh:signup" events (type, armed, sent, fail) so assets/field.js can animate the envelope; it works without that file.
  function send(data) {
    var body = new URLSearchParams();
    Object.keys(FIELDS).forEach(function (k) { body.append(FIELDS[k], data[k] || ""); });
    // Google Forms does not send CORS headers, so the reply is opaque: a resolved fetch means it was delivered.
    return fetch(ENDPOINT, { method: "POST", mode: "no-cors", body: body }).then(function () { store("joined"); });
  }
  (function inline() {
    var sec = document.getElementById("signup"), f = sec && sec.querySelector("form");
    if (!f) return;
    var email = f.elements.email, st = sec.querySelector("[data-status]"), dn = sec.querySelector("[data-done]"), btn = f.querySelector("button[type=submit]"), field = sec.querySelector(".sg-field");
    function tell(type) { try { document.dispatchEvent(new CustomEvent("rh:signup", { detail: { type: type } })); } catch (e) {} }
    email.addEventListener("input", function () {
      var ok = email.value.trim() !== "" && email.checkValidity();
      sec.classList.toggle("sg-armed", ok);
      if (field) field.style.setProperty("--fill", ok ? "1" : Math.min(.9, email.value.length / 24).toFixed(3));
      email.removeAttribute("aria-invalid"); st.textContent = "";
      tell(ok ? "armed" : "type");
    });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!email.value.trim() || !email.checkValidity()) { email.setAttribute("aria-invalid", "true"); st.textContent = "Add a valid email address."; email.focus(); return; }
      if (f.elements._honey && f.elements._honey.value) return;
      btn.disabled = true; st.textContent = "Sending…";
      send({ email: email.value.trim(), business: "", city: "", interests: "(inline form)", source: location.href + " | inline form" + (document.referrer ? " | ref " + document.referrer : "") })
        .then(function () {
          st.textContent = ""; f.hidden = true; dn.hidden = false; sec.classList.add("sg-sent");
          var h = dn.querySelector("h3"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
          tell("sent");
        })
        .catch(function () {
          btn.disabled = false;
          st.innerHTML = 'That didn’t go through. <a href="mailto:righthandnwa@gmail.com?subject=Interested%20in%20Right%20Hand%20NWA">Email us instead</a>.';
          tell("fail");
        });
    });
  })();
  var dlg = document.getElementById("interest");
  if (!dlg) return;
  var form = dlg.querySelector("form"), status = dlg.querySelector("[data-status]"), done = dlg.querySelector("[data-done]");
  function store(v) { try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {} }
  function recent() { try { var o = JSON.parse(localStorage.getItem(KEY) || "null"); return o && (o.v === "joined" || Date.now() - o.t < DAYS * 864e5); } catch (e) { return false; } }
  var shown = false, idleT = 0, busyUntil = 0;
  function busy() {
    if (document.documentElement.classList.contains("presenting")) return true;
    if (document.querySelector("dialog[open]")) return true;
    var a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return true;
    return Date.now() < busyUntil;
  }
  ["pointerdown", "keydown"].forEach(function (ev) { document.addEventListener(ev, function () { busyUntil = Date.now() + 4000; }, true); });
  function open(force) {
    if (shown && !force) return;
    if (!force && (recent() || busy())) { if (!force && !recent()) setTimeout(function () { open(false); }, 5000); return; }
    shown = true;
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    var first = dlg.querySelector("input[type=email]"); if (first) setTimeout(function () { first.focus(); }, 60);
  }
  function close(remember) { if (remember) store("dismissed"); if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open"); }
  dlg.addEventListener("cancel", function () { store("dismissed"); });
  dlg.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) { close(true); return; }
    if (e.target === dlg) { var r = dlg.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(true); }
  });
  // triggers: 25 seconds in, reaching the services section, or leaving the page on desktop
  idleT = setTimeout(function () { open(false); }, 25000);
  var svc = document.getElementById("services");
  if (svc && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); setTimeout(function () { open(false); }, 1500); } }, { threshold: .25 });
    io.observe(svc);
  }
  if (matchMedia("(pointer:fine)").matches) document.addEventListener("mouseout", function (e) { if (!e.relatedTarget && e.clientY <= 0) open(false); });
  document.querySelectorAll("[data-open-interest]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); open(true); }); });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = form.elements.email;
    if (!email.value.trim() || !email.checkValidity()) { email.setAttribute("aria-invalid", "true"); status.textContent = "Add a valid email address."; email.focus(); return; }
    email.removeAttribute("aria-invalid");
    if (form.elements._honey && form.elements._honey.value) return;
    var interests = Array.prototype.slice.call(form.querySelectorAll('input[name="interest"]:checked')).map(function (i) { return i.value; });
    var data = {
      email: email.value.trim(),
      business: form.elements.business.value,
      city: form.elements.city.value,
      interests: interests.join(", ") || "(none picked)",
      source: location.href + (document.referrer ? " | ref " + document.referrer : "")
    };
    var body = new URLSearchParams();
    Object.keys(FIELDS).forEach(function (k) { body.append(FIELDS[k], data[k] || ""); });
    var btn = form.querySelector("button[type=submit]");
    btn.disabled = true; status.textContent = "Sending…";
    // Google Forms does not send CORS headers, so the reply is opaque: a resolved fetch means it was delivered.
    fetch(ENDPOINT, { method: "POST", mode: "no-cors", body: body })
      .then(function () {
        store("joined"); form.hidden = true; done.hidden = false; status.textContent = "";
        var h = done.querySelector("h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
      })
      .catch(function () {
        btn.disabled = false;
        var mbody = "Hi Right Hand NWA,%0D%0A%0D%0AI'm interested. Email: " + encodeURIComponent(data.email) + "%0D%0ABusiness: " + encodeURIComponent(data.business) + "%0D%0ACity: " + encodeURIComponent(data.city) + "%0D%0AInterested in: " + encodeURIComponent(data.interests);
        status.innerHTML = 'That didn’t go through. <a href="mailto:righthandnwa@gmail.com?subject=Interested%20in%20Right%20Hand%20NWA&body=' + mbody + '">Email us instead</a>.';
      });
  });
  window.RHInterest = { open: function () { open(true); }, instagram: INSTAGRAM };
})();
