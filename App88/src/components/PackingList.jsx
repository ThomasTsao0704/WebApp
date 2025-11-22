import React, { useState, useEffect } from 'react';

function PackingList({ db }) {
  const [items, setItems] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const data = await db.getPacking();
    setItems(data);
  };

  const addItem = async () => {
    if (input.trim()) {
      await db.addPackingItem(input);
      setInput('');
      await loadItems();
    }
  };

  const toggleItem = async (id, done) => {
    await db.togglePackingItem(id, !done);
    await loadItems();
  };

  const deleteItem = async (id) => {
    await db.deletePackingItem(id);
    await loadItems();
  };

  return (
    <div className="container">
      <h2 className="section-title">🎒 行李清單</h2>

      <div className="list-container">
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>還沒有新增任何物品</p>
          </div>
        ) : (
          <div>
            {items.map((item) => (
              <div key={item.id} className={`list-item ${item.done ? 'done' : ''}`}>
                <div className="list-item-content">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleItem(item.id, item.done)}
                  />
                  <span style={{ flex: 1 }}>{item.text}</span>
                </div>
                <button
                  className="btn danger"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => deleteItem(item.id)}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="input-group" style={{ marginTop: '20px' }}>
          <input
            type="text"
            placeholder="新增物品..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
          />
          <button className="btn success" onClick={addItem}>
            ➕ 新增
          </button>
        </div>
      </div>
    </div>
  );
}

export default PackingList;
