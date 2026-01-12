let fxData = {};
let dateKeys = [];
let dateObjs = [];
let currencies = [];
let cmpChart = null;
let trendChart = null;
let ppChart = null;
let mcChart = null;

async function loadData() {
  const res = await fetch('data.json');
  fxData = await res.json();
  dateKeys = Object.keys(fxData).sort();
  dateObjs = dateKeys.map(d => new Date(d));
  currencies = Object.keys(fxData[dateKeys[0]]);

  const selectIds = ['c-from', 'c-to', 'cmp-ccy', 'tr-ccy1', 'tr-ccy2', 'pp-ccy', 'mc-ccys'];
  selectIds.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    currencies.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      sel.appendChild(opt);
    });
  });

  if (currencies.includes('TWD')) document.getElementById('c-from').value = 'TWD';
  if (currencies.includes('JPY')) document.getElementById('c-to').value = 'JPY';
  document.getElementById('cmp-ccy').value = currencies[0];
  document.getElementById('tr-ccy1').value = currencies[0];
  document.getElementById('pp-ccy').value = currencies.includes('TWD') ? 'TWD' : currencies[0];
}

function nearestDate(target) {
  let best = dateObjs[0];
  let bestDiff = Math.abs(dateObjs[0] - target);
  for (let d of dateObjs) {
    const diff = Math.abs(d - target);
    if (diff < bestDiff) {
      best = d;
      bestDiff = diff;
    }
  }
  return best.toISOString().slice(0, 10);
}

function getRate(dateKey, ccy) {
  const row = fxData[dateKey];
  if (!row) return null;
  const v = row[ccy];
  if (v === undefined || v === null || Number.isNaN(v)) return null;
  return Number(v);
}

function crossConvert(amount, from, to, dateKey) {
  const rA = getRate(dateKey, from);
  const rB = getRate(dateKey, to);
  if (rA == null || rB == null) return null;
  return amount * (rB / rA);
}

function setupTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Tab1: convert
function setupConvert() {
  document.getElementById('btn-convert').addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('c-amount').value);
    const from = document.getElementById('c-from').value;
    const to = document.getElementById('c-to').value;
    const d = new Date(document.getElementById('c-date').value);
    if (!amount || !from || !to || !d) return;

    const nearestKey = nearestDate(d);
    const res = crossConvert(amount, from, to, nearestKey);
    const mainEl = document.getElementById('c-result-main');
    const subEl = document.getElementById('c-result-sub');
    const badgeEl = document.getElementById('c-result-badges');

    if (res == null) {
      mainEl.textContent = '該日期的某些貨幣資料為空，無法換算。';
      subEl.textContent = '';
      badgeEl.innerHTML = '';
      return;
    }

    const unitVal = crossConvert(1, from, to, nearestKey);
    mainEl.textContent = `${amount.toLocaleString()} ${from} ≈ ${res.toFixed(4)} ${to}`;
    subEl.innerHTML = `
      使用最接近日期：<b>${nearestKey}</b><br>
      即期匯率：<b>1 ${from} ≈ ${unitVal.toFixed(6)} ${to}</b>
    `;
    badgeEl.innerHTML = `<span class="badge">跨幣換算：透過 USD 作為中介貨幣計算</span>`;
  });
}

// Tab2: single currency vs USD
function setupCompare() {
  const ctx = document.getElementById('cmp-chart').getContext('2d');
  document.getElementById('btn-compare').addEventListener('click', () => {
    const ccy = document.getElementById('cmp-ccy').value;
    const dA = new Date(document.getElementById('cmp-date-a').value);
    const dB = new Date(document.getElementById('cmp-date-b').value);
    if (!ccy || !dA || !dB) return;
    const kA = nearestDate(dA);
    const kB = nearestDate(dB);
    const rA = getRate(kA, ccy);
    const rB = getRate(kB, ccy);
    const mainEl = document.getElementById('cmp-result-main');
    const subEl = document.getElementById('cmp-result-sub');
    const badgeEl = document.getElementById('cmp-result-badges');

    if (rA == null || rB == null) {
      mainEl.textContent = '選定期間中有缺少該貨幣的資料。';
      subEl.textContent = '';
      badgeEl.innerHTML = '';
      return;
    }

    const pctNominal = (rB / rA - 1) * 100;
    const usdPerUnitA = 1 / rA;
    const usdPerUnitB = 1 / rB;
    const pctStrength = (usdPerUnitB / usdPerUnitA - 1) * 100;

    const dirNominal = pctNominal > 0 ? '貶值（對 USD 數字變大）' : '升值（對 USD 數字變小）';
    const dirStrength = pctStrength > 0 ? '升值' : '貶值';

    mainEl.textContent = `${ccy} 對 USD 從 ${kA} 到 ${kB}，名目匯率變化約 ${pctNominal.toFixed(2)}%，屬於 ${dirNominal}。`;
    subEl.innerHTML = `
      1 USD = ${rA.toFixed(4)} ${ccy} （${kA}）<br>
      1 USD = ${rB.toFixed(4)} ${ccy} （${kB}）<br>
      若從「每 1 單位 ${ccy} 能換得多少 USD」來看，${ccy} 對 USD ${dirStrength} 約 ${Math.abs(pctStrength).toFixed(2)}%。
    `;

    const badgeClass = pctStrength > 0 ? 'good' : 'bad';
    const badgeText = pctStrength > 0 ? '貨幣相對走強（同樣 1 單位可換到更多 USD）' : '貨幣相對走弱（同樣 1 單位可換到更少 USD）';
    badgeEl.innerHTML = `
      <span class="badge ${badgeClass}">${badgeText}</span>
      <span class="badge">名目匯率：數字越大代表每 1 USD 能換到的該貨幣越多</span>
    `;

    const labels = dateKeys;
    const series = labels.map(k => getRate(k, ccy));

    if (cmpChart) cmpChart.destroy();
    cmpChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `1 USD = ? ${ccy}`,
            data: series,
            borderWidth: 1.5,
            pointRadius: 0
          }
        ]
      },
      options: {
        animation: false,
        plugins: {
          legend: { labels: { color: '#e5e7eb', font: { size: 11 } } }
        },
        scales: {
          x: {
            ticks: { color: '#9ca3af', maxTicksLimit: 6 },
            grid: { display: false }
          },
          y: {
            ticks: { color: '#9ca3af' },
            grid: { color: '#1f2937' }
          }
        }
      }
    });
  });
}

