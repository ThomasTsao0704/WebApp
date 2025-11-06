import { state } from './store.js';

export function rebuildChartIfNeeded(slice) {
  if (!slice || slice.length === 0) return;
  buildLineChart(slice);
}

export function buildLineChart(rows) {
  const wrap = document.getElementById('chartWrapper');
  const canvas = document.getElementById('priceChart');
  if (!wrap || !canvas) return;
  wrap.style.display = 'block';
  const labels = rows.map(r => r.日期);
  const prices = rows.map(r => +r.收盤價 || 0);

  if (state.chart) { state.chart.destroy(); state.chart = null; }
  if (typeof Chart === 'undefined') { console.warn('Chart.js 未載入'); return; }
  state.chart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: { labels, datasets: [{ label: '收盤價', data: prices }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

export function jumpAnalyze(code) {
  if (!code || !state.marketData.length) return;
  const rows = state.marketData.filter(r => r.代碼 === code).sort((a,b)=>new Date(a.日期)-new Date(b.日期));
  state.lastAnalyzedSlice = rows;
  buildLineChart(rows);
  // 切到分析分頁（#tab3）如果存在
  const tab = document.getElementById('tab3');
  if (tab) {
    for (let i = 0; i <= 8; i++) {
      const panel = document.getElementById('tab' + i);
      if (panel) panel.classList.toggle('active', i === 3);
    }
    document.querySelectorAll('.tab').forEach((t, i)=> t.classList.toggle('active', i === 3));
  }
}
