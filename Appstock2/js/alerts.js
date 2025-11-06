import { state } from './store.js';
import { saveAlerts } from './storage.js';
import { number } from './utils.js';

export function initAlerts() {
  const form = document.getElementById('alertForm');
  const add = document.getElementById('alertAdd');
  if (form && add) {
    add.addEventListener('click', (e)=>{
      e.preventDefault();
      const code = form.querySelector('[name="code"]')?.value?.trim();
      const above= parseFloat(form.querySelector('[name="above"]')?.value||'');
      const below= parseFloat(form.querySelector('[name="below"]')?.value||'');
      if (!code || (isNaN(above) && isNaN(below))) return;
      state.alerts.push({ code, above: isNaN(above)? null: above, below: isNaN(below)? null: below });
      saveAlerts(); updateAlertsDisplay(); form.reset();
    });
  }
  updateAlertsDisplay();
  // 每次資料變動時，外部會呼叫 updateAlertsDisplay() 重算觸發清單
}

export function updateAlertsDisplay() {
  const el = document.getElementById('alertsContent');
  if (!el) return;
  if (!state.alerts.length) { el.innerHTML = '<div class="muted">尚未設定任何警示</div>'; return; }

  const lastDate = [...new Set(state.marketData.map(d=>d.日期))].sort().slice(-1)[0];
  const today = state.marketData.filter(d=>d.日期===lastDate);
  const map = new Map(today.map(r=>[r.代碼, r]));

  const rows = state.alerts.map(a=>{
    const m = map.get(a.code);
    const price = m ? (+m.收盤價||0) : NaN;
    const hitAbove = (a.above!=null && !isNaN(price) && price>=a.above);
    const hitBelow = (a.below!=null && !isNaN(price) && price<=a.below);
    const status = (hitAbove||hitBelow) ? '觸發' : '—';
    return { ...a, price, status };
  });

  el.innerHTML = `
    <table class="table">
      <thead><tr><th>代碼</th><th>現價</th><th>>=</th><th><=</th><th>狀態</th><th>操作</th></thead>
      <tbody>
        ${rows.map((r,i)=>`
          <tr>
            <td>${r.code}</td>
            <td>${isNaN(r.price)?'—':number(r.price)}</td>
            <td>${r.above==null?'—':number(r.above)}</td>
            <td>${r.below==null?'—':number(r.below)}</td>
            <td class="${r.status==='觸發'?'trend-positive':'muted'}">${r.status}</td>
            <td><button data-i="${i}" class="btn btn-sm remove-alert">刪除</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;

  el.querySelectorAll('.remove-alert').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const i = +btn.dataset.i;
      state.alerts.splice(i,1);
      saveAlerts(); updateAlertsDisplay();
    });
  });
}
