import React, { useState } from 'react';
import { Calendar, Users, Clock, Settings, Download, Upload, Eye, Edit, Edit2, Trash2, Save, X, ChevronLeft, ChevronRight } from 'lucide-react';

const MobileSchedulingApp = () => {
    const [activeTab, setActiveTab] = useState('employees');
    const [employees, setEmployees] = useState<any[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [holidays, setHolidays] = useState<any[]>([]);
    const [scheduleData, setScheduleData] = useState<any>({}); // {date: {employeeId: shiftId}}
    const [editingEmployee, setEditingEmployee] = useState<number | null>(null);
    const [editingShift, setEditingShift] = useState<number | null>(null);
    const [editingHoliday, setEditingHoliday] = useState<number | null>(null);

    const [scheduleViewMode, setScheduleViewMode] = useState<'view' | 'edit'>('view');
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    const [employeeForm, setEmployeeForm] = useState<any>({
        name: '',
        birthday: '',
        type: '正職',
        areas: [],
        hireDate: '',
        remainingLeave: 0
    });

    const [shiftForm, setShiftForm] = useState<any>({
        shiftName: '',
        type: '正職',
        areas: [],
        shortName: '',
        hours: '',
        textColor: '#ffffff',
        backgroundColor: '#3b82f6'
    });

    const [holidayForm, setHolidayForm] = useState<any>({
        name: '',
        date: ''
    });

    const getMonthInfo = (date = currentDate) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        return { year, month, daysInMonth, startingDayOfWeek, firstDay, lastDay };
    };

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const getEmployeeMonthStats = (employee: any, year: number, month: number) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let workDays = 0, restDays = 0, totalHours = 0, vacationDays = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const schedule = getEmployeeSchedule(employee.id, date);
            if (schedule) {
                const assignedShift = shifts.find((s: any) => s.id === schedule);
                if (assignedShift) {
                    workDays++;
                    if (assignedShift.hours) {
                        const [hours, minutes] = assignedShift.hours.split(':').map(Number);
                        totalHours += hours + (minutes / 60);
                    }
                    if (assignedShift.shiftName?.includes('特休') || assignedShift.shortName?.includes('特休')) {
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
            remainingVacation: (employee.remainingLeave ?? 0) - vacationDays
        };
    };

    const getSortedEmployees = () => {
        const typeOrder: Record<string, number> = { '正職': 0, '兼職': 1 };
        const areaOrder: Record<string, number> = { '外場': 0, '廚房': 1 };
        return [...employees].sort((a: any, b: any) => {
            for (const areaA of [...a.areas].sort((x: string, y: string) => areaOrder[x] - areaOrder[y])) {
                for (const areaB of [...b.areas].sort((x: string, y: string) => areaOrder[x] - areaOrder[y])) {
                    if (areaA !== areaB) return areaOrder[areaA] - areaOrder[areaB];
                    if (a.type !== b.type) return typeOrder[a.type] - typeOrder[b.type];
                }
            }
            return 0;
        });
    };

    const exportData = (dataType: 'employees' | 'shifts' | 'holidays' | 'schedule') => {
        let data: any, filename = '';
        if (dataType === 'employees') { data = employees; filename = 'employees.json'; }
        if (dataType === 'shifts') { data = shifts; filename = 'shifts.json'; }
        if (dataType === 'holidays') { data = holidays; filename = 'holidays.json'; }
        if (dataType === 'schedule') { data = scheduleData; filename = 'schedule.json'; }

        const blob = new Blob([JSON.stringify(data ?? {}, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    };

    const importData = (dataType: 'employees' | 'shifts' | 'holidays' | 'schedule', file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(String(e.target?.result));
                if (dataType === 'employees') setEmployees(data);
                if (dataType === 'shifts') setShifts(data);
                if (dataType === 'holidays') setHolidays(data);
                if (dataType === 'schedule') setScheduleData(data);
                alert('匯入成功！');
            } catch {
                alert('匯入失敗，請檢查檔案格式');
            }
        };
        reader.readAsText(file);
    };

    const handleImportClick = (dataType: 'employees' | 'shifts' | 'holidays' | 'schedule') => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json';
        input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) importData(dataType, file);
        };
        input.click();
    };

    const getEmployeeSchedule = (employeeId: string, date: Date) => {
        const dateStr = formatDate(date);
        return scheduleData?.[dateStr]?.[employeeId] ?? null;
    };

    const setEmployeeSchedule = (employeeId: string, date: Date, shiftId: string | null) => {
        const dateStr = formatDate(date);
        setScheduleData((prev: any) => ({
            ...prev,
            [dateStr]: { ...(prev?.[dateStr] ?? {}), [employeeId]: shiftId }
        }));
    };

    const isHoliday = (date: Date) => {
        const dateStr = formatDate(date);
        return holidays.some((h: any) => h.date === dateStr);
    };

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

    const handleEmployeeSubmit = () => {
        if (!employeeForm.name?.trim()) return alert('請填寫員工姓名');
        if (editingEmployee !== null) {
            const updated = [...employees]; updated[editingEmployee] = { ...employeeForm, id: employees[editingEmployee].id };
            setEmployees(updated);
        } else {
            setEmployees([...employees, { ...employeeForm, id: String(Date.now()) }]);
        }
        resetEmployeeForm();
    };
    const editEmployee = (index: number) => { setEmployeeForm(employees[index]); setEditingEmployee(index); };
    const deleteEmployee = (index: number) => { if (confirm('確定要刪除此員工資料嗎？')) setEmployees(employees.filter((_: any, i: number) => i !== index)); };

    const handleShiftSubmit = () => {
        if (!shiftForm.shiftName?.trim()) return alert('請填寫班別名稱');
        if (!shiftForm.shortName?.trim()) return alert('請填寫班別簡稱');
        if (editingShift !== null) {
            const updated = [...shifts]; updated[editingShift] = { ...shiftForm, id: shifts[editingShift].id };
            setShifts(updated);
        } else {
            setShifts([...shifts, { ...shiftForm, id: String(Date.now()) }]);
        }
        resetShiftForm();
    };
    const editShift = (index: number) => { setShiftForm(shifts[index]); setEditingShift(index); };
    const deleteShift = (index: number) => { if (confirm('確定要刪除此班別嗎？')) setShifts(shifts.filter((_: any, i: number) => i !== index)); };

    const handleHolidaySubmit = () => {
        if (!holidayForm.name?.trim() || !holidayForm.date) return alert('請填寫完整的假日資訊');
        if (editingHoliday !== null) {
            const updated = [...holidays]; updated[editingHoliday] = { ...holidayForm, id: holidays[editingHoliday].id };
            setHolidays(updated);
        } else {
            setHolidays([...holidays, { ...holidayForm, id: String(Date.now()) }]);
        }
        resetHolidayForm();
    };
    const editHoliday = (index: number) => { setHolidayForm(holidays[index]); setEditingHoliday(index); };
    const deleteHoliday = (index: number) => { if (confirm('確定要刪除此國定假日嗎？')) setHolidays(holidays.filter((_: any, i: number) => i !== index)); };

    const handleAreaChange = (area: string, formType: 'employee' | 'shift') => {
        if (formType === 'employee') {
            const has = employeeForm.areas.includes(area);
            setEmployeeForm({ ...employeeForm, areas: has ? employeeForm.areas.filter((a: string) => a !== area) : [...employeeForm.areas, area] });
        } else {
            const has = shiftForm.areas.includes(area);
            setShiftForm({ ...shiftForm, areas: has ? shiftForm.areas.filter((a: string) => a !== area) : [...shiftForm.areas, area] });
        }
    };

    const tabs = [
        { id: 'employees', name: '員工資料', icon: Users },
        { id: 'shifts', name: '班別設定', icon: Clock },
        { id: 'holidays', name: '國定假日', icon: Calendar },
        { id: 'schedule', name: '排班表', icon: Settings }
    ];

    const ImportExportButtons = ({ dataType }: { dataType: 'employees' | 'shifts' | 'holidays' | 'schedule' }) => (
        <div className="flex space-x-2 mb-4">
            <button onClick={() => handleImportClick(dataType)} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm">
                <Upload size={16} /><span>匯入</span>
            </button>
            <button onClick={() => exportData(dataType)} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm">
                <Download size={16} /><span>匯出</span>
            </button>
        </div>
    );

    const renderEmployeeTab = () => (
        <div className="p-4 space-y-6">
            <ImportExportButtons dataType="employees" />
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{editingEmployee !== null ? '編輯員工資料' : '新增員工資料'}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
                        <input type="text" value={employeeForm.name} onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="請輸入員工姓名" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">生日</label>
                        <input type="date" value={employeeForm.birthday} onChange={(e) => setEmployeeForm({ ...employeeForm, birthday: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">類型</label>
                        <select value={employeeForm.type} onChange={(e) => setEmployeeForm({ ...employeeForm, type: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="正職">正職</option><option value="兼職">兼職</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">區域</label>
                        <div className="space-y-2">
                            {['外場', '廚房'].map(area => (
                                <label key={area} className="flex items-center space-x-2">
                                    <input type="checkbox" checked={employeeForm.areas.includes(area)} onChange={() => handleAreaChange(area, 'employee')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    <span className="text-sm text-gray-700">{area}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">到職日</label>
                        <input type="date" value={employeeForm.hireDate} onChange={(e) => setEmployeeForm({ ...employeeForm, hireDate: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">特休累積天數</label>
                        <input type="number" value={employeeForm.remainingLeave} min={0} onChange={(e) => setEmployeeForm({ ...employeeForm, remainingLeave: parseInt(e.target.value) || 0 })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" />
                    </div>
                    <div className="flex space-x-3">
                        <button onClick={handleEmployeeSubmit} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                            <Save size={18} /><span>{editingEmployee !== null ? '更新' : '新增'}</span>
                        </button>
                        {editingEmployee !== null && (
                            <button onClick={resetEmployeeForm} className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center">
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {employees.map((employee: any, index: number) => (
                    <div key={employee.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-800">{employee.name}</h4>
                                <div className="text-sm text-gray-600 mt-1 space-y-1">
                                    <div>類型: {employee.type}</div>
                                    <div>區域: {employee.areas?.join(', ') || '未設定'}</div>
                                    <div>特休累積: {employee.remainingLeave ?? 0} 天</div>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => editEmployee(index)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => deleteEmployee(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
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
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{editingShift !== null ? '編輯班別' : '新增班別'}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">班別名稱</label>
                        <input type="text" value={shiftForm.shiftName} onChange={(e) => setShiftForm({ ...shiftForm, shiftName: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="例如：早班、晚班、中班" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">類型</label>
                        <select value={shiftForm.type} onChange={(e) => setShiftForm({ ...shiftForm, type: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="正職">正職</option><option value="兼職">兼職</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">區域</label>
                        <div className="space-y-2">
                            {['外場', '廚房'].map(area => (
                                <label key={area} className="flex items-center space-x-2">
                                    <input type="checkbox" checked={shiftForm.areas.includes(area)} onChange={() => handleAreaChange(area, 'shift')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    <span className="text-sm text-gray-700">{area}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">簡稱</label>
                        <input type="text" value={shiftForm.shortName} onChange={(e) => setShiftForm({ ...shiftForm, shortName: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="例如：早、晚、中" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">時數</label>
                        <input type="time" value={shiftForm.hours} onChange={(e) => setShiftForm({ ...shiftForm, hours: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">文字顏色</label>
                            <input type="color" value={shiftForm.textColor} onChange={(e) => setShiftForm({ ...shiftForm, textColor: e.target.value })} className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">底色</label>
                            <input type="color" value={shiftForm.backgroundColor} onChange={(e) => setShiftForm({ ...shiftForm, backgroundColor: e.target.value })} className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">顏色預覽</label>
                        <div className="w-full p-3 rounded-lg text-center font-medium" style={{ backgroundColor: shiftForm.backgroundColor, color: shiftForm.textColor }}>
                            {shiftForm.shortName || shiftForm.shiftName || '預覽'}
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <button onClick={handleShiftSubmit} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                            <Save size={18} /><span>{editingShift !== null ? '更新' : '新增'}</span>
                        </button>
                        {editingShift !== null && (
                            <button onClick={resetShiftForm} className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center">
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {shifts.map((shift: any, index: number) => (
                    <div key={shift.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="font-semibold text-gray-800">{shift.shiftName}</h4>
                                    <div className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: shift.backgroundColor || '#3b82f6', color: shift.textColor || '#ffffff' }}>
                                        {shift.shortName || shift.shiftName}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>類型: {shift.type}</div>
                                    <div>區域: {shift.areas?.join(', ') || '未設定'}</div>
                                    <div>簡稱: {shift.shortName}</div>
                                    <div>時數: {shift.hours || '未設定'}</div>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => editShift(index)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => deleteShift(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
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
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{editingHoliday !== null ? '編輯國定假日' : '新增國定假日'}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">名稱</label>
                        <input type="text" value={holidayForm.name} onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="例如：春節、中秋節" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">日期</label>
                        <input type="date" value={holidayForm.date} onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div className="flex space-x-3">
                        <button onClick={handleHolidaySubmit} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                            <Save size={18} /><span>{editingHoliday !== null ? '更新' : '新增'}</span>
                        </button>
                        {editingHoliday !== null && (
                            <button onClick={resetHolidayForm} className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center">
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {holidays.map((holiday: any, index: number) => (
                    <div key={holiday.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-800">{holiday.name}</h4>
                                <div className="text-sm text-gray-600 mt-1">日期: {holiday.date}</div>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => editHoliday(index)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => deleteHoliday(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
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

        const getVisibleEmployees = (date: Date) => {
            if (scheduleViewMode === 'edit') return sortedEmployees;
            return sortedEmployees.filter((emp: any) => {
                if (emp.type === '正職') return true;
                const schedule = getEmployeeSchedule(emp.id, date);
                return schedule !== null;
            });
        };

        const navigateMonth = (direction: number) => {
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => navigateMonth(-1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft size={20} /></button>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-800">{year}年 {monthNames[month]}</h3>
                            <button onClick={navigateToToday} className="text-sm text-blue-600 hover:text-blue-800 transition-colors">回到今天</button>
                        </div>
                        <button onClick={() => navigateMonth(1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight size={20} /></button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                            <button onClick={() => setScheduleViewMode('view')} className={`flex items-center space-x-2 py-2 px-4 rounded-lg font-medium transition-colors ${scheduleViewMode === 'view' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                <Eye size={16} /><span>檢視</span>
                            </button>
                            <button onClick={() => setScheduleViewMode('edit')} className={`flex items-center space-x-2 py-2 px-4 rounded-lg font-medium transition-colors ${scheduleViewMode === 'edit' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                <Edit size={16} /><span>編輯</span>
                            </button>
                        </div>
                        <div className="text-xs text-gray-500">{scheduleViewMode === 'view' ? '隱藏兼職休息日' : '顯示所有員工'}</div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-7 bg-gray-50">
                        {dayNames.map(day => (
                            <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 border-r border-gray-200 last:border-r-0">{day}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7">
                        {Array.from({ length: startingDayOfWeek }, (_, i) => (
                            <div key={`empty-${i}`} className="h-32 border-r border-b border-gray-200 bg-gray-50"></div>
                        ))}

                        {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const d = new Date(year, month, day);
                            const isToday = formatDate(d) === formatDate(new Date());
                            const isHolidayDate = isHoliday(d);
                            const visibleEmployees = getVisibleEmployees(d);
                            return (
                                <div key={day} className="h-32 border-r border-b border-gray-200 last:border-r-0 p-1 overflow-hidden">
                                    <div className="h-full flex flex-col">
                                        <div className={`text-center text-sm font-medium mb-1 ${isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto' : isHolidayDate ? 'text-red-500' : 'text-gray-700'}`}>{day}</div>
                                        <div className="flex-1 overflow-y-auto">
                                            <div className="grid grid-cols-2 gap-0.5 text-xs">
                                                {visibleEmployees.map((emp: any) => {
                                                    const schedule = getEmployeeSchedule(emp.id, d);
                                                    const assignedShift = shifts.find((s: any) => s.id === schedule);
                                                    return (
                                                        <div key={emp.id} className="min-h-fit">
                                                            {scheduleViewMode === 'edit' ? (
                                                                <div className="space-y-0.5">
                                                                    <div className="font-medium text-gray-700 truncate text-xs leading-tight">{emp.name}</div>
                                                                    <select value={schedule ?? ''} onChange={(e) => setEmployeeSchedule(emp.id, d, e.target.value || null)} className="w-full text-xs p-0.5 border border-gray-300 rounded bg-white">
                                                                        <option value="">休</option>
                                                                        {shifts.filter((s: any) => s.type === emp.type && s.areas?.some((a: string) => emp.areas?.includes(a)))
                                                                            .map((s: any) => (<option key={s.id} value={s.id}>{s.shortName || s.shiftName}</option>))}
                                                                    </select>
                                                                </div>
                                                            ) : (
                                                                <div className="p-0.5 rounded text-center" style={{ backgroundColor: assignedShift ? (assignedShift.backgroundColor || '#dbeafe') : '#f3f4f6', color: assignedShift ? (assignedShift.textColor || '#1e40af') : '#6b7280' }}>
                                                                    <div className="font-medium truncate text-xs leading-tight">{emp.name}</div>
                                                                    <div className="truncate text-xs leading-tight">{assignedShift ? (assignedShift.shortName || assignedShift.shiftName) : '休息'}</div>
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

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h4 className="font-semibold text-gray-800 mb-4">員工本月統計 ({getMonthInfo().year}年{['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'][getMonthInfo().month]})</h4>
                    <div className="mb-6">
                        <h5 className="font-medium text-blue-800 mb-3 flex items-center"><span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>正職員工</h5>
                        <div className="space-y-2">
                            {employees.filter((emp: any) => emp.type === '正職').map((emp: any) => {
                                const s = getEmployeeMonthStats(emp, getMonthInfo().year, getMonthInfo().month);
                                return (
                                    <div key={emp.id} className="bg-blue-50 rounded-lg p-3">
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div><div className="font-medium text-gray-800">{emp.name}</div><div className="text-xs text-gray-600">{emp.areas?.join('/')}</div></div>
                                            <div className="text-center"><div className="font-medium text-blue-700">{s.restDays}天</div><div className="text-xs text-gray-600">休假天數</div></div>
                                            <div className="text-center"><div className="font-medium text-green-700">{s.remainingVacation}天</div><div className="text-xs text-gray-600">特休剩餘</div></div>
                                        </div>
                                    </div>
                                );
                            })}
                            {employees.filter((e: any) => e.type === '正職').length === 0 && (<div className="text-gray-500 text-sm text-center py-2">暫無正職員工</div>)}
                        </div>
                    </div>

                    <div>
                        <h5 className="font-medium text-green-800 mb-3 flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>兼職員工</h5>
                        <div className="space-y-2">
                            {employees.filter((emp: any) => emp.type === '兼職').map((emp: any) => {
                                const s = getEmployeeMonthStats(emp, getMonthInfo().year, getMonthInfo().month);
                                return (
                                    <div key={emp.id} className="bg-green-50 rounded-lg p-3">
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div><div className="font-medium text-gray-800">{emp.name}</div><div className="text-xs text-gray-600">{emp.areas?.join('/')}</div></div>
                                            <div className="text-center"><div className="font-medium text-green-700">{s.workDays}天</div><div className="text-xs text-gray-600">上班天數</div></div>
                                            <div className="text-center"><div className="font-medium text-orange-700">{s.totalHours}小時</div><div className="text-xs text-gray-600">上班時數</div></div>
                                        </div>
                                    </div>
                                );
                            })}
                            {employees.filter((e: any) => e.type === '兼職').length === 0 && (<div className="text-gray-500 text-sm text-center py-2">暫無兼職員工</div>)}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderTabContent = () => {
        if (activeTab === 'employees') return renderEmployeeTab();
        if (activeTab === 'shifts') return renderShiftsTab();
        if (activeTab === 'holidays') return renderHolidaysTab();
        return renderScheduleTab();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="px-4 py-4">
                    <h1 className="text-xl font-bold text-gray-800">排班管理系統</h1>
                </div>
            </div>

            <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
                <div className="flex">
                    {tabs.map((tab) => {
                        const Icon = tab.icon as any;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium transition-colors ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                                <Icon size={20} className="mb-1" /><span>{tab.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="pb-6">{renderTabContent()}</div>
        </div>
    );
};

export default function App() {
    return <MobileSchedulingApp />;
}
