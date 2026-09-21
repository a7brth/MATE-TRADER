/* TradeJournal — client-side trading journal. Data persists in localStorage. */
(function () {
  "use strict";

  const STORAGE_KEY = "tradejournal.trades.v1";

  /** @type {Array<Trade>} */
  let trades = load();

  // ---------- Persistence ----------
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn("Failed to load trades:", e);
      return [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  }

  // ---------- P&L math ----------
  // Long: (exit - entry) * qty. Short: (entry - exit) * qty. Minus fees.
  function computePnl(t) {
    const gross = t.side === "short"
      ? (t.entry - t.exit) * t.qty
      : (t.exit - t.entry) * t.qty;
    return gross - (t.fees || 0);
  }

  function fmtMoney(n) {
    const sign = n < 0 ? "-" : "";
    return sign + "$" + Math.abs(n).toLocaleString(undefined, {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
  }

  // ---------- Rendering ----------
  const $ = (sel) => document.querySelector(sel);

  function renderStats() {
    const pnls = trades.map(computePnl);
    const total = trades.length;
    const wins = pnls.filter((p) => p > 0);
    const losses = pnls.filter((p) => p < 0);
    const net = pnls.reduce((a, b) => a + b, 0);
    const winRate = total ? (wins.length / total) * 100 : 0;
    const avgWin = wins.length ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
    const avgLoss = losses.length ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
    const grossProfit = wins.reduce((a, b) => a + b, 0);
    const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));
    const profitFactor = grossLoss ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0);

    const netEl = $("#statNetPnl");
    netEl.textContent = fmtMoney(net);
    netEl.className = "stat-value " + (net >= 0 ? "positive" : "negative");

    $("#statTotal").textContent = total;
    $("#statWinRate").textContent = winRate.toFixed(1) + "%";
    $("#statAvgWin").textContent = fmtMoney(avgWin);
    $("#statAvgLoss").textContent = fmtMoney(avgLoss);
    $("#statProfitFactor").textContent =
      profitFactor === Infinity ? "∞" : profitFactor.toFixed(2);
  }

  function tradeRow(t, opts) {
    const pnl = computePnl(t);
    const cls = pnl >= 0 ? "positive" : "negative";
    const sideCls = t.side === "short" ? "pill-short" : "pill-long";
    const cells = `
      <td>${t.date}</td>
      <td><strong>${escapeHtml(t.symbol)}</strong></td>
      <td><span class="pill ${sideCls}">${t.side}</span></td>
      <td>${t.qty}</td>
      <td>${fmtMoney(t.entry)}</td>
      <td>${fmtMoney(t.exit)}</td>`;
    if (opts && opts.full) {
      return `<tr>
        ${cells}
        <td>${fmtMoney(t.fees || 0)}</td>
        <td class="${cls}"><strong>${fmtMoney(pnl)}</strong></td>
        <td class="note-cell">${escapeHtml(t.notes || "")}</td>
        <td style="white-space:nowrap">
          <button class="btn-edit" data-edit="${t.id}">Edit</button>
          <button class="btn-danger" data-del="${t.id}">Delete</button>
        </td>
      </tr>`;
    }
    return `<tr>${cells}<td class="${cls}"><strong>${fmtMoney(pnl)}</strong></td></tr>`;
  }

  function renderRecent() {
    const body = $("#recentBody");
    const sorted = [...trades].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    body.innerHTML = sorted.map((t) => tradeRow(t, { full: false })).join("");
    $("#recentEmpty").hidden = sorted.length > 0;
  }

  function renderTrades() {
    const q = $("#searchInput").value.trim().toLowerCase();
    const side = $("#filterSide").value;
    const result = $("#filterResult").value;

    let filtered = trades.filter((t) => {
      const matchQ = !q ||
        t.symbol.toLowerCase().includes(q) ||
        (t.notes || "").toLowerCase().includes(q);
      const matchSide = !side || t.side === side;
      const pnl = computePnl(t);
      const matchResult = !result ||
        (result === "win" && pnl > 0) ||
        (result === "loss" && pnl < 0);
      return matchQ && matchSide && matchResult;
    });

    filtered.sort((a, b) => b.date.localeCompare(a.date));
    $("#tradesBody").innerHTML = filtered.map((t) => tradeRow(t, { full: true })).join("");
    $("#tradesEmpty").hidden = filtered.length > 0;
  }

  // ---------- Chart (cumulative P&L equity curve) ----------
  function renderChart() {
    const canvas = $("#pnlChart");
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    $("#chartEmpty").hidden = sorted.length > 0;
    if (!sorted.length) return;

    // cumulative points
    let cum = 0;
    const pts = sorted.map((t) => (cum += computePnl(t)));
    const data = [0, ...pts];

    const pad = 40;
    const min = Math.min(...data, 0);
    const max = Math.max(...data, 0);
    const range = max - min || 1;
    const xStep = (W - pad * 2) / Math.max(data.length - 1, 1);
    const yFor = (v) => H - pad - ((v - min) / range) * (H - pad * 2);
    const xFor = (i) => pad + i * xStep;

    // zero baseline
    ctx.strokeStyle = "#2a3346";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, yFor(0));
    ctx.lineTo(W - pad, yFor(0));
    ctx.stroke();

    // area fill
    const grad = ctx.createLinearGradient(0, pad, 0, H - pad);
    grad.addColorStop(0, "rgba(79,140,255,.35)");
    grad.addColorStop(1, "rgba(79,140,255,0)");
    ctx.beginPath();
    ctx.moveTo(xFor(0), yFor(data[0]));
    data.forEach((v, i) => ctx.lineTo(xFor(i), yFor(v)));
    ctx.lineTo(xFor(data.length - 1), yFor(0));
    ctx.lineTo(xFor(0), yFor(0));
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // line
    ctx.beginPath();
    ctx.moveTo(xFor(0), yFor(data[0]));
    data.forEach((v, i) => ctx.lineTo(xFor(i), yFor(v)));
    ctx.strokeStyle = cum >= 0 ? "#2ecc71" : "#ff5c6c";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // labels
    ctx.fillStyle = "#93a1b5";
    ctx.font = "12px sans-serif";
    ctx.fillText(fmtMoney(max), 4, yFor(max) + 4);
    ctx.fillText(fmtMoney(min), 4, yFor(min) + 4);
  }

  function renderAll() {
    renderStats();
    renderRecent();
    renderTrades();
    renderChart();
  }

  // ---------- Form ----------
  function resetForm() {
    $("#tradeForm").reset();
    $("#tradeId").value = "";
    $("#formTitle").textContent = "Add Trade";
    $("#saveBtn").textContent = "Save Trade";
    $("#cancelEdit").hidden = true;
    $("#livePnl").textContent = "";
    $("#date").value = new Date().toISOString().slice(0, 10);
  }

  function fillForm(t) {
    $("#tradeId").value = t.id;
    $("#date").value = t.date;
    $("#symbol").value = t.symbol;
    $("#side").value = t.side;
    $("#qty").value = t.qty;
    $("#entry").value = t.entry;
    $("#exit").value = t.exit;
    $("#fees").value = t.fees || 0;
    $("#notes").value = t.notes || "";
    $("#formTitle").textContent = "Edit Trade";
    $("#saveBtn").textContent = "Update Trade";
    $("#cancelEdit").hidden = false;
    updateLivePnl();
  }

  function updateLivePnl() {
    const draft = {
      side: $("#side").value,
      qty: parseFloat($("#qty").value) || 0,
      entry: parseFloat($("#entry").value) || 0,
      exit: parseFloat($("#exit").value) || 0,
      fees: parseFloat($("#fees").value) || 0,
    };
    if (!draft.qty || !draft.entry || !draft.exit) {
      $("#livePnl").textContent = "";
      return;
    }
    const pnl = computePnl(draft);
    const el = $("#livePnl");
    el.textContent = "P&L: " + fmtMoney(pnl);
    el.className = "live-pnl " + (pnl >= 0 ? "positive" : "negative");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const id = $("#tradeId").value;
    const record = {
      id: id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
      date: $("#date").value,
      symbol: $("#symbol").value.trim().toUpperCase(),
      side: $("#side").value,
      qty: parseFloat($("#qty").value),
      entry: parseFloat($("#entry").value),
      exit: parseFloat($("#exit").value),
      fees: parseFloat($("#fees").value) || 0,
      notes: $("#notes").value.trim(),
    };

    if (id) {
      const idx = trades.findIndex((t) => t.id === id);
      if (idx > -1) trades[idx] = record;
      toast("Trade updated");
    } else {
      trades.push(record);
      toast("Trade added");
    }
    save();
    resetForm();
    renderAll();
    switchView("trades");
  }

  // ---------- Table actions ----------
  function handleTableClick(e) {
    const del = e.target.closest("[data-del]");
    const edit = e.target.closest("[data-edit]");
    if (del) {
      const id = del.getAttribute("data-del");
      if (confirm("Delete this trade?")) {
        trades = trades.filter((t) => t.id !== id);
        save();
        renderAll();
        toast("Trade deleted");
      }
    } else if (edit) {
      const t = trades.find((x) => x.id === edit.getAttribute("data-edit"));
      if (t) { fillForm(t); switchView("add"); }
    }
  }

  // ---------- Import / Export ----------
  function exportData() {
    const blob = new Blob([JSON.stringify(trades, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tradejournal-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error("Invalid format");
        trades = parsed;
        save();
        renderAll();
        toast("Imported " + parsed.length + " trades");
      } catch (err) {
        toast("Import failed: invalid file");
      }
    };
    reader.readAsText(file);
  }

  // ---------- Navigation ----------
  function switchView(view) {
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
    const target = document.getElementById(view);
    if (target) target.classList.add("active");
    const link = document.querySelector('.nav-link[data-view="' + view + '"]');
    if (link) link.classList.add("active");
    if (view === "add" && !$("#tradeId").value) resetForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- Utils ----------
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 2200);
  }

  // ---------- Wire up ----------
  function init() {
    resetForm();
    renderAll();

    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        switchView(link.getAttribute("data-view"));
      });
    });

    $("#tradeForm").addEventListener("submit", handleSubmit);
    $("#cancelEdit").addEventListener("click", () => { resetForm(); switchView("trades"); });
    ["qty", "entry", "exit", "fees", "side"].forEach((id) =>
      document.getElementById(id).addEventListener("input", updateLivePnl));

    document.getElementById("recentBody").addEventListener("click", handleTableClick);
    document.getElementById("tradesBody").addEventListener("click", handleTableClick);

    $("#searchInput").addEventListener("input", renderTrades);
    $("#filterSide").addEventListener("change", renderTrades);
    $("#filterResult").addEventListener("change", renderTrades);

    $("#exportBtn").addEventListener("click", exportData);
    $("#importBtn").addEventListener("click", () => $("#importFile").click());
    $("#importFile").addEventListener("change", (e) => {
      if (e.target.files[0]) importData(e.target.files[0]);
      e.target.value = "";
    });

    // Load hash view if present
    const hash = location.hash.replace("#", "");
    if (["dashboard", "trades", "add"].includes(hash)) switchView(hash);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
