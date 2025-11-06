/**
 * 通用工具函數模組
 * 提供所有頁面使用的共用函數
 */

/**
 * 安全數字格式化
 * @param {number} v - 要格式化的值
 * @param {number} dec - 小數位數，預設 2
 * @returns {string} 格式化後的字符串或 '—'
 */
function safeNum(v, dec = 2) {
  if (v == null || isNaN(v)) return '—';
  return Number(v).toFixed(dec);
}

/**
 * HTML 轉義 - 防止 XSS 攻擊
 * @param {string} str - 要轉義的字符串
 * @returns {string} 轉義後的字符串
 */
function escapeHTML(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * CSV 格式化引號
 * @param {string} str - 要格式化的字符串
 * @returns {string} 帶引號的字符串
 */
function quoteForCSV(str) {
  if (str == null) return '';
  const s = String(str).replace(/"/g, '""');
  return `"${s}"`;
}

/**
 * 文字下載
 * @param {string} filename - 檔案名稱
 * @param {string} text - 內容
 */
function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 基礎驗證 - 檢查必填欄位
 * @param {object} obj - 要驗證的對象
 * @param {array} requiredFields - 必填欄位列表
 * @returns {boolean} 是否通過驗證
 */
function validateRequired(obj, requiredFields) {
  for (const field of requiredFields) {
    if (!obj[field]) return false;
  }
  return true;
}

/**
 * 延遲執行
 * @param {number} ms - 毫秒數
 * @returns {promise}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 深拷貝
 * @param {any} obj - 要複製的對象
 * @returns {any} 複製後的對象
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 格式化日期
 * @param {string|date} dateStr - 日期字符串或 Date 對象
 * @param {string} format - 格式，如 'YYYY-MM-DD'
 * @returns {string} 格式化後的日期
 */
function formatDate(dateStr, format = 'YYYY-MM-DD') {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return '—';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 數字千分位格式化
 * @param {number} num - 數字
 * @returns {string} 千分位格式化後的字符串
 */
function formatThousands(num) {
  if (num == null || isNaN(num)) return '—';
  return Number(num).toLocaleString('zh-TW');
}

/**
 * 百分比格式化
 * @param {number} value - 值（0-1 或 0-100）
 * @param {boolean} isDecimal - 是否為小數形式，預設 true
 * @returns {string} 百分比字符串
 */
function formatPercent(value, isDecimal = true) {
  if (value == null || isNaN(value)) return '—';
  const num = isDecimal ? value * 100 : value;
  return num.toFixed(2) + '%';
}

/**
 * 判斷是否為正數/負數/零
 * @param {number} num - 數字
 * @returns {string} 'positive', 'negative', 'zero', 或 'invalid'
 */
function getNumericTrend(num) {
  if (num == null || isNaN(num)) return 'invalid';
  if (num > 0) return 'positive';
  if (num < 0) return 'negative';
  return 'zero';
}

/**
 * 顏色根據趨勢變化
 * @param {number} value - 值
 * @returns {string} CSS 變數名稱
 */
function getTrendColor(value) {
  const trend = getNumericTrend(value);
  if (trend === 'positive') return 'var(--trend-pos)';
  if (trend === 'negative') return 'var(--trend-neg)';
  return 'var(--trend-neutral)';
}

/**
 * 生成唯一 ID
 * @returns {string} UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 頁面導航
 * @param {string} page - 頁面名稱
 * @param {object} params - URL 參數
 */
function navigateTo(page, params = {}) {
  let url = page;
  if (Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    url += '?' + queryString;
  }
  window.location.href = url;
}

/**
 * 獲取 URL 查詢參數
 * @param {string} key - 參數名稱
 * @returns {string|null} 參數值
 */
function getURLParam(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

/**
 * 所有 URL 查詢參數
 * @returns {object} 參數對象
 */
function getAllURLParams() {
  const params = {};
  new URLSearchParams(window.location.search).forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

/**
 * 複製文本到剪貼板
 * @param {string} text - 要複製的文本
 * @returns {promise}
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('複製失敗:', err);
    return false;
  }
}

/**
 * 顯示提示消息
 * @param {string} message - 消息
 * @param {string} type - 類型: 'success', 'error', 'info', 'warning'
 * @param {number} duration - 持續時間（毫秒）
 */
function showNotification(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `notification notification-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    background: var(--alert-${type}-bg);
    color: var(--alert-${type}-text);
    border: 1px solid var(--alert-${type}-border);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  if (duration > 0) {
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  
  return toast;
}
