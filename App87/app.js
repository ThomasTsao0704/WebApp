// ==================== React App ====================
const { useState, useEffect, useMemo, useCallback } = React;

// ==================== Main App Component ====================
function App() {
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [favorites, setFavorites] = useState(
        JSON.parse(localStorage.getItem("favorites") || "[]")
    );

    // 載入景點資料
    useEffect(() => {
        fetch("data/trip.json")
            .then(response => {
                if (!response.ok) {
                    throw new Error('無法載入景點資料');
                }
                return response.json();
            })
            .then(data => {
                setPlaces(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('載入失敗:', err);
                setError(err.message);
                setLoading(false);
            });
    }, []);

    // 收藏功能
    const toggleFavorite = useCallback((id) => {
        setFavorites(prev => {
            const updated = prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id];
            localStorage.setItem("favorites", JSON.stringify(updated));
            return updated;
        });
    }, []);

    // 取得所有類別
    const categories = useMemo(() => {
        const cats = new Set();
        places.forEach(p => {
            if (p.category) cats.add(p.category);
        });
        return ['all', ...Array.from(cats).sort()];
    }, [places]);

    // 篩選景點
    const filteredPlaces = useMemo(() => {
        let filtered = places;

        // 分頁篩選
        if (activeTab === 'favorites') {
            filtered = filtered.filter(p => favorites.includes(p.id));
        }

        // 類別篩選
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }

        // 搜尋
        if (searchQuery) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(query) ||
                p.location.toLowerCase().includes(query) ||
                (p.description && p.description.toLowerCase().includes(query))
            );
        }

        return filtered;
    }, [places, activeTab, selectedCategory, searchQuery, favorites]);

    // 統計資料
    const stats = useMemo(() => ({
        total: places.length,
        favorites: favorites.length,
        categories: categories.length - 1,
        filtered: filteredPlaces.length
    }), [places, favorites, categories, filteredPlaces]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>載入旅遊資料中...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">❌</div>
                <p>載入失敗：{error}</p>
                <button className="btn btn-primary" onClick={() => window.location.reload()}>
                    重新載入
                </button>
            </div>
        );
    }

    return (
        <>
            <Navigation 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                stats={stats}
            />

            {(activeTab === 'all' || activeTab === 'favorites') && (
                <>
                    <SearchFilter
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        categories={categories}
                    />

                    <div className="day-section">
                        <StatsBar stats={stats} activeTab={activeTab} />

                        <PlacesList
                            places={filteredPlaces}
                            favorites={favorites}
                            toggleFavorite={toggleFavorite}
                            isShowingFavorites={activeTab === 'favorites'}
                        />
                    </div>
                </>
            )}

            {activeTab === 'packing' && <PackingList />}
            {activeTab === 'budget' && <Budget />}
        </>
    );
}

// ==================== Navigation Component ====================
function Navigation({ activeTab, setActiveTab, stats }) {
    const tabs = [
        { id: 'all', label: '所有景點', icon: '🗺️' },
        { id: 'favorites', label: `收藏 (${stats.favorites})`, icon: '❤️' },
        { id: 'packing', label: '行李清單', icon: '🎒' },
        { id: 'budget', label: '預算記帳', icon: '💰' }
    ];

    return (
        <nav className="nav-tabs" role="navigation" aria-label="主選單">
            {tabs.map(tab => (
                <div
                    key={tab.id}
                    className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    tabIndex={0}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            setActiveTab(tab.id);
                        }
                    }}
                >
                    <span aria-hidden="true">{tab.icon}</span> {tab.label}
                </div>
            ))}
        </nav>
    );
}

