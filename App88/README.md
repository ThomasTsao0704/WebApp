# 🌏 旅行規劃 APP - React + Capacitor + SQLite

完整的離線旅行規劃應用程式，使用 React、Capacitor 和 SQLite 資料庫。

## ✨ 功能特點

### 核心功能
- ✅ **SQLite 本地資料庫** - 完整的離線資料存取
- ✅ **天數管理** - 新增、刪除、編輯、排序天數
- ✅ **活動管理** - 新增、編輯、刪除行程活動
- ✅ **地圖顯示** - 使用 Leaflet 顯示景點位置
- ✅ **行李清單** - 打包檢查表
- ✅ **預算記帳** - 支出記錄與總計
- ✅ **收藏功能** - 收藏喜歡的景點

### 技術特色
- 🚀 **原生 APP** - 可打包為 iOS 和 Android APP
- 💾 **離線優先** - 所有資料存儲在本地 SQLite
- ⚡ **快速啟動** - Vite 構建工具
- 📱 **響應式設計** - 完美適配手機和平板

## 📦 安裝步驟

### 1. 安裝依賴

```bash
npm install
```

### 2. 開發模式（網頁版）

```bash
npm run dev
```

在瀏覽器開啟 http://localhost:3000

### 3. 構建專案

```bash
npm run build
```

### 4. 初始化 Capacitor 平台

#### Android
```bash
npx cap add android
npm run sync
```

#### iOS
```bash
npx cap add ios
npm run sync
```

### 5. 打開原生專案

#### Android
```bash
npm run android
# 或
npx cap open android
```

#### iOS（需要 Mac）
```bash
npm run ios
# 或
npx cap open ios
```

## 🛠️ 專案結構

```
travel-app-capacitor/
├── package.json              # 依賴配置
├── capacitor.config.json     # Capacitor 配置
├── vite.config.js           # Vite 構建配置
├── index.html               # 入口 HTML
├── public/                  # 靜態資源
│   └── manifest.json        # PWA 配置
└── src/
    ├── main.jsx             # React 入口
    ├── App.jsx              # 主應用組件
    ├── App.css              # 全局樣式
    ├── database.js          # SQLite 資料庫封裝
    └── components/          # React 組件
        ├── ItineraryView.jsx    # 行程視圖
        ├── PackingList.jsx      # 行李清單
        ├── BudgetList.jsx       # 預算記帳
        └── MapView.jsx          # 地圖顯示
```

## 💾 資料庫結構

### 資料表

#### days（天數表）
- `id` - 主鍵
- `title` - 天數標題
- `date` - 日期
- `sort_order` - 排序順序
- `created_at` - 建立時間

#### activities（活動表）
- `id` - 主鍵
- `day_id` - 關聯天數 ID
- `time` - 時間
- `name` - 活動名稱
- `category` - 類別
- `location` - 地點
- `description` - 描述
- `image` - 圖片 URL
- `lat` / `lng` - 經緯度
- `sort_order` - 排序順序
- `created_at` - 建立時間

#### packing（行李表）
- `id` - 主鍵
- `text` - 物品名稱
- `done` - 是否完成（0/1）
- `created_at` - 建立時間

#### budget（預算表）
- `id` - 主鍵
- `name` - 項目名稱
- `cost` - 金額
- `created_at` - 建立時間

#### favorites（收藏表）
- `id` - 主鍵
- `activity_id` - 關聯活動 ID

## 📱 構建原生 APP

### Android

1. **安裝 Android Studio**
2. **同步專案**
   ```bash
   npm run build
   npx cap sync android
   ```
3. **打開 Android Studio**
   ```bash
   npx cap open android
   ```
4. **連接設備或啟動模擬器**
5. **點擊 Run 按鈕** ▶️

### iOS（需要 Mac）

1. **安裝 Xcode**
2. **同步專案**
   ```bash
   npm run build
   npx cap sync ios
   ```
3. **打開 Xcode**
   ```bash
   npx cap open ios
   ```
4. **選擇目標設備**
5. **點擊 Run 按鈕** ▶️

## 🎯 快速命令

```bash
# 開發模式
npm run dev

# 構建專案
npm run build

# 同步到 Capacitor
npm run sync

# 構建並打開 Android
npm run build:android

# 構建並打開 iOS
npm run build:ios
```

## 📚 API 說明

### 資料庫類 (database.js)

```javascript
// 初始化資料庫
await db.init()

// 天數操作
await db.getDays()
await db.addDay(title, date)
await db.updateDay(id, title, date)
await db.deleteDay(id)
await db.reorderDays(dayId, newOrder)

// 活動操作
await db.getActivities(dayId)
await db.addActivity(activity)
await db.updateActivity(id, activity)
await db.deleteActivity(id)

// 行李操作
await db.getPacking()
await db.addPackingItem(text)
await db.togglePackingItem(id, done)
await db.deletePackingItem(id)

// 預算操作
await db.getBudget()
await db.addBudgetItem(name, cost)
await db.deleteBudgetItem(id)

// 收藏操作
await db.getFavorites()
await db.addFavorite(activityId)
await db.removeFavorite(activityId)
```

## 🔧 常見問題

### Q: 在瀏覽器中 SQLite 無法運作？
A: SQLite 功能需要在原生 APP 環境中運行。在網頁開發模式下，建議使用 localStorage 或其他替代方案。

### Q: 如何清除資料庫？
A: 刪除 APP 重新安裝，或在資料庫類中添加清除方法。

### Q: 如何更改 APP 圖示？
A: 替換 `public/` 目錄中的 `icon-192.png` 和 `icon-512.png`。

### Q: 支援哪些平台？
A: iOS、Android 和 Web（PWA）。

## 📝 授權

MIT License

## 🙏 致謝

- React
- Capacitor
- Capacitor SQLite
- Leaflet
- Vite

---

打造者：Claude  
版本：1.0.0  
更新日期：2024
