export const STORAGE_KEYS = {
  MARKET_DATA: 'stockMarketData_v3',
  PERSONAL_RECORDS: 'stockRecords_v3',
  PORTFOLIO: 'stockPortfolio_v3',
  ALERTS: 'priceAlerts_v3',
  THEME: 'theme_dark'
};

export const state = {
  marketData: [],
  pendingNewData: [],
  personalRecords: [],
  portfolio: [],
  alerts: [],
  lastAnalyzedSlice: [],
  chart: null
};

export const concepts = {
  'AI人工智慧': ['2330','2454','3034','2379','3661','6669','4904'],
  '電動車': ['2317','1513','6116','1102','5871','2308','1519'],
  '半導體': ['2330','2454','3034','2303','3711','6770','3443'],
  '5G通訊': ['2454','2474','3044','2345','2449','6188','3661']
};
