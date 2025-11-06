import { state } from './store.js';
import { saveRecords } from './storage.js';
import { number } from './utils.js';

export function initRecords() {
  const form = document.getElementById('recordForm');
  const add = document.getElementById('recordAdd');
  if (form && add) {
    add.addEventListener('click', (e)=>{
      e.preventDefault();
      const code = form.querySelector('[name="code"]')?.value?.trim();
      const date = form.querySelector('[name="date"]')?.value?.trim();
      const note = form.querySelector('[name="note"]')?.value?.trim();
      if (!code || !date) return;
      state.personalRecords.push({ code, date, note, ts: Date.now() });
      saveRecords(); updateRecordsDisplay(); form.reset();
    });
  }
  updateRecordsDisplay();
}

export function updateRecordsDisplay() {
  const el = document.getElementById('recordsContent');
  if (!el) return;
  if (!state.personalRecords.length) { el.innerHTML = '<div class="muted">尚無個人紀錄</div>'; return; }

  const rows = [...state.personalRecords].sort((a,b)=>b.ts-a.ts);
  el.innerHTML = `
    <table class="table">
      <thead><tr><th>日期</th><th>代碼</th><th>備註</th><th>操作</th></tr></thead>
      <tbody>
        ${rows.map((r,i)=>`
          <tr>
            <td>${r.date}</td>
            <td>${r.code}</td>
            <td>${r.note||''}</td>
            <td><button class="btn btn-sm remove-record" data-i="${i}">刪除</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;

  el.querySelectorAll('.remove-record').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const i = +btn.dataset.i;
      const idx = state.personalRecords.indexOf(rows[i]);
      if (idx>=0) state.personalRecords.splice(idx,1);
      saveRecords(); updateRecordsDisplay();
    });
  });
}
