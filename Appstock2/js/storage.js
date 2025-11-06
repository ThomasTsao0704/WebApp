import { state, STORAGE_KEYS } from './store.js';

export function loadMarketData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MARKET_DATA);
    if (!stored) { state.marketData = []; return; }
    const parsed = JSON.parse(stored);
    state.marketData = parsed?.data ?? (Array.isArray(parsed) ? parsed : []);
    if (!parsed?.data) saveMarketData();
  } catch { state.marketData = []; }
}

export function saveMarketData() {
  const payload = {
    version: '2.0',
    lastUpdate: new Date().toISOString(),
    recordCount: state.marketData.length,
    data: state.marketData
  };
  const json = JSON.stringify(payload);
  const size = new Blob([json]).size;
  if (size > 4.5 * 1024 * 1024) throw new Error('QuotaExceeded');
  localStorage.setItem(STORAGE_KEYS.MARKET_DATA, json);
}

export function loadRecords() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PERSONAL_RECORDS);
    if (!stored) { state.personalRecords = []; return; }
    const parsed = JSON.parse(stored);
    state.personalRecords = parsed?.records ?? (Array.isArray(parsed) ? parsed : []);
    if (!parsed?.records) saveRecords();
  } catch { state.personalRecords = []; }
}

export function saveRecords() {
  const payload = {
    version: '2.0',
    lastUpdate: new Date().toISOString(),
    recordCount: state.personalRecords.length,
    records: state.personalRecords
  };
  localStorage.setItem(STORAGE_KEYS.PERSONAL_RECORDS, JSON.stringify(payload));
}

export const loadPortfolio = () => {
  try {
    state.portfolio = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIO)) || [];
  } catch { state.portfolio = []; }
};
export const savePortfolio = () =>
  localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(state.portfolio));

export const loadAlerts = () => {
  try {
    state.alerts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ALERTS)) || [];
  } catch { state.alerts = []; }
};
export const saveAlerts = () =>
  localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(state.alerts));
