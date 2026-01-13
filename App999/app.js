// 全域狀態
const state = {
  rows: [],
  history: {},
  search: '',
  sortField: 'ChangePct',
  sortOrder: 'desc',
  loading: true,
  error: null,
  availableFiles: [],
  selectedFile: null
};

// 常數
const CHART_WIDTH = 120;
const CHART_HEIGHT = 60;
const CHART_PADDING = 4;
const MAX_CANDLES = 10;

// CSV 載入工具函數
function loadCsv(path) {
  return new Promise((resolve, reject) => {
    Papa.parse(path, {
      download: true,
      header: true,
      complete: (res) => resolve(res.data),
      error: (err) => reject(err)
    });
  });
}

// 載入可用的數據文件列表
async function loadManifest() {
  try {
    const manifestRes = await fetch('/data/manifest.json');
    if (!manifestRes.ok) {
      throw new Error('Failed to load manifest.json');
    }

    const manifest = await manifestRes.json();
    state.availableFiles = manifest.files || [];

    if (state.availableFiles.length === 0) {
      throw new Error('No CSV files in manifest.json');
    }

    // 初始化下拉選單
    populateFileSelect();

    // 預設選擇第一個文件
    state.selectedFile = state.availableFiles[0];
    document.getElementById('dataFileSelect').value = state.selectedFile;

  } catch (e) {
    console.error(e);
    state.error = e.message;
  }
}

// 填充文件選擇下拉選單
function populateFileSelect() {
  const select = document.getElementById('dataFileSelect');
  select.innerHTML = '';

  state.availableFiles.forEach(file => {
    const option = document.createElement('option');
    option.value = file;
    option.textContent = file.replace('.csv', '').replace(/_/g, ' ');
    select.appendChild(option);
  });
}

// 載入單一數據文件
async function loadDataFile(filename) {
  try {
    setLoading(true);

    const data = await loadCsv(`/data/${filename}`);
    const clean = data.filter(r => r && r.Symbol);

    const historyMap = {};

    for (const r of clean) {
      const sym = r.Symbol;
      if (!historyMap[sym]) historyMap[sym] = [];
      historyMap[sym].push({
        Date: r.Date,
        Open: r.Open,
        High: r.High,
        Low: r.Low,
        Avg: r.Avg,
        Close: r.Close
      });
    }

    // 排序每個股票的歷史資料
    Object.keys(historyMap).forEach(sym => {
      historyMap[sym].sort((a, b) => (a.Date > b.Date ? 1 : -1));
    });

    // 取得最新日期的資料
    const dates = clean.map(r => r.Date).filter(Boolean);
    const latestDate = dates.sort().slice(-1)[0];
    const latestRows = clean.filter(r => r.Date === latestDate);

    state.rows = latestRows;
    state.history = historyMap;
    state.error = null;

  } catch (e) {
    console.error(e);
    state.error = e.message;
  } finally {
    setLoading(false);
    render();
  }
}

// 載入所有資料（已棄用，改為載入單一文件）
async function loadAllData() {
  await loadManifest();
  if (state.selectedFile) {
    await loadDataFile(state.selectedFile);
  }
}

// 設定載入狀態
function setLoading(isLoading) {
  state.loading = isLoading;
  const loadingEl = document.getElementById('loadingMessage');
  loadingEl.style.display = isLoading ? 'block' : 'none';
}

// 過濾資料
function getFilteredRows() {
  return state.rows.filter(r => {
    if (!state.search.trim()) return true;
    const q = state.search.trim().toLowerCase();
    const sym = (r.Symbol || '').toString().toLowerCase();
    const name = (r.Name || '').toString().toLowerCase();
    return sym.includes(q) || name.includes(q);
  });
}

// 排序資料
function getSortedRows(filtered) {
  return [...filtered].sort((a, b) => {
    const dir = state.sortOrder === 'asc' ? 1 : -1;
    let va = 0, vb = 0;
    
    if (state.sortField === 'ChangePct') {
      va = parseFloat(String(a.ChangePct || '0').replace('%', ''));
      vb = parseFloat(String(b.ChangePct || '0').replace('%', ''));
    } else if (state.sortField === 'Volume') {
      va = Number(a.Volume || 0);
      vb = Number(b.Volume || 0);
    } else if (state.sortField === 'Turnover') {
      va = Number(a.Turnover || 0);
      vb = Number(b.Turnover || 0);
    }
    
    if (isNaN(va)) va = 0;
    if (isNaN(vb)) vb = 0;
    return (vb - va) * dir;
  });
}

