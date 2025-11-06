/**
 * 主題管理模組
 * 負責深色/淺色模式的切換和持久化
 */

class ThemeManager {
  constructor() {
    this.THEME_KEY = 'stock-analysis-theme';
    this.initTheme();
  }

  /**
   * 初始化主題 - 讀取本地存儲或使用系統預設
   */
  initTheme() {
    const saved = localStorage.getItem(this.THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;
    
    this.setTheme(isDark ? 'dark' : 'light');
  }

  /**
   * 設置主題
   * @param {string} theme - 'dark' 或 'light'
   */
  setTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem(this.THEME_KEY, theme);
    this.updateToggleButton();
  }

  /**
   * 切換主題
   */
  toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    this.setTheme(isDark ? 'light' : 'dark');
  }

  /**
   * 更新主題切換按鈕的文字
   */
  updateToggleButton() {
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
      const isDark = document.documentElement.classList.contains('dark');
      btn.textContent = isDark ? '☀️ 淺色' : '🌙 深色';
    }
  }

  /**
   * 獲取當前主題
   */
  getCurrentTheme() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
}

// 全局實例
const themeManager = new ThemeManager();

// 頁面加載完成後，自動綁定主題切換按鈕
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.theme-toggle');
  if (btn) {
    btn.addEventListener('click', () => themeManager.toggleTheme());
  }
});
