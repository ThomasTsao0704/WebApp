# 🍽️ 智慧餐廳 WebSocket 呼叫系統

## 📖 專案說明

這是一個基於 WebSocket 的即時餐廳服務呼叫系統，讓顧客可以透過掃描 QR Code 即時呼叫服務員。

## ✨ 功能特色

- 🔔 即時通知系統
- 📱 響應式設計
- 🎵 音效提醒
- 📊 通知統計
- 🔄 自動重連

## 🚀 本地開發

### 安裝依賴
\`\`\`bash
npm install
\`\`\`

### 啟動開發伺服器
\`\`\`bash
npm start
# 或使用 nodemon
npm run dev
\`\`\`

### 訪問網址
- 顧客端：http://localhost:3000/table.html?table=1
- 服務員端：http://localhost:3000/staff.html

## 📱 使用方式

1. 為每桌生成對應的 QR Code
2. 顧客掃描 QR Code 進入呼叫介面
3. 服務員開啟通知面板接收即時通知

## 🛠️ 技術棧

- Node.js + Express
- WebSocket (ws)
- HTML5 + CSS3 + JavaScript

## 📄 授權

MIT License
更新 package.json 的 scripts 部分：
json{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "engines": {
    "node": ">=14.0.0",
    "npm": ">=6.0.0"
  }
}