# chrome

A web-first desktop OS built over your Solid pod. Apps as ES modules,
real-time via WebSocket Notifications, prefs sync across devices, all
on your pod. Sister project to [hub](https://github.com/solid-apps/hub)
— hub is workspace-shaped, chrome is desktop-shaped.

> ⚠️ Day-1 scaffold. Window manager, launcher, app registry, auth, and
> real-time subscribe come in successive commits. The eventual shape:
> ChromeOS-like shell, decentralized backbone.

## Architecture

| Layer | Source |
|---|---|
| App registry (`urn:App` / `urn:Pane`) | [`solid-apps/registry`](https://github.com/solid-apps/registry) |
| App + Pane interfaces | SLIP-48 (LOSOS shape) |
| Identity | WebID + Solid OIDC (via xlogin) |
| Live updates | solid-0.1 WebSocket Notifications |
| Pod-stored preferences | TypeIndex registrations under `urn:solid:*` |

Apps and panes are interchangeable with hub: anything that runs in hub
runs here once the registry import is wired up. Chrome adds:

- **Window manager** — every app lives in a draggable, resizable window.
- **Shelf** (bottom) — pinned + running apps.
- **Status tray** (top) — clock, notifications, quick settings, account.
- **Launcher** — ⌘Space full-screen app grid + search.
- **Lock screen** — Esc-after-idle, PIN/passkey re-auth.
- **Wallpaper** — pod-stored URL, time-of-day theming.
- **Virtual desks** — multiple workspaces.

## Development

Pure ES modules, no build. Serve any way you like:

```bash
python3 -m http.server 3003
```

Open <http://localhost:3003/>.

## Status

| Day | What | Status |
|---|---|---|
| 1 | Scaffold: shell + wallpaper + status tray + clock | shipping |
| 2 | Window manager (drag/resize/z-order/snap) | next |
| 3 | Shelf running-app indicators + launcher | |
| 4 | App registry + auth + real-time | |
| 5 | Lock screen + multi-desk + 2 demo apps | polish |

## License

AGPL-3.0
