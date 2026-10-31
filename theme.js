/*! OpenFlash theme switch | https://github.com/bobaka10/openflash
 *  Copyright (c) 2026 @bobaka10
 *  SPDX-License-Identifier: MIT. See the LICENSE file. */
/* The theme follows the device (prefers-color-scheme) until the visitor picks one with the button.
   The choice is remembered in localStorage, and everything keeps working if storage is blocked. */
(function () {
  var KEY = "openflash-theme", root = document.documentElement;
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  var saved = read();
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);   // set early, no flash
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function current() { return root.getAttribute("data-theme") || (mq && mq.matches ? "dark" : "light"); }
  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/></svg>';
  function paint(btn) {
    var dark = current() === "dark";
    btn.innerHTML = dark ? SUN : MOON;                       // shows what a click switches to
    var label = dark ? "Switch to light theme" : "Switch to dark theme";
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);
  }
  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    paint(btn);
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      write(next);
      paint(btn);
    });
    if (mq && mq.addEventListener) mq.addEventListener("change", function () { paint(btn); });
  });
})();
