/* ── 台股分析工具組 · 共用導覽列 ── */
(function(){
  const BASE = 'https://thomastsao0704.github.io/WebApp/App16/';
  const TOOLS = [
    { file:'home.html',          icon:'🏠', label:'工具首頁',    sub:'總覽與快速入口' },
    { file:'long-short.html',    icon:'⚖️', label:'隔日多空評估', sub:'融資融券+處置評分' },
    { file:'revenue.html',       icon:'💹', label:'月營收分析',   sub:'成長衰退排行榜' },
    { file:'income-analysis.html',icon:'🏦',label:'財務體質分析', sub:'100分財務健康評分' },
    { file:'balance-sheet.html', icon:'📊', label:'資產負債分析', sub:'流動比率/負債結構' },
    { file:'market-signal.html', icon:'🚦', label:'市場訊號',     sub:'停買停售事件偵測' },
    { file:'news.html',          icon:'📰', label:'重大訊息',     sub:'上市公司即時公告' },
  ];

  const cur = location.pathname.split('/').pop() || 'home.html';

  /* ── styles ── */
  const style = document.createElement('style');
  style.textContent = `
  #nb-fab{
    position:fixed;bottom:22px;right:22px;z-index:9999;
    width:46px;height:46px;border-radius:50%;border:none;cursor:pointer;
    background:linear-gradient(135deg,#1e3a5f,#2563eb);
    color:#fff;font-size:20px;box-shadow:0 4px 16px rgba(37,99,235,.45);
    display:flex;align-items:center;justify-content:center;
    transition:transform .15s,box-shadow .15s;
  }
  #nb-fab:hover{transform:scale(1.08);box-shadow:0 6px 22px rgba(37,99,235,.55);}
  #nb-fab.open{background:linear-gradient(135deg,#1e293b,#0f172a);}
  #nb-panel{
    position:fixed;bottom:78px;right:22px;z-index:9998;
    width:230px;background:#fff;border-radius:12px;
    box-shadow:0 8px 32px rgba(0,0,0,.18);border:1px solid #e2e8f0;
    overflow:hidden;
    transform:scale(.92) translateY(12px);opacity:0;pointer-events:none;
    transform-origin:bottom right;transition:transform .18s,opacity .18s;
  }
  #nb-panel.open{transform:scale(1) translateY(0);opacity:1;pointer-events:auto;}
  .nb-head{
    background:linear-gradient(135deg,#0f172a,#1e3a5f);
    padding:10px 14px;color:#fff;font-size:11px;font-weight:700;
    letter-spacing:.5px;display:flex;align-items:center;gap:6px;
  }
  .nb-head span{color:#94a3b8;font-weight:400;margin-left:auto;font-size:10px;}
  .nb-item{
    display:flex;align-items:center;gap:10px;padding:8px 14px;
    text-decoration:none;color:#0f172a;border-bottom:1px solid #f1f5f9;
    transition:background .1s;font-size:12px;
  }
  .nb-item:last-child{border-bottom:none;}
  .nb-item:hover{background:#f8fafc;}
  .nb-item.active{background:#eff6ff;}
  .nb-item .ni{font-size:16px;flex-shrink:0;}
  .nb-item .nl{font-weight:600;line-height:1.2;}
  .nb-item .ns{font-size:10px;color:#94a3b8;margin-top:1px;}
  .nb-item.active .nl{color:#2563eb;}
  #nb-overlay{
    position:fixed;inset:0;z-index:9997;display:none;
  }
  #nb-overlay.open{display:block;}
  `;
  document.head.appendChild(style);

  /* ── markup ── */
  const fab = document.createElement('button');
  fab.id = 'nb-fab';
  fab.title = '工具導覽';
  fab.innerHTML = '☰';

  const overlay = document.createElement('div');
  overlay.id = 'nb-overlay';

  const panel = document.createElement('div');
  panel.id = 'nb-panel';
  panel.innerHTML = `<div class="nb-head">🗂 台股分析工具組 <span>${TOOLS.length-1} 工具</span></div>`
    + TOOLS.map(t=>`
      <a class="nb-item${cur===t.file?' active':''}" href="${BASE}${t.file}">
        <span class="ni">${t.icon}</span>
        <div><div class="nl">${t.label}</div><div class="ns">${t.sub}</div></div>
      </a>`).join('');

  document.body.appendChild(overlay);
  document.body.appendChild(panel);
  document.body.appendChild(fab);

  /* ── toggle ── */
  function open(){fab.classList.add('open');panel.classList.add('open');overlay.classList.add('open');fab.innerHTML='✕';}
  function close(){fab.classList.remove('open');panel.classList.remove('open');overlay.classList.remove('open');fab.innerHTML='☰';}
  fab.addEventListener('click',()=>panel.classList.contains('open')?close():open());
  overlay.addEventListener('click',close);
})();
