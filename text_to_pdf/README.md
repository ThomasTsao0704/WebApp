# 文字排版 PDF（PWA 離線版）

把文字或 Markdown 排成正式的 PDF。手機、平板、電腦都能用，安裝後完全離線，文字只存在自己的裝置上。

## 檔案

```
index.html            App 本體（介面、排版引擎）
manifest.webmanifest  App 名稱、圖示、分享與開檔設定
sw.js                 Service Worker（離線快取、版本更新）
icons/                App 圖示
```

## 部署（必須是 HTTPS）

PWA 的離線與安裝功能只在 HTTPS（或 localhost）下啟用。直接雙擊 `index.html` 仍可使用排版功能，但不能安裝、也不會離線快取。

以下任選一種，都免費：

- **Netlify Drop**：打開 https://app.netlify.com/drop ，把整個資料夾拖進去，馬上得到一個 https 網址。
- **GitHub Pages**：建立 repo，上傳全部檔案，到 Settings → Pages 選擇 main 分支。
- **Cloudflare Pages**：上傳資料夾即可。
- **本機測試**：在資料夾中執行 `python3 -m http.server 8000`，開 http://localhost:8000 。

所有路徑都是相對路徑，放在子目錄（例如 `https://帳號.github.io/text2pdf/`）也能正常運作。

## 安裝到手機

- **Android（Chrome）**：開啟網址 → 右上選單「安裝應用程式」，或點 App 上方的「安裝 App」。
- **iPhone / iPad（Safari）**：開啟網址 → 分享 →「加入主畫面」。

第一次開啟後 App 就會快取，之後沒有網路也能用。

## 手機上輸出 PDF

- **Android**：按「輸出 PDF」→ 印表機選「另存為 PDF」。
- **iPhone**：按「輸出 PDF」→ 列印預覽畫面點右上「分享」→「儲存到檔案」。若在主畫面 App 裡沒有跳出列印畫面，請改用 Safari 開同一個網址輸出。

## 安裝後才有的功能（Android / 桌機 Chrome、Edge）

- **分享進來**：在其他 App 選取文字 →「分享」→ 選「排版PDF」，文字會直接載入。
- **用 App 開檔**：在檔案總管對 .txt / .md 選「開啟方式」→ 排版PDF（桌機）。
- **捷徑**：長按 App 圖示 →「新文件」。

## 更新版本

修改任何檔案後，把 `sw.js` 第一行的 `VERSION` 改成新的值（例如 `t2p-v2.0.1`）再上傳。使用者下次開啟時會看到「有新版本可用」，點一下即可更新。
