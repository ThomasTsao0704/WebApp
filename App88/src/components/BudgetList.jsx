import React, { useState, useEffect } from 'react';

function BudgetList({ db }) {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const data = await db.getBudget();
    setItems(data);
  };

  const addItem = async () => {
    if (name.trim() && cost) {
      await db.addBudgetItem(name, Number(cost));
      setName('');
      setCost('');
      await loadItems();
    }
  };

  const deleteItem = async (id) => {
    await db.deleteBudgetItem(id);
    await loadItems();
  };

  const total = items.reduce((sum, item) => sum + item.cost, 0);

  return (
    <div className="container">
      <h2 className="section-title">💰 預算記帳</h2>

      <div className="budget-total">
        <div className="budget-amount">¥{total.toLocaleString()}</div>
        <div className="budget-label">總支出</div>
      </div>

      <div className="list-container">
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💸</div>
            <p>還沒有記錄任何支出</p>
          </div>
        ) : (
          <div>
            {items.map((item) => (
              <div key={item.id} className="list-item">
                <div className="list-item-content">
                  <span style={{ flex: 1, fontWeight: 600 }}>{item.name}</span>
                  <span style={{ color: '#1a2a4e', fontWeight: 'bold', marginRight: '12px' }}>
                    ¥{item.cost.toLocaleString()}
                  </span>
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
            placeholder="項目名稱"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ flex: '1 1 200px' }}
          />
          <input
            type="number"
            placeholder="金額"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            style={{ flex: '1 1 120px' }}
          />
          <button className="btn success" onClick={addItem}>
            ➕ 新增
          </button>
        </div>
      </div>
    </div>
  );
}

export default BudgetList;
