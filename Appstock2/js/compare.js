import { state } from './store.js';

export function initCompare() {
  const form = document.getElementById('compareForm');
  const btn  = document.getElementById('compareRun');
  if (form && btn) {
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      const codes = (form.querySelector('[name="codes"]')?.value||'')
        .split(/[ ,;|]+/).map(s=>s.trim()).filter(Boolean);
      updateCompare(codes);
    });
  }
}

export function updateCompare(codes=[]) {
  const el = document.getElementById('compareContent');
  if (!el) return;
  if (!codes.length) { el.innerHTML = '<div class="muted">輸入代碼，分隔可用空白或 |</div>'; return; }

  const map = new Map();
  for (const r of state.marketData) {
    if (!codes.includes(r.代碼)) continue;
    if (!map.has(r.代碼)) map.set(r.代碼, []);
    map.get(r.代碼).push(r);
  }
  for (const arr of map.values()) arr.sort((a,b)=>new Date(a.日期)-new Date(b.日期));

  // 輸出簡表（可擴成多序列 Chart.js）
  el.innerHTML = [...map.entries()].map(([code, arr])=>`
    <h4>${code}</h4>
    <table class="table">
      <thead><tr><th>日期</th><th>收盤</th><th>漲跌幅</th></tr></thead>
      <tbody>
        ${arr.slice(-30).map(r=>`
          <tr><td>${r.日期}</td><td>${r.收盤價}</td><td>${(+r.漲跌幅||0).toFixed(2)}%</td></tr>
        `).join('')}
      </tbody>
    </table>
  `).join('');
}
