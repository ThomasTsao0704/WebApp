const { useState, useEffect } = React;

// 簡易 ICON 集（取代 lucide-react）
const ICONS = {
    Calendar: "📅",
    Users: "👥",
    Clock: "⏰",
    Settings: "⚙️",
    Plus: "＋",
    Edit2: "✎",
    Trash2: "🗑️",
    Save: "💾",
    X: "✖",
    Download: "⬇",
    Upload: "⬆",
    Eye: "👁️",
    Edit: "✏️",
    ChevronLeft: "‹",
    ChevronRight: "›",
};

function MobileSchedulingApp() {
    const [activeTab, setActiveTab] = useState('employees');
    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [scheduleData, setScheduleData] = useState({}); // {date: {employeeId: shiftId}}
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [editingShift, setEditingShift] = useState(null);
    const [editingHoliday, setEditingHoliday] = useState(null);

    // 排班表狀態
    const [scheduleViewMode, setScheduleViewMode] = useState('view'); // 'view' or 'edit'
    const [currentDate, setCurrentDate] = useState(new Date());

    // 員工表單
    const [employeeForm, setEmployeeForm] = useState({
        name: '',
        birthday: '',
        type: '正職',
        areas: [],
        hireDate: '',
        remainingLeave: 0
    });

    // 班別表單
    const [shiftForm, setShiftForm] = useState({
        shiftName: '',
        type: '正職',
        areas: [],
        shortName: '',
        hours: '',
        textColor: '#ffffff',
        backgroundColor: '#3b82f6'
    });

    // 假日表單
    const [holidayForm, setHolidayForm] = useState({
        name: '',
        date: ''
    });

    // 工具：當月資訊
    const getMonthInfo = (date = currentDate) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        return { year, month, daysInMonth, startingDayOfWeek, firstDay, lastDay };
    };

    const formatDate = (date) => date.toISOString().split('T')[0];

    // 員工月統計
    const getEmployeeMonthStats = (employee, year, month) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let workDays = 0;
        let restDays = 0;
        let totalHours = 0;
        let vacationDays = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const schedule = getEmployeeSchedule(employee.id, date);
            if (schedule) {
                const assignedShift = shifts.find(s => s.id === schedule);
                if (assignedShift) {
                    workDays++;
                    if (assignedShift.hours) {
                        const [h, m] = assignedShift.hours.split(':').map(Number);
                        totalHours += h + (m / 60);
                    }
                    if (assignedShift.shiftName.includes('特休') || assignedShift.shortName?.includes('特休')) {
                        vacationDays++;
                    }
                }
            } else {
                restDays++;
            }
        }

        return {
            workDays,
            restDays,
            totalHours: Math.round(totalHours * 10) / 10,
            vacationDays,
            remainingVacation: (employee.remainingLeave || 0) - vacationDays
        };
    };

    // 員工排序：區域->類型
    const getSortedEmployees = () => {
        const typeOrder = { '正職': 0, '兼職': 1 };
        const areaOrder = { '外場': 0, '廚房': 1 };

        // 複製一份避免原陣列被 sort 原地改動
        const cloned = [...employees];
        return cloned.sort((a, b) => {
            const aAreas = [...(a.areas || [])].sort((x, y) => (areaOrder[x] ?? 99) - (areaOrder[y] ?? 99));
            const bAreas = [...(b.areas || [])].sort((x, y) => (areaOrder[x] ?? 99) - (areaOrder[y] ?? 99));

            // 逐一比對區域
            const len = Math.max(aAreas.length, bAreas.length);
            for (let i = 0; i < len; i++) {
                const aa = aAreas[i] ?? '';
                const bb = bAreas[i] ?? '';
                if (aa !== bb) return (areaOrder[aa] ?? 99) - (areaOrder[bb] ?? 99);
            }
            // 區域相同再比類型
            return (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99);
        });
    };

    // 匯出
    const exportData = (dataType) => {
        let data, filename;
        switch (dataType) {
            case 'employees': data = employees; filename = 'employees.json'; break;
            case 'shifts': data = shifts; filename = 'shifts.json'; break;
            case 'holidays': data = holidays; filename = 'holidays.json'; break;
            case 'schedule': data = scheduleData; filename = 'schedule.json'; break;
            default: return;
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // 匯入
    const importData = (dataType, file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                switch (dataType) {
                    case 'employees': setEmployees(data); break;
                    case 'shifts': setShifts(data); break;
                    case 'holidays': setHolidays(data); break;
                    case 'schedule': setScheduleData(data); break;
                }
                alert('匯入成功！');
            } catch (err) {
                alert('匯入失敗，請檢查檔案格式');
            }
        };
        reader.readAsText(file);
    };

    const handleImportClick = (dataType) => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (file) importData(dataType, file);
        };
        input.click();
    };

    // 班表
    const getEmployeeSchedule = (employeeId, date) => {
        const dateStr = formatDate(date);
        return scheduleData[dateStr]?.[employeeId] || null;
    };
    const setEmployeeSchedule = (employeeId, date, shiftId) => {
        const dateStr = formatDate(date);
        setScheduleData(prev => ({
            ...prev,
            [dateStr]: { ...(prev[dateStr] || {}), [employeeId]: shiftId || null }
        }));
    };
    const isHoliday = (date) => {
        const dateStr = formatDate(date);
        return holidays.some(h => h.date === dateStr);
    };

    // Reset 表單
    const resetEmployeeForm = () => {
        setEmployeeForm({ name: '', birthday: '', type: '正職', areas: [], hireDate: '', remainingLeave: 0 });
        setEditingEmployee(null);
    };
    const resetShiftForm = () => {
        setShiftForm({ shiftName: '', type: '正職', areas: [], shortName: '', hours: '', textColor: '#ffffff', backgroundColor: '#3b82f6' });
        setEditingShift(null);
    };
    const resetHolidayForm = () => {
        setHolidayForm({ name: '', date: '' });
        setEditingHoliday(null);
    };

    // 員工 CRUD
    const handleEmployeeSubmit = () => {
        if (!employeeForm.name.trim()) return alert('請填寫員工姓名');
        if (editingEmployee !== null) {
            const updated = [...employees];
            updated[editingEmployee] = { ...employeeForm, id: employees[editingEmployee].id };
            setEmployees(updated);
        } else {
            setEmployees([...employees, { ...employeeForm, id: Date.now() }]);
        }
        resetEmployeeForm();
    };
    const editEmployee = (index) => { setEmployeeForm(employees[index]); setEditingEmployee(index); };
    const deleteEmployee = (index) => {
        if (confirm('確定要刪除此員工資料嗎？')) setEmployees(employees.filter((_, i) => i !== index));
    };

    // 班別 CRUD
    const handleShiftSubmit = () => {
        if (!shiftForm.shiftName.trim()) return alert('請填寫班別名稱');
        if (!shiftForm.shortName.trim()) return alert('請填寫班別簡稱');
        if (editingShift !== null) {
            const updated = [...shifts];
            updated[editingShift] = { ...shiftForm, id: shifts[editingShift].id };
            setShifts(updated);
        } else {
            setShifts([...shifts, { ...shiftForm, id: Date.now() }]);
        }
        resetShiftForm();
    };
    const editShift = (index) => { setShiftForm(shifts[index]); setEditingShift(index); };
    const deleteShift = (index) => {
        if (confirm('確定要刪除此班別嗎？')) setShifts(shifts.filter((_, i) => i !== index));
    };

    // 假日 CRUD
    const handleHolidaySubmit = () => {
        if (!holidayForm.name.trim() || !holidayForm.date) return alert('請填寫完整的假日資訊');
        if (editingHoliday !== null) {
            const updated = [...holidays];
            updated[editingHoliday] = { ...holidayForm, id: holidays[editingHoliday].id };
            setHolidays(updated);
        } else {
            setHolidays([...holidays, { ...holidayForm, id: Date.now() }]);
        }
        resetHolidayForm();
    };
    const editHoliday = (index) => { setHolidayForm(holidays[index]); setEditingHoliday(index); };
    const deleteHoliday = (index) => {
        if (confirm('確定要刪除此國定假日嗎？')) setHolidays(holidays.filter((_, i) => i !== index));
    };

    // 多選區域
    const handleAreaChange = (area, formType) => {
        if (formType === 'employee') {
            const set = new Set(employeeForm.areas || []);
            set.has(area) ? set.delete(area) : set.add(area);
            setEmployeeForm({ ...employeeForm, areas: [...set] });
        } else if (formType === 'shift') {
            const set = new Set(shiftForm.areas || []);
            set.has(area) ? set.delete(area) : set.add(area);
            setShiftForm({ ...shiftForm, areas: [...set] });
        }
    };

    const tabs = [
        { id: 'employees', name: '員工資料', icon: ICONS.Users },
        { id: 'shifts', name: '班別設定', icon: ICONS.Clock },
        { id: 'holidays', name: '國定假日', icon: ICONS.Calendar },
        { id: 'schedule', name: '排班表', icon: ICONS.Settings }
    ];

    const ImportExportButtons = ({ dataType }) => (
        <div className="flex space-x-2 mb-4">
            <button
                onClick={() => handleImportClick(dataType)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm"
            >
                <span>{ICONS.Upload}</span><span>匯入</span>
            </button>
            <button
                onClick={() => exportData(dataType)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm"
            >
                <span>{ICONS.Download}</span><span>匯出</span>
            </button>
        </div>
    );

    const renderEmployeeTab = () => (
        <div className="p-4 space-y-6">
            <ImportExportButtons dataType="employees" />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {editingEmployee !== null ? '編輯員工資料' : '新增員工資料'}
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
                        <input
                            type="text"
                            value={employeeForm.name}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="請輸入員工姓名"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">生日</label>
                        <input
                            type="date"
                            value={employeeForm.birthday}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, birthday: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">類型</label>
                        <select
                            value={employeeForm.type}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, type: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="正職">正職</option>
                            <option value="兼職">兼職</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">區域</label>
                        <div className="space-y-2">
                            {['外場', '廚房'].map(area => (
                                <label key={area} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={employeeForm.areas.includes(area)}
                                        onChange={() => handleAreaChange(area, 'employee')}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{area}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">到職日</label>
                        <input
                            type="date"
                            value={employeeForm.hireDate}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, hireDate: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">特休累積天數</label>
                        <input
                            type="number"
                            value={employeeForm.remainingLeave}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, remainingLeave: parseInt(e.target.value) || 0 })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0" min="0"
                        />
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={handleEmployeeSubmit}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                        >
                            <span>{ICONS.Save}</span>
                            <span>{editingEmployee !== null ? '更新' : '新增'}</span>
                        </button>
                        {editingEmployee !== null && (
                            <button
                                onClick={resetEmployeeForm}
                                className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                                title="取消編輯"
                            >
                                {ICONS.X}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {employees.map((employee, index) => (
                    <div key={employee.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-800">{employee.name}</h4>
                                <div className="text-sm text-gray-600 mt-1 space-y-1">
                                    <div>類型: {employee.type}</div>
                                    <div>區域: {employee.areas.join(', ') || '未設定'}</div>
                                    <div>特休累積: {employee.remainingLeave} 天</div>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => editEmployee(index)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="編輯"
                                >{ICONS.Edit2}</button>
                                <button
                                    onClick={() => deleteEmployee(index)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="刪除"
                                >{ICONS.Trash2}</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderShiftsTab = () => (
        <div className="p-4 space-y-6">
            <ImportExportButtons dataType="shifts" />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {editingShift !== null ? '編輯班別' : '新增班別'}
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">班別名稱</label>
                        <input
                            type="text"
                            value={shiftForm.shiftName}
                            onChange={(e) => setShiftForm({ ...shiftForm, shiftName: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="例如：早班、晚班、中班"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">類型</label>
                        <select
                            value={shiftForm.type}
                            onChange={(e) => setShiftForm({ ...shiftForm, type: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="正職">正職</option>
                            <option value="兼職">兼職</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">區域</label>
                        <div className="space-y-2">
                            {['外場', '廚房'].map(area => (
                                <label key={area} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={shiftForm.areas.includes(area)}
                                        onChange={() => handleAreaChange(area, 'shift')}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{area}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">簡稱</label>
                        <input
                            type="text"
                            value={shiftForm.shortName}
                            onChange={(e) => setShiftForm({ ...shiftForm, shortName: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="例如：早、晚、中"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">時數</label>
                        <input
                            type="time"
                            value={shiftForm.hours}
                            onChange={(e) => setShiftForm({ ...shiftForm, hours: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">文字顏色</label>
                            <input
                                type="color"
                                value={shiftForm.textColor}
                                onChange={(e) => setShiftForm({ ...shiftForm, textColor: e.target.value })}
                                className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">底色</label>
                            <input
                                type="color"
                                value={shiftForm.backgroundColor}
                                onChange={(e) => setShiftForm({ ...shiftForm, backgroundColor: e.target.value })}
                                className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* 預覽 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">顏色預覽</label>
                        <div
                            className="w-full p-3 rounded-lg text-center font-medium"
                            style={{ backgroundColor: shiftForm.backgroundColor, color: shiftForm.textColor }}
                        >
                            {shiftForm.shortName || shiftForm.shiftName || '預覽'}
                        </div>
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={handleShiftSubmit}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                        >
                            <span>{ICONS.Save}</span>
                            <span>{editingShift !== null ? '更新' : '新增'}</span>
                        </button>
                        {editingShift !== null && (
                            <button
                                onClick={resetShiftForm}
                                className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                                title="取消編輯"
                            >
                                {ICONS.X}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {shifts.map((shift, index) => (
                    <div key={shift.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="font-semibold text-gray-800">{shift.shiftName}</h4>
                                    <div
                                        className="px-2 py-1 rounded text-xs font-medium"
                                        style={{ backgroundColor: shift.backgroundColor || '#3b82f6', color: shift.textColor || '#ffffff' }}
                                    >
                                        {shift.shortName || shift.shiftName}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>類型: {shift.type}</div>
                                    <div>區域: {shift.areas.join(', ') || '未設定'}</div>
                                    <div>簡稱: {shift.shortName || '—'}</div>
                                    <div>時數: {shift.hours || '未設定'}</div>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => editShift(index)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="編輯"
                                >{ICONS.Edit2}</button>
                                <button
                                    onClick={() => deleteShift(index)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="刪除"
                                >{ICONS.Trash2}</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderHolidaysTab = () => (
        <div className="p-4 space-y-6">
            <ImportExportButtons dataType="holidays" />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {editingHoliday !== null ? '編輯國定假日' : '新增國定假日'}
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">名稱</label>
                        <input
                            type="text"
                            value={holidayForm.name}
                            onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="例如：春節、中秋節"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">日期</label>
                        <input
                            type="date"
                            value={holidayForm.date}
                            onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={handleHolidaySubmit}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                        >
                            <span>{ICONS.Save}</span>
                            <span>{editingHoliday !== null ? '更新' : '新增'}</span>
                        </button>
                        {editingHoliday !== null && (
                            <button
                                onClick={resetHolidayForm}
                                className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                                title="取消編輯"
                            >
                                {ICONS.X}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {holidays.map((holiday, index) => (
                    <div key={holiday.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-800">{holiday.name}</h4>
                                <div className="text-sm text-gray-600 mt-1">日期: {holiday.date}</div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => editHoliday(index)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="編輯"
                                >{ICONS.Edit2}</button>
                                <button
                                    onClick={() => deleteHoliday(index)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="刪除"
                                >{ICONS.Trash2}</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderScheduleTab = () => {
        const { year, month, daysInMonth, startingDayOfWeek } = getMonthInfo();
        const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
        const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
        const sortedEmployees = getSortedEmployees();

        const getVisibleEmployees = (date) => {
            if (scheduleViewMode === 'edit') return sortedEmployees;
            // 檢視模式：隱藏沒有排班的兼職員工
            return sortedEmployees.filter(emp => {
                if (emp.type === '正職') return true;
                const schedule = getEmployeeSchedule(emp.id, date);
                return schedule !== null;
            });
        };

        const navigateMonth = (direction) => {
            setCurrentDate(prev => {
                const d = new Date(prev);
                d.setMonth(prev.getMonth() + direction);
                return d;
            });
        };
        const navigateToToday = () => setCurrentDate(new Date());

        return (
            <div className="p-4 space-y-4">
                <ImportExportButtons dataType="schedule" />

                {/* 控制面板 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => navigateMonth(-1)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="上一月"
                        >{ICONS.ChevronLeft}</button>

                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-800">{year}年 {monthNames[month]}</h3>
                            <button
                                onClick={navigateToToday}
                                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            >回到今天</button>
                        </div>

                        <button
                            onClick={() => navigateMonth(1)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="下一月"
                        >{ICONS.ChevronRight}</button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setScheduleViewMode('view')}
                                className={`flex items-center space-x-2 py-2 px-4 rounded-lg font-medium transition-colors ${scheduleViewMode === 'view' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <span>{ICONS.Eye}</span><span>檢視</span>
                            </button>
                            <button
                                onClick={() => setScheduleViewMode('edit')}
                                className={`flex items-center space-x-2 py-2 px-4 rounded-lg font-medium transition-colors ${scheduleViewMode === 'edit' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <span>{ICONS.Edit}</span><span>編輯</span>
                            </button>
                        </div>
                        <div className="text-xs text-gray-500">
                            {scheduleViewMode === 'view' ? '隱藏兼職休息日' : '顯示所有員工'}
                        </div>
                    </div>
                </div>

                {/* 月曆 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-7 bg-gray-50">
                        {dayNames.map(day => (
                            <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 border-r border-gray-200 last:border-r-0">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7">
                        {Array.from({ length: startingDayOfWeek }, (_, i) => (
                            <div key={`empty-${i}`} className="h-32 border-r border-b border-gray-200 bg-gray-50"></div>
                        ))}

                        {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const cur = new Date(year, month, day);
                            const isToday = formatDate(cur) === formatDate(new Date());
                            const holiday = isHoliday(cur);
                            const visibleEmployees = getVisibleEmployees(cur);

                            return (
                                <div key={day} className="h-32 border-r border-b border-gray-200 last:border-r-0 p-1 overflow-hidden">
                                    <div className="h-full flex flex-col">
                                        <div className={`text-center text-sm font-medium mb-1 ${isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto'
                                                : holiday ? 'text-red-500' : 'text-gray-700'
                                            }`}>
                                            {day}
                                        </div>

                                        <div className="flex-1 overflow-y-auto">
                                            <div className="grid grid-cols-2 gap-0.5 text-xs">
                                                {visibleEmployees.map(employee => {
                                                    const schedule = getEmployeeSchedule(employee.id, cur);
                                                    const assignedShift = shifts.find(s => s.id === schedule);
                                                    return (
                                                        <div key={employee.id} className="min-h-fit">
                                                            {scheduleViewMode === 'edit' ? (
                                                                <div className="space-y-0.5">
                                                                    <div className="font-medium text-gray-700 truncate text-xs leading-tight">{employee.name}</div>
                                                                    <select
                                                                        value={schedule || ''}
                                                                        onChange={(e) => setEmployeeSchedule(employee.id, cur, e.target.value || null)}
                                                                        className="w-full text-xs p-0.5 border border-gray-300 rounded bg-white"
                                                                    >
                                                                        <option value="">休</option>
                                                                        {shifts
                                                                            .filter(shift =>
                                                                                shift.type === employee.type &&
                                                                                shift.areas.some(a => (employee.areas || []).includes(a))
                                                                            )
                                                                            .map(shift => (
                                                                                <option key={shift.id} value={shift.id}>
                                                                                    {shift.shortName || shift.shiftName}
                                                                                </option>
                                                                            ))}
                                                                    </select>
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    className="p-0.5 rounded text-center"
                                                                    style={{
                                                                        backgroundColor: assignedShift ? (assignedShift.backgroundColor || '#dbeafe') : '#f3f4f6',
                                                                        color: assignedShift ? (assignedShift.textColor || '#1e40af') : '#6b7280'
                                                                    }}
                                                                >
                                                                    <div className="font-medium truncate text-xs leading-tight">{employee.name}</div>
                                                                    <div className="truncate text-xs leading-tight">
                                                                        {assignedShift ? (assignedShift.shortName || assignedShift.shiftName) : '休息'}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 統計 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h4 className="font-semibold text-gray-800 mb-4">員工本月統計 ({year}年{['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'][month]})</h4>

                    {/* 正職 */}
                    <div className="mb-6">
                        <h5 className="font-medium text-blue-800 mb-3 flex items-center">
                            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>正職員工
                        </h5>
                        <div className="space-y-2">
                            {employees.filter(e => e.type === '正職').map(emp => {
                                const stats = getEmployeeMonthStats(emp, year, month);
                                return (
                                    <div key={emp.id} className="bg-blue-50 rounded-lg p-3">
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div>
                                                <div className="font-medium text-gray-800">{emp.name}</div>
                                                <div className="text-xs text-gray-600">{(emp.areas || []).join('/')}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-medium text-blue-700">{stats.restDays}天</div>
                                                <div className="text-xs text-gray-600">休假天數</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-medium text-green-700">{stats.remainingVacation}天</div>
                                                <div className="text-xs text-gray-600">特休剩餘</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {employees.filter(e => e.type === '正職').length === 0 && (
                                <div className="text-gray-500 text-sm text-center py-2">暫無正職員工</div>
                            )}
                        </div>
                    </div>

                    {/* 兼職 */}
                    <div>
                        <h5 className="font-medium text-green-800 mb-3 flex items-center">
                            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>兼職員工
                        </h5>
                        <div className="space-y-2">
                            {employees.filter(e => e.type === '兼職').map(emp => {
                                const stats = getEmployeeMonthStats(emp, year, month);
                                return (
                                    <div key={emp.id} className="bg-green-50 rounded-lg p-3">
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div>
                                                <div className="font-medium text-gray-800">{emp.name}</div>
                                                <div className="text-xs text-gray-600">{(emp.areas || []).join('/')}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-medium text-green-700">{stats.workDays}天</div>
                                                <div className="text-xs text-gray-600">上班天數</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-medium text-orange-700">{stats.totalHours}小時</div>
                                                <div className="text-xs text-gray-600">上班時數</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {employees.filter(e => e.type === '兼職').length === 0 && (
                                <div className="text-gray-500 text-sm text-center py-2">暫無兼職員工</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'employees': return renderEmployeeTab();
            case 'shifts': return renderShiftsTab();
            case 'holidays': return renderHolidaysTab();
            case 'schedule': return renderScheduleTab();
            default: return renderEmployeeTab();
        }
    };

    return (
        <div className="pb-6">
            {/* Tab 導覽列（貼齊 Header 下方） */}
            <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
                <div className="flex">
                    {[
                        { id: 'employees', name: '員工資料', icon: ICONS.Users },
                        { id: 'shifts', name: '班別設定', icon: ICONS.Clock },
                        { id: 'holidays', name: '國定假日', icon: ICONS.Calendar },
                        { id: 'schedule', name: '排班表', icon: ICONS.Settings },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium transition-colors ${activeTab === tab.id
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <span className="mb-1">{tab.icon}</span>
                            <span>{tab.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 內容 */}
            {renderTabContent()}
        </div>
    );
}

// 掛載
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<MobileSchedulingApp />);
