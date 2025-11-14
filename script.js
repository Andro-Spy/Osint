// script.js - Terminal typing, API fetch, history, downloadable JSON report

const API_BASE = 'https://mynkapi.amit1100941.workers.dev/?key=onlymynk&mobile='; 
// element refs
const out = document.getElementById('terminalOutput');
const input = document.getElementById('number');
const downloadBtn = document.getElementById('downloadBtn');

let isTyping = false;

// Utility: append a styled line to terminal
function appendLine(text, cls='line') {
  const el = document.createElement('div');
  el.className = cls;
  el.textContent = text;
  out.appendChild(el);
  out.scrollTop = out.scrollHeight;
  return el;
}

// Typewriter effect for a single line (awaitable)
function typeLine(containerEl, text, speed = 12) {
  return new Promise(resolve => {
    let i = 0;
    containerEl.textContent = '';
    const timer = setInterval(() => {
      containerEl.textContent += text[i++] ?? '';
      out.scrollTop = out.scrollHeight;
      if (i >= text.length) {
        clearInterval(timer);
        setTimeout(resolve, 80);
      }
    }, speed);
  });
}

// Load history from localStorage (array of entries)
function loadHistory() {
  const h = JSON.parse(localStorage.getItem('scanHistory') || '[]');
  // show a compact summary at top of terminal
  if (h.length === 0) {
    appendLine('> history: empty', 'line neon');
    return;
  }
  appendLine(`> history: ${h.length} entries (most recent first)`, 'line neon');
  // show up to 6 items
  for (let i=0; i < Math.min(6, h.length); i++) {
    const e = h[i];
    appendLine(`  - ${e.number} @ ${new Date(e.ts).toLocaleString()}`, 'line');
  }
}

// Save a scan to localStorage (keeps most recent first, dedup by number)
function saveScan(number, rawData) {
  const existing = JSON.parse(localStorage.getItem('scanHistory') || '[]');
  // entry shape: { number, ts, data }
  const entry = { number, ts: Date.now(), data: rawData || null };
  // remove same number if exists
  const filtered = existing.filter(x => x.number !== number);
  filtered.unshift(entry);
  // keep max 200 records
  filtered.splice(200);
  localStorage.setItem('scanHistory', JSON.stringify(filtered));
  // enable download button
  downloadBtn.style.display = 'inline-block';
}

// Build a display block for API response
function showResultBlock(number, data) {
  const block = document.createElement('div');
  block.className = 'block';
  const time = new Date().toLocaleString();
  let inner = `>> SCAN :: ${number}   (${time})\n\n`;
  if (!data || !data.data || data.data.length === 0) {
    inner += '  NO DATA FOUND\n';
  } else {
    data.data.forEach((it, idx) => {
      inner += `  [${idx+1}] Mobile: ${it.mobile || 'N/A'}\n`;
      inner += `       Name  : ${it.name || 'N/A'}\n`;
      inner += `       Father: ${it.fname || 'N/A'}\n`;
      inner += `       Addr  : ${it.address || 'N/A'}\n`;
      inner += `       Alt   : ${it.alt || 'N/A'}\n`;
      inner += `       Circle: ${it.circle || 'N/A'}\n\n`;
    });
  }
  block.textContent = inner;
  out.appendChild(block);
  out.scrollTop = out.scrollHeight;
}

// Main scan flow with typewriter animation
async function runScan() {
  if (isTyping) return;
  const num = (input.value || '').trim();
  if (!/^\d{10}$/.test(num)) {
    const l = appendLine('> error: enter a valid 10-digit number', 'line err');
    setTimeout(() => l.remove(), 2500);
    return;
  }

  isTyping = true;
  // show dynamic typing lines
  const l1 = appendLine('> initializing scanner...', 'line');
  await typeLine(l1, '> initializing scanner...', 10);

  const l2 = appendLine('> resolving network...', 'line');
  await typeLine(l2, '> resolving network...', 10);

  const l3 = appendLine(`> querying API for ${num} ...`, 'line neon');
  await typeLine(l3, `> querying API for ${num} ...`, 10);

  // Do the fetch
  try {
    const res = await fetch(API_BASE + encodeURIComponent(num));
    const json = await res.json();

    // success feedback
    const ok = appendLine('> response received', 'line ok');
    await typeLine(ok, '> response received', 10);

    // show result block (no slow typing here - structured)
    showResultBlock(num, json);

    // save to local history
    saveScan(num, json);

  } catch (err) {
    const e = appendLine('> network error: could not reach API', 'line err');
    await typeLine(e, '> network error: could not reach API', 8);
    appendLine(`  ${err.message}`, 'line err');
  } finally {
    isTyping = false;
    input.value = '';
  }
}

// prepare downloadable JSON report of all history
function downloadReport() {
  const hist = JSON.parse(localStorage.getItem('scanHistory') || '[]');
  if (!hist.length) {
    appendLine('> no entries to export', 'line err');
    return;
  }
  const blob = new Blob([JSON.stringify(hist, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const t = new Date().toISOString().replace(/[:.]/g,'-');
  a.href = url;
  a.download = `scan-report-${t}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  appendLine(`> exported ${hist.length} entries to ${a.download}`, 'line ok');
}

// show download button if history exists
(function init(){
  const hist = JSON.parse(localStorage.getItem('scanHistory') || '[]');
  if (hist.length) downloadBtn.style.display = 'inline-block';
  else downloadBtn.style.display = 'none';
  // initial load
  appendLine('>> CYBERPUNK TERMINAL v2.9', 'line neon');
  appendLine('> quickhelp: type 10-digit number and RUN', 'line');
  loadHistory();
})();
