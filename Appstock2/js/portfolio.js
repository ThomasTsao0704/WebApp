import { state } from './store.js';
import { savePortfolio } from './storage.js';
import { number } from './utils.js';

export function initPortfolio() {
  const form = document.getElementById('portfolioForm');
  const addBtn = document.getElementById('portfolioAdd');
  if (form && addBtn) {
    addBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      const code = form.querySelector('[name="code"]')?.value?.trim();
      const qty = parseFloat(form.querySelector('[name="qty"]')?.value||'0');
      const cost= parseFloat(form.querySelector('[name="cost"]')?.value||'0');
      if (!code || !qty) return;
      state.portfolio.push({ code, qty, cost });
      savePortfolio();
      updatePortfolioDisplay();
      form.reset();
    });
  }
  updatePortfolioDisplay();
}

export function updatePortfolioDisplay() {
  const el = document.getElementById('portfolioContent');
  if (!el) return;
  if (!state.portfolio.length) { el.innerHTML = '<div class="muted">尚未加入持股</div>'; return; }

  // 用最新收盤價估算市值與損益
  const lastDate = [...new Set(state.marketData.map(d=>d.日期))].sort().slice(-1)[0];
  const today = state.marketData.filter(d=>d.日期===lastDate);
  const map = new Map(today.map(r=>[r.代碼, r]));

  let totalCost=0, totalValue=0;
  const rows = state.portfolio.map(p=>{
    const m = map.get(p.code);
    const price = m ? (+m.收盤價||0) : 0;
    const value = price * p.qty;
    const cost  = p.cost * p.qty;
    totalCost += cost; totalValue += value;
    const pnl = value - cost;
    const pnlp = totalCost? (pnl/totalCost*100):0;
    return { ...p, price, value, cost, pnl, pnlp };
  });

  el.innerHTML = `
    <table class="table">
      <thead><tr><th>代碼</th><th>數量</th><th>均價</th><th>現價</th><th>市值</th><th>成本</th><th>損益</th></tr></thead>
      <tbody>
        ${rows.map(r=>`
          <tr>
            <td>${r.code}</td>
            <td>${number(r.qty)}</td>
            <td>${number(r.cost)}</td>
            <td>${number(r.price)}</td>
            <td>${number(r.value)}</td>
            <td>${number(r.cost*r.qty)}</td>
            <td class="${r.value-r.cost*r.qty>=0?'trend-positive':'trend-negative'}">${number(r.value-r.cost*r.qty)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4">合計</td>
          <td>${number(totalValue)}</td>
          <td>${number(totalCost)}</td>
          <td class="${totalValue-totalCost>=0?'trend-positive':'trend-negative'}">${number(totalValue-totalCost)}</td>
        </tr>
      </tfoot>
    </table>`;
}
