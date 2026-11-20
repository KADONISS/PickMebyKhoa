import React from 'react';
import { useClassroom } from '../hooks/useClassroomStore';
import { UserX, RotateCcw, UserPlus, Users } from 'lucide-react';

export const EmptyState: React.FC = () => {
  const {
    activeClassroom,
    allStudents,
    availableStudents,
    calledStudents,
    absentStudents,
    resetCalledStudents,
    setIsDrawerOpen,
  } = useClassroom();

  if (availableStudents.length > 0) return null;

  const isAllCalled = allStudents.length > 0 && calledStudents.length + absentStudents.length >= allStudents.length && calledStudents.length > 0;
  const isAllAbsent = allStudents.length > 0 && absentStudents.length === allStudents.length;
  const isEmptyClass = allStudents.length === 0;

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center max-w-lg mx-auto bg-white/90 backdrop-blur-md rounded-3xl border-2 border-dashed border-amber-300 shadow-xl my-8 animate-in zoom-in-95">
      <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-4 shadow-inner">
        {isEmptyClass ? (
          <Users className="w-10 h-10" />
        ) : isAllCalled ? (
          <RotateCcw className="w-10 h-10 text-emerald-600" />
        ) : (
          <UserX className="w-10 h-10 text-rose-500" />
        )}
      </div>

      <h3 className="text-2xl font-black text-slate-800 mb-2">
        {isEmptyClass
          ? 'Lớp học chưa có học sinh nào'
          : isAllCalled
          ? 'Đã gọi hết tất cả học sinh!'
          : isAllAbsent
          ? 'Tất cả học sinh đều vắng mặt'
          : 'Không có học sinh nào khả dụng'}
      </h3>

      <p className="text-slate-500 text-sm mb-6 leading-relaxed">
        {isEmptyClass
          ? `Lớp "${activeClassroom?.name}" chưa có danh sách tên. Hãy mở thanh bên để thêm hoặc dán từ Excel!`
          : isAllCalled
          ? 'Mọi học sinh trong lớp đã hoàn thành lượt gọi. Hãy bấm "Làm mới lượt gọi" để bắt đầu vòng mới!'
          : 'Hãy kiểm tra lại đánh dấu "Vắng mặt" hoặc tắt chế độ "Không lặp lại" trong thanh bên.'}
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        {isAllCalled && (
          <button
            onClick={() => resetCalledStudents()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Làm mới lượt gọi ({calledStudents.length} bạn)
          </button>
        )}

        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all"
        >
          <UserPlus className="w-5 h-5" />
          {isEmptyClass ? 'Thêm học sinh ngay' : 'Quản lý danh sách lớp'}
        </button>
      </div>
    </div>
  );
};
