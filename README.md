# 📈 Mate Trader — Trading Journal

A full, single-file **trading journal** web app. No build step, no backend, no dependencies — everything runs in your browser and your data is saved locally (via `localStorage`).

## Features

- **Dashboard** — Net P&L, win rate, profit factor, expectancy, average R, drawdown, best/worst, streaks
- **Interactive charts** — equity curve, daily P&L, and drawdown views with hover tooltips
- **Log trades** — long/short, lots, entry/exit, stop, take profit, fees, session, setup
- **Live calculations** — P&L, R multiple, risk on stop, planned R:R, % of equity as you type
- **Journaling** — how it felt, mistakes, execution rating (stars), plan, review, screenshot URL
- **Trades table** — sortable columns, expandable rows, search & filters, CSV export
- **Calendar** — monthly P&L heatmap; click a day to read its trades
- **Analytics** — breakdowns by symbol, setup, session, day of week, direction, emotion, mistakes, rating; R-multiple distribution
- **Risk sizing** — position size calculator + drawdown recovery table
- **Settings** — starting balance, default risk, currency, custom instruments; import/export JSON; sample data
- **Light / dark theme** and responsive (works on mobile)

## How to preview / access it

- **Live site (GitHub Pages):** enable Pages on this repo (Settings → Pages → Branch: `main` → `/root`), then open `https://<your-username>.github.io/trade-journal/`
- **Open directly:** download `index.html` and open it in any browser — it works fully offline.

## Files

| File | Purpose |
|------|---------|
| `index.html` | The entire app — HTML, CSS, and JS in one self-contained file |

> Tip: use **Settings → Load sample trades** to see the journal filled in, then **Delete all trades** to start fresh.
