/**
 * launcher.js — full-screen app grid.
 *
 * Triggered by the tray launcher button or ⌘Space. Searchable list
 * of every app in the curated registry, click → opens in a fresh
 * window. Esc / click outside / launch → closes.
 */

import { listApps, loadApp } from "./registry.js";
import { openWindow } from "./windows.js";

let overlay = null;
let apps = null;        // cached after first load
let appsError = null;

export function isOpen() { return !!overlay; }

export function openLauncher() {
  if (overlay) return;
  overlay = document.createElement("div");
  overlay.className = "launcher-overlay";
  overlay.innerHTML = `
    <div class="launcher-card" role="dialog" aria-label="App launcher">
      <div class="launcher-search">
        <svg class="launcher-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input class="launcher-input" id="launcher-input" type="text" placeholder="Search apps…" autocomplete="off" autofocus />
        <span class="launcher-hint">Esc</span>
      </div>
      <div class="launcher-grid" id="launcher-grid">
        <div class="launcher-status">Loading registry…</div>
      </div>
      <div class="launcher-foot">
        Curated apps from <code>solid-apps/registry</code>. Click anywhere outside to close.
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector("#launcher-input");
  const grid = overlay.querySelector("#launcher-grid");

  input.focus();
  draw();

  if (apps === null && !appsError) {
    listApps()
      .then(list => { apps = list; draw(); })
      .catch(e => { appsError = e; draw(); });
  }

  input.addEventListener("input", draw);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); closeLauncher(); return; }
    if (e.key === "Enter") {
      e.preventDefault();
      const first = grid.querySelector("[data-url]");
      if (first) first.click();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const buttons = grid.querySelectorAll("[data-url]");
      if (buttons.length) buttons[0].focus();
    }
  });

  overlay.addEventListener("mousedown", (e) => {
    if (e.target === overlay) closeLauncher();
  });

  document.addEventListener("keydown", onGlobalKey);

  function draw() {
    if (appsError) {
      grid.innerHTML = `<div class="launcher-status err">Couldn't load registry: ${escape(appsError.message)}</div>`;
      return;
    }
    if (apps === null) {
      grid.innerHTML = `<div class="launcher-status">Loading registry…</div>`;
      return;
    }
    const q = input.value.trim().toLowerCase();
    const matches = !q
      ? apps
      : apps.filter(a =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q));
    if (!matches.length) {
      grid.innerHTML = `<div class="launcher-status">No apps match “${escape(q)}”.</div>`;
      return;
    }
    grid.innerHTML = matches.map(a => `
      <button class="launcher-app" data-url="${escape(a.url)}" title="${escape(a.description)}">
        <div class="launcher-app-icon">${escape(a.icon)}</div>
        <div class="launcher-app-name">${escape(a.name)}</div>
        <div class="launcher-app-author">${escape(a.author)}</div>
      </button>
    `).join("");
    for (const btn of grid.querySelectorAll("[data-url]")) {
      btn.addEventListener("click", () => launchApp(btn.dataset.url));
      btn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); btn.click(); }
      });
    }
  }
}

export function closeLauncher() {
  if (!overlay) return;
  overlay.remove();
  overlay = null;
  document.removeEventListener("keydown", onGlobalKey);
}

function onGlobalKey(e) {
  if (e.key === "Escape") closeLauncher();
}

async function launchApp(url) {
  closeLauncher();
  let app;
  try {
    app = await loadApp(url);
  } catch (e) {
    openWindow({
      title: "Launch error",
      icon: "⚠️",
      width: 480, height: 240,
      render(content) {
        content.innerHTML = `<div style="padding:18px;color:var(--danger);font:13px var(--mono);word-break:break-all">
          Couldn't load app:<br>${escape(url)}<br><br>${escape(e.message)}
        </div>`;
      },
    });
    return;
  }
  openWindow({
    title: app.meta?.name || url.split("/").pop(),
    icon:  app.meta?.icon || "📦",
    width:  app.meta?.width  || 720,
    height: app.meta?.height || 480,
    app: { url, meta: app.meta },
    render(content, win) {
      const ctx = makeCtx(win);
      try {
        Promise.resolve(app.render(content, ctx)).catch(e => {
          content.innerHTML = `<div style="padding:18px;color:var(--danger);font:13px var(--mono)">App render error: ${escape(e.message)}</div>`;
        });
      } catch (e) {
        content.innerHTML = `<div style="padding:18px;color:var(--danger);font:13px var(--mono)">App render error: ${escape(e.message)}</div>`;
      }
    },
  });
}

function makeCtx(win) {
  return {
    // Auth + real-time come in day 4. Apps that read these get
    // sensible defaults so they don't crash before then.
    auth: { loggedIn: false, type: null, id: null },
    fetch: (...args) => window.fetch(...args),
    subscribe: async () => () => {}, // no-op until day 4
    openWindow,                       // child windows for apps that want them
    closeWindow: () => win.close(),
    setTitle: (t) => win.setTitle(t),
  };
}

function escape(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
