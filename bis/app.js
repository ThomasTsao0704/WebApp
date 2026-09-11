// 預設值範本(對應維度順序)，讓載入後就是一組有效查詢
const TEMPLATE = "A.N.TW.XW.S13.S1.N.L.LE.F3.L._Z.USD.X1+XDC.N.V.N._T".split(".");
let DIMS = [];
let chart = null;

const $ = id => document.getElementById(id);
// Google Apps Script Web App URL：部署 Code.gs 後，把 /exec URL 貼到這裡
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbzvmobA1LOrqANcF1cX8ioTHuW5c-BCyUxQDBVDZbbC0eYg33MTwt3bDkvL0hzF30Ju8Q/exec";

function gasJsonp(action, params={}){
  return new Promise((resolve, reject) => {
    const cb = "gas_cb_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    const q = new URLSearchParams({action, callback:cb, ...params});
    const timer = setTimeout(() => { cleanup(); reject(new Error("GAS API 逾時")); }, 60000);
    function cleanup(){ clearTimeout(timer); delete window[cb]; script.remove(); }
    window[cb] = data => { cleanup(); resolve(data); };
    script.onerror = () => { cleanup(); reject(new Error("GAS API 無法連線")); };
    script.src = GAS_API_URL + (GAS_API_URL.includes("?") ? "&" : "?") + q.toString();
    document.head.appendChild(script);
  });
}
function compactSeriesLabel(i){ return `S${i+1}`; }
function colorFor(i){ return `hsl(${(i*137.508)%360},58%,46%)`; }
function periodKey(p){ const m=String(p).match(/(\d{4})(?:\D*(\d+))?/); return m?parseInt(m[1])*100+(m[2]?parseInt(m[2]):0):Infinity; }
function setStatus(msg,kind){ const s=$("status"); s.innerHTML=msg; s.className="status show "+kind; }

function buildForm(dims){
  DIMS = dims;
  if (dims.length !== TEMPLATE.length) {
    setStatus(`注意：BIS 回傳 ${dims.length} 個維度，範本預期 ${TEMPLATE.length} 個；預設值可能對不上，請以下方組出的 key 為準。`, "warn");
  }
  const grid = $("grid");
  grid.innerHTML = "";
  dims.forEach((d, di) => {
    const cell = document.createElement("div");
    cell.className = "dim";
    const defaults = (TEMPLATE[di] || "").split("+").filter(Boolean);

    if (d.values && d.values.length) {
      const opts = d.values.map(v =>
        `<option value="${v.code}" ${defaults.includes(v.code)?"selected":""}>${v.code} — ${v.name}</option>`
      ).join("");
      cell.innerHTML =
        `<label>${d.name} <span class="id">${d.id}</span></label>` +
        `<select multiple data-dim="${di}" size="4">${opts}</select>`;
    } else {
      // 沒有代碼清單的維度 → 退回文字輸入
      cell.innerHTML =
        `<label>${d.name} <span class="id">${d.id}</span></label>` +
        `<input type="text" data-dim="${di}" value="${TEMPLATE[di]||""}" placeholder="留空=全選">`;
    }
    grid.appendChild(cell);
  });
  grid.addEventListener("change", () => { updateKey(); scheduleAvail(); });
  updateKey();
  refreshAvail();
  $("go").disabled = false;
}

function composeKey(){
  return DIMS.map((d, di) => {
    const ctrl = document.querySelector(`[data-dim="${di}"]`);
    if (!ctrl) return "";
    if (ctrl.tagName === "SELECT")
      return Array.from(ctrl.selectedOptions).map(o => o.value).join("+");
    return ctrl.value.trim();
  }).join(".");
}

function bisUrl(key, start, fmt){
  let u = `https://stats.bis.org/api/v2/data/dataflow/BIS/WS_NA_SEC_DSS/1.0/${key}?format=${fmt || "csv"}`;
  if (start) u += `&startPeriod=${encodeURIComponent(start)}`;
  return u;
}

function updateKey(){
  const k = composeKey();
  $("keytext").textContent = k || "—";
  const a = $("keyurl");
  if (k) { a.href = bisUrl(k, $("start").value.trim()); a.style.display = ""; }
  else { a.style.display = "none"; }
}

// 依「目前組合下哪些值有資料」裁剪其他維度的選項
let availTimer = null;
function scheduleAvail(){ clearTimeout(availTimer); availTimer = setTimeout(refreshAvail, 350); }

async function refreshAvail(){
  try {
    const data = await gasJsonp("available", {key: composeKey()});
    const note = $("availNote");
    if (data.available && Object.keys(data.available).length) {
      applyAvailability(data.available);
      if (note) note.style.display = "none";
    } else if (note) {
      note.style.display = "";       // 裁剪拿不到資料 → 提示選單未過濾
    }
  } catch (e) { /* 抓不到就不裁剪，維持全部選項 */ }
}

