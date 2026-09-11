# BIS Dynamic Explorer｜Google Apps Script 版

## 1. GAS
1. 建立 Google Apps Script 專案。
2. 將 `Code.gs` 全部貼上。
3. 部署 → 新增部署作業 → 網頁應用程式。
4. 執行身分選「我」。
5. 存取權選「任何人」。
6. 複製 `/exec` 網址。

## 2. GitHub
將 `index.html`、`app.js`、`style.css`、`dims_cache.json` 放入 GitHub repository。
在 `app.js` 最上方：
```js
const GAS_API_URL = "你的 GAS /exec 網址";
```
替換後 push。

## 3. GitHub Pages
Repository → Settings → Pages → Deploy from a branch → 選 main / root。

## 4. 架構
GitHub Pages（前端） → GAS Web App（JSONP Proxy） → BIS SDMX API。

## 5. 注意
本版本用 JSONP 讓 GitHub Pages 不受一般 fetch CORS 限制。GAS 端負責 BIS Structure、Availability、Data 與 SDMX-JSON 解碼。
