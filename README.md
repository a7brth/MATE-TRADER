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

- **Live site (GitHub Pages):** enable Pages on this repo (Settings → Pages → Branch: `main` → `/root`), then open `https://a7brth.github.io/MATE-TRADER/`
- **Open directly:** download `index.html` and open it in any browser — it works fully offline.

## ☁️ Cloud sync across devices (Firebase)

The journal can sync your trades across phone + laptop using a **free Firebase** project. Until you add your config it runs offline (localStorage) exactly as before — nothing breaks.

**One-time setup (~5 minutes):**

1. Go to the [Firebase console](https://console.firebase.google.com) → **Add project** (any name, e.g. `mate-trader`). Google Analytics is optional.
2. In the project, click the **web icon `</>`** to "Add app". Give it a nickname, click **Register app**. Firebase shows you a `firebaseConfig` object — keep that tab open.
3. Left menu → **Build → Authentication → Get started** → **Sign-in method** → enable **Email/Password** → Save.
4. Left menu → **Build → Firestore Database → Create database** → Production mode → pick a location → Enable.
5. In Firestore → **Rules** tab, paste the rules below and **Publish**:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /journals/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
   *(This makes each person's journal private — only the signed-in owner can read/write their own data.)*
6. Open `index.html`, find the block marked **"PASTE YOUR FIREBASE CONFIG HERE"**, and replace the placeholder values with the ones from step 2 (`apiKey`, `authDomain`, `projectId`, `appId`).
7. Commit & push. On the live site, click **"Sign in to sync"** in the sidebar → create an account. Do the same on your other device with the **same email/password**, and your trades sync automatically in real time. ✨

**Notes**
- These Firebase web config values are safe to keep in the code — they are public identifiers, not secrets. Your data is protected by the security rules above.
- Free tier is generous (plenty for a personal journal).
- First device to sign in seeds the cloud from its local data; after that every device shows the same journal live.

## Import from MetaTrader 5

You can bring your MT5 history in without typing anything:

1. In **MT5**, open the **History** tab (Toolbox at the bottom).
2. **Right-click** anywhere in it → **Report** → save as **HTML**.
3. In Mate Trader → **Settings → Import from MetaTrader 5 → Choose MT5 report…** and pick that file.
4. Review the preview, then click **Import** — all your closed trades appear with the exact broker P&L, symbol, side, lots, entry/exit, and fees (commission + swap).

Re-importing the same/updated report later is safe — trades already imported are automatically skipped (deduped by MT5 position id). This is a **manual pull** (not live streaming): export + import again whenever you want the latest trades. CSV history exports are also supported.

## Files

| File | Purpose |
|------|---------|
| `index.html` | The entire app — HTML, CSS, JS, and Firebase sync in one self-contained file |

> Tip: use **Settings → Load sample trades** to see the journal filled in, then **Delete all trades** to start fresh.
