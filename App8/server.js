// ===== 修正版 server.js =====
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 修正的 WebSocket 伺服器配置
const wss = new WebSocket.Server({ 
  server,
  // 添加這些配置以提高相容性
  perMessageDeflate: {
    zlibDeflateOptions: {
      level: 3,
    },
  },
  maxPayload: 1024 * 1024, // 1MB
});

const PORT = process.env.PORT || 3000;

// 儲存連線
let staffSockets = [];
let notificationHistory = [];

// 提供靜態檔案
app.use(express.static(path.join(__dirname, 'public')));

// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connections: staffSockets.length 
  });
});

// 根路徑
app.get('/', (req, res) => {
  res.redirect('/staff.html');
});

// API 端點
app.get('/api/history', (req, res) => {
  res.json(notificationHistory);
});

// WebSocket 連線處理 - 加強版
wss.on('connection', (ws, req) => {
  console.log('新的WebSocket連線', {
    userAgent: req.headers['user-agent'],
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });

  // 設定連線保持活躍
  ws.isAlive = true;
  
  // 心跳檢測
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // 連線成功回應
  ws.send(JSON.stringify({
    type: 'connected',
    message: '連線成功',
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('收到訊息:', data);
      
      // 處理心跳
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }
      
      // 服務員註冊
      if (data.role === 'staff') {
        if (!staffSockets.includes(ws)) {
          staffSockets.push(ws);
          console.log(`服務員已連線，目前共 ${staffSockets.length} 位`);
        }
        
        // 發送歷史通知
        ws.send(JSON.stringify({
          type: 'history',
          data: notificationHistory.slice(-10)
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
        
        // 儲存記錄
        notificationHistory.push(notification);
        if (notificationHistory.length > 50) {
          notificationHistory = notificationHistory.slice(-50);
        }
        
        // 廣播給服務員
        let sentCount = 0;
        staffSockets.forEach((staffSocket, index) => {
          if (staffSocket.readyState === WebSocket.OPEN) {
            try {
              staffSocket.send(JSON.stringify({
                type: 'notification',
                data: notification
              }));
              sentCount++;
            } catch (error) {
              console.error(`發送給服務員 ${index} 失敗:`, error);
            }
          }
        });
        
        console.log(`通知已發送: 第${data.table}桌 - ${data.request} (${sentCount}位服務員)`);
        
        // 回應客戶端
        ws.send(JSON.stringify({
          type: 'confirm',
          message: `通知已發送給 ${sentCount} 位服務員`,
          success: true
        }));
      }
      
    } catch (error) {
      console.error('處理訊息錯誤:', error);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          message: '訊息處理失敗'
        }));
      }
    }
  });
  
  ws.on('close', (code, reason) => {
    console.log('WebSocket 連線關閉:', { code, reason: reason.toString() });
    // 清理連線
    staffSockets = staffSockets.filter(s => s !== ws);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket 錯誤:', error);
    staffSockets = staffSockets.filter(s => s !== ws);
  });
});

// 心跳檢測 - 每30秒檢查一次
const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log('移除死連線');
      return ws.terminate();
    }
    
    ws.isAlive = false;
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  });
  
  // 清理斷線的服務員
  staffSockets = staffSockets.filter(s => s.readyState === WebSocket.OPEN);
}, 30000);

// 伺服器啟動
server.listen(PORT, () => {
  console.log(`🚀 伺服器運行在 http://localhost:${PORT}`);
  console.log(`📱 桌邊介面: http://localhost:${PORT}/table.html?table=1`);
  console.log(`👨‍💼 服務員面板: http://localhost:${PORT}/staff.html`);
});

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('正在關閉伺服器...');
  clearInterval(heartbeat);
  wss.close(() => {
    server.close(() => {
      console.log('伺服器已關閉');
    });
  });
});

process.on('SIGINT', () => {
  console.log('正在關閉伺服器...');
  clearInterval(heartbeat);
  wss.close(() => {
    server.close(() => {
      console.log('伺服器已關閉');
      process.exit(0);
    });
  });
});

// ===== 修正版前端 WebSocket 連線腳本 =====
// 將此腳本加入到 table.html 和 staff.html 中

/*
<script>
class SmartWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectInterval: 3000, // 3秒重連
      maxReconnectAttempts: 10, // 最多重連10次
      heartbeatInterval: 25000, // 25秒心跳
      ...options
    };
    
    this.socket = null;
    this.reconnectAttempts = 0;
    this.heartbeatTimer = null;
    this.isConnected = false;
    this.messageQueue = [];
    
    // 事件處理器
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    
    this.connect();
  }
  
  connect() {
    try {
      console.log('嘗試WebSocket連線:', this.url);
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = (event) => {
        console.log('WebSocket連線成功');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        
        // 發送佇列中的訊息
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift();
          this.socket.send(message);
        }
        
        if (this.onopen) this.onopen(event);
      };
      
      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // 處理心跳回應
        if (data.type === 'pong') {
          console.log('收到心跳回應');
          return;
        }
        
        if (this.onmessage) this.onmessage(event);
      };
      
      this.socket.onclose = (event) => {
        console.log('WebSocket連線關閉:', event.code, event.reason);
        this.isConnected = false;
        this.stopHeartbeat();
        
        if (this.onclose) this.onclose(event);
        
        // 自動重連
        if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`嘗試重連 (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);
          setTimeout(() => this.connect(), this.options.reconnectInterval);
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket錯誤:', error);
        if (this.onerror) this.onerror(error);
      };
      
    } catch (error) {
      console.error('WebSocket連線失敗:', error);
      setTimeout(() => this.connect(), this.options.reconnectInterval);
    }
  }
  
  send(data) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    
    if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else {
      // 加入佇列等待連線
      this.messageQueue.push(message);
    }
  }
  
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.options.heartbeatInterval);
  }
  
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  close() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close();
    }
  }
}

// 使用方式
const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
const socket = new SmartWebSocket(protocol + '//' + location.host);

// 設定事件處理器
socket.onopen = () => {
  document.getElementById('connectionStatus').textContent = '🟢 已連線';
  document.getElementById('connectionStatus').className = 'connection-status connected';
};

socket.onclose = () => {
  document.getElementById('connectionStatus').textContent = '🔴 連線中斷';
  document.getElementById('connectionStatus').className = 'connection-status disconnected';
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // 處理收到的訊息
  console.log('收到訊息:', data);
};

// 發送訊息
function sendMessage(data) {
  socket.send(data);
}
</script>
*/