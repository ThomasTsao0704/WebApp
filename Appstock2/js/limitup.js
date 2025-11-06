import { state } from './store.js';
import { number } from './utils.js';

export function initLimitUp() {
  // 綁定篩選器（若存在）
  const sel = document.getElementById('limitupFilter');
  if (sel) sel.addEventListener('change', updateLimitUp);
}

export function updateLimitUp() {
  const el = document.getElementById('limitupContent');
  if (!el) return;
  if (state.marketData.length === 0) { el.innerHTML = '<div class="muted">尚無資料</div>'; return; }

  const dates = [...new Set(state.marketData.map(d => d.日期))].sort();
  const latest = dates[dates.length - 1];
  const today = state.marketData.filter(d => d.日期 === latest);
  // 以漲跌幅排序，前 20 名
  const top = [...today].sort((a,b)=>(b.漲跌幅||0)-(a.漲跌幅||0)).slice(0,20);
  el.innerHTML = `
    <h3>今日強勢股（${latest}）</h3>
    <table class="table">
      <thead><tr><th>代碼</th><th>名稱</th><th>漲跌幅</th><th>成交量</th></tr></thead>
      <tbody>
        ${top.map(r=>`
          <tr class="clickable-stock" data-code="${r.代碼}" data-name="${r.商品||''}">
            <td>${r.代碼}</td><td>${r.商品||''}</td>
            <td class="trend-positive">+${(+r.漲跌幅||0).toFixed(2)}%</td>
            <td>${number(r.成交量)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;

  // 列表列點擊 -> analyze
  el.querySelectorAll('.clickable-stock').forEach(tr=>{
    tr.addEventListener('click', ()=>{
      const code = tr.dataset.code;
      window.dispatchEvent(new CustomEvent('analyze:jump', { detail: { code } }));
    });
  });
}
