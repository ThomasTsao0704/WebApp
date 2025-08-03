import React, { useState, useCallback, useMemo } from 'react';
import { Upload, Filter, Download, Search, X } from 'lucide-react';
import * as Papa from 'papaparse';

const DataTableViewer = () => {
    const [data, setData] = useState([]);
    const [originalData, setOriginalData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [filters, setFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [fileName, setFileName] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    // 處理檔案上傳
    const handleFileUpload = useCallback((file) => {
        if (!file) return;

        setFileName(file.name);
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (fileExtension === 'json') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
                    processData(dataArray);
                } catch (error) {
                    alert('JSON 檔案格式錯誤');
                }
            };
            reader.readAsText(file);
        } else if (fileExtension === 'csv') {
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        console.warn('CSV 解析警告:', results.errors);
                    }
                    processData(results.data);
                },
                error: (error) => {
                    alert('CSV 檔案解析錯誤: ' + error.message);
                }
            });
        } else {
            alert('請上傳 JSON 或 CSV 檔案');
        }
    }, []);

    // 處理資料
    const processData = useCallback((rawData) => {
        if (!rawData || rawData.length === 0) {
            alert('檔案中沒有資料');
            return;
        }

        // 取得所有欄位名稱
        const allColumns = new Set();
        rawData.forEach(row => {
            Object.keys(row || {}).forEach(key => {
                if (key.trim()) allColumns.add(key.trim());
            });
        });

        const columnList = Array.from(allColumns);
        setColumns(columnList);
        setOriginalData(rawData);
        setData(rawData);
        setFilters({});
        setSearchTerm('');
    }, []);

    // 拖拽處理
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    }, [handleFileUpload]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    // 取得欄位的唯一值
    const getUniqueValues = useCallback((column) => {
        const values = originalData
            .map(row => row[column])
            .filter(val => val !== null && val !== undefined && val !== '');
        return [...new Set(values)].sort();
    }, [originalData]);

    // 更新篩選條件
    const updateFilter = useCallback((column, value) => {
        setFilters(prev => ({
            ...prev,
            [column]: value === '' ? undefined : value
        }));
    }, []);

    // 清除篩選條件
    const clearFilter = useCallback((column) => {
        setFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters[column];
            return newFilters;
        });
    }, []);

    // 篩選資料
    const filteredData = useMemo(() => {
        let result = originalData;

        // 應用篩選條件
        Object.entries(filters).forEach(([column, value]) => {
            if (value !== undefined) {
                result = result.filter(row => {
                    const cellValue = row[column];
                    if (cellValue === null || cellValue === undefined) return false;
                    return cellValue.toString().toLowerCase().includes(value.toString().toLowerCase());
                });
            }
        });

        // 應用搜尋
        if (searchTerm) {
            result = result.filter(row =>
                Object.values(row || {}).some(value =>
                    value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        return result;
    }, [originalData, filters, searchTerm]);

    // 匯出篩選後的資料
    const exportData = useCallback(() => {
        if (filteredData.length === 0) return;

        const csv = Papa.unparse(filteredData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `filtered_${fileName || 'data'}.csv`;
        link.click();
    }, [filteredData, fileName]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* 標題區域 */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Filter className="h-8 w-8" />
                            資料表格檢視器
                        </h1>
                        <p className="mt-2 opacity-90">上傳 JSON 或 CSV 檔案，透過篩選條件分析您的資料</p>
                    </div>

                    {/* 檔案上傳區域 */}
                    {data.length === 0 && (
                        <div className="p-8">
                            <div
                                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${isDragging
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                    }`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                            >
                                <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                    上傳您的資料檔案
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    拖拽檔案到這裡，或點擊下方按鈕選擇檔案
                                </p>
                                <input
                                    type="file"
                                    accept=".json,.csv"
                                    onChange={(e) => handleFileUpload(e.target.files[0])}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors duration-200"
                                >
                                    <Upload className="h-5 w-5 mr-2" />
                                    選擇檔案
                                </label>
                                <p className="text-sm text-gray-400 mt-4">
                                    支援格式：JSON, CSV
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 資料展示區域 */}
                    {data.length > 0 && (
                        <div className="flex">
                            {/* 篩選側邊欄 */}
                            <div className="w-80 bg-gray-50 p-6 border-r">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800">篩選條件</h3>
                                    <span className="text-sm text-gray-500">
                                        {filteredData.length} / {originalData.length} 筆資料
                                    </span>
                                </div>

                                {/* 全域搜尋 */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        全域搜尋
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="搜尋所有欄位..."
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* 欄位篩選 */}
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {columns.map(column => (
                                        <div key={column} className="bg-white p-4 rounded-lg border">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-medium text-gray-700 truncate">
                                                    {column}
                                                </label>
                                                {filters[column] && (
                                                    <button
                                                        onClick={() => clearFilter(column)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <select
                                                value={filters[column] || ''}
                                                onChange={(e) => updateFilter(column, e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            >
                                                <option value="">全部</option>
                                                {getUniqueValues(column).map(value => (
                                                    <option key={value} value={value}>
                                                        {value}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>

                                {/* 匯出按鈕 */}
                                <button
                                    onClick={exportData}
                                    className="w-full mt-6 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    匯出篩選結果
                                </button>
                            </div>

                            {/* 資料表格 */}
                            <div className="flex-1 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {fileName && `檔案：${fileName}`}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setData([]);
                                            setOriginalData([]);
                                            setColumns([]);
                                            setFilters({});
                                            setSearchTerm('');
                                            setFileName('');
                                        }}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        重新上傳
                                    </button>
                                </div>

                                <div className="overflow-auto max-h-96 border rounded-lg">
                                    <table className="min-w-full bg-white">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                {columns.map(column => (
                                                    <th
                                                        key={column}
                                                        className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b"
                                                    >
                                                        {column}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredData.map((row, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    {columns.map(column => (
                                                        <td
                                                            key={column}
                                                            className="px-4 py-3 text-sm text-gray-900 border-b max-w-xs truncate"
                                                            title={row[column]}
                                                        >
                                                            {row[column] !== null && row[column] !== undefined
                                                                ? row[column].toString()
                                                                : '-'
                                                            }
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {filteredData.length === 0 && originalData.length > 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>沒有符合篩選條件的資料</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DataTableViewer;