import { state } from './store.js';
import { saveMarketData } from './storage.js';
import { afterDataChanged } from './utils.js';

export function initUploader() {
  const el = document.getElementById('fileInput');
  if (!el) return;
  el.addEventListener('change', handleFileUpload);
}

function handleFileUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const nameEl = document.getElementById('fileName');
  if (nameEl) nameEl.textContent = `已選擇: ${file.name}`;
  const reader = new FileReader();
  reader.onload = ev => {
    const data = ev.target.result;
    if (file.name.endsWith('.csv')) parseCSV(data);
    else parseExcel(data);
  };
  if (file.name.endsWith('.csv')) reader.readAsText(file, 'utf-8');
  else reader.readAsBinaryString(file);
}

function parseCSV(data) {
  if (typeof Papa === 'undefined') { alert('未載入 PapaParse'); return; }
  Papa.parse(data, {
    header: true, dynamicTyping: true, skipEmptyLines: true,
    complete: res => prepareNewData(res.data),
    error: err => alert('CSV 解析失敗: ' + err.message)
  });
}

function parseExcel(data) {
  try {
    if (typeof XLSX === 'undefined') throw new Error('未載入 XLSX');
    const wb = XLSX.read(data, { type: 'binary' });
    const first = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(first);
    prepareNewData(json);
  } catch (e) { alert('Excel 解析失敗: ' + e.message); }
}

function normalizeRow(row) {
  const n = v => (v == null || v === '' ? 0 : parseFloat(v));
  return {
    日期: row['日期'] || row['date'] || '',
    代碼: String(row['代碼'] || row['code'] || '').trim(),
    商品: row['商品'] || row['name'] || '',
    收盤價: n(row['收盤價'] || row['close']),
    漲跌幅: n(row['漲跌幅'] || row['change%']),
    成交量: n(row['成交量'] || row['volume']),
    開盤價: n(row['開盤價'] || row['open']),
    最高價: n(row['最高價'] || row['high']),
    最低價: n(row['最低價'] || row['low'])
  };
}

export function prepareNewData(raw) {
  state.pendingNewData = raw.map(normalizeRow).filter(r => r.代碼 && r.日期 && !isNaN(r.收盤價));
  if (state.pendingNewData.length === 0) { alert('❌ 檔案中沒有有效的資料'); return; }

  if (state.marketData.length === 0) {
    state.marketData = state.pendingNewData;
    saveMarketData();
    alert(`✅ 資料載入成功！共 ${state.marketData.length} 筆`);
    afterDataChanged();
    state.pendingNewData = [];
    return;
  }
  const existEl = document.getElementById('existingDataCount');
  const newEl = document.getElementById('newDataCount');
  if (existEl) existEl.textContent = state.marketData.length.toLocaleString();
  if (newEl) newEl.textContent = state.pendingNewData.length.toLocaleString();
  const modal = document.getElementById('mergeModal');
  if (modal) modal.style.display = 'block';
}

export function confirmMerge() {
  const op = document.querySelector('input[name="mergeOption"]:checked')?.value || 'merge';
  closeMergeModal();
  if (op === 'merge') smartMerge(); else if (op === 'replace') replace(); else append();
  saveMarketData();
  alert(`✅ 資料已${{merge:'智慧合併',replace:'完全覆蓋',append:'直接新增'}[op]}！目前共 ${state.marketData.length} 筆`);
  afterDataChanged();
  state.pendingNewData = [];
}

export const closeMergeModal = () => {
  const modal = document.getElementById('mergeModal');
  if (modal) modal.style.display = 'none';
};

function smartMerge() {
  const map = new Map();
  state.marketData.forEach(i => map.set(i.代碼 + '_' + i.日期, i));
  state.pendingNewData.forEach(i => map.set(i.代碼 + '_' + i.日期, i));
  state.marketData = [...map.values()].sort((a,b)=>{
    const d = new Date(a.日期) - new Date(b.日期);
    return d !== 0 ? d : a.代碼.localeCompare(b.代碼);
  });
}
const replace = () => { state.marketData = state.pendingNewData; };
const append  = () => { state.marketData = state.marketData.concat(state.pendingNewData); };