// ==================== Search & Filter Component ====================
function SearchFilter({ searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, categories }) {
    const categoryLabels = {
        'all': '🌐 全部',
        '交通': '🚇 交通',
        '美食': '🍜 美食',
        '購物': '🛍️ 購物',
        '景點': '🏯 景點'
    };

    return (
        <div className="search-filter-section">
            <div className="search-box">
                <span className="search-icon" aria-hidden="true">🔍</span>
                <input
                    type="text"
                    placeholder="搜尋景點、地點、描述..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="搜尋景點"
                />
            </div>

            <div className="filter-chips" role="tablist" aria-label="類別篩選">
                {categories.map(cat => (
                    <div
                        key={cat}
                        className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                        role="tab"
                        aria-selected={selectedCategory === cat}
                        tabIndex={0}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                setSelectedCategory(cat);
                            }
                        }}
                    >
                        {categoryLabels[cat] || cat}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ==================== Stats Bar Component ====================
function StatsBar({ stats, activeTab }) {
    const displayStats = [
        { label: '景點總數', value: stats.total, show: true },
        { label: '已收藏', value: stats.favorites, show: true },
        { label: '類別', value: stats.categories, show: true },
        { label: '搜尋結果', value: stats.filtered, show: activeTab === 'all' }
    ].filter(s => s.show);

    return (
        <div className="stats-bar">
            {displayStats.map((stat, index) => (
                <div className="stat-item" key={index}>
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                </div>
            ))}
        </div>
    );
}

// ==================== Places List Component ====================
function PlacesList({ places, favorites, toggleFavorite, isShowingFavorites }) {
    if (places.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    {isShowingFavorites ? '❤️' : '🔍'}
                </div>
                <p>
                    {isShowingFavorites 
                        ? '尚未收藏任何景點' 
                        : '找不到符合條件的景點'}
                </p>
            </div>
        );
    }

    return (
        <div className="cards-grid">
            {places.map(place => (
                <PlaceCard
                    key={place.id}
                    place={place}
                    isFavorite={favorites.includes(place.id)}
                    toggleFavorite={toggleFavorite}
                />
            ))}
        </div>
    );
}

// ==================== Place Card Component ====================
function PlaceCard({ place, isFavorite, toggleFavorite }) {
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;

    return (
        <article className="card">
            <div className="card-image-container">
                <img 
                    src={place.image} 
                    alt={place.name}
                    loading="lazy"
                    onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="%23999" font-size="16">圖片載入失敗</text></svg>';
                    }}
                />
                <span 
                    className="favorite" 
                    onClick={() => toggleFavorite(place.id)}
                    title={isFavorite ? '取消收藏' : '加入收藏'}
                    role="button"
                    aria-label={isFavorite ? '取消收藏' : '加入收藏'}
                    tabIndex={0}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            toggleFavorite(place.id);
                        }
                    }}
                >
                    {isFavorite ? "❤️" : "🤍"}
                </span>
                {place.category && (
                    <div className="category-badge">{place.category}</div>
                )}
            </div>

            <div className="card-content">
                <h3 className="card-title">{place.name}</h3>
                <div className="card-sub">
                    <span aria-hidden="true">📍</span>
                    <span>{place.location}</span>
                </div>
                {place.description && (
                    <p className="card-description">{place.description}</p>
                )}

                <div className="card-actions">
                    <a 
                        className="btn" 
                        href={mapUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        aria-label={`在 Google 地圖開啟 ${place.name}`}
                    >
                        📍 地圖
                    </a>
                    <button 
                        className="btn" 
                        onClick={() => sendNotify(place)}
                        aria-label={`設定 ${place.name} 的提醒`}
                    >
                        🔔 提醒
                    </button>
                </div>
            </div>
        </article>
    );
}

// ==================== Notification Function ====================
function sendNotify(place) {
    if (!("Notification" in window)) {
        alert("此瀏覽器不支援通知功能");
        return;
    }

    if (Notification.permission === "granted") {
        new Notification(`📍 ${place.name}`, {
            body: `${place.location}\n${place.description || ''}`,
            icon: place.image,
            badge: place.image,
            tag: `place-${place.id}`,
            requireInteraction: false
        });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(`📍 ${place.name}`, {
                    body: `${place.location}\n${place.description || ''}`,
                    icon: place.image
                });
            } else {
                alert("需要通知權限才能設定提醒");
            }
        });
    } else {
        alert("通知權限已被拒絕，請在瀏覽器設定中開啟通知權限");
    }
}

