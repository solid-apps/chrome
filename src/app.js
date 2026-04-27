/**
 * app.js — chrome (the desktop) main entry.
 *
 * Day-1 shell: wallpaper + status tray + (empty) shelf + clock.
 * Window manager, launcher, app registry, auth, and real-time
 * subscribe come in subsequent days. Keep this file thin — it's
 * the boot script, not the runtime.
 */

import { startClock } from "./tray.js";

// Theme — persisted in localStorage. Defaults to system preference.
function resolveTheme() {
  const saved = localStorage.getItem("chrome-theme");
  if (saved === "light" || saved === "dark") return saved;
  return matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
}
function setTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem("chrome-theme", t);
}
setTheme(resolveTheme());

// Empty-state hint in the shelf — replaced by running app indicators
// once the window manager lands on day 2.
const shelfRunning = document.getElementById("shelf-running");
shelfRunning.innerHTML = `<span class="shelf-empty">no apps running yet · ⌘Space to launch</span>`;

// Wire tray buttons to placeholders for now. Day 2-3 fills these in.
document.getElementById("tray-launcher").addEventListener("click", () => {
  alert("Launcher: coming day 3.");
});
document.getElementById("tray-quick").addEventListener("click", () => {
  // Quick-toggle theme as the simplest real action a quick-settings panel
  // would provide. The panel itself comes later.
  const cur = document.documentElement.getAttribute("data-theme");
  setTheme(cur === "dark" ? "light" : "dark");
});
document.getElementById("tray-auth").addEventListener("click", () => {
  alert("Auth: hooking up xlogin in day 4.");
});

// ⌘Space / Ctrl+Space → launcher (placeholder for now).
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.code === "Space") {
    e.preventDefault();
    document.getElementById("tray-launcher").click();
  }
});

// Live clock in the tray.
startClock(document.getElementById("tray-clock"));
