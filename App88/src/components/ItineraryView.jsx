import React, { useState } from 'react';

function ItineraryView({
  days,
  currentDay,
  setCurrentDay,
  editMode,
  setEditMode,
  favorites,
  onAddDay,
  onDeleteDay,
  onEditDayTitle,
  onMoveDayUp,
  onMoveDayDown,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
  onToggleFavorite,
}) {
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);

  const day = days[currentDay];

  return (
    <div className="container">
      {/* Day selector */}
      <div className="day-selector-wrapper">
        <div className="day-selector">
          {days.map((d, idx) => (
            <DayButton
              key={d.id}
              day={d}
              index={idx}
              isActive={currentDay === idx}
              onClick={() => setCurrentDay(idx)}
              onEdit={(newTitle) => onEditDayTitle(idx, newTitle)}
              onDelete={() => onDeleteDay(idx)}
              onMoveUp={() => onMoveDayUp(idx)}
              onMoveDown={() => onMoveDayDown(idx)}
              canMoveUp={idx > 0}
              canMoveDown={idx < days.length - 1}
            />
          ))}
          <button className="add-day-btn" onClick={onAddDay}>
            ➕ 新增天數
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <button
          className={`btn ${editMode ? 'active' : ''}`}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? '✅ 完成編輯' : '✏️ 編輯模式'}
        </button>
        {editMode && (
          <button
            className="btn success"
            onClick={() => {
              setEditingActivity(null);
              setShowActivityModal(true);
            }}
          >
            ➕ 新增活動
          </button>
        )}
      </div>

      {/* Activities */}
      {!day || day.activities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p>這一天還沒有安排行程</p>
          {editMode && <p style={{ marginTop: '12px', color: '#666' }}>點擊「新增活動」開始規劃</p>}
        </div>
      ) : (
        day.activities.map((activity) => (
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
                  {favorites.includes(activity.id) ? '❤️' : '🤍'}
                </button>
              </div>

              <h3 className="card-title">{activity.name}</h3>
              <span className="card-category">{activity.category}</span>

              <div className="card-info">📍 {activity.location}</div>

              {activity.description && (
                <p className="card-description">{activity.description}</p>
              )}

              {editMode && (
                <div className="edit-controls">
                  <button
                    className="btn"
                    onClick={() => {
                      setEditingActivity(activity);
                      setShowActivityModal(true);
                    }}
                  >
                    ✏️ 編輯
                  </button>
                  <button
                    className="btn danger"
                    onClick={() => onDeleteActivity(activity.id)}
                  >
                    🗑️ 刪除
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}

      {/* Activity Modal */}
      {showActivityModal && (
        <ActivityModal
          activity={editingActivity}
          onSave={(activity) => {
            if (editingActivity) {
              onUpdateActivity(editingActivity.id, activity);
            } else {
              onAddActivity(activity);
            }
            setShowActivityModal(false);
            setEditingActivity(null);
          }}
          onClose={() => {
            setShowActivityModal(false);
            setEditingActivity(null);
          }}
        />
      )}
    </div>
  );
}

// Day Button Component
function DayButton({
  day,
  index,
  isActive,
  onClick,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(day.title);

  const handleEdit = () => {
    if (isEditing) {
      onEdit(editedTitle);
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="day-item">
      <div className={`day-btn-wrapper ${isActive ? 'active' : ''}`}>
        {isEditing ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleEdit}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleEdit();
            }}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              fontSize: '14px',
              fontWeight: isActive ? 700 : 500,
              width: '150px',
            }}
            autoFocus
          />
        ) : (
          <button className="day-btn" onClick={onClick}>
            {day.title}
          </button>
        )}
        <button className="day-mini-btn" onClick={handleEdit} title={isEditing ? '完成' : '編輯'}>
          {isEditing ? '✓' : '✏️'}
        </button>
        <button className="day-mini-btn danger" onClick={onDelete} title="刪除">
          🗑️
        </button>
      </div>
      <div className="day-controls">
        {canMoveUp && (
          <button className="day-mini-btn" onClick={onMoveUp} title="上移">
            ⬆️
          </button>
        )}
        {canMoveDown && (
          <button className="day-mini-btn" onClick={onMoveDown} title="下移">
            ⬇️
          </button>
        )}
      </div>
    </div>
  );
}

// Activity Modal Component
function ActivityModal({ activity, onSave, onClose }) {
  const [formData, setFormData] = useState(
    activity || {
      time: '',
      name: '',
      category: '景點',
      location: '',
      description: '',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
      lat: 0,
      lng: 0,
    }
  );

  const handleSubmit = () => {
    if (!formData.name || !formData.time) {
      alert('請填寫活動名稱和時間');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{activity ? '編輯活動' : '新增活動'}</h3>

        <div className="form-group">
          <label>時間 *</label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>活動名稱 *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="例如:清水寺"
          />
        </div>

        <div className="form-group">
          <label>類別</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="景點">景點</option>
            <option value="美食">美食</option>
            <option value="購物">購物</option>
            <option value="交通">交通</option>
            <option value="住宿">住宿</option>
            <option value="其他">其他</option>
          </select>
        </div>

        <div className="form-group">
          <label>地點</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="例如:京都市東山區"
          />
        </div>

        <div className="form-group">
          <label>描述</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="活動描述..."
          />
        </div>

        <div className="form-group">
          <label>圖片網址</label>
          <input
            type="url"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div className="modal-buttons">
          <button className="btn" onClick={onClose}>
            取消
          </button>
          <button className="btn success" onClick={handleSubmit}>
            {activity ? '更新' : '新增'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ItineraryView;
