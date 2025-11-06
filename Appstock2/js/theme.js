import { STORAGE_KEYS, state } from './store.js';
import { rebuildChartIfNeeded } from './analyze.js';

export function initTheme() {
  if (localStorage.getItem(STORAGE_KEYS.THEME) === '1') {
    document.body.classList.add('dark');
  }
  updateThemeButton();
  document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);
}

export function toggleTheme() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem(STORAGE_KEYS.THEME, isDark ? '1' : '0');
  updateThemeButton();
  rebuildChartIfNeeded(state.lastAnalyzedSlice);
}

function updateThemeButton() {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = document.body.classList.contains('dark') ? '☀️ 日間模式' : '🌙 夜間模式';
}