// 創建股票卡片 HTML
function createStockCard(row, history) {
  const pct = row.ChangePct || '0%';
  const sign = pct.includes('-') ? '↓' : '↑';
  const color = pct.includes('-') ? '#EF4444' : '#22C55E';

  const card = document.createElement('div');
  card.className = 'card';

  // 解析歷史資料
  const parsedHistory = (history || [])
    .map(h => ({
      date: h.Date,
      open: parseFloat(h.Open),
      high: parseFloat(h.High),
      low: parseFloat(h.Low),
      avg: parseFloat(h.Avg),
      close: parseFloat(h.Close)
    }))
    .filter(h => [h.open, h.high, h.low, h.close].every(v => !isNaN(v)));

  const candles = parsedHistory.slice(-MAX_CANDLES);
  const hasHistory = candles.length > 1;

  // 計算額外資訊
  const open = parseFloat(row.Open) || 0;
  const high = parseFloat(row.High) || 0;
  const low = parseFloat(row.Low) || 0;
  const avg = parseFloat(row.Avg) || 0;
  const close = parseFloat(row.Close) || 0;
  const volume = Number(row.Volume || 0);
  const turnover = Number(row.Turnover || 0);
  const priceChange = close - open;
  const priceChangeStr = priceChange >= 0 ? `+${priceChange.toFixed(2)}` : priceChange.toFixed(2);
  const avgPrice = volume > 0 ? (turnover / volume).toFixed(2) : avg.toFixed(2);

  card.innerHTML = `
    <div class="card-front">
      <div class="card-header">
        <div class="title" data-flip-trigger>${row.Symbol} ${row.Name} (${row.Market})</div>
        <div class="date">${row.Date}</div>
      </div>
      <div class="main-row">
        <div class="main-left">
          <div class="price-row">
            <div class="price-value">${close}</div>
            <div class="price-change" style="color: ${color}">
              ${pct} ${sign}
            </div>
          </div>
          <div class="sub">Volume: ${volume.toLocaleString()}</div>
          <div class="sub">Turnover: ${turnover.toLocaleString()}</div>
        </div>
        <div class="main-right">
          ${hasHistory ? createCandlestickChart(candles) : '<div class="sparkline-placeholder">No history</div>'}
        </div>
      </div>
    </div>
    <div class="card-back">
      <div class="back-header" data-flip-trigger>${row.Symbol} ${row.Name}</div>
      <div class="info-row">
        <span class="info-label">開盤 (Open)</span>
        <span class="info-value">${open.toFixed(2)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">最高 (High)</span>
        <span class="info-value">${high.toFixed(2)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">最低 (Low)</span>
        <span class="info-value">${low.toFixed(2)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">收盤 (Close)</span>
        <span class="info-value">${close.toFixed(2)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">均價 (Avg)</span>
        <span class="info-value">${avgPrice}</span>
      </div>
      <div class="info-row">
        <span class="info-label">價格變動</span>
        <span class="info-value" style="color: ${color}">${priceChangeStr}</span>
      </div>
      <div class="flip-hint">點擊標題返回</div>
    </div>
  `;

  // 設定翻轉功能
  setupCardFlip(card);

  // 如果有歷史資料，設定 tooltip 互動
  if (hasHistory) {
    setupCandlestickInteraction(card, candles);
  }

  return card;
}

// 設定卡片翻轉功能
function setupCardFlip(card) {
  const flipTriggers = card.querySelectorAll('[data-flip-trigger]');

  flipTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      card.classList.toggle('flipped');
    });
  });
}

