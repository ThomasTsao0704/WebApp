import { state } from './store.js';
import { updateDashboard } from './dashboard.js';
import { updateLimitUp } from './limitup.js';
import { updateConcepts } from './concepts.js';
import { updatePortfolioDisplay } from './portfolio.js';
import { updateAlertsDisplay } from './alerts.js';

export const number = n => (n==null?'—':(+n).toLocaleString());
export const qs = s => document.querySelector(s);

export function afterDataChanged() {
  updateMgmtUI();
  updateDashboard();
  updateLimitUp();
  updateConcepts();
  updatePortfolioDisplay();
  updateAlertsDisplay();
}

export function updateMgmtUI() {
  const count = state.marketData.length;
  const dates = [...new Set(state.marketData.map(d=>d.日期).filter(Boolean))].sort();
  const stocks = new Set(state.marketData.map(d=>d.代碼));
  const dc = document.getElementById('dataCount');
  if (dc) dc.textContent = count.toLocaleString();
  const dr = document.getElementById('dateRange');
  if (dr) dr.textContent = dates.length? `${dates[0]} ~ ${dates[dates.length-1]}` : '-';
  const sc = document.getElementById('stockCount');
  if (sc) sc.textContent = stocks.size;
  try {
    const stored = JSON.parse(localStorage.getItem('stockMarketData_v3')||'{}');
    if (stored.lastUpdate) {
      const lu = document.getElementById('lastUpdate');
      if (lu) lu.textContent = new Date(stored.lastUpdate).toLocaleString('zh-TW',{hour12:false});
    }
  } catch {}
}

export function attachStockClickHandlers() {
  document.querySelectorAll('.clickable-stock').forEach(el=>{
    el.addEventListener('click', ()=>{
      const code = el.dataset.code;
      window.dispatchEvent(new CustomEvent('analyze:jump', { detail: { code } }));
    });
  });
}