// Tab3: trend
function setupTrend() {
  const ctx = document.getElementById('tr-chart').getContext('2d');
  document.getElementById('btn-trend').addEventListener('click', () => {
    const c1 = document.getElementById('tr-ccy1').value;
    const c2 = document.getElementById('tr-ccy2').value || null;
    const yA = parseInt(document.getElementById('tr-year-a').value, 10);
    const yB = parseInt(document.getElementById('tr-year-b').value, 10);
    if (!c1 || !yA || !yB) return;
    const yMin = Math.min(yA, yB);
    const yMax = Math.max(yA, yB);

    const labels = [];
    const series1 = [];
    const series2 = [];

    for (let k of dateKeys) {
      const year = parseInt(k.slice(0, 4), 10);
      if (year < yMin || year > yMax) continue;
      labels.push(k);
      series1.push(getRate(k, c1));
      if (c2) series2.push(getRate(k, c2));
    }

    if (trendChart) trendChart.destroy();
    const datasets = [
      {
        label: `1 USD = ? ${c1}`,
        data: series1,
        borderWidth: 1.5,
        pointRadius: 0
      }
    ];
    if (c2) {
      datasets.push({
        label: `1 USD = ? ${c2}`,
        data: series2,
        borderWidth: 1.5,
        pointRadius: 0
      });
    }

    trendChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        animation: false,
        plugins: {
          legend: { labels: { color: '#e5e7eb', font: { size: 11 } } }
        },
        scales: {
          x: {
            ticks: { color: '#9ca3af', maxTicksLimit: 8 },
            grid: { display: false }
          },
          y: {
            ticks: { color: '#9ca3af' },
            grid: { color: '#1f2937' }
          }
        }
      }
    });
  });
}

