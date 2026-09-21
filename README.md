# 📈 TradeJournal

A full, working **trading journal** website — no build step, no backend, no dependencies. Everything runs in your browser and your trades are saved locally (via `localStorage`).

## Features

- **Dashboard** with key stats: Net P&L, Total Trades, Win Rate, Avg Win, Avg Loss, Profit Factor
- **Equity curve** — a cumulative P&L chart drawn on `<canvas>`
- **Add / Edit / Delete trades** with live P&L preview as you type
- **Long & short** support with correct P&L math (fees included)
- **Search & filter** trades by symbol, notes, side, or win/loss
- **Import / Export** your data as JSON (backup or move between devices)
- **Responsive** dark UI that works on desktop and mobile
- **Persistent** — data stays saved in your browser between visits

## How to preview / access it

### Option 1 — Just open the file (simplest)
Open `index.html` directly in any web browser (double-click it, or drag it into a browser tab). It works fully offline.

### Option 2 — Run a local web server (recommended)
From the project folder, run **one** of these, then open the printed URL:

```bash
# Python 3
python3 -m http.server 8000
# then visit http://localhost:8000

# Node.js
npx serve .
# or
npx http-server
```

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure and views |
| `styles.css` | Styling and responsive layout |
| `app.js` | All logic: trades, stats, chart, storage |

## P&L formula

- **Long:** `(exit − entry) × qty − fees`
- **Short:** `(entry − exit) × qty − fees`
