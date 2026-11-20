import React, { useState, useRef } from 'react';
import { useClassroom } from '../hooks/useClassroomStore';
import {
  X,
  Users,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Check,
  UserCheck,
  UserX,
  Settings,
  HelpCircle,
} from 'lucide-react';

export const ClassroomDrawer: React.FC = () => {
  const {
    classrooms,
    activeClassroomId,
    activeClassroom,
    allStudents,
    availableStudents,
    absentStudents,
    calledStudents,
    noRepeat,
    setNoRepeat,
    isDrawerOpen,
    setIsDrawerOpen,
    createClassroom,
    renameClassroom,
    deleteClassroom,
    setActiveClassroomId,
    importStudents,
    addStudent,
    removeStudent,
    toggleStudentAbsent,
    toggleStudentCalled,
    resetCalledStudents,
    exportData,
    importData,
  } = useClassroom();

  const [activeTab, setActiveTab] = useState<'students' | 'import' | 'classes' | 'backup'>('students');
  const [newStudentName, setNewStudentName] = useState('');
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isEditingClassName, setIsEditingClassName] = useState(false);
  const [editClassNameVal, setEditClassNameVal] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [importStatusMsg, setImportStatusMsg] = useState<{ text: string; success: boolean } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isDrawerOpen) return null;

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !activeClassroom) return;
    addStudent(activeClassroom.id, newStudentName.trim());
    setNewStudentName('');
  };

  const handleProcessImport = () => {
    if (!activeClassroom || !importText.trim()) return;
    const count = importStudents(activeClassroom.id, importText, importMode === 'replace');
    if (count > 0) {
      setImportStatusMsg({ text: `Đã nhập thành công ${count} học sinh!`, success: true });
      setImportText('');
      setTimeout(() => {
        setImportStatusMsg(null);
        setActiveTab('students');
      }, 1200);
    } else {
      setImportStatusMsg({ text: 'Không tìm thấy dòng hợp lệ để nhập.', success: false });
    }
  };

  const handleSaveClassName = () => {
    if (!activeClassroom || !editClassNameVal.trim()) return;
    renameClassroom(activeClassroom.id, editClassNameVal.trim());
    setIsEditingClassName(false);
  };

  const handleCreateNewClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    createClassroom(newClassName.trim());
    setNewClassName('');
    setActiveTab('students');
  };

  const handleExportJSON = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vuong_quoc_goi_ten_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importData(content);
        setImportStatusMsg({ text: res.message, success: res.success });
        setTimeout(() => setImportStatusMsg(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full transform transition-all animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl">
                🏰
              </div>
              <div>
                <h3 className="font-extrabold text-lg leading-tight">Quản Lý Lớp Học</h3>
                <p className="text-amber-100 text-xs">
                  {activeClassroom ? activeClassroom.name : 'Chưa chọn lớp'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/25 transition-colors"
              title="Đóng bảng điều khiển"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Classroom Selector & Rename Bar */}
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-200/60 flex items-center justify-between gap-2">
            <div className="flex-1">
              {isEditingClassName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editClassNameVal}
                    onChange={(e) => setEditClassNameVal(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-amber-400 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Tên lớp mới"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveClassName}
                    className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingClassName(false)}
                    className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={activeClassroomId}
                    onChange={(e) => setActiveClassroomId(e.target.value)}
                    className="flex-1 font-bold text-slate-800 text-sm bg-white border border-amber-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.students.length} HS)
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      setEditClassNameVal(activeClassroom?.name || '');
                      setIsEditingClassName(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-colors"
                    title="Đổi tên lớp"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-2 pt-2">
            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                activeTab === 'students'
                  ? 'bg-white text-amber-600 border-amber-500 shadow-sm'
                  : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Học sinh ({allStudents.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                activeTab === 'import'
                  ? 'bg-white text-amber-600 border-amber-500 shadow-sm'
                  : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Nhập nhanh</span>
            </button>
            <button
              onClick={() => setActiveTab('classes')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                activeTab === 'classes'
                  ? 'bg-white text-amber-600 border-amber-500 shadow-sm'
                  : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>DS Lớp ({classrooms.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                activeTab === 'backup'
                  ? 'bg-white text-amber-600 border-amber-500 shadow-sm'
                  : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Sao lưu</span>
            </button>
          </div>

          {/* Quick Controls Bar (No-repeat switch & Reset Called) */}
          <div className="p-3 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between text-xs font-bold">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={noRepeat}
                onChange={(e) => setNoRepeat(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 border-slate-300"
              />
              <span className="text-slate-700">Chế độ không lặp lại</span>
            </label>

            <button
              onClick={() => resetCalledStudents()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition-colors shadow-sm"
              title="Đặt lại tất cả học sinh về trạng thái chưa gọi"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>Làm mới ({calledStudents.length})</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* TAB 1: STUDENT LIST */}
            {activeTab === 'students' && (
              <div className="space-y-4">
                {/* Stats chips */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-emerald-50 text-emerald-800 p-2 rounded-xl border border-emerald-200">
                    <div className="font-extrabold text-base">{availableStudents.length}</div>
                    <div className="font-medium">Sẵn sàng</div>
                  </div>
                  <div className="bg-amber-50 text-amber-800 p-2 rounded-xl border border-amber-200">
                    <div className="font-extrabold text-base">{calledStudents.length}</div>
                    <div className="font-medium">Đã gọi</div>
                  </div>
                  <div className="bg-rose-50 text-rose-800 p-2 rounded-xl border border-rose-200">
                    <div className="font-extrabold text-base">{absentStudents.length}</div>
                    <div className="font-medium">Vắng mặt</div>
                  </div>
                </div>

                {/* Add Student Form */}
                <form onSubmit={handleAddSingleStudent} className="flex gap-2">
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Thêm tên học sinh mới..."
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center gap-1 shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm</span>
                  </button>
                </form>

                {/* Student list */}
                {allStudents.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    <UserX className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    Lớp chưa có học sinh nào. Thêm tên ở trên hoặc dán từ Excel tại tab "Nhập nhanh".
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allStudents.map((student, idx) => (
                      <div
                        key={student.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          student.isAbsent
                            ? 'bg-rose-50/50 border-rose-200 opacity-60'
                            : student.isCalled
                            ? 'bg-amber-50/70 border-amber-200'
                            : 'bg-white border-slate-200 hover:border-amber-300 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xs font-mono text-slate-400 w-5 text-right">
                            {idx + 1}
                          </span>
                          <span className="text-xl shrink-0" role="img" aria-label="avatar">
                            {student.avatarEmoji || '👤'}
                          </span>
                          <div className="truncate">
                            <span
                              className={`text-sm font-bold truncate block ${
                                student.isAbsent
                                  ? 'text-rose-500 line-through'
                                  : student.isCalled
                                  ? 'text-amber-800'
                                  : 'text-slate-800'
                              }`}
                            >
                              {student.name}
                            </span>
                            <div className="flex gap-1.5 text-[10px]">
                              {student.isAbsent && (
                                <span className="text-rose-600 font-semibold">Vắng</span>
                              )}
                              {student.isCalled && !student.isAbsent && (
                                <span className="text-amber-600 font-semibold">Đã gọi</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons per student */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Toggle Absent Button */}
                          <button
                            onClick={() => toggleStudentAbsent(student.id)}
                            className={`px-2 py-1 text-xs rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                              student.isAbsent
                                ? 'bg-rose-500 text-white hover:bg-rose-600'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700'
                            }`}
                            title={student.isAbsent ? 'Đang vắng (Click để đánh dấu có mặt)' : 'Đang có mặt (Click để đánh dấu vắng)'}
                          >
                            {student.isAbsent ? 'Vắng' : 'Có mặt'}
                          </button>

                          {/* Toggle Called Button */}
                          <button
                            onClick={() => toggleStudentCalled(student.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              student.isCalled
                                ? 'text-amber-600 bg-amber-100 hover:bg-amber-200'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                            title={student.isCalled ? 'Đã gọi (Click để bỏ gọi)' : 'Chưa gọi (Click để đánh dấu đã gọi)'}
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>

                          {/* Delete Student */}
                          <button
                            onClick={() => {
                              if (activeClassroom) {
                                removeStudent(activeClassroom.id, student.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa học sinh này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: QUICK IMPORT FROM EXCEL */}
            {activeTab === 'import' && (
              <div className="space-y-4">
                <div className="bg-sky-50 border border-sky-200 p-3 rounded-2xl text-xs text-sky-800 flex items-start gap-2.5">
                  <HelpCircle className="w-5 h-5 shrink-0 text-sky-600 mt-0.5" />
                  <div>
                    <div className="font-bold">Cách dán từ Excel / Google Sheets:</div>
                    <p className="mt-0.5 text-sky-700 leading-relaxed">
                      Copy cột Họ và Tên trong bảng tính rồi dán vào khung bên dưới. Mỗi dòng sẽ tự động được nhận làm một học sinh.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dán danh sách tên học sinh (Mỗi dòng một tên):
                  </label>
                  <textarea
                    rows={8}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Nguyễn Văn A&#10;Trần Thị B&#10;Lê Hoàng C&#10;Phạm Minh D..."
                    className="w-full p-3 text-sm border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700">Chế độ nhập:</div>
                  <div className="flex gap-4 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span>Thêm vào danh sách hiện tại</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-rose-600 font-semibold">Thay thế toàn bộ</span>
                    </label>
                  </div>
                </div>

                {importStatusMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold ${
                      importStatusMsg.success
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {importStatusMsg.text}
                  </div>
                )}

                <button
                  onClick={handleProcessImport}
                  disabled={!importText.trim()}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-extrabold shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Tiến hành nhập danh sách</span>
                </button>
              </div>
            )}

            {/* TAB 3: CLASSROOM MANAGEMENT */}
            {activeTab === 'classes' && (
              <div className="space-y-4">
                <form onSubmit={handleCreateNewClass} className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Tạo lớp học mới:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="Ví dụ: Lớp 10A1, Khối 6..."
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={!newClassName.trim()}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tạo</span>
                    </button>
                  </div>
                </form>

                <div className="border-t border-slate-200 pt-3">
                  <div className="text-xs font-bold text-slate-700 mb-2">Danh sách lớp hiện có:</div>
                  <div className="space-y-2">
                    {classrooms.map((c) => (
                      <div
                        key={c.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          c.id === activeClassroomId
                            ? 'bg-amber-50 border-amber-400 shadow-sm'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => setActiveClassroomId(c.id)}
                        >
                          <div className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                            <span>{c.name}</span>
                            {c.id === activeClassroomId && (
                              <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                                Đang chọn
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-medium mt-0.5">
                            {c.students.length} học sinh
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {classrooms.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm(`Bạn có chắc muốn xóa lớp "${c.name}"?`)) {
                                  deleteClassroom(c.id);
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                              title="Xóa lớp này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: BACKUP & RESTORE */}
            {activeTab === 'backup' && (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                  <div className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <Download className="w-5 h-5 text-amber-500" />
                    <span>Xuất dữ liệu dự phòng</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tải toàn bộ danh sách lớp học và trạng thái học sinh thành tệp <code className="bg-slate-200 px-1 py-0.5 rounded">.json</code> để lưu trên máy hoặc chuyển sang máy tính khác.
                  </p>
                  <button
                    onClick={handleExportJSON}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải về tệp .JSON</span>
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                  <div className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-indigo-500" />
                    <span>Khôi phục / Nhập dữ liệu</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Chọn tệp sao lưu <code className="bg-slate-200 px-1 py-0.5 rounded">.json</code> đã lưu trước đó để nạp lại dữ liệu.
                  </p>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Chọn tệp .JSON để nạp</span>
                  </button>
                </div>

                {importStatusMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold ${
                      importStatusMsg.success
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {importStatusMsg.text}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-400 font-medium">
            Tự động lưu vào bộ nhớ trình duyệt (localStorage)
          </div>
        </div>
      </div>
    </div>
  );
};