$("start").addEventListener("input", updateKey);

function applyAvailability(avail){
  DIMS.forEach((d, di) => {
    const sel = document.querySelector(`select[data-dim="${di}"]`);
    if (!sel || !d.values.length) return;

    const allowed = avail[d.id];
    if (!allowed) return;  // BIS 沒回傳 → 保留原選項，避免因 API 暫時失敗誤刪

    const allowSet = new Set(allowed);
    const selected = new Set(Array.from(sel.selectedOptions).map(o => o.value));

    // 真正的動態 Facet：無效組合直接隱藏，不再顯示紅色「過期」選項。
    // 如果使用者原本選的值已經失效，會自動取消，讓 key 回到有效狀態。
    const stillSelected = [];
    sel.innerHTML = d.values
      .filter(v => allowSet.has(v.code))
      .map(v => {
        const isSelected = selected.has(v.code);
        if (isSelected) stillSelected.push(v.code);
        return `<option value="${v.code}"${isSelected ? " selected" : ""}>` +
               `${v.code} — ${v.name}</option>`;
      }).join("");

    // 如果目前完全沒有選值，維持「空＝全選」的語意；
    // 如果有值但全部被裁掉，瀏覽器會自然呈現空選取。
  });
  updateKey();
}
async function loadStructure(){
  try {
    if (!GAS_API_URL || GAS_API_URL.includes("PASTE_YOUR")) throw new Error("尚未設定 GAS_API_URL");
    const data = await gasJsonp("structure");
    if (!data.dimensions || !data.dimensions.length) throw new Error("結構回傳空的維度清單。");
    buildForm(data.dimensions);
  } catch (err) {
    $("grid").innerHTML = "";
    setStatus("載入維度清單失敗：" + err.message +
      "。請確認是用 <code>python bis_server.py</code> 啟動、而且能連到網路。", "warn");
  }
}

async function run(){
  const key = composeKey();
  const start = $("start").value.trim();
  const btn = $("go");
  btn.disabled = true; btn.textContent = "抓取中…";
  setStatus("正在向 BIS 查詢…", "info");
  try {
    const data = await gasJsonp("data", {key, start});
    const link = data.url ? ` <a href="${data.url}" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">開啟這條查詢</a>` : "";
    if (data.error) { setStatus("失敗：" + data.error + link, "warn"); return; }
    if (data.empty) {
      setStatus("這個維度組合在 BIS 查無資料（回應 404 = 無結果）。放寬條件（把某些維度改成全選），或點" + link + "在瀏覽器確認。", "warn");
      return;
    }
    if (!data.series || !data.series.length) { setStatus("查無資料。試試放寬條件。" + link, "warn"); return; }
    draw(data);
    setStatus(`已載入 ${data.series.length} 條序列 × ${data.periods.length} 期。` + link, "info");
  } catch (err) {
    setStatus("失敗：" + err.message, "warn");
  } finally {
    btn.disabled = false; btn.textContent = "抓取並繪圖";
  }
}

function draw(d){
  const order = d.periods.map((_,i)=>i).sort((a,b)=>periodKey(d.periods[a])-periodKey(d.periods[b]));
  const periods = order.map(i=>d.periods[i]);
  const series = d.series.map(s => ({label:s.label, data:order.map(i=>s.data[i])}));

  $("chartWrap").style.display = "block";
  if (chart) chart.destroy();
  chart = new Chart($("chart"), {
    type:"line",
    data:{ labels:periods, datasets: series.map((s,i)=>({
      label:compactSeriesLabel(i), fullLabel:s.label, data:s.data,
      borderColor:colorFor(i), backgroundColor:colorFor(i),
      borderWidth:1.8, pointRadius:0, pointHoverRadius:4, spanGaps:true, tension:0.15,
    })) },
    options:{
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:"index", intersect:false },
      plugins:{
        legend:{ position:"bottom", labels:{ font:{family:"IBM Plex Sans",size:11}, boxWidth:12, padding:12 } },
        tooltip:{ backgroundColor:"#171B22", padding:12, cornerRadius:8,
          titleFont:{family:"IBM Plex Mono"}, bodyFont:{family:"IBM Plex Sans"} },
      },
      scales:{
        x:{ grid:{display:false}, ticks:{ font:{family:"IBM Plex Mono",size:10}, maxRotation:0, autoSkip:true, maxTicksLimit:12 } },
        y:{ grid:{color:"#EEF0F4"}, ticks:{ font:{family:"IBM Plex Mono",size:11} } },
      },
    },
  });
}

$("go").addEventListener("click", run);
loadStructure();
