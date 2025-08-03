// 股票資料庫
let dataSource1 = []; // JS 固定資料 (stocksData)
let dataSource2 = []; // JSON 動態資料
let filteredStocks1 = [];
let filteredStocks2 = [];
let csvMode = false; // CSV轉JSON模式

// 切換上傳模式
function toggleUploadMode() {
    const csvCheckbox = document.getElementById('csv-mode');
    const fileInput = document.getElementById('file-input');
    const modeText = document.getElementById('upload-mode-text');
    
    csvMode = csvCheckbox.checked;
    
    if (csvMode) {
        fileInput.accept = '.csv';
        modeText.textContent = '目前模式: CSV 轉 JSON';
    } else {
        fileInput.accept = '.json';
        modeText.textContent = '目前模式: JSON 上傳';
    }
    
    // 清除已選檔案
    fileInput.value = '';
    document.getElementById('file-name').textContent = '';
}

// 處理文件上傳
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileName = document.getElementById('file-name');
    fileName.textContent = file.name;
    
    const reader = new FileReader();
    
    if (csvMode && file.name.toLowerCase().endsWith('.csv')) {
        // CSV 模式
        reader.onload = function(e) {
            try {
                const csvText = e.target.result;
                const jsonData = csvToJson(csvText);
                updateDataSource2(jsonData);
                alert('CSV 檔案轉換並載入成功！');
            } catch (error) {
                console.error('CSV 轉換錯誤:', error);
                alert('CSV 檔案格式錯誤，請檢查檔案內容。');
            }
        };
        reader.readAsText(file);
    } else if (!csvMode && file.name.toLowerCase().endsWith('.json')) {
        // JSON 模式
        reader.onload = function(e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                if (validateStockData(jsonData)) {
                    updateDataSource2(jsonData);
                    alert('JSON 檔案載入成功！');
                } else {
                    alert('JSON 檔案格式不正確，請確認包含必要的股票資料欄位。');
                }
            } catch (error) {
                console.error('JSON 解析錯誤:', error);
                alert('JSON 檔案格式錯誤，請檢查檔案語法。');
            }
        };
        reader.readAsText(file);
    } else {
        alert('請選擇正確的檔案格式！');
        event.target.value = '';
        fileName.textContent = '';
    }
}

// CSV 轉 JSON 函數
function csvToJson(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('CSV 檔案必須包含標題行和資料行');
    }
    
    // 解析標題行
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    
    // 建立欄位映射
    const fieldMapping = {
        'code': ['code', '股票代號', '代號', 'stock_code'],
        'name': ['name', '股票名稱', '名稱', 'stock_name'],
        'industry': ['industry', '產業', '產業類別', 'sector'],
        'price': ['price', '股價', '價格', 'current_price'],
        'change': ['change', '漲跌', '漲跌幅', 'price_change'],
        'pe': ['pe', '本益比', 'PE', 'pe_ratio'],
        'dividend': ['dividend', '殖利率', 'dividend_yield'],
        'volume': ['volume', '成交量', 'trading_volume'],
        'marketCap': ['marketCap', '市值', 'market_cap', 'market_value']
    };
    
    // 找到對應的欄位索引
    const columnIndexes = {};
    for (const [field, possibleNames] of Object.entries(fieldMapping)) {
        const index = headers.findIndex(header => 
            possibleNames.some(name => 
                header.toLowerCase().includes(name.toLowerCase())
            )
        );
        if (index !== -1) {
            columnIndexes[field] = index;
        }
    }
    
    // 檢查必要欄位
    const requiredFields = ['code', 'name', 'price'];
    for (const field of requiredFields) {
        if (columnIndexes[field] === undefined) {
            throw new Error(`找不到必要欄位: ${field}`);
        }
    }
    
    // 轉換資料
    const jsonData = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.trim().replace(/"/g, ''));
        
        if (values.length < headers.length) continue; // 跳過不完整的行
        
        const stock = {};
        
        // 處理每個欄位
        stock.code = values[columnIndexes.code] || '';
        stock.name = values[columnIndexes.name] || '';
        stock.industry = values[columnIndexes.industry] || '其他';
        stock.price = parseFloat(values[columnIndexes.price]) || 0;
        stock.change = parseFloat(values[columnIndexes.change]) || 0;
        stock.pe = parseFloat(values[columnIndexes.pe]) || 0;
        stock.dividend = parseFloat(values[columnIndexes.dividend]) || 0;
        stock.volume = parseInt(values[columnIndexes.volume]) || 0;
        stock.marketCap = parseFloat(values[columnIndexes.marketCap]) || 0;
        
        // 只添加有效的股票資料
        if (stock.code && stock.name && stock.price > 0) {
            jsonData.push(stock);
        }
    }
    
    if (jsonData.length === 0) {
        throw new Error('沒有找到有效的股票資料');
    }
    
    return jsonData;
}

