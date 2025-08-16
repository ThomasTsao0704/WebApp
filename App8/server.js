// ===== package.json =====
{
  "name": "smart-restaurant-ws",
  "version": "1.0.0",
  "description": "智慧餐廳WebSocket呼叫系統",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "keywords": ["restaurant", "websocket", "notification"],
  "author": "Smart Restaurant System",
  "license": "MIT"
}

// ===== server.js =====
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3000;

// 儲存所有服務員連線
let staffSockets = [];
// 儲存通知歷史記錄
let notificationHistory = [];

// 提供靜態檔案服務
app.use(express.static(path.join(__dirname, 'public')));

// 根路徑重導向到服務員面板
app.get('/', (req, res) => {
  res.redirect('/staff.html');
});

// API 端點：獲取通知歷史
app.get('/api/history', (req, res) => {
  res.json(notificationHistory);
});

// WebSocket 連線處理
wss.on('connection', (ws, req) => {
  console.log('新的客戶端連線');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('收到訊息:', data);
      
      // 服務員註冊
      if (data.role === 'staff') {
        staffSockets.push(ws);
        console.log(`服務員已連線，目前共 ${staffSockets.length} 位服務員在線`);
        
        // 發送歷史通知給新連線的服務員
        ws.send(JSON.stringify({
          type: 'history',
          data: notificationHistory.slice(-10) // 只發送最近10筆
        }));
      }
      
      // 桌邊通知
      if (data.role === 'table') {
        const notification = {
          table: data.table,
          request: data.request,
          time: new Date().toLocaleTimeString('zh-TW'),
          timestamp: new Date().toISOString(),
          id: Date.now()
        };
        
        // 儲存到歷史記錄
        notificationHistory.push(notification);
        // 只保留最近50筆記錄
        if (notificationHistory.length > 50) {
          notificationHistory = notificationHistory.slice(-50);
        }
        
        // 廣播給所有在線服務員
        let sentCount = 0;
        staffSockets.forEach((staffSocket) => {
          if (staffSocket.readyState === WebSocket.OPEN) {
            staffSocket.send(JSON.stringify({
              type: 'notification',
              data: notification
            }));
            sentCount++;
          }
        });
        
        console.log(`通知已發送給 ${sentCount} 位服務員: 第${data.table}桌 - ${data.request}`);
        
        // 回應給桌邊客戶端
        ws.send(JSON.stringify({
          type: 'confirm',
          message: `通知已發送給 ${sentCount} 位服務員`,
          success: true
        }));
      }
      
    } catch (error) {
      console.error('處理訊息時發生錯誤:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: '訊息處理失敗'
      }));
    }
  });
  
  ws.on('close', () => {
    // 移除已斷線的服務員
    const originalLength = staffSockets.length;
    staffSockets = staffSockets.filter(s => s !== ws);
    if (staffSockets.length < originalLength) {
      console.log(`服務員已離線，目前共 ${staffSockets.length} 位服務員在線`);
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket 錯誤:', error);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 伺服器運行在 http://localhost:${PORT}`);
  console.log(`📱 桌邊呼叫介面: http://localhost:${PORT}/table.html?table=1`);
  console.log(`👨‍💼 服務員面板: http://localhost:${PORT}/staff.html`);
});

// 優雅地關閉伺服器
process.on('SIGTERM', () => {
  console.log('正在關閉伺服器...');
  server.close(() => {
    console.log('伺服器已關閉');
  });
});

// ===== public/table.html =====
// 此檔案應該放在 public 資料夾內
/*
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>桌邊服務呼叫</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      padding: 20px;
    }
    
    .container {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 40px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      text-align: center;
      max-width: 400px;
      width: 100%;
    }
    
    h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    .table-info {
      font-size: 1.5em;
      margin-bottom: 30px;
      background: rgba(255, 255, 255, 0.2);
      padding: 15px;
      border-radius: 10px;
    }
    
    .table-number {
      font-size: 2em;
      font-weight: bold;
      color: #FFD700;
    }
    
    .buttons {
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin-bottom: 20px;
    }
    
    button {
      padding: 20px;
      font-size: 1.2em;
      border: none;
      border-radius: 15px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    }
    
    .btn-water {
      background: linear-gradient(45deg, #4CAF50, #45a049);
      color: white;
    }
    
    .btn-order {
      background: linear-gradient(45deg, #FF9800, #F57C00);
      color: white;
    }
    
    .btn-clean {
      background: linear-gradient(45deg, #2196F3, #1976D2);
      color: white;
    }
    
    .status {
      min-height: 50px;
      padding: 15px;
      border-radius: 10px;
      font-size: 1.1em;
      transition: all 0.3s ease;
    }
    
    .status.success {
      background: rgba(76, 175, 80, 0.3);
      border: 1px solid #4CAF50;
    }
    
    .status.error {
      background: rgba(244, 67, 54, 0.3);
      border: 1px solid #f44336;
    }
    
    .connection-status {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 15px;
      border-radius: 20px;
      font-size: 0.9em;
      font-weight: bold;
    }
    
    .connected {
      background: rgba(76, 175, 80, 0.8);
      color: white;
    }
    
    .disconnected {
      background: rgba(244, 67, 54, 0.8);
      color: white;
    }
    
    @media (max-width: 480px) {
      .container {
        padding: 20px;
      }
      
      h1 {
        font-size: 2em;
      }
      
      button {
        padding: 15px;
        font-size: 1.1em;
      }
    }
  </style>
</head>
<body>
  <div class="connection-status" id="connectionStatus">連線中...</div>
  
  <div class="container">
    <h1>🍽️ 桌邊服務</h1>
    
    <div class="table-info">
      您目前在第 <span class="table-number" id="tableNum">1</span> 桌
    </div>
    
    <div class="buttons">
      <button class="btn-water" onclick="notify('加水')">
        💧 需要加水
      </button>
      <button class="btn-order" onclick="notify('點餐')">
        📋 需要點餐
      </button>
      <button class="btn-clean" onclick="notify('收桌')">
        🧹 需要收桌
      </button>
    </div>
    
    <div class="status" id="status"></div>
  </div>

  <script>
    const tableId = new URLSearchParams(location.search).get('table') || '1';
    document.getElementById('tableNum').innerText = tableId;
    
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(protocol + '//' + location.host);
    
    const statusEl = document.getElementById('status');
    const connectionEl = document.getElementById('connectionStatus');
    
    socket.onopen = () => {
      console.log('WebSocket 連線成功');
      connectionEl.textContent = '🟢 已連線';
      connectionEl.className = 'connection-status connected';
      statusEl.textContent = '準備就緒，可以呼叫服務';
      statusEl.className = 'status';
    };
    
    socket.onclose = () => {
      console.log('WebSocket 連線關閉');
      connectionEl.textContent = '🔴 連線中斷';
      connectionEl.className = 'connection-status disconnected';
      statusEl.textContent = '連線中斷，請重新整理頁面';
      statusEl.className = 'status error';
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket 錯誤:', error);
      connectionEl.textContent = '🔴 連線錯誤';
      connectionEl.className = 'connection-status disconnected';
    };
    
    socket.onmessage = (event) => {
      const response = JSON.parse(event.data);
      
      if (response.type === 'confirm') {
        statusEl.textContent = response.message;
        statusEl.className = 'status success';
        
        // 3秒後清除狀態訊息
        setTimeout(() => {
          statusEl.textContent = '準備就緒，可以呼叫服務';
          statusEl.className = 'status';
        }, 3000);
      } else if (response.type === 'error') {
        statusEl.textContent = '發送失敗：' + response.message;
        statusEl.className = 'status error';
      }
    };
    
    function notify(request) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          role: 'table',
          table: tableId,
          request: request
        }));
        
        statusEl.textContent = `正在發送「${request}」通知...`;
        statusEl.className = 'status';
      } else {
        statusEl.textContent = '連線中斷，無法發送通知';
        statusEl.className = 'status error';
      }
    }
    
    // 防止頁面意外刷新
    window.addEventListener('beforeunload', (event) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    });
  </script>
</body>
</html>
*/

// ===== public/staff.html =====
// 此檔案應該放在 public 資料夾內
/*
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>服務員通知中心</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
      min-height: 100vh;
      color: white;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      background: rgba(255, 255, 255, 0.1);
      padding: 20px;
      border-radius: 15px;
      backdrop-filter: blur(10px);
    }
    
    h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    .status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .connection-status {
      padding: 10px 20px;
      border-radius: 25px;
      font-weight: bold;
      transition: all 0.3s ease;
    }
    
    .connected {
      background: rgba(76, 175, 80, 0.8);
    }
    
    .disconnected {
      background: rgba(244, 67, 54, 0.8);
    }
    
    .stats {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    
    .stat-item {
      background: rgba(255, 255, 255, 0.1);
      padding: 10px 15px;
      border-radius: 10px;
      text-align: center;
    }
    
    .stat-number {
      font-size: 1.5em;
      font-weight: bold;
      color: #FFD700;
    }
    
    .controls {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    button {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.3s ease;
    }
    
    .btn-clear {
      background: #e74c3c;
      color: white;
    }
    
    .btn-clear:hover {
      background: #c0392b;
    }
    
    .notifications-container {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 15px;
      padding: 20px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      max-height: 70vh;
      overflow-y: auto;
    }
    
    .notifications-header {
      font-size: 1.3em;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .notification-list {
      list-style: none;
    }
    
    .notification-item {
      background: rgba(255, 255, 255, 0.1);
      margin-bottom: 10px;
      padding: 15px;
      border-radius: 10px;
      border-left: 4px solid #3498db;
      animation: slideIn 0.3s ease-out;
      transition: all 0.3s ease;
    }
    
    .notification-item:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateX(5px);
    }
    
    .notification-item.new {
      border-left-color: #e74c3c;
      background: rgba(231, 76, 60, 0.2);
    }
    
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    
    .table-info {
      font-size: 1.2em;
      font-weight: bold;
      color: #FFD700;
    }
    
    .time-info {
      font-size: 0.9em;
      color: #bdc3c7;
    }
    
    .request-info {
      font-size: 1.1em;
      margin-top: 5px;
    }
    
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #7f8c8d;
      font-size: 1.1em;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .notification-sound {
      display: none;
    }
    
    @media (max-width: 768px) {
      .header h1 {
        font-size: 2em;
      }
      
      .status-bar {
        flex-direction: column;
        align-items: stretch;
      }
      
      .stats {
        justify-content: center;
      }
      
      .notification-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>👨‍💼 服務員通知中心</h1>
    <div class="status-bar">
      <div class="connection-status" id="connectionStatus">連線中...</div>
      <div class="stats">
        <div class="stat-item">
          <div class="stat-number" id="totalNotifications">0</div>
          <div>總通知數</div>
        </div>
        <div class="stat-item">
          <div class="stat-number" id="todayNotifications">0</div>
          <div>今日通知</div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="controls">
    <button class="btn-clear" onclick="clearNotifications()">🗑️ 清除通知</button>
  </div>
  
  <div class="notifications-container">
    <div class="notifications-header">📋 即時通知列表</div>
    <ul class="notification-list" id="notificationList">
      <li class="empty-state" id="emptyState">暫無通知，等待桌邊呼叫...</li>
    </ul>
  </div>
  
  <audio class="notification-sound" id="notificationSound" preload="auto">
    <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFA==" type="audio/wav">
  </audio>

  <script>
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(protocol + '//' + location.host);
    
    const connectionEl = document.getElementById('connectionStatus');
    const notificationListEl = document.getElementById('notificationList');
    const emptyStateEl = document.getElementById('emptyState');
    const totalNotificationsEl = document.getElementById('totalNotifications');
    const todayNotificationsEl = document.getElementById('todayNotifications');
    const notificationSound = document.getElementById('notificationSound');
    
    let totalCount = 0;
    let todayCount = 0;
    let todayDate = new Date().toDateString();
    
    socket.onopen = () => {
      console.log('WebSocket 連線成功');
      connectionEl.textContent = '🟢 已連線';
      connectionEl.className = 'connection-status connected';
      
      // 註冊為服務員
      socket.send(JSON.stringify({ role: 'staff' }));
    };
    
    socket.onclose = () => {
      console.log('WebSocket 連線關閉');
      connectionEl.textContent = '🔴 連線中斷';
      connectionEl.className = 'connection-status disconnected';
      
      // 嘗試重新連線
      setTimeout(() => {
        location.reload();
      }, 3000);
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket 錯誤:', error);
      connectionEl.textContent = '🔴 連線錯誤';
      connectionEl.className = 'connection-status disconnected';
    };
    
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'notification') {
        addNotification(message.data, true);
        playNotificationSound();
      } else if (message.type === 'history') {
        // 載入歷史通知
        message.data.forEach(notification => {
          addNotification(notification, false);
        });
      }
    };
    
    function addNotification(data, isNew = true) {
      // 移除空狀態
      if (emptyStateEl.style.display !== 'none') {
        emptyStateEl.style.display = 'none';
      }
      
      const li = document.createElement('li');
      li.className = `notification-item ${isNew ? 'new' : ''}`;
      li.innerHTML = `
        <div class="notification-header">
          <div class="table-info">🍽️ 第 ${data.table} 桌</div>
          <div class="time-info">${data.time}</div>
        </div>
        <div class="request-info">${getRequestIcon(data.request)} ${data.request}</div>
      `;
      
      // 插入到列表最前面
      notificationListEl.insertBefore(li, notificationListEl.firstChild);
      
      // 更新計數
      totalCount++;
      const notificationDate = new Date(data.timestamp || Date.now()).toDateString();
      if (notificationDate === todayDate) {
        todayCount++;
      }
      
      updateStats();
      
      // 移除新通知樣式
      if (isNew) {
        setTimeout(() => {
          li.classList.remove('new');
        }, 3000);
      }
      
      // 限制顯示的通知數量（最多50個）
      const items = notificationListEl.querySelectorAll('.notification-item');
      if (items.length > 50) {
        items[items.length - 1].remove();
      }
    }
    
    function getRequestIcon(request) {
      switch (request) {
        case '加水': return '💧';
        case '點餐': return '📋';
        case '收桌': return '🧹';
        default: return '🔔';
      }
    }
    
    function updateStats() {
      totalNotificationsEl.textContent = totalCount;
      todayNotificationsEl.textContent = todayCount;
    }
    
    function clearNotifications() {
      const items = notificationListEl.querySelectorAll('.notification-item');
      items.forEach(item => item.remove());
      
      emptyStateEl.style.display = 'block';
      totalCount = 0;
      todayCount = 0;
      updateStats();
    }
    
    function playNotificationSound() {
      // 播放通知音效
      notificationSound.currentTime = 0;
      notificationSound.play().catch(e => {
        console.log('無法播放通知音效:', e);
      });
      
      // 顯示瀏覽器通知（需要用戶許可）
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('新的服務請求', {
          body: '有顧客需要服務，請查看通知面板',
          icon: '/favicon.ico'
        });
        
        setTimeout(() => {
          notification.close();
        }, 5000);
      }
    }
    
    // 請求通知權限
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // 檢查日期變更
    setInterval(() => {
      const currentDate = new Date().toDateString();
      if (currentDate !== todayDate) {
        todayDate = currentDate;
        todayCount = 0;
        updateStats();
      }
    }, 60000); // 每分鐘檢查一次
  </script>
</body>
</html>
*/