import { state } from './store.js';
import { attachStockClickHandlers, number } from './utils.js';

export function updateDashboard() {
  const el = document.getElementById('dashboardContent');
  if (!el) return;
  if (state.marketData.length === 0) {
    el.innerHTML = `<div class="alert alert-info">尚未載入市場資料。請先上傳 CSV / Excel。</div>`;
    return;
  }
  const dates = [...new Set(state.marketData.map(d => d.日期))].sort();
  const latest = dates[dates.length - 1];
  const today = state.marketData.filter(d => d.日期 === latest);

  const up = today.filter(r => r.漲跌幅 >= 0).length;
  const down = today.length - up;
  const avg = (today.reduce((s, r) => s + (+r.漲跌幅 || 0), 0) / today.length).toFixed(2);

  const topVol = [...today].sort((a,b)=>(b.成交量||0)-(a.成交量||0)).slice(0,5);
  const topGain = [...today].sort((a,b)=>(b.漲跌幅||0)-(a.漲跌幅||0)).slice(0,5);

  el.innerHTML = `
    <div class="dashboard-grid">
      <div class="dashboard-widget">
        <h3>📈 今日市場概況 (${latest})</h3>
        <div class="stat-row"><div class="stat-label">上漲家數</div><div class="stat-value">${up}</div></div>
        <div class="stat-row"><div class="stat-label">下跌家數</div><div class="stat-value">${down}</div></div>
        <div class="stat-row"><div class="stat-label">平均漲跌幅</div><div class="stat-value">${avg}%</div></div>
      </div>
      <div class="dashboard-widget">
        <h3>🔥 成交量前五</h3>
        ${topVol.map(r=>`
          <div class="stat-row">
            <div class="stat-label clickable-stock" data-code="${r.代碼}" data-name="${r.商品||''}">${r.代碼} ${r.商品||''}</div>
            <div class="stat-value">${number(r.成交量)}</div>
          </div>`).join('')}
      </div>
      <div class="dashboard-widget">
        <h3>🚀 漲幅前五</h3>
        ${topGain.map(r=>`
          <div class="stat-row">
            <div class="stat-label clickable-stock" data-code="${r.代碼}" data-name="${r.商品||''}">${r.代碼} ${r.商品||''}</div>
            <div class="stat-value trend-positive">+${(+r.漲跌幅||0).toFixed(2)}%</div>
          </div>`).join('')}
      </div>
    </div>`;
  attachStockClickHandlers();
}
