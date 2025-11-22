import { Capacitor } from '@capacitor/core';

const platform = Capacitor.getPlatform();
const isNative = platform === 'ios' || platform === 'android';

// LocalStorage 版本的資料庫（用於瀏覽器開發）
class LocalStorageDB {
  init() {
    // 初始化 localStorage 結構
    if (!localStorage.getItem('days')) {
      localStorage.setItem('days', JSON.stringify([]));
    }
    if (!localStorage.getItem('activities')) {
      localStorage.setItem('activities', JSON.stringify([]));
    }
    if (!localStorage.getItem('packing')) {
      localStorage.setItem('packing', JSON.stringify([]));
    }
    if (!localStorage.getItem('budget')) {
      localStorage.setItem('budget', JSON.stringify([]));
    }
    if (!localStorage.getItem('favorites')) {
      localStorage.setItem('favorites', JSON.stringify([]));
    }
  }

  // 天數操作
  getDays() {
    const days = JSON.parse(localStorage.getItem('days') || '[]');
    return days.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  addDay(title, date = '') {
    const days = this.getDays();
    const maxOrder = days.reduce((max, d) => Math.max(max, d.sort_order || 0), 0);
    const newDay = {
      id: Date.now(),
      title,
      date,
      sort_order: maxOrder + 1,
      created_at: new Date().toISOString()
    };
    days.push(newDay);
    localStorage.setItem('days', JSON.stringify(days));
    return newDay.id;
  }

  updateDay(id, title, date) {
    const days = this.getDays();
    const index = days.findIndex(d => d.id === id);
    if (index !== -1) {
      days[index] = { ...days[index], title, date };
      localStorage.setItem('days', JSON.stringify(days));
    }
  }

  deleteDay(id) {
    const days = this.getDays().filter(d => d.id !== id);
    localStorage.setItem('days', JSON.stringify(days));
    
    // 同時刪除相關活動
    const activities = this.getAllActivities().filter(a => a.day_id !== id);
    localStorage.setItem('activities', JSON.stringify(activities));
  }

  reorderDays(dayId, newOrder) {
    const days = this.getDays();
    const day = days.find(d => d.id === dayId);
    if (day) {
      day.sort_order = newOrder;
      localStorage.setItem('days', JSON.stringify(days));
    }
  }

  // 活動操作
  getActivities(dayId) {
    const activities = JSON.parse(localStorage.getItem('activities') || '[]');
    return activities
      .filter(a => a.day_id === dayId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  getAllActivities() {
    return JSON.parse(localStorage.getItem('activities') || '[]');
  }

  addActivity(activity) {
    const activities = this.getAllActivities();
    const maxOrder = activities
      .filter(a => a.day_id === activity.day_id)
      .reduce((max, a) => Math.max(max, a.sort_order || 0), 0);
    
    const newActivity = {
      ...activity,
      id: Date.now() + Math.random(), // 確保唯一性
      sort_order: maxOrder + 1,
      created_at: new Date().toISOString()
    };
    activities.push(newActivity);
    localStorage.setItem('activities', JSON.stringify(activities));
    return newActivity.id;
  }

  updateActivity(id, activity) {
    const activities = this.getAllActivities();
    const index = activities.findIndex(a => a.id === id);
    if (index !== -1) {
      activities[index] = { ...activities[index], ...activity, id };
      localStorage.setItem('activities', JSON.stringify(activities));
    }
  }

  deleteActivity(id) {
    const activities = this.getAllActivities().filter(a => a.id !== id);
    localStorage.setItem('activities', JSON.stringify(activities));
  }

  // 行李操作
  getPacking() {
    return JSON.parse(localStorage.getItem('packing') || '[]');
  }

  addPackingItem(text) {
    const items = this.getPacking();
    const newItem = {
      id: Date.now(),
      text,
      done: 0,
      created_at: new Date().toISOString()
    };
    items.push(newItem);
    localStorage.setItem('packing', JSON.stringify(items));
    return newItem.id;
  }

  togglePackingItem(id, done) {
    const items = this.getPacking();
    const item = items.find(i => i.id === id);
    if (item) {
      item.done = done ? 1 : 0;
      localStorage.setItem('packing', JSON.stringify(items));
    }
  }

  deletePackingItem(id) {
    const items = this.getPacking().filter(i => i.id !== id);
    localStorage.setItem('packing', JSON.stringify(items));
  }

  // 預算操作
  getBudget() {
    return JSON.parse(localStorage.getItem('budget') || '[]');
  }

  addBudgetItem(name, cost) {
    const items = this.getBudget();
    const newItem = {
      id: Date.now(),
      name,
      cost: Number(cost),
      created_at: new Date().toISOString()
    };
    items.push(newItem);
    localStorage.setItem('budget', JSON.stringify(items));
    return newItem.id;
  }

  deleteBudgetItem(id) {
    const items = this.getBudget().filter(i => i.id !== id);
    localStorage.setItem('budget', JSON.stringify(items));
  }

  // 收藏操作
  getFavorites() {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
  }

  addFavorite(activityId) {
    const favorites = this.getFavorites();
    if (!favorites.includes(activityId)) {
      favorites.push(activityId);
      localStorage.setItem('favorites', JSON.stringify(favorites));
    }
  }

  removeFavorite(activityId) {
    const favorites = this.getFavorites().filter(id => id !== activityId);
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }
}

// SQLite 版本的資料庫（用於原生 APP）
class SQLiteDB {
  constructor() {
    this.db = null;
    this.dbName = 'travelapp.db';
  }

  async init() {
    // 動態導入 SQLite 模組
    const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
    this.sqlite = new SQLiteConnection(CapacitorSQLite);

    try {
      const ret = await this.sqlite.checkConnectionsConsistency();
      const isConn = (await this.sqlite.isConnection(this.dbName, false)).result;

      if (ret.result && isConn) {
        this.db = await this.sqlite.retrieveConnection(this.dbName, false);
      } else {
        this.db = await this.sqlite.createConnection(
          this.dbName,
          false,
          'no-encryption',
          1,
          false
        );
      }

      await this.db.open();
      await this.createTables();
    } catch (error) {
      console.error('SQLite 初始化錯誤:', error);
      throw error;
    }
  }

  async createTables() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS days (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        date TEXT,
        sort_order INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_id INTEGER NOT NULL,
        time TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        location TEXT,
        description TEXT,
        image TEXT,
        lat REAL,
        lng REAL,
        sort_order INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (day_id) REFERENCES days(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS packing (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        done INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS budget (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cost REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity_id INTEGER NOT NULL,
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
      )`
    ];

    for (const query of queries) {
      await this.db.execute(query);
    }
  }

  async getDays() {
    const result = await this.db.query('SELECT * FROM days ORDER BY sort_order, id');
    return result.values || [];
  }

  async addDay(title, date = '') {
    const maxOrder = await this.db.query('SELECT MAX(sort_order) as max_order FROM days');
    const nextOrder = (maxOrder.values?.[0]?.max_order || 0) + 1;
    
    const result = await this.db.query(
      'INSERT INTO days (title, date, sort_order) VALUES (?, ?, ?)',
      [title, date, nextOrder]
    );
    return result.changes?.lastId;
  }

  async updateDay(id, title, date) {
    await this.db.query(
      'UPDATE days SET title = ?, date = ? WHERE id = ?',
      [title, date, id]
    );
  }

  async deleteDay(id) {
    await this.db.query('DELETE FROM days WHERE id = ?', [id]);
  }

  async reorderDays(dayId, newOrder) {
    await this.db.query('UPDATE days SET sort_order = ? WHERE id = ?', [newOrder, dayId]);
  }

  async getActivities(dayId) {
    const result = await this.db.query(
      'SELECT * FROM activities WHERE day_id = ? ORDER BY sort_order, time',
      [dayId]
    );
    return result.values || [];
  }

  async getAllActivities() {
    const result = await this.db.query('SELECT * FROM activities ORDER BY id');
    return result.values || [];
  }

  async addActivity(activity) {
    const { day_id, time, name, category, location, description, image, lat, lng } = activity;
    
    const maxOrder = await this.db.query(
      'SELECT MAX(sort_order) as max_order FROM activities WHERE day_id = ?',
      [day_id]
    );
    const nextOrder = (maxOrder.values?.[0]?.max_order || 0) + 1;
    
    const result = await this.db.query(
      `INSERT INTO activities 
       (day_id, time, name, category, location, description, image, lat, lng, sort_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [day_id, time, name, category, location, description, image, lat, lng, nextOrder]
    );
    return result.changes?.lastId;
  }

  async updateActivity(id, activity) {
    const { time, name, category, location, description, image, lat, lng } = activity;
    await this.db.query(
      `UPDATE activities 
       SET time = ?, name = ?, category = ?, location = ?, description = ?, image = ?, lat = ?, lng = ? 
       WHERE id = ?`,
      [time, name, category, location, description, image, lat, lng, id]
    );
  }

  async deleteActivity(id) {
    await this.db.query('DELETE FROM activities WHERE id = ?', [id]);
  }

  async getPacking() {
    const result = await this.db.query('SELECT * FROM packing ORDER BY id DESC');
    return result.values || [];
  }

  async addPackingItem(text) {
    const result = await this.db.query(
      'INSERT INTO packing (text, done) VALUES (?, 0)',
      [text]
    );
    return result.changes?.lastId;
  }

  async togglePackingItem(id, done) {
    await this.db.query('UPDATE packing SET done = ? WHERE id = ?', [done ? 1 : 0, id]);
  }

  async deletePackingItem(id) {
    await this.db.query('DELETE FROM packing WHERE id = ?', [id]);
  }

  async getBudget() {
    const result = await this.db.query('SELECT * FROM budget ORDER BY id DESC');
    return result.values || [];
  }

  async addBudgetItem(name, cost) {
    const result = await this.db.query(
      'INSERT INTO budget (name, cost) VALUES (?, ?)',
      [name, cost]
    );
    return result.changes?.lastId;
  }

  async deleteBudgetItem(id) {
    await this.db.query('DELETE FROM budget WHERE id = ?', [id]);
  }

  async getFavorites() {
    const result = await this.db.query('SELECT activity_id FROM favorites');
    return (result.values || []).map(row => row.activity_id);
  }

  async addFavorite(activityId) {
    await this.db.query('INSERT INTO favorites (activity_id) VALUES (?)', [activityId]);
  }

  async removeFavorite(activityId) {
    await this.db.query('DELETE FROM favorites WHERE activity_id = ?', [activityId]);
  }

  async close() {
    if (this.db) {
      await this.db.close();
      await this.sqlite.closeConnection(this.dbName, false);
    }
  }
}

// 統一的資料庫介面
class Database {
  constructor() {
    this.platform = platform;
    this.isNative = isNative;
    
    if (isNative) {
      console.log('📱 使用 SQLite 模式（原生 APP）');
      this.db = new SQLiteDB();
    } else {
      console.log('🌐 使用 localStorage 模式（瀏覽器開發）');
      this.db = new LocalStorageDB();
    }
  }

  async init() {
    try {
      if (this.isNative) {
        await this.db.init();
      } else {
        this.db.init();
      }
      console.log(`✅ ${this.isNative ? 'SQLite' : 'localStorage'} 資料庫初始化完成`);
      return true;
    } catch (error) {
      console.error('❌ 資料庫初始化失敗:', error);
      return false;
    }
  }

  // 插入示範資料
  async insertSampleData() {
    const existingDays = await this.getDays();
    if (existingDays.length > 0) {
      console.log('已有資料，跳過示範資料');
      return;
    }

    console.log('插入示範資料...');

    // Day 1
    const day1 = await this.addDay('Day 1 - 11/28 大阪抵達', '2024-11-28');
    await this.addActivity({
      day_id: day1,
      time: '09:00',
      name: '關西機場',
      category: '交通',
      location: '關西國際機場',
      description: '搭乘航班抵達關西機場',
      image: 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=800',
      lat: 34.4347,
      lng: 135.2440
    });
    await this.addActivity({
      day_id: day1,
      time: '13:00',
      name: '道頓堀',
      category: '美食',
      location: '大阪市中央區道頓堀',
      description: '大阪最熱鬧的美食街',
      image: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800',
      lat: 34.6686,
      lng: 135.5012
    });

    // Day 2
    const day2 = await this.addDay('Day 2 - 11/29 京都嵐山', '2024-11-29');
    await this.addActivity({
      day_id: day2,
      time: '09:30',
      name: '竹林小徑',
      category: '景點',
      location: '京都市右京區嵯峨小倉山',
      description: '京都必訪景點，漫步在壯觀的竹林隧道中',
      image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800',
      lat: 35.0175,
      lng: 135.6721
    });
    await this.addActivity({
      day_id: day2,
      time: '11:00',
      name: '天龍寺',
      category: '景點',
      location: '京都市右京區嵯峨天龍寺',
      description: '世界文化遺產，賞楓名所',
      image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800',
      lat: 35.0156,
      lng: 135.6739
    });

    console.log('✅ 示範資料插入完成');
  }

  // 所有方法都直接轉發給底層實現
  getDays() { return this.db.getDays(); }
  addDay(title, date) { return this.db.addDay(title, date); }
  updateDay(id, title, date) { return this.db.updateDay(id, title, date); }
  deleteDay(id) { return this.db.deleteDay(id); }
  reorderDays(dayId, newOrder) { return this.db.reorderDays(dayId, newOrder); }
  
  getActivities(dayId) { return this.db.getActivities(dayId); }
  getAllActivities() { return this.db.getAllActivities(); }
  addActivity(activity) { return this.db.addActivity(activity); }
  updateActivity(id, activity) { return this.db.updateActivity(id, activity); }
  deleteActivity(id) { return this.db.deleteActivity(id); }
  
  getPacking() { return this.db.getPacking(); }
  addPackingItem(text) { return this.db.addPackingItem(text); }
  togglePackingItem(id, done) { return this.db.togglePackingItem(id, done); }
  deletePackingItem(id) { return this.db.deletePackingItem(id); }
  
  getBudget() { return this.db.getBudget(); }
  addBudgetItem(name, cost) { return this.db.addBudgetItem(name, cost); }
  deleteBudgetItem(id) { return this.db.deleteBudgetItem(id); }
  
  getFavorites() { return this.db.getFavorites(); }
  addFavorite(activityId) { return this.db.addFavorite(activityId); }
  removeFavorite(activityId) { return this.db.removeFavorite(activityId); }
  
  close() { 
    if (this.isNative && this.db.close) {
      return this.db.close(); 
    }
  }
}

// 創建單例
const db = new Database();
export default db;