// Tab4: salary purchasing power (FX only)
function setupPP() {
  const ctx = document.getElementById('pp-chart').getContext('2d');
  document.getElementById('btn-pp').addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('pp-amount').value);
    const ccy = document.getElementById('pp-ccy').value;
    const yA = parseInt(document.getElementById('pp-year-a').value, 10);
    const yB = parseInt(document.getElementById('pp-year-b').value, 10);
    if (!amount || !ccy || !yA || !yB) return;
    const yMin = Math.min(yA, yB);
    const yMax = Math.max(yA, yB);

    const kA = nearestDate(new Date(`${yA}-01-01`));
    const kB = nearestDate(new Date(`${yB}-01-01`));
    const rA = getRate(kA, ccy);
    const rB = getRate(kB, ccy);
    const mainEl = document.getElementById('pp-result-main');
    const subEl = document.getElementById('pp-result-sub');
    const badgeEl = document.getElementById('pp-result-badges');

    if (rA == null || rB == null) {
      mainEl.textContent = '選定年份附近缺少該貨幣的匯率資料。';
      subEl.textContent = '';
      badgeEl.innerHTML = '';
      return;
    }

    const eqAtB = amount * (rB / rA); // 要在年份 B 擁有相同 USD 購買力所需名目薪資
    const ratio = (eqAtB / amount - 1) * 100;

    const usdA = amount / rA;
    const usdB_ifSameNominal = amount / rB;
    const usdPctChange = (usdB_ifSameNominal / usdA - 1) * 100;

    mainEl.textContent = `${yA} 年的 ${amount.toLocaleString()} ${ccy}，若要在 ${yB} 年維持同樣對 USD 的購買力，需約 ${eqAtB.toFixed(0)} ${ccy}。`;
    subEl.innerHTML = `
      以匯率估算：<br>
      ${yA} 年：1 USD ≈ ${rA.toFixed(4)} ${ccy}，${amount.toLocaleString()} ${ccy} ≈ ${(usdA).toFixed(2)} USD<br>
      ${yB} 年：1 USD ≈ ${rB.toFixed(4)} ${ccy}，若仍是 ${amount.toLocaleString()} ${ccy}，≈ ${(usdB_ifSameNominal).toFixed(2)} USD<br>
      要維持 ${yA} 年的 USD 購買力，${yB} 年名目薪資需增加約 ${ratio.toFixed(2)}%。
    `;

    const badgeClass = usdPctChange > 0 ? 'good' : 'bad';
    const badgeText = usdPctChange > 0
      ? `若名目薪資不變，${yB} 年對 USD 購買力比 ${yA} 年高 ${usdPctChange.toFixed(2)}%`
      : `若名目薪資不變，${yB} 年對 USD 購買力比 ${yA} 年低 ${Math.abs(usdPctChange).toFixed(2)}%`;

    badgeEl.innerHTML = `
      <span class="badge ${badgeClass}">${badgeText}</span>
      <span class="badge">注意：此為「匯率版購買力」，未納入物價與 CPI。</span>
    `;

    // 建立整段期間購買力曲線：假設名目薪資固定為 amount，每年可換到多少 USD
    const labels = [];
    const usdSeries = [];
    for (let k of dateKeys) {
      const year = parseInt(k.slice(0, 4), 10);
      if (year < yMin || year > yMax) continue;
      const rate = getRate(k, ccy);
      if (!rate) continue;
      labels.push(k);
      usdSeries.push(amount / rate); // 固定名目薪資下，每期可換到多少 USD
    }

    if (ppChart) ppChart.destroy();
    ppChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `固定 ${amount.toLocaleString()} ${ccy} 名目薪資可換得的 USD 數量`,
            data: usdSeries,
            borderWidth: 1.5,
            pointRadius: 0
          }
        ]
      },
      options: {
        animation: false,
        plugins: {
          legend: { labels: { color: '#e5e7eb', font: { size: 11 } } }
        },
        scales: {
          x: {
            ticks: { color: '#9ca3af', maxTicksLimit: 8 },
            grid: { display: false }
          },
          y: {
            ticks: { color: '#9ca3af' },
            grid: { color: '#1f2937' }
          }
        }
      }
    });
  });
}

// Tab5: multi-currency comparison
function setupMultiCompare() {
  const ctx = document.getElementById('mc-chart').getContext('2d');
  document.getElementById('btn-mc').addEventListener('click', () => {
    const sel = document.getElementById('mc-ccys');
    const selected = Array.from(sel.selectedOptions).map(o => o.value);
    const yA = parseInt(document.getElementById('mc-year-a').value, 10);
    const yB = parseInt(document.getElementById('mc-year-b').value, 10);
    if (!selected.length || !yA || !yB) return;

    const yMin = Math.min(yA, yB);
    const yMax = Math.max(yA, yB);

    const labels = [];
    for (let k of dateKeys) {
      const year = parseInt(k.slice(0, 4), 10);
      if (year < yMin || year > yMax) continue;
      labels.push(k);
    }

    const datasets = [];
    const summary = [];

    selected.forEach(ccy => {
      const series = [];
      let baseRate = null;
      let lastVal = null;

      labels.forEach((k, idx) => {
        const r = getRate(k, ccy);
        if (!r) {
          series.push(null);
          return;
        }
        if (baseRate == null) baseRate = r;
        const idxVal = (r / baseRate) * 100;
        series.push(idxVal);
        lastVal = idxVal;
      });

      if (baseRate == null) return;

      const startVal = 100;
      const endVal = lastVal != null ? lastVal : 100;
      const pct = (endVal / startVal - 1) * 100;
      const dir = pct > 0 ? '名目上對 USD 貶值（數字變大）' : '名目上對 USD 升值（數字變小）';
      summary.push(`${ccy}：指數 ${startVal.toFixed(0)} → ${endVal.toFixed(1)}（${pct.toFixed(2)}%，${dir}）`);

      datasets.push({
        label: `${ccy}（起點=100）`,
        data: series,
        borderWidth: 1.5,
        pointRadius: 0
      });
    });

    if (!datasets.length) return;

    if (mcChart) mcChart.destroy();
    mcChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        animation: false,
        plugins: {
          legend: { labels: { color: '#e5e7eb', font: { size: 11 } } }
        },
        scales: {
          x: {
            ticks: { color: '#9ca3af', maxTicksLimit: 8 },
            grid: { display: false }
          },
          y: {
            ticks: { color: '#9ca3af' },
            grid: { color: '#1f2937' }
          }
        }
      }
    });

    const mainEl = document.getElementById('mc-result-main');
    const subEl = document.getElementById('mc-result-sub');
    mainEl.textContent = `多貨幣相對強弱（基準：1 USD = ? 貨幣，並將起始年份指數化為 100）。`;
    subEl.innerHTML = summary.join('<br>');
  });
}

// PWA
function setupPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(console.error);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupConvert();
  setupCompare();
  setupTrend();
  setupPP();
  setupMultiCompare();
  setupPWA();
  await loadData();
});
