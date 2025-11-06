# 模組化安裝說明（不需打包器）

1. 確保你在 `<body>` 結尾、第三方 UMD 庫之後（PapaParse / XLSX / Chart.js）插入：
   ```html
   <script type="module" src="./js/main.js"></script>
   ```

2. 保留頁面上的元素 ID（若你的 index2.html 已有，無需修改）：
   - 檔案上傳：`#fileInput`, 檔名顯示 `#fileName`
   - 合併 Modal：`#mergeModal`（內含 3 個 radio: name="mergeOption"，值 `merge|replace|append`）
     - 其中顯示現有筆數 `#existingDataCount`、新增筆數 `#newDataCount`
   - 儀表板容器：`#dashboardContent`
   - 管理資訊：`#dataCount`, `#dateRange`, `#stockCount`, `#lastUpdate`
   - 主題切換按鈕：`#themeToggleBtn`
   - 圖表區：`#chartWrapper`、`#priceChart`
   - 分頁按鈕：class `.tab`，分頁內容面板 `#tab0`..`#tab8`
   - 其它模組若找不到元素，會優雅忽略（不報錯）。

3. 若你從舊單檔遷移，請移除原本巨長的 `<script>...</script>`，只保留上述 `type="module"` 的入口。

4. 若 localStorage 容量不足（> ~4.5MB）：
   - 先導出或刪減資料後再存；我們在 `saveMarketData()` 會丟 `QuotaExceeded` 的錯。
