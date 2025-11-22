// ==================== React App (Debug Version) ====================
const { useState, useEffect, useMemo, useCallback } = React;

console.log('🔍 除錯: React 載入完成');
console.log('React version:', React.version);

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

    console.log('🔍 除錯: App 元件已初始化');

    // 載入景點資料
    useEffect(() => {
        console.log('🔍 除錯: 開始載入景點資料...');
        
        fetch("data/trip.json")
            .then(response => {
                console.log('🔍 除錯: fetch 回應狀態:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('🔍 除錯: 景點資料載入成功，數量:', data.length);
                setPlaces(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('❌ 除錯: 載入失敗:', err);
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

        if (activeTab === 'favorites') {
            filtered = filtered.filter(p => favorites.includes(p.id));
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }

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

    console.log('🔍 除錯: 當前狀態 - loading:', loading, ', places:', places.length, ', error:', error);

    if (loading) {
        return React.createElement('div', { className: 'loading-container' },
            React.createElement('div', { className: 'spinner' }),
            React.createElement('p', null, '載入旅遊資料中...')
        );
    }

    if (error) {
        return React.createElement('div', { className: 'empty-state' },
            React.createElement('div', { className: 'empty-state-icon' }, '❌'),
            React.createElement('p', null, '載入失敗：' + error),
            React.createElement('button', {
                className: 'btn btn-primary',
                onClick: () => window.location.reload()
            }, '重新載入')
        );
    }

    return React.createElement(React.Fragment, null,
        React.createElement(Navigation, {
            activeTab: activeTab,
            setActiveTab: setActiveTab,
            stats: stats
        }),

        (activeTab === 'all' || activeTab === 'favorites') && React.createElement(React.Fragment, null,
            React.createElement(SearchFilter, {
                searchQuery: searchQuery,
                setSearchQuery: setSearchQuery,
                selectedCategory: selectedCategory,
                setSelectedCategory: setSelectedCategory,
                categories: categories
            }),

            React.createElement('div', { className: 'day-section' },
                React.createElement(StatsBar, { stats: stats, activeTab: activeTab }),
                React.createElement(PlacesList, {
                    places: filteredPlaces,
                    favorites: favorites,
                    toggleFavorite: toggleFavorite,
                    isShowingFavorites: activeTab === 'favorites'
                })
            )
        ),

        activeTab === 'packing' && React.createElement(PackingList),
        activeTab === 'budget' && React.createElement(Budget)
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

    return React.createElement('nav', { className: 'nav-tabs', role: 'navigation' },
        tabs.map(tab => 
            React.createElement('div', {
                key: tab.id,
                className: `nav-tab ${activeTab === tab.id ? 'active' : ''}`,
                onClick: () => setActiveTab(tab.id)
            },
                React.createElement('span', null, tab.icon),
                ' ' + tab.label
            )
        )
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

    return React.createElement('div', { className: 'search-filter-section' },
        React.createElement('div', { className: 'search-box' },
            React.createElement('span', { className: 'search-icon' }, '🔍'),
            React.createElement('input', {
                type: 'text',
                placeholder: '搜尋景點、地點、描述...',
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value)
            })
        ),

        React.createElement('div', { className: 'filter-chips' },
            categories.map(cat =>
                React.createElement('div', {
                    key: cat,
                    className: `filter-chip ${selectedCategory === cat ? 'active' : ''}`,
                    onClick: () => setSelectedCategory(cat)
                }, categoryLabels[cat] || cat)
            )
        )
    );
}

// ==================== Stats Bar Component ====================
function StatsBar({ stats, activeTab }) {
    const displayStats = [
        { label: '景點總數', value: stats.total },
        { label: '已收藏', value: stats.favorites },
        { label: '類別', value: stats.categories }
    ];

    return React.createElement('div', { className: 'stats-bar' },
        displayStats.map((stat, index) =>
            React.createElement('div', { className: 'stat-item', key: index },
                React.createElement('div', { className: 'stat-value' }, stat.value),
                React.createElement('div', { className: 'stat-label' }, stat.label)
            )
        )
    );
}

// ==================== Places List Component ====================
function PlacesList({ places, favorites, toggleFavorite, isShowingFavorites }) {
    if (places.length === 0) {
        return React.createElement('div', { className: 'empty-state' },
            React.createElement('div', { className: 'empty-state-icon' }, 
                isShowingFavorites ? '❤️' : '🔍'
            ),
            React.createElement('p', null, 
                isShowingFavorites ? '尚未收藏任何景點' : '找不到符合條件的景點'
            )
        );
    }

    return React.createElement('div', { className: 'cards-grid' },
        places.map(place =>
            React.createElement(PlaceCard, {
                key: place.id,
                place: place,
                isFavorite: favorites.includes(place.id),
                toggleFavorite: toggleFavorite
            })
        )
    );
}

// ==================== Place Card Component ====================
function PlaceCard({ place, isFavorite, toggleFavorite }) {
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;

    return React.createElement('article', { className: 'card' },
        React.createElement('div', { className: 'card-image-container' },
            React.createElement('img', {
                src: place.image,
                alt: place.name,
                loading: 'lazy'
            }),
            React.createElement('span', {
                className: 'favorite',
                onClick: () => toggleFavorite(place.id),
                title: isFavorite ? '取消收藏' : '加入收藏'
            }, isFavorite ? '❤️' : '🤍'),
            place.category && React.createElement('div', { className: 'category-badge' }, place.category)
        ),

        React.createElement('div', { className: 'card-content' },
            React.createElement('h3', { className: 'card-title' }, place.name),
            React.createElement('div', { className: 'card-sub' },
                React.createElement('span', null, '📍'),
                React.createElement('span', null, place.location)
            ),
            place.description && React.createElement('p', { className: 'card-description' }, place.description),

            React.createElement('div', { className: 'card-actions' },
                React.createElement('a', {
                    className: 'btn',
                    href: mapUrl,
                    target: '_blank',
                    rel: 'noopener noreferrer'
                }, '📍 地圖'),
                React.createElement('button', {
                    className: 'btn',
                    onClick: () => alert(`已設定 ${place.name} 的提醒`)
                }, '🔔 提醒')
            )
        )
    );
}

// ==================== Packing List Component ====================
function PackingList() {
    const [items, setItems] = useState(
        JSON.parse(localStorage.getItem("pack") || "[]")
    );
    const [input, setInput] = useState("");

    const addItem = () => {
        if (!input.trim()) return;
        const newList = [...items, { text: input, done: false, id: Date.now() }];
        setItems(newList);
        localStorage.setItem("pack", JSON.stringify(newList));
        setInput("");
    };

    const toggleItem = (id) => {
        const newList = items.map(item =>
            item.id === id ? { ...item, done: !item.done } : item
        );
        setItems(newList);
        localStorage.setItem("pack", JSON.stringify(newList));
    };

    const deleteItem = (id) => {
        const newList = items.filter(item => item.id !== id);
        setItems(newList);
        localStorage.setItem("pack", JSON.stringify(newList));
    };

    const completedCount = items.filter(i => i.done).length;

    return React.createElement('div', { className: 'day-section' },
        React.createElement('div', { className: 'list-container' },
            React.createElement('h2', null, '🎒 行李清單'),
            
            React.createElement('div', { className: 'input-group' },
                React.createElement('input', {
                    type: 'text',
                    placeholder: '新增行李物品...',
                    value: input,
                    onChange: (e) => setInput(e.target.value),
                    onKeyPress: (e) => e.key === 'Enter' && addItem()
                }),
                React.createElement('button', {
                    className: 'btn btn-primary',
                    onClick: addItem
                }, '➕ 新增')
            ),

            items.length > 0 && React.createElement('div', { style: { marginBottom: '16px', color: '#777', fontSize: '14px' } },
                `已完成: ${completedCount} / ${items.length}`
            ),

            items.length === 0 ? 
                React.createElement('div', { className: 'empty-state' },
                    React.createElement('div', { className: 'empty-state-icon' }, '🎒'),
                    React.createElement('p', null, '尚未加入任何物品')
                ) :
                items.map(item =>
                    React.createElement('div', {
                        key: item.id,
                        className: `list-item ${item.done ? 'done' : ''}`
                    },
                        React.createElement('input', {
                            type: 'checkbox',
                            checked: item.done,
                            onChange: () => toggleItem(item.id)
                        }),
                        React.createElement('span', { style: { flex: 1 } }, item.text),
                        React.createElement('button', {
                            className: 'btn',
                            onClick: () => deleteItem(item.id),
                            style: { padding: '8px 14px', fontSize: '13px' }
                        }, '🗑️')
                    )
                )
        )
    );
}

// ==================== Budget Component ====================
function Budget() {
    const [list, setList] = useState(
        JSON.parse(localStorage.getItem("budget") || "[]")
    );
    const [name, setName] = useState("");
    const [cost, setCost] = useState("");

    const addBudget = () => {
        if (!name.trim() || !cost) return;
        
        const newList = [...list, {
            name: name.trim(),
            cost: Number(cost),
            id: Date.now(),
            date: new Date().toLocaleDateString('zh-TW')
        }];
        setList(newList);
        localStorage.setItem("budget", JSON.stringify(newList));
        setName("");
        setCost("");
    };

    const deleteItem = (id) => {
        if (confirm('確定要刪除這筆記錄嗎?')) {
            const newList = list.filter(item => item.id !== id);
            setList(newList);
            localStorage.setItem("budget", JSON.stringify(newList));
        }
    };

    const total = list.reduce((sum, item) => sum + item.cost, 0);

    return React.createElement('div', { className: 'day-section' },
        React.createElement('div', { className: 'budget-container' },
            React.createElement('h2', null, '💰 預算記帳'),

            React.createElement('div', { className: 'input-group' },
                React.createElement('input', {
                    type: 'text',
                    placeholder: '項目名稱',
                    value: name,
                    onChange: (e) => setName(e.target.value),
                    onKeyPress: (e) => e.key === 'Enter' && addBudget()
                }),
                React.createElement('input', {
                    type: 'number',
                    placeholder: '金額',
                    value: cost,
                    onChange: (e) => setCost(e.target.value),
                    onKeyPress: (e) => e.key === 'Enter' && addBudget(),
                    style: { maxWidth: '150px' }
                }),
                React.createElement('button', {
                    className: 'btn btn-primary',
                    onClick: addBudget
                }, '➕ 新增')
            ),

            list.length === 0 ?
                React.createElement('div', { className: 'empty-state' },
                    React.createElement('div', { className: 'empty-state-icon' }, '💰'),
                    React.createElement('p', null, '尚未記錄任何支出')
                ) :
                React.createElement(React.Fragment, null,
                    list.map(item =>
                        React.createElement('div', { key: item.id, className: 'budget-item' },
                            React.createElement('div', null,
                                React.createElement('div', { style: { fontWeight: '600' } }, item.name),
                                item.date && React.createElement('div', {
                                    style: { fontSize: '13px', color: '#999', marginTop: '4px' }
                                }, item.date)
                            ),
                            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '14px' } },
                                React.createElement('span', {
                                    style: { fontWeight: '700', color: '#FF6B6B', fontSize: '16px' }
                                }, `NT$ ${item.cost.toLocaleString('zh-TW')}`),
                                React.createElement('button', {
                                    className: 'btn',
                                    onClick: () => deleteItem(item.id),
                                    style: { padding: '8px 14px', fontSize: '13px' }
                                }, '🗑️')
                            )
                        )
                    ),

                    React.createElement('div', { className: 'budget-total' },
                        `總計: NT$ ${total.toLocaleString('zh-TW')}`
                    )
                )
        )
    );
}

// ==================== Initialize App ====================
console.log('🔍 除錯: 準備渲染 App...');

try {
    ReactDOM.render(
        React.createElement(App),
        document.getElementById('root')
    );
    console.log('✅ 除錯: App 渲染成功！');
} catch (err) {
    console.error('❌ 除錯: 渲染失敗:', err);
}

// ==================== Console Welcome Message ====================
console.log('%c🇯🇵 Thomas Japan Travel', 'font-size: 24px; font-weight: bold; color: #1A2A4E;');
console.log('%c歡迎使用大阪旅遊助手！', 'font-size: 14px; color: #666;');
console.log('%c版本: 2.0 (Debug) | 作者: Thomas', 'font-size: 12px; color: #999;');