// 驗證股票資料格式
function validateStockData(data) {
    if (!Array.isArray(data) || data.length === 0) {
        return false;
    }
    
    const requiredFields = ['code', 'name', 'price'];
    const optionalFields = ['industry', 'change', 'pe', 'dividend', 'volume', 'marketCap'];
    
    return data.every(stock => {
        // 檢查必要欄位
        for (const field of requiredFields) {
            if (!(field in stock)) {
                return false;
            }
        }
        
        // 檢查資料型別
        if (typeof stock.code !== 'string' || typeof stock.name !== 'string') {
            return false;
        }
        
        if (typeof stock.price !== 'number' || stock.price <= 0) {
            return false;
        }
        
        return true;
    });
}



// 初始化 (JS + JSON)
function initData() {
    if (typeof stocksData !== 'undefined' && Array.isArray(stocksData)) {
        dataSource1 = [...stocksData];
    }

    fetch('/assets/stocks.json')
        .then(res => res.json())
        .then(data => {
            // 轉換 JSON 資料格式
            dataSource2 = data.map(stock => ({
                code: stock.code.toString(),
                name: stock.name,
                market: stock.market,
                point: stock.point,
                type: stock.type,
                industry: getIndustryFromMarket(stock.market)
            }));

            updateDisplay();
        })
        .catch(err => console.error('無法載入 stocks.json:', err));

    updateDisplay();
}

// 將市場類別轉換為產業類別
function getIndustryFromMarket(market) {
    if (market.includes('半導體') || market.includes('電腦')) return '科技';
    if (market.includes('金融')) return '金融';
    if (market.includes('食品')) return '食品';
    if (market.includes('電子') || market.includes('光電')) return '電子';
    if (market.includes('塑膠') || market.includes('汽車') || market.includes('通信')) return '傳產';
    return '其他';
}

// 頁面切換功能
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');

// 手機版選單切換功能
const menuToggle = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');

if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

// 點擊選單項目時關閉手機版選單
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        // 關閉手機版選單
        if (menuToggle && navMenu) {
            menuToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }

        // 移除所有 active 類別
        navLinks.forEach(nl => nl.classList.remove('active'));
        pages.forEach(page => page.classList.remove('active'));

        // 添加 active 類別到點擊的連結
        link.classList.add('active');

        // 顯示對應的頁面
        const targetPage = link.getAttribute('data-page');
        const pageElement = document.getElementById(targetPage);
        if (pageElement) {
            pageElement.classList.add('active');
        }

        // 如果切換到股票頁面，更新股票表格
        if (targetPage === 'stocks') {
            updateDisplay();
        }
    });
});

// 點擊頁面其他地方時關閉選單
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-container')) {
        if (menuToggle && navMenu) {
            menuToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    }
});

// 判斷應該使用哪個資料源進行篩選
function determineFilterDataSource() {
    const priceMin = document.getElementById('price-min')?.value;
    const priceMax = document.getElementById('price-max')?.value;
    const peMin = document.getElementById('pe-min')?.value;
    const peMax = document.getElementById('pe-max')?.value;
    const volumeMin = document.getElementById('volume-min')?.value;
    const dividendMin = document.getElementById('dividend-min')?.value;
    const marketCap = document.getElementById('market-cap')?.value;

    // 檢查是否有交易相關的篩選條件
    const hasTradeFilters = priceMin || priceMax || peMin || peMax || volumeMin || dividendMin || marketCap;

    if (hasTradeFilters) {
        return 'stocks_js'; // 使用 stocks.js 資料進行篩選
    } else {
        return 'stocks_json'; // 使用 stocks.json 資料進行篩選
    }
}

// 根據股票代碼從資料源1獲取資料
function getStocksFromSource1(codes) {
    return dataSource1.filter(stock => codes.includes(stock.code));
}

// 根據股票代碼從資料源2獲取資料
function getStocksFromSource2(codes) {
    return dataSource2.filter(stock => codes.includes(stock.code));
}

// 顯示資料源1的股票資料（交易資料）
function displayStocksSource1(stocks) {
    const tbody = document.getElementById('stock1-stock-tbody');
    const resultsCount = document.getElementById('stock1-results-count');
    const noResults = document.getElementById('stock1-no-results');
    const stockTable = document.getElementById('stock1-stock-table');

    if (!tbody || !resultsCount || !noResults || !stockTable) return;

    if (!stocks || stocks.length === 0) {
        stockTable.style.display = 'none';
        noResults.style.display = 'block';
        resultsCount.textContent = '找不到符合條件的股票 (0筆)';
        return;
    }

    stockTable.style.display = 'table';
    noResults.style.display = 'none';
    resultsCount.textContent = `顯示篩選結果 (${stocks.length}筆) - stocks.js 交易資料`;

    tbody.innerHTML = stocks.map(stock => `
        <tr>
            <td class="stock-code">${stock.code}</td>
            <td class="stock-name">${stock.name}</td>
            <td><span class="industry-tag">${stock.industry}</span></td>
            <td>${stock.price.toFixed(1)}</td>
            <td class="${stock.change >= 0 ? 'price-positive' : 'price-negative'}">
                ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(1)}
            </td>
            <td>${stock.pe.toFixed(1)}</td>
            <td>${stock.dividend.toFixed(1)}%</td>
            <td>${stock.volume.toLocaleString()}</td>
            <td>${stock.marketCap.toLocaleString()}</td>
        </tr>
    `).join('');
}

