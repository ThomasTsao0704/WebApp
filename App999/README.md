# Stock Cards Dashboard - HTML/CSS/JS 版本

## 專案說明

這是一個純 HTML/CSS/JavaScript 實作的台股資料看板，不需要 React 或其他框架。

## 功能特色

- 📊 顯示台股每日盤後資料
- 🔍 即時搜尋股票代號或名稱
- 📈 多種排序方式（漲跌幅、成交量、成交金額）
- 📉 K線圖視覺化（最多顯示 10 根 K 棒）
- 💡 互動式 Tooltip 顯示詳細價格資訊
- 🎨 現代化卡片式設計

## 檔案結構

```
.
├── index.html          # 主要 HTML 檔案
├── style.css           # 樣式表
├── app.js              # 主要應用程式邏輯
├── update_data.py      # Python 資料更新腳本
└── public/
    └── data/
        ├── manifest.json       # 檔案清單
        ├── 20250110.csv       # 每日資料檔案
        ├── 20250111.csv
        └── ...
```

## 安裝與設定

### 1. 安裝 Python 依賴

```bash
pip install requests
```

### 2. 建立資料目錄

```bash
mkdir -p public/data
```

### 3. 執行資料更新腳本

```bash
python update_data.py
```

這會：
- 從 TWSE API 抓取當日資料
- 儲存為 `public/data/YYYYMMDD.csv`
- 更新 `public/data/manifest.json`

### 4. 啟動本地伺服器

由於需要載入 CSV 檔案，必須使用 HTTP 伺服器，不能直接開啟 HTML 檔案。

**使用 Python:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**使用 Node.js:**
```bash
npx http-server -p 8000
```

**使用 PHP:**
```bash
php -S localhost:8000
```

### 5. 開啟瀏覽器

訪問 `http://localhost:8000`

## 資料格式

CSV 檔案應包含以下欄位：
- `Symbol` - 股票代號
- `Name` - 股票名稱
- `Market` - 市場別（上市/上櫃）
- `Date` - 日期
- `Open` - 開盤價
- `High` - 最高價
- `Low` - 最低價
- `Close` - 收盤價
- `Avg` - 均價
- `ChangePct` - 漲跌幅（%）
- `Volume` - 成交量
- `Turnover` - 成交金額

## 使用說明

### 搜尋功能
在搜尋框輸入股票代號或名稱，系統會即時過濾顯示結果。

### 排序功能
可以選擇三種排序方式：
1. **漲跌幅 (Change %)** - 預設
2. **成交量 (Volume)**
3. **成交金額 (Turnover)**

並可選擇升序或降序排列。

### K線圖
- 每張卡片顯示最近 10 筆歷史資料的 K 線圖
- 綠色表示上漲，紅色表示下跌
- 藍色小點表示均價
- 滑鼠移到 K 棒上會顯示詳細資訊

## 技術架構

- **前端**: 純 HTML/CSS/JavaScript（無框架）
- **CSV 解析**: PapaParse 5.4.1（CDN）
- **資料來源**: TWSE 證交所 API
- **後端**: Python 3.x（資料更新）

## 自訂設定

### 修改顯示的 K 棒數量

編輯 `app.js` 中的常數：
```javascript
const MAX_CANDLES = 10;  // 改成你想要的數量
```

### 修改圖表尺寸

編輯 `app.js` 中的常數：
```javascript
const CHART_WIDTH = 120;   // 寬度
const CHART_HEIGHT = 60;   // 高度
const CHART_PADDING = 4;   // 邊距
```

### 修改卡片樣式

編輯 `style.css` 中的 `.card` 類別。

## 定期更新資料

建議使用 cron 或 Task Scheduler 定期執行 `update_data.py`：

**Linux/Mac (crontab):**
```bash
# 每天下午 3 點執行
0 15 * * * cd /path/to/project && python update_data.py
```

**Windows (Task Scheduler):**
1. 開啟「工作排程器」
2. 建立基本工作
3. 設定觸發時間（每天下午 3 點）
4. 動作選擇「啟動程式」
5. 程式選擇 Python，參數輸入 `update_data.py`

## 瀏覽器支援

- Chrome / Edge 90+
- Firefox 88+
- Safari 14+

需要支援：
- ES6+ JavaScript
- CSS Grid
- SVG
- Fetch API

## 授權

本專案僅供學習和個人使用。資料來源為台灣證券交易所，請遵守其使用條款。

## 疑難排解

### 問題：CSV 檔案無法載入
**解決方案**：確認你使用 HTTP 伺服器而非直接開啟 HTML 檔案。

### 問題：沒有資料顯示
**解決方案**：
1. 檢查 `public/data/manifest.json` 是否存在
2. 檢查 CSV 檔案格式是否正確
3. 開啟瀏覽器開發者工具查看錯誤訊息

### 問題：K線圖沒有顯示
**解決方案**：確認至少有 2 筆以上的歷史資料。

## 更新記錄

- v1.0.0 (2025-01-12)
  - 初始版本
  - 基本功能實作
  - K線圖視覺化
  - 搜尋與排序功能
