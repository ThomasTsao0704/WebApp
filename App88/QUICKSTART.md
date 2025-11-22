# 🚀 快速開始指南

## 第一次使用？跟著這個步驟就對了！

### 步驟 1：安裝 Node.js
如果還沒安裝，請前往 https://nodejs.org/ 下載並安裝 LTS 版本

### 步驟 2：解壓縮專案
```bash
unzip travel-app-capacitor.zip
cd travel-app-capacitor
```

### 步驟 3：安裝依賴
```bash
npm install
```
這會需要幾分鐘，請耐心等待 ☕

### 步驟 4：啟動開發模式
```bash
npm run dev
```
在瀏覽器開啟 http://localhost:3000

### 步驟 5：打包成 APP（選擇性）

#### 🤖 Android APP
1. 安裝 Android Studio: https://developer.android.com/studio
2. 運行命令：
```bash
npx cap add android
npm run build
npx cap sync
npx cap open android
```
3. 在 Android Studio 中點擊 Run ▶️

#### 🍎 iOS APP（需要 Mac）
1. 安裝 Xcode（從 App Store）
2. 運行命令：
```bash
npx cap add ios
npm run build
npx cap sync
npx cap open ios
```
3. 在 Xcode 中點擊 Run ▶️

## 💡 提示

- 第一次啟動時會自動插入示範資料
- 所有資料都存儲在本地 SQLite 資料庫
- 支援完全離線使用
- 可以新增、編輯、刪除天數和活動
- 包含地圖、行李清單、預算記帳功能

## 🆘 需要幫助？

請查看 README.md 獲取完整文檔！