// 顯示資料源2的股票資料（公司資料）
function displayStocksSource2(stocks) {
    const tbody = document.getElementById('stock2-stock-tbody');
    const resultsCount = document.getElementById('stock2-results-count');
    const noResults = document.getElementById('stock2-no-results');
    const stockTable = document.getElementById('stock2-stock-table');

    if (!tbody || !resultsCount || !noResults || !stockTable) return;

    if (!stocks || stocks.length === 0) {
        stockTable.style.display = 'none';
        noResults.style.display = 'block';
        resultsCount.textContent = '找不到符合條件的股票 (0筆)';
        return;
    }

    stockTable.style.display = 'table';
    noResults.style.display = 'none';
    resultsCount.textContent = `顯示篩選結果 (${stocks.length}筆) - stocks.json 公司資料`;

    tbody.innerHTML = stocks.map(stock => `
        <tr>
            <td class="stock-code">${stock.code}</td>
            <td class="stock-name">${stock.name}</td>
            <td><span class="industry-tag">${stock.market}</span></td>
            <td colspan="6" style="padding: 1rem; color: #4a5568;">
                <div style="margin-bottom: 0.5rem;">
                    <strong>公司描述：</strong>${stock.point}
                </div>
                <div>
                    <strong>概念股類型：</strong>${Array.isArray(stock.type) ? stock.type.join(', ') : stock.type}
                </div>
            </td>
        </tr>
    `).join('');
}

// 執行篩選並獲取股票代碼
function performFilter() {
    const industry = document.getElementById('industry-filter')?.value || '';
    const priceMin = parseFloat(document.getElementById('price-min')?.value) || 0;
    const priceMax = parseFloat(document.getElementById('price-max')?.value) || Infinity;
    const peMin = parseFloat(document.getElementById('pe-min')?.value) || 0;
    const peMax = parseFloat(document.getElementById('pe-max')?.value) || Infinity;
    const volumeMin = parseInt(document.getElementById('volume-min')?.value) || 0;
    const dividendMin = parseFloat(document.getElementById('dividend-min')?.value) || 0;
    const marketCap = document.getElementById('market-cap')?.value || '';

    const filterDataSource = determineFilterDataSource();
    let filteredStocks = [];

    if (filterDataSource === 'stocks_js') {
        // 使用 stocks.js 資料進行篩選
        filteredStocks = dataSource1.filter(stock => {
            // 產業篩選
            if (industry && stock.industry !== industry) return false;

            // 價格範圍
            if (stock.price < priceMin || stock.price > priceMax) return false;

            // 本益比範圍
            if (stock.pe < peMin || stock.pe > peMax) return false;

            // 成交量
            if (stock.volume < volumeMin) return false;

            // 殖利率
            if (stock.dividend < dividendMin) return false;

            // 市值篩選
            if (marketCap) {
                if (marketCap === 'large' && stock.marketCap <= 500) return false;
                if (marketCap === 'medium' && (stock.marketCap <= 100 || stock.marketCap > 500)) return false;
                if (marketCap === 'small' && stock.marketCap > 100) return false;
            }

            return true;
        });
    } else {
        // 使用 stocks.json 資料進行篩選
        filteredStocks = dataSource2.filter(stock => {
            // 產業篩選 (基於市場類別)
            if (industry && stock.industry !== industry) return false;

            return true;
        });
    }

    // 提取股票代碼
    filteredCodes = filteredStocks.map(stock => stock.code);

    return filteredCodes;
}

// 更新顯示
function updateDisplay() {
    // 執行篩選獲取代碼
    const codes = performFilter();

    // 根據代碼從兩個資料源獲取對應資料
    const stocksFromSource1 = getStocksFromSource1(codes);
    const stocksFromSource2 = getStocksFromSource2(codes);

    // 顯示兩個表格
    displayStocksSource1(stocksFromSource1);
    displayStocksSource2(stocksFromSource2);
}

// 套用篩選條件
function applyFilters() {
    updateDisplay();
}

// 重置篩選條件
function resetFilters() {
    const filterElements = [
        'industry-filter',
        'price-min',
        'price-max',
        'pe-min',
        'pe-max',
        'volume-min',
        'dividend-min',
        'market-cap'
    ];

    filterElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
        }
    });

    updateDisplay();
}

// 初始化
document.addEventListener('DOMContentLoaded', initData);

// 表單提交處理
const contactForm = document.querySelector('.contact-form form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('感謝您的訊息！我們會盡快與您聯繫。');
        contactForm.reset();
    });
}

// 滾動效果
window.addEventListener('scroll', () => {
    const topbar = document.querySelector('.topbar');
    if (topbar) {
        if (window.scrollY > 50) {
            topbar.style.background = 'rgba(255, 255, 255, 0.2)';
        } else {
            topbar.style.background = 'rgba(255, 255, 255, 0.1)';
        }
    }
});