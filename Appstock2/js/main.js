import { loadMarketData, loadRecords, loadPortfolio, loadAlerts } from './storage.js';
import { initTheme } from './theme.js';
import { bindTabButtons } from './tabs.js';
import { initUploader, confirmMerge } from './upload.js';
import { updateMgmtUI } from './utils.js';
import { updateDashboard } from './dashboard.js';
import { initLimitUp, updateLimitUp } from './limitup.js';
import { initConcepts, updateConcepts } from './concepts.js';
import { initRecords } from './records.js';
import { initPortfolio } from './portfolio.js';
import { initAlerts } from './alerts.js';
import { initSearch } from './search.js';
import { initCompare } from './compare.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadMarketData();
  loadRecords();
  loadPortfolio();
  loadAlerts();

  updateMgmtUI();
  updateDashboard();
  initLimitUp();     updateLimitUp();
  initConcepts();    updateConcepts();
  initRecords();
  initPortfolio();
  initAlerts();
  initSearch();
  initCompare();
  bindTabButtons();
  initUploader();

  document.querySelector('#mergeModal .btn:not(.btn-secondary)')?.addEventListener('click', confirmMerge);

  window.addEventListener('analyze:jump', (e)=>{
    const { code } = e.detail || {};
    if (!code) return;
    import('./analyze.js').then(m => m.jumpAnalyze?.(code));
  });
});
