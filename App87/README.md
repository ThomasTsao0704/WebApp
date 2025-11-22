# 🇯🇵 Thomas Japan Travel - 大阪旅遊助手

![Version](https://img.shields.io/badge/version-2.0-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![PWA](https://img.shields.io/badge/PWA-Ready-green)
![License](https://img.shields.io/badge/license-MIT-orange)

一個功能完整、設計精美、可離線使用的日本大阪旅遊規劃 Progressive Web App (PWA)

---

## ✨ 主要功能

### 📍 景點管理系統
- **50+ 精選景點**：涵蓋購物、美食、交通、景點等完整分類
- **即時智慧搜尋**：快速搜尋景點名稱、地點和描述
- **多重篩選功能**：依類別快速篩選想去的地方
- **收藏管理**：標記喜愛的景點，建立專屬收藏清單
- **Google Maps 整合**：一鍵開啟導航，精準 GPS 定位
- **推播提醒通知**：設定景點提醒，不錯過任何行程

### 🎒 行李清單管理
- ✅ 新增/刪除行李物品
- ✅ 勾選完成狀態追蹤
- ✅ 即時進度百分比顯示
- ✅ LocalStorage 本地儲存

### 💰 旅遊預算記帳
- 📝 記錄每筆旅遊支出
- 📊 自動計算總金額統計
- 📅 顯示記帳日期時間
- 🗑️ 支出項目編輯刪除

### 📊 統計儀表板
- 📈 景點總數統計
- ❤️ 收藏數量追蹤
- 🏷️ 類別數量分析
- 🔍 搜尋結果即時更新

### 🌐 完整 PWA 功能
- **100% 離線使用**：首次載入後完全離線可用
- **安裝到主畫面**：可安裝為獨立 APP 使用
- **智慧快取策略**：網路優先 + 圖片快取，最佳化效能
- **響應式設計**：完美適配手機、平板、電腦各種裝置
- **Service Worker**：背景同步與推播通知支援

---

## 🚀 快速開始

### 方法 1: 直接使用（最簡單）

直接用瀏覽器開啟 `index.html` 檔案即可！無需任何安裝或設定。

### 方法 2: 本地伺服器（推薦）

#### 使用 Python
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### 使用 Node.js
```bash
# 安裝 http-server (只需一次)
npm install -g http-server

# 啟動伺服器
http-server -p 8000
```

#### 使用 PHP
```bash
php -S localhost:8000
```

然後開啟瀏覽器訪問：`http://localhost:8000`

---

## 📱 安裝成手機 APP

### iOS 系統 (Safari)

1. 用 **Safari** 瀏覽器開啟網站
2. 點選下方的 **分享** 按鈕 (⬆️)
3. 向下滑動，選擇「**加入主畫面**」
4. 輸入名稱（或使用預設）
5. 點選「**加入**」
6. ✅ 完成！在主畫面可看到 APP 圖示

### Android 系統 (Chrome)

1. 用 **Chrome** 瀏覽器開啟網站
2. 點選右上角 **三點選單** (⋮)
3. 選擇「**安裝應用程式**」或「**加到主畫面**」
4. 確認安裝
5. ✅ 完成！在主畫面可看到 APP 圖示

### 桌面版 (Chrome/Edge)

1. 開啟網站後，網址列右側會出現 **安裝圖示** (⊕)
2. 點選安裝圖示
3. 確認安裝
4. ✅ APP 將安裝到系統中，可獨立開啟

---

## 🌐 部署到線上

### GitHub Pages（免費）

#### 步驟 1: 建立 Repository

```bash
git init
git add .
git commit -m "🎉 Initial commit: Thomas Japan Travel"
git branch -M main
git remote add origin https://github.com/你的帳號/thomas-japan-travel.git
git push -u origin main
```

#### 步驟 2: 啟用 GitHub Pages

1. 進入 Repository
2. 點選 **Settings** (設定)
3. 左側選單點選 **Pages**
4. Source 選擇 `main` 分支
5. Folder 選擇 `/ (root)`
6. 點選 **Save**
7. 等待 2-5 分鐘部署完成

#### 步驟 3: 存取網站

網址：`https://你的帳號.github.io/thomas-japan-travel/`

---

### Cloudflare Pages（推薦）

1. 登入 [Cloudflare Pages](https://pages.cloudflare.com/)
2. 點選「**Create a project**」
3. 連接你的 **GitHub Repository**
4. 設定專案：
   - **Framework preset**: None
   - **Build command**: (留空)
   - **Build output directory**: `/`
5. 點選「**Save and Deploy**」
6. ✅ 部署完成！會得到一個 `.pages.dev` 網址

---

### Vercel（快速）

1. 登入 [Vercel](https://vercel.com/)
2. 點選「**New Project**」
3. Import 你的 GitHub Repository
4. 使用預設設定
5. 點選「**Deploy**」
6. ✅ 完成！自動部署並提供 HTTPS 網址

---

### Netlify（簡單）

1. 登入 [Netlify](https://www.netlify.com/)
2. 拖曳整個專案資料夾到網站上
3. 或連接 GitHub Repository
4. ✅ 自動部署完成！

---

## 📁 專案結構

```
thomas-japan-travel/
│
├── index.html              # 主頁面 (HTML5)
├── style.css              # 完整樣式表 (CSS3)
├── app.js                 # React 應用程式主邏輯
├── manifest.json          # PWA 設定檔
├── service-worker.js      # Service Worker (離線功能)
│
├── data/
│   └── trip.json         # 景點資料庫 (50+ 景點)
│
└── README.md             # 專案說明文件
```

### 檔案說明

- **index.html**: 應用程式主頁面，包含 PWA 設定
- **style.css**: 完整的 CSS 樣式，包含響應式設計
- **app.js**: React 應用程式邏輯，包含所有功能
- **manifest.json**: PWA manifest 設定，定義 APP 資訊
- **service-worker.js**: 處理快取和離線功能
- **data/trip.json**: 景點資料，包含 50+ 大阪景點資訊

---

## 🎨 自訂景點資料

編輯 `data/trip.json` 檔案即可新增或修改景點。

### 景點資料格式

```json
{
  "id": 101,
  "name": "心齋橋筋商店街",
  "category": "購物",
  "location": "大阪市中央區心斎橋筋",
  "description": "大阪最長購物街，商店超過200家",
  "image": "https://images.unsplash.com/photo-xxx",
  "lat": 34.6736,
  "lng": 135.5019
}
```

### 欄位說明

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `id` | Number | ✅ | 唯一識別碼 |
| `name` | String | ✅ | 景點名稱 |
| `category` | String | ❌ | 類別 (交通/美食/購物/景點) |
| `location` | String | ✅ | 詳細地址 |
| `description` | String | ❌ | 景點描述 |
| `image` | String | ✅ | 圖片 URL (建議使用 Unsplash) |
| `lat` | Number | ✅ | GPS 緯度 (用於地圖) |
| `lng` | Number | ✅ | GPS 經度 (用於地圖) |

### 圖片來源建議

- [Unsplash](https://unsplash.com/) - 免費高品質圖片
- [Pexels](https://www.pexels.com/) - 免費商用圖片
- [Pixabay](https://pixabay.com/) - 免費圖片和向量圖

---

## 🔧 技術棧

### 前端框架
- **React 18**: 使用 UMD 版本，無需建置工具
- **React DOM 18**: DOM 渲染

### 樣式設計
- **純 CSS3**: 無依賴的響應式設計
- **CSS Grid & Flexbox**: 現代化排版
- **CSS Variables**: 主題顏色管理
- **Media Queries**: 完整響應式支援

### PWA 技術
- **Service Worker**: 快取與離線功能
- **Web App Manifest**: PWA 設定
- **Cache API**: 資源快取管理
- **Notification API**: 推播通知

### 資料儲存
- **LocalStorage**: 收藏、行李、預算資料
- **JSON**: 景點資料格式

### 字體與圖示
- **Noto Sans TC**: Google Fonts 繁體中文字體
- **Emoji**: 原生 Emoji 圖示（無需額外載入）

---

## 🎯 功能規劃

### ✅ 已完成功能

- [x] 50+ 景點資料庫
- [x] 即時搜尋功能
- [x] 多重篩選系統
- [x] 收藏管理
- [x] 行李清單
- [x] 預算記帳
- [x] Google Maps 整合
- [x] 推播通知
- [x] PWA 完整支援
- [x] 離線功能
- [x] 響應式設計
- [x] 統計儀表板
- [x] 無障礙設計 (A11y)

### 🚧 未來計畫

- [ ] 已造訪景點標記功能
- [ ] 行程時間軸規劃
- [ ] 天氣資訊整合
- [ ] 即時匯率換算
- [ ] 多語言支援 (英文/日文)
- [ ] 資料匯出 / 備份功能
- [ ] 社交分享 (分享景點到社群媒體)
- [ ] 離線地圖下載
- [ ] AI 推薦景點
- [ ] 景點評分與評論

---

## 💡 使用技巧

### 景點管理
1. **快速搜尋**: 輸入關鍵字即時篩選景點
2. **類別切換**: 點選類別標籤快速查看特定類型
3. **收藏管理**: 點擊愛心圖示收藏喜愛的地方
4. **地圖導航**: 點選「地圖」按鈕直接開啟 Google Maps

### 離線使用
1. **首次載入**: 確保網路連線，載入所有資源
2. **安裝 APP**: 建議安裝到主畫面以獲得最佳體驗
3. **離線存取**: 之後無網路也能完整使用所有功能
4. **資料同步**: 連上網路後會自動同步最新資料

### 行李與記帳
1. **快速新增**: 輸入後按 Enter 鍵快速新增
2. **進度追蹤**: 即時查看打包進度百分比
3. **支出記錄**: 記錄每筆開銷，自動計算總額
4. **資料保存**: 所有資料自動儲存在本地

---

## 🐛 已知問題與解決方案

### 問題 1: Service Worker 快取更新
**現象**: 更新檔案後，使用者看到的還是舊版本

**解決方案**:
```javascript
// 修改 service-worker.js 中的 CACHE_VERSION
const CACHE_VERSION = 'v2.0.1'; // 更新版本號
```

### 問題 2: iOS Safari 安裝問題
**現象**: iOS 上無法加入主畫面

**解決方案**:
- 確保使用 Safari 瀏覽器（不支援 Chrome）
- 檢查是否在無痕模式（無痕模式不支援）

### 問題 3: 圖片載入失敗
**現象**: 景點圖片無法顯示

**解決方案**:
- 檢查網路連線
- 確認圖片 URL 是否有效
- 系統會自動顯示備用 SVG 圖片

---

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

### 如何貢獻

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

### 程式碼規範

- 使用 2 空格縮排
- 遵循 JSDoc 註解規範
- 保持程式碼簡潔易讀
- 新增功能需附上說明文件

---

## 📄 授權

MIT License

Copyright (c) 2024 Thomas

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

---

## 👨‍💻 作者

**Thomas**
- 建立日期: 2024 年
- 最後更新: 2024 年 11 月

---

## 🙏 致謝

### 圖片與資源
- 景點圖片來自 [Unsplash](https://unsplash.com)
- 字體使用 [Google Fonts - Noto Sans TC](https://fonts.google.com/noto/specimen/Noto+Sans+TC)

### 技術支援
- 地圖功能由 [Google Maps](https://maps.google.com) 提供
- React 由 [Facebook / Meta](https://react.dev/) 開發維護
- PWA 技術參考 [Google Developers](https://developers.google.com/web/progressive-web-apps)

### 開源社群
感謝所有開源軟體開發者的貢獻！

---

## 📞 聯絡方式

如有任何問題或建議，歡迎聯絡：

- **Email**: your-email@example.com
- **GitHub**: [github.com/your-username](https://github.com/your-username)
- **Website**: [your-website.com](https://your-website.com)

---

## 🌟 星標支持

如果這個專案對你有幫助，請給個 ⭐️ 支持一下！

---

**Enjoy your trip to Osaka! 🇯🇵✈️**

**祝您大阪之旅愉快！🗾🎌**
