import React, { useState, useEffect } from 'react';
import db from './database';
import ItineraryView from './components/ItineraryView';
import PackingList from './components/PackingList';
import BudgetList from './components/BudgetList';
import MapView from './components/MapView';
import './App.css';

function App() {
  const [dbReady, setDbReady] = useState(false);
  const [days, setDays] = useState([]);
  const [currentDay, setCurrentDay] = useState(0);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [editMode, setEditMode] = useState(false);
  const [favorites, setFavorites] = useState([]);

  // 初始化資料庫
  useEffect(() => {
    initDatabase();
  }, []);

  const initDatabase = async () => {
    try {
      const success = await db.init();
      if (success) {
        await db.insertSampleData();
        await loadData();
        setDbReady(true);
      }
    } catch (error) {
      console.error('初始化失敗:', error);
      alert('資料庫初始化失敗，請重新啟動應用');
    }
  };

  // 載入所有資料
  const loadData = async () => {
    const daysData = await db.getDays();
    
    // 為每個 day 載入其 activities
    const daysWithActivities = await Promise.all(
      daysData.map(async (day) => {
        const activities = await db.getActivities(day.id);
        return { ...day, activities };
      })
    );

    setDays(daysWithActivities);
    
    // 載入收藏
    const favs = await db.getFavorites();
    setFavorites(favs);
  };

  // === 天數管理 ===
  
  const addDay = async () => {
    const newDayNumber = days.length + 1;
    const title = `Day ${newDayNumber} - 新的一天`;
    const dayId = await db.addDay(title, '');
    await loadData();
    setCurrentDay(days.length); // 切換到新天數
  };

  const deleteDay = async (dayIndex) => {
    if (days.length <= 1) {
      alert('至少需要保留一天行程！');
      return;
    }
    if (confirm(`確定要刪除 ${days[dayIndex].title} 嗎？`)) {
      await db.deleteDay(days[dayIndex].id);
      await loadData();
      if (currentDay >= days.length - 1) {
        setCurrentDay(Math.max(0, days.length - 2));
      }
    }
  };

  const editDayTitle = async (dayIndex, newTitle) => {
    const day = days[dayIndex];
    await db.updateDay(day.id, newTitle, day.date);
    await loadData();
  };

  const moveDayUp = async (dayIndex) => {
    if (dayIndex === 0) return;
    
    const currentDayObj = days[dayIndex];
    const prevDayObj = days[dayIndex - 1];
    
    await db.reorderDays(currentDayObj.id, prevDayObj.sort_order);
    await db.reorderDays(prevDayObj.id, currentDayObj.sort_order);
    
    await loadData();
    setCurrentDay(dayIndex - 1);
  };

  const moveDayDown = async (dayIndex) => {
    if (dayIndex === days.length - 1) return;
    
    const currentDayObj = days[dayIndex];
    const nextDayObj = days[dayIndex + 1];
    
    await db.reorderDays(currentDayObj.id, nextDayObj.sort_order);
    await db.reorderDays(nextDayObj.id, currentDayObj.sort_order);
    
    await loadData();
    setCurrentDay(dayIndex + 1);
  };

  // === 活動管理 ===
  
  const addActivity = async (activity) => {
    await db.addActivity({ ...activity, day_id: days[currentDay].id });
    await loadData();
  };

  const updateActivity = async (activityId, updatedActivity) => {
    await db.updateActivity(activityId, updatedActivity);
    await loadData();
  };

  const deleteActivity = async (activityId) => {
    if (confirm('確定要刪除這個活動嗎？')) {
      await db.deleteActivity(activityId);
      await loadData();
    }
  };

  // === 收藏管理 ===
  
  const toggleFavorite = async (activityId) => {
    if (favorites.includes(activityId)) {
      await db.removeFavorite(activityId);
    } else {
      await db.addFavorite(activityId);
    }
    const favs = await db.getFavorites();
    setFavorites(favs);
  };

  if (!dbReady) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <div>資料庫初始化中...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">🌏 旅行規劃</div>
        <div className="app-subtitle">離線 SQLite 資料庫</div>
      </header>

      <nav className="nav-tabs">
        <div
          className={`nav-tab ${activeTab === 'itinerary' ? 'active' : ''}`}
          onClick={() => setActiveTab('itinerary')}
        >
          📅 行程
        </div>
        <div
          className={`nav-tab ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          🗺️ 地圖
        </div>
        <div
          className={`nav-tab ${activeTab === 'packing' ? 'active' : ''}`}
          onClick={() => setActiveTab('packing')}
        >
          🎒 行李
        </div>
        <div
          className={`nav-tab ${activeTab === 'budget' ? 'active' : ''}`}
          onClick={() => setActiveTab('budget')}
        >
          💰 預算
        </div>
        <div
          className={`nav-tab ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          ❤️ 收藏
        </div>
      </nav>

      {activeTab === 'itinerary' && (
        <ItineraryView
          days={days}
          currentDay={currentDay}
          setCurrentDay={setCurrentDay}
          editMode={editMode}
          setEditMode={setEditMode}
          favorites={favorites}
          onAddDay={addDay}
          onDeleteDay={deleteDay}
          onEditDayTitle={editDayTitle}
          onMoveDayUp={moveDayUp}
          onMoveDayDown={moveDayDown}
          onAddActivity={addActivity}
          onUpdateActivity={updateActivity}
          onDeleteActivity={deleteActivity}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {activeTab === 'map' && days[currentDay] && (
        <MapView day={days[currentDay]} />
      )}

      {activeTab === 'packing' && <PackingList db={db} />}

      {activeTab === 'budget' && <BudgetList db={db} />}

      {activeTab === 'favorites' && (
        <FavoritesList
          days={days}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
}

// 收藏列表組件
function FavoritesList({ days, favorites, onToggleFavorite }) {
  const favActivities = days
    .flatMap(day => day.activities)
    .filter(activity => favorites.includes(activity.id));

  return (
    <div className="container">
      <h2 className="section-title">❤️ 收藏景點</h2>
      {favActivities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💔</div>
          <p>尚未收藏任何景點</p>
        </div>
      ) : (
        favActivities.map(activity => (
          <div className="card" key={activity.id}>
            <div className="card-image-wrapper">
              <img src={activity.image} alt={activity.name} loading="lazy" />
            </div>
            <div className="card-content">
              <div className="card-header">
                <span className="card-time">🕐 {activity.time}</span>
                <button
                  className="icon-btn"
                  onClick={() => onToggleFavorite(activity.id)}
                >
                  ❤️
                </button>
              </div>
              <h3 className="card-title">{activity.name}</h3>
              <span className="card-category">{activity.category}</span>
              <div className="card-info">📍 {activity.location}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default App;
