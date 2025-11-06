import { state, concepts } from './store.js';
import { number } from './utils.js';

export function initConcepts() {
  const box = document.getElementById('conceptsFilter');
  if (!box) return;
  box.innerHTML = Object.keys(concepts).map(k=>`<label><input type="checkbox" value="${k}" checked> ${k}</label>`).join('');
  box.querySelectorAll('input[type="checkbox"]').forEach(chk=>{
    chk.addEventListener('change', updateConcepts);
  });
}

export function updateConcepts() {
  const el = document.getElementById('conceptsContent');
  if (!el) return;
  if (state.marketData.length === 0) { el.innerHTML = '<div class="muted">尚無資料</div>'; return; }

  // 取各概念清單，匯總今日平均漲跌幅與成交量
  const dates = [...new Set(state.marketData.map(d => d.日期))].sort();
  const latest = dates[dates.length - 1];
  const today = state.marketData.filter(d => d.日期 === latest);

  const enabled = new Set(
    Array.from(document.querySelectorAll('#conceptsFilter input:checked')).map(i=>i.value)
  );
  const rows = [];
  for (const [name, codes] of Object.entries(concepts)) {
    if (!enabled.has(name)) continue;
    const subset = today.filter(r => codes.includes(r.代碼));
    if (!subset.length) continue;
    const avg = subset.reduce((s,r)=>s+(+r.漲跌幅||0),0)/subset.length;
    const vol = subset.reduce((s,r)=>s+(+r.成交量||0),0);
    rows.push({ name, avg, vol, count: subset.length });
  }
  rows.sort((a,b)=>b.avg-a.avg);

  el.innerHTML = `
    <h3>概念股即時條（${latest}）</h3>
    <table class="table">
      <thead><tr><th>概念</th><th>平均漲幅</th><th>家數</th><th>總量</th></tr></thead>
      <tbody>
        ${rows.map(r=>`
          <tr>
            <td>${r.name}</td>
            <td class="${r.avg>=0?'trend-positive':'trend-negative'}">${r.avg>=0?'+':''}${r.avg.toFixed(2)}%</td>
            <td>${r.count}</td>
            <td>${number(r.vol)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}
