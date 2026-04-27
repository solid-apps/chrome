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
document.getElementById("tray-launcher").addEventListener("click", openDemoWindow);
document.getElementById("tray-quick").addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme");
  setTheme(cur === "dark" ? "light" : "dark");
});
document.getElementById("tray-auth").addEventListener("click", () => {
  alert("Auth: hooking up xlogin in day 4.");
});
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.code === "Space") {
    e.preventDefault();
    openDemoWindow();
  }
});

// ---- Live clock ----
startClock(document.getElementById("tray-clock"));

// ---- Demo window factory (placeholder until the registry lands) ----
let demoCount = 0;
function openDemoWindow() {
  demoCount += 1;
  const n = demoCount;
  const offset = (n - 1) * 28;
  openWindow({
    title: `Hello window #${n}`,
    icon: "🪟",
    width: 520, height: 360,
    x: 80 + offset, y: 80 + offset,
    render(content, win) {
      content.innerHTML = `
        <div style="padding:24px;font:14px/1.6 var(--sans);color:var(--text)">
          <h2 style="margin:0 0 6px;font:600 18px var(--sans)">Window #${n}</h2>
          <p style="color:var(--text-dim);margin:0 0 12px">
            Drag the title bar to move. Drag any edge or corner to resize.
            Drag to the top of the screen to maximize, or to the left/right
            edges to tile half-screen. Double-click the title bar to toggle
            maximize.
          </p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="demo-btn" data-act="another">Open another</button>
            <button class="demo-btn" data-act="title">Set title…</button>
            <button class="demo-btn" data-act="min">Minimize</button>
            <button class="demo-btn" data-act="max">Maximize</button>
          </div>
          <pre data-role="clock" style="margin-top:16px;font:24px var(--mono);color:var(--accent)"></pre>
        </div>
      `;
      content.querySelector('[data-act="another"]').addEventListener("click", openDemoWindow);
      content.querySelector('[data-act="title"]').addEventListener("click", () => {
        const t = prompt("New title?", `Hello #${n}`);
        if (t) win.setTitle(t);
      });
      content.querySelector('[data-act="min"]').addEventListener("click", () => win.minimize());
      content.querySelector('[data-act="max"]').addEventListener("click", () => win.maximize());

      const clock = content.querySelector('[data-role="clock"]');
      const tick = () => { clock.textContent = new Date().toLocaleTimeString(); };
      tick();
      const t = setInterval(tick, 1000);
      const obs = new MutationObserver(() => {
        if (!content.isConnected) { clearInterval(t); obs.disconnect(); }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    },
  });
}

function escape(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
