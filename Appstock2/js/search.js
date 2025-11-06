import { state } from './store.js';

export function initSearch() {
  const input = document.getElementById('globalSearch');
  if (!input) return;
  input.addEventListener('input', ()=> updateSearch(input.value));
}

export function updateSearch(keyword='') {
  const el = document.getElementById('searchResults');
  if (!el) return;
  const kw = keyword.trim();
  if (!kw) { el.innerHTML = '<div class="muted">輸入代碼或名稱關鍵字</div>'; return; }

  const rows = state.marketData.filter(r => 
    r.代碼?.includes(kw) || (r.商品||'').includes(kw)
  ).slice(0,100);

  el.innerHTML = rows.length? `
    <table class="table">
      <thead><tr><th>日期</th><th>代碼</th><th>名稱</th><th>收盤</th><th>漲跌幅</th></tr></thead>
      <tbody>
        ${rows.map(r=>`
          <tr class="clickable-stock" data-code="${r.代碼}">
            <td>${r.日期}</td><td>${r.代碼}</td><td>${r.商品||''}</td>
            <td>${r.收盤價}</td><td>${(+r.漲跌幅||0).toFixed(2)}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>` : '<div class="muted">查無結果</div>';

  el.querySelectorAll('.clickable-stock').forEach(tr=>{
    tr.addEventListener('click', ()=>{
      const code = tr.dataset.code;
      window.dispatchEvent(new CustomEvent('analyze:jump', { detail: { code } }));
    });
  });
}
