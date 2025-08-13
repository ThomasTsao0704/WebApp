// Language handling, search, rendering, modal, and data loading
let currentLanguage = 'zh-tw';
let eventsData = [];
let filteredEvents = [];

const translations = {
  'zh-tw': {
    title:'酒吧餐廳活動搜尋', subtitle:'發現您附近最熱門的酒吧和餐廳活動',
    search_name:'活動名稱', search_location:'地點', search_type:'活動類型', search_btn:'搜尋活動',
    no_results:'找不到符合條件的活動', view_details:'查看詳情', date:'日期', time:'時間',
    venue:'場地', price:'價格', contact:'聯絡方式', description:'詳細說明', free:'免費',
    view_map:'📍 查看地圖位置', all_types:'所有類型', type_music:'音樂表演', type_food:'美食活動',
    type_cocktail:'調酒體驗', type_party:'主題派對', type_special:'特別活動'
  },
  'zh-cn': {
    title:'酒吧餐厅活动搜索', subtitle:'发现您附近最热门的酒吧和餐厅活动',
    search_name:'活动名称', search_location:'地点', search_type:'活动类型', search_btn:'搜索活动',
    no_results:'找不到符合条件的活动', view_details:'查看详情', date:'日期', time:'时间',
    venue:'场地', price:'价格', contact:'联系方式', description:'详细说明', free:'免费',
    view_map:'📍 查看地图位置', all_types:'所有类型', type_music:'音乐表演', type_food:'美食活动',
    type_cocktail:'调酒体验', type_party:'主题派对', type_special:'特别活动'
  },
  'en': {
    title:'Bar & Restaurant Events Search', subtitle:'Discover the hottest bar and restaurant events near you',
    search_name:'Event Name', search_location:'Location', search_type:'Event Type', search_btn:'Search Events',
    no_results:'No events found matching your criteria', view_details:'View Details', date:'Date', time:'Time',
    venue:'Venue', price:'Price', contact:'Contact', description:'Description', free:'Free',
    view_map:'📍 View Map Location', all_types:'All Types', type_music:'Music Performance', type_food:'Food Events',
    type_cocktail:'Cocktail Experience', type_party:'Theme Party', type_special:'Special Events'
  },
  'ja': {
    title:'バー・レストランイベント検索', subtitle:'お近くの人気バー・レストランイベントを発見',
    search_name:'イベント名', search_location:'場所', search_type:'イベントタイプ', search_btn:'イベント検索',
    no_results:'条件に一致するイベントが見つかりません', view_details:'詳細を見る', date:'日付', time:'時間',
    venue:'会場', price:'料金', contact:'連絡先', description:'詳細説明', free:'無料',
    view_map:'📍 地図で場所を確認', all_types:'すべてのタイプ', type_music:'音楽パフォーマンス', type_food:'フードイベント',
    type_cocktail:'カクテル体験', type_party:'テーマパーティー', type_special:'特別イベント'
  },
  'ko': {
    title:'바 & 레스토랑 이벤트 검색', subtitle:'주변의 인기 바와 레스토랑 이벤트를 발견하세요',
    search_name:'이벤트 이름', search_location:'위치', search_type:'이벤트 유형', search_btn:'이벤트 검색',
    no_results:'조건에 맞는 이벤트를 찾을 수 없습니다', view_details:'자세히 보기', date:'날짜', time:'시간',
    venue:'장소', price:'가격', contact:'연락처', description:'상세 설명', free:'무료',
    view_map:'📍 지도에서 위치 보기', all_types:'모든 유형', type_music:'음악 공연', type_food:'음식 이벤트',
    type_cocktail:'칵테일 체험', type_party:'테마 파티', type_special:'특별 이벤트'
  },
  'th': {
    title:'ค้นหาอีเวนต์บาร์และร้านอาหาร', subtitle:'ค้นพบอีเวนต์บาร์และร้านอาหารยอดนิยมใกล้คุณ',
    search_name:'ชื่ออีเวนต์', search_location:'สถานที่', search_type:'ประเภทอีเวนต์', search_btn:'ค้นหาอีเวนต์',
    no_results:'ไม่พบอีเวนต์ที่ตรงกับเงื่อนไข', view_details:'ดูรายละเอียด', date:'วันที่', time:'เวลา',
    venue:'สถานที่จัด', price:'ราคา', contact:'ติดต่อ', description:'รายละเอียด', free:'ฟรี',
    view_map:'📍 ดูตำแหน่งในแผนที่', all_types:'ทุกประเภท', type_music:'การแสดงดนตรี', type_food:'อีเวนต์อาหาร',
    type_cocktail:'ประสบการณ์ค็อกเทล', type_party:'ปาร์ตี้ธีม', type_special:'อีเวนต์พิเศษ'
  }
};

function updatePlaceholders(lang){
  const placeholders={
    'zh-tw':{name:'輸入活動名稱...', location:'輸入地點...'},
    'zh-cn':{name:'输入活动名称...', location:'输入地点...'},
    'en':{name:'Enter event name...', location:'Enter location...'},
    'ja':{name:'イベント名を入力...', location:'場所を入力...'},
    'ko':{name:'이벤트 이름 입력...', location:'위치 입력...'},
    'th':{name:'กรอกชื่ออีเวนต์...', location:'กรอกสถานที่...'}
  };
  document.getElementById('searchName').placeholder = placeholders[lang].name;
  document.getElementById('searchLocation').placeholder = placeholders[lang].location;
}