// ==================== Packing List Component ====================
function PackingList() {
    const [items, setItems] = useState(
        JSON.parse(localStorage.getItem("pack") || "[]")
    );
    const [input, setInput] = useState("");

    const addItem = useCallback(() => {
        const trimmed = input.trim();
        if (!trimmed) return;
        
        const newList = [...items, { 
            text: trimmed, 
            done: false, 
            id: Date.now() 
        }];
        setItems(newList);
        localStorage.setItem("pack", JSON.stringify(newList));
        setInput("");
    }, [input, items]);

    const toggleItem = useCallback((id) => {
        const newList = items.map(item => 
            item.id === id ? { ...item, done: !item.done } : item
        );
        setItems(newList);
        localStorage.setItem("pack", JSON.stringify(newList));
    }, [items]);

    const deleteItem = useCallback((id) => {
        const newList = items.filter(item => item.id !== id);
        setItems(newList);
        localStorage.setItem("pack", JSON.stringify(newList));
    }, [items]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') addItem();
    };

    const completedCount = items.filter(i => i.done).length;

    return (
        <div className="day-section">
            <div className="list-container">
                <h2>🎒 行李清單</h2>
                
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="新增行李物品..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        aria-label="新增行李物品"
                    />
                    <button className="btn btn-primary" onClick={addItem}>
                        ➕ 新增
                    </button>
                </div>

                {items.length > 0 && (
                    <div style={{ marginBottom: '16px', color: '#777', fontSize: '14px' }}>
                        已完成: {completedCount} / {items.length} 
                        ({items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0}%)
                    </div>
                )}

                {items.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🎒</div>
                        <p>尚未加入任何物品</p>
                    </div>
                ) : (
                    items.map((item) => (
                        <div key={item.id} className={`list-item ${item.done ? 'done' : ''}`}>
                            <input
                                type="checkbox"
                                checked={item.done}
                                onChange={() => toggleItem(item.id)}
                                aria-label={`標記 ${item.text} 為${item.done ? '未完成' : '已完成'}`}
                            />
                            <span>{item.text}</span>
                            <button 
                                className="btn" 
                                onClick={() => deleteItem(item.id)}
                                style={{ padding: '8px 14px', fontSize: '13px' }}
                                aria-label={`刪除 ${item.text}`}
                            >
                                🗑️
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ==================== Budget Component ====================
function Budget() {
    const [list, setList] = useState(
        JSON.parse(localStorage.getItem("budget") || "[]")
    );
    const [name, setName] = useState("");
    const [cost, setCost] = useState("");

    const addBudget = useCallback(() => {
        const trimmedName = name.trim();
        const numCost = Number(cost);
        
        if (!trimmedName || !numCost || numCost <= 0) {
            alert('請輸入有效的項目名稱和金額');
            return;
        }
        
        const newList = [...list, { 
            name: trimmedName, 
            cost: numCost, 
            id: Date.now(),
            date: new Date().toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            })
        }];
        setList(newList);
        localStorage.setItem("budget", JSON.stringify(newList));
        setName("");
        setCost("");
    }, [name, cost, list]);

    const deleteItem = useCallback((id) => {
        if (confirm('確定要刪除這筆記錄嗎?')) {
            const newList = list.filter(item => item.id !== id);
            setList(newList);
            localStorage.setItem("budget", JSON.stringify(newList));
        }
    }, [list]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') addBudget();
    };

    const total = list.reduce((sum, item) => sum + item.cost, 0);

    return (
        <div className="day-section">
            <div className="budget-container">
                <h2>💰 預算記帳</h2>

                <div className="input-group">
                    <input
                        type="text"
                        placeholder="項目名稱"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyPress={handleKeyPress}
                        aria-label="項目名稱"
                    />
                    <input
                        type="number"
                        placeholder="金額 (TWD)"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        onKeyPress={handleKeyPress}
                        min="0"
                        step="1"
                        style={{ maxWidth: '150px' }}
                        aria-label="金額"
                    />
                    <button className="btn btn-primary" onClick={addBudget}>
                        ➕ 新增
                    </button>
                </div>

                {list.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">💰</div>
                        <p>尚未記錄任何支出</p>
                    </div>
                ) : (
                    <>
                        {list.map((item) => (
                            <div key={item.id} className="budget-item">
                                <div>
                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                        {item.name}
                                    </div>
                                    {item.date && (
                                        <div style={{ fontSize: '13px', color: '#999' }}>
                                            {item.date}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <span style={{ fontWeight: '700', color: '#FF6B6B', fontSize: '16px' }}>
                                        NT$ {item.cost.toLocaleString('zh-TW')}
                                    </span>
                                    <button 
                                        className="btn" 
                                        onClick={() => deleteItem(item.id)}
                                        style={{ padding: '8px 14px', fontSize: '13px' }}
                                        aria-label={`刪除 ${item.name}`}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}

                        <div className="budget-total">
                            總計: NT$ {total.toLocaleString('zh-TW')}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ==================== Initialize App ====================
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// ==================== Console Welcome Message ====================
console.log('%c🇯🇵 Thomas Japan Travel', 'font-size: 24px; font-weight: bold; color: #1A2A4E;');
console.log('%c歡迎使用大阪旅遊助手！', 'font-size: 14px; color: #666;');
console.log('%c版本: 2.0 | 作者: Thomas', 'font-size: 12px; color: #999;');
