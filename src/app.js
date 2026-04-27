/**
 * app.js — chrome (the desktop) main entry.
 *
 * Day-2 ships the window manager. The launcher button (and ⌘Space)
 * spawns demo windows so the WM is exercise-able. Real launcher,
 * registry-installed apps, auth, and real-time come in coming days.
 */

import { startClock } from "./tray.js";
import {
  openWindow, listWindows, onWindowsChange,
  focusWindow, minimizeWindow, restoreWindow,
} from "./windows.js";
import { openLauncher, closeLauncher, isOpen as launcherIsOpen } from "./launcher.js";
import { onAuth, login, logout } from "./auth.js";

// ---- Theme (system pref → localStorage). ----
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

// ---- Shelf (running-app pills) ----
const shelfRunning = document.getElementById("shelf-running");
function drawShelf() {
  const wins = listWindows();
  if (!wins.length) {
    shelfRunning.innerHTML = `<span class="shelf-empty">no apps running yet · ⌘Space to launch</span>`;
    return;
  }
  shelfRunning.innerHTML = wins.map(w => `
    <button class="shelf-app ${w.active ? "active" : ""} ${w.minimized ? "minimized" : ""}" data-wid="${w.id}" title="${escape(w.title)}">
      <span class="shelf-app-icon">${escape(w.icon || "▢")}</span>
      <span class="shelf-app-name">${escape(w.title)}</span>
    </button>
  `).join("");
  for (const btn of shelfRunning.querySelectorAll("[data-wid]")) {
    btn.addEventListener("click", () => {
      const id = +btn.dataset.wid;
      const w = listWindows().find(x => x.id === id);
      if (!w) return;
      if (w.minimized) restoreWindow(id);
      else if (!w.active) focusWindow(id);
      else minimizeWindow(id);
    });
  }
}
onWindowsChange(drawShelf);
drawShelf();

// ---- Tray buttons ----
document.getElementById("tray-launcher").addEventListener("click", () => {
  launcherIsOpen() ? closeLauncher() : openLauncher();
});
document.getElementById("tray-quick").addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme");
  setTheme(cur === "dark" ? "light" : "dark");
});
// Auth pill — clicking signs in (when logged out) or shows a small
// menu (when logged in). For day 4 the menu is just "Sign out".
const authPill = document.getElementById("tray-auth");
authPill.addEventListener("click", () => {
  const a = authStateRef.current;
  if (!a.loggedIn) login();
  else if (confirm(`Sign out ${shortName(a)}?`)) logout();
});

const authStateRef = { current: { loggedIn: false } };
onAuth((a) => {
  authStateRef.current = a;
  authPill.textContent = a.loggedIn ? shortName(a) : "Sign in";
  authPill.classList.toggle("tray-auth-on", a.loggedIn);
  authPill.title = a.loggedIn
    ? `${a.id} (${a.type}) — click to sign out`
    : "Sign in with WebID or Nostr key";
});

function shortName(a) {
  if (!a.id) return "you";
  try { return new URL(a.id).hostname.replace(/^www\./, ""); }
  catch { return a.id.length > 14 ? a.id.slice(0, 6) + "…" + a.id.slice(-4) : a.id; }
}
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.code === "Space") {
    e.preventDefault();
    launcherIsOpen() ? closeLauncher() : openLauncher();
  }
});

// ---- Live clock ----
startClock(document.getElementById("tray-clock"));

function escape(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
