# 便利貼佈告欄 PWA 外殼

## 為什麼需要這個資料夾？

Google Apps Script 網頁應用程式（`script.google.com/.../exec`）本身**無法**成為可安裝的 PWA：
Google 會把你的頁面包在它自己網域（`*.googleusercontent.com`）的隱藏 iframe 裡，
而瀏覽器安裝 PWA / 註冊 Service Worker 時都要求「manifest／Service Worker 檔案」必須
跟「最上層網頁」同一個網域，Apps Script 這個架構做不到。

解法：另外用一個很輕量的「外殼」網站（就是這個資料夾）來提供：
- `manifest.json`（App 名稱、圖示、啟動方式）
- `sw.js`（Service Worker，只快取外殼本身，讓 App 可以顯示為安裝好的圖示、有啟動畫面）
- 一個用 `<iframe>` 載入你 Apps Script 應用程式的 `index.html`

安裝後，手機／電腦桌面會出現一個「便利貼佈告欄」圖示，點開會以獨立視窗（沒有瀏覽器網址列）
開啟，裡面即時載入你的 Apps Script 應用程式內容。

⚠️ 注意：便利貼資料儲存在 Google Sheet，一定要有網路連線才能讀寫，
所以這不是「完全離線可用」的 App，只是能像原生 App 一樣安裝、有圖示和啟動畫面。

## 部署步驟

1. 依照主專案說明，把 `Code.gs` / `Index.html` 部署成 Google Apps Script 網頁應用程式，
   拿到類似 `https://script.google.com/macros/s/AKfycb.../exec` 的網址。
2. 打開這個資料夾裡的 `index.html`，把
   `PASTE_YOUR_APPS_SCRIPT_EXEC_URL_HERE` 換成你剛剛拿到的網址。
3. 把整個 `pwa-shell` 資料夾內容（`index.html`、`manifest.json`、`sw.js`、
   `icon-192.png`、`icon-512.png`）上傳到任一個支援 HTTPS 的靜態網站空間，例如：
   - GitHub Pages（免費，最簡單）
   - Firebase Hosting
   - Netlify / Vercel
   - Google Sites 的「自訂 HTML」嵌入亦可作變通
4. 用手機瀏覽器開啟外殼網站的網址：
   - Android Chrome：右上角選單會出現「安裝應用程式 / 加到主畫面」
   - iOS Safari：分享 → 加入主畫面
   - 桌面 Chrome/Edge：網址列右側會出現安裝圖示
5. 安裝後點主畫面圖示，即可用 App 的樣子開啟你的便利貼佈告欄。

## 你也可以在 Apps Script 端做的調整

`Code.gs` 的 `doGet()` 已加上：

```js
.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
```

這是允許外部頁面（也就是這個 PWA 外殼）用 `<iframe>` 嵌入你的 Apps Script 應用程式的必要設定，
如果被移除，外殼裡的 iframe 會顯示空白或被瀏覽器拒絕載入。