// 創建 K線圖 HTML
function createCandlestickChart(candles) {
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const minLow = Math.min(...lows);
  const maxHigh = Math.max(...highs);
  const range = maxHigh - minLow || 1;
  const candleWidth = CHART_WIDTH / candles.length;
  const bodyWidth = Math.max(1, candleWidth * 0.6);

  const scaleY = value =>
    CHART_PADDING + ((maxHigh - value) / range) * (CHART_HEIGHT - CHART_PADDING * 2);

  const avgWickHalf = 4;
  const avgBodyHeight = 3;

  let svgContent = '';
  
  candles.forEach((c, i) => {
    const xCenter = i * candleWidth + candleWidth / 2;
    const yOpen = scaleY(c.open);
    const yClose = scaleY(c.close);
    const yHigh = scaleY(c.high);
    const yLow = scaleY(c.low);
    const yAvg = Number.isFinite(c.avg) ? scaleY(c.avg) : null;
    
    const isUp = c.close >= c.open;
    const candleColor = isUp ? '#22C55E' : '#EF4444';
    const bodyTop = Math.min(yOpen, yClose);
    const bodyHeight = Math.max(1, Math.abs(yOpen - yClose));
    const avgBodyWidth = Math.max(1, bodyWidth * 0.5);

    svgContent += `
      <g class="candle-group" data-index="${i}">
        <line
          x1="${xCenter}"
          x2="${xCenter}"
          y1="${yHigh}"
          y2="${yLow}"
          stroke="${candleColor}"
          stroke-width="1"
        />
        <rect
          x="${xCenter - bodyWidth / 2}"
          y="${bodyTop}"
          width="${bodyWidth}"
          height="${bodyHeight}"
          fill="${candleColor}"
        />
        ${yAvg !== null ? `
          <line
            class="avg-wick"
            x1="${xCenter}"
            x2="${xCenter}"
            y1="${yAvg - avgWickHalf}"
            y2="${yAvg + avgWickHalf}"
          />
          <rect
            class="avg-body"
            x="${xCenter - avgBodyWidth / 2}"
            y="${yAvg - avgBodyHeight / 2}"
            width="${avgBodyWidth}"
            height="${avgBodyHeight}"
          />
        ` : ''}
      </g>
    `;
  });

  return `
    <div class="candlestick-wrap">
      <svg
        class="candlestick"
        viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}"
        role="img"
        aria-label="Price history candlestick chart"
      >
        ${svgContent}
      </svg>
    </div>
  `;
}

// 設定 K線圖互動
function setupCandlestickInteraction(card, candles) {
  const wrap = card.querySelector('.candlestick-wrap');
  const svg = card.querySelector('.candlestick');
  const groups = svg.querySelectorAll('.candle-group');
  
  let tooltip = null;

  const formatValue = value =>
    Number.isFinite(value) ? value.toString() : '-';

  const showTooltip = (c, x, y) => {
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'candle-tooltip';
      wrap.appendChild(tooltip);
    }

    tooltip.innerHTML = `
      <div class="candle-tooltip-date">${c.date}</div>
      <div class="candle-tooltip-values">
        O:${formatValue(c.open)} H:${formatValue(c.high)} L:${formatValue(c.low)} C:${formatValue(c.close)} A:${formatValue(c.avg)}
      </div>
    `;
    
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${Math.max(CHART_PADDING, y)}px`;
    tooltip.style.display = 'block';
  };

  const hideTooltip = () => {
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  };

  groups.forEach((group, index) => {
    const candle = candles[index];
    const candleWidth = CHART_WIDTH / candles.length;
    const xCenter = index * candleWidth + candleWidth / 2;
    
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const minLow = Math.min(...lows);
    const maxHigh = Math.max(...highs);
    const range = maxHigh - minLow || 1;
    const yHigh = CHART_PADDING + ((maxHigh - candle.high) / range) * (CHART_HEIGHT - CHART_PADDING * 2);

    group.addEventListener('mouseenter', () => showTooltip(candle, xCenter, yHigh));
    group.addEventListener('mousemove', () => showTooltip(candle, xCenter, yHigh));
  });

  svg.addEventListener('mouseleave', hideTooltip);
}

// 渲染畫面
function render() {
  const errorEl = document.getElementById('errorMessage');
  const errorText = errorEl.querySelector('.error');
  const gridEl = document.getElementById('grid');

  // 顯示錯誤訊息
  if (state.error) {
    errorText.textContent = `Error: ${state.error}`;
    errorEl.style.display = 'block';
  } else {
    errorEl.style.display = 'none';
  }

  // 如果正在載入，不渲染卡片
  if (state.loading) {
    gridEl.innerHTML = '';
    return;
  }

  // 過濾和排序資料
  const filtered = getFilteredRows();
  const sorted = getSortedRows(filtered);

  // 清空並重新渲染
  gridEl.innerHTML = '';
  sorted.forEach(row => {
    const card = createStockCard(row, state.history[row.Symbol] || []);
    gridEl.appendChild(card);
  });
}

// 事件處理
function setupEventListeners() {
  const dataFileSelect = document.getElementById('dataFileSelect');
  const searchInput = document.getElementById('searchInput');
  const sortField = document.getElementById('sortField');
  const sortOrder = document.getElementById('sortOrder');

  dataFileSelect.addEventListener('change', (e) => {
    state.selectedFile = e.target.value;
    loadDataFile(state.selectedFile);
  });

  searchInput.addEventListener('input', (e) => {
    state.search = e.target.value;
    render();
  });

  sortField.addEventListener('change', (e) => {
    state.sortField = e.target.value;
    render();
  });

  sortOrder.addEventListener('change', (e) => {
    state.sortOrder = e.target.value;
    render();
  });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadAllData();
});