function updateSelectOptions(lang){
  const searchType=document.getElementById('searchType');
  const typeKeys=['all_types','type_music','type_food','type_cocktail','type_party','type_special'];
  Array.from(searchType.options).forEach((opt,i)=>{ opt.textContent = translations[lang][typeKeys[i]]; });
}

function getTypeLabel(type){
  const map={'music':'type_music','food':'type_food','cocktail':'type_cocktail','party':'type_party','special':'type_special'};
  return translations[currentLanguage][map[type]] || type;
}

function renderEvents(list){
  const container=document.getElementById('eventsContainer');
  const noResults=document.getElementById('noResults');
  if(!list.length){
    container.style.display='none';
    noResults.style.display='block';
    return;
  }
  container.style.display='grid';
  noResults.style.display='none';
  container.innerHTML = list.map(event=>`
    <div class="event-card" data-id="${event.id}">
      <div class="event-image" style="background-image:url('${event.image}')">
        <div class="event-image-title">${event.name[currentLanguage]}</div>
      </div>
      <div class="event-content">
        <div class="event-venue">${event.venue[currentLanguage]}</div>
        <div class="event-date">${event.date} ${event.time}</div>
        <div class="event-type">${getTypeLabel(event.type)}</div>
        <div class="event-description">${event.description[currentLanguage].substring(0,100)}...</div>
        <div class="event-price">${event.price[currentLanguage]}</div>
      </div>
    </div>
  `).join('');
  // attach click listeners for cards
  document.querySelectorAll('.event-card').forEach(card=>{
    card.addEventListener('click',()=>showEventDetails(Number(card.dataset.id)));
  });
}

function switchLanguage(lang, buttonEl){
  currentLanguage=lang;
  document.querySelectorAll('.language-btn').forEach(btn=>btn.classList.remove('active'));
  if(buttonEl) buttonEl.classList.add('active');
  // Update UI texts
  document.querySelectorAll('[data-translate]').forEach(el=>{
    const key = el.getAttribute('data-translate');
    if(translations[lang][key]) el.textContent = translations[lang][key];
  });
  updatePlaceholders(lang);
  updateSelectOptions(lang);
  renderEvents(filteredEvents);
}

function search(){
  const qName = document.getElementById('searchName').value.toLowerCase();
  const qLoc  = document.getElementById('searchLocation').value.toLowerCase();
  const qType = document.getElementById('searchType').value;
  filteredEvents = eventsData.filter(ev=>{
    const nameMatch = !qName || Object.values(ev.name).some(n=>n.toLowerCase().includes(qName));
    const locMatch  = !qLoc || Object.values(ev.location).some(l=>l.toLowerCase().includes(qLoc)) ||
                                Object.values(ev.venue).some(v=>v.toLowerCase().includes(qLoc));
    const typeMatch = !qType || ev.type===qType;
    return nameMatch && locMatch && typeMatch;
  });
  renderEvents(filteredEvents);
}

function showEventDetails(id){
  const ev = eventsData.find(e=>e.id===id);
  if(!ev) return;
  const modal = document.getElementById('eventModal');
  const modalContent = document.getElementById('modalContent');
  const googleMapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(ev.address)}`;
  modalContent.innerHTML = `
    <div class="modal-header-image" style="background-image:url('${ev.image}')">
      <h2 class="modal-title">${ev.name[currentLanguage]}</h2>
    </div>
    <div class="event-details">
      <div class="detail-item"><div class="detail-label">${translations[currentLanguage].venue}</div><div class="detail-value">${ev.venue[currentLanguage]}</div></div>
      <div class="detail-item"><div class="detail-label">${translations[currentLanguage].date}</div><div class="detail-value">${ev.date}</div></div>
      <div class="detail-item"><div class="detail-label">${translations[currentLanguage].time}</div><div class="detail-value">${ev.time}</div></div>
      <div class="detail-item"><div class="detail-label">${translations[currentLanguage].price}</div><div class="detail-value">${ev.price[currentLanguage]}</div></div>
      <div class="detail-item"><div class="detail-label">${translations[currentLanguage].contact}</div><div class="detail-value">${ev.contact}</div></div>
    </div>
    <div style="margin:20px 0;">
      <h3>${translations[currentLanguage].description}</h3>
      <p style="line-height:1.6;margin-top:10px;">${ev.description[currentLanguage]}</p>
    </div>
    <a href="${googleMapsUrl}" target="_blank" class="map-btn">${translations[currentLanguage].view_map}</a>
  `;
  modal.style.display='block';
}

function closeModal(){ document.getElementById('eventModal').style.display='none'; }

// wire up once DOM loaded
document.addEventListener('DOMContentLoaded', async ()=>{
  // language buttons
  document.querySelectorAll('.language-btn').forEach(btn=>{
    btn.addEventListener('click',()=>switchLanguage(btn.dataset.lang, btn));
  });
  document.getElementById('searchBtn').addEventListener('click', search);
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  window.addEventListener('click', (e)=>{ if(e.target.id==='eventModal') closeModal(); });

  // load data
  try {
    const res = await fetch('database/data.json', {cache:'no-cache'});
    if(!res.ok) throw new Error('Failed to load data.json');
    eventsData = await res.json();
    filteredEvents = [...eventsData];
  } catch (err) {
    console.error('Data load error:', err);
    eventsData = [];
    filteredEvents = [];
  }
  renderEvents(filteredEvents);
  updatePlaceholders(currentLanguage);
  updateSelectOptions(currentLanguage);
});
