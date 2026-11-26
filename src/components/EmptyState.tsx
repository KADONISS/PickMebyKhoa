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

  const isAllCalled =
    allStudents.length > 0 &&
    calledStudents.length + absentStudents.length >= allStudents.length &&
    calledStudents.length > 0;
  const isAllAbsent = allStudents.length > 0 && absentStudents.length === allStudents.length;
  const isEmptyClass = allStudents.length === 0;

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center max-w-xl mx-auto clay-card rounded-3xl border-2 border-dashed border-amber-400/50 my-8 animate-pop-in">
      <div className="w-20 h-20 rounded-2xl bg-slate-800/90 border border-amber-400/40 flex items-center justify-center text-amber-400 mb-5 shadow-inner">
        {isEmptyClass ? (
          <Users className="w-10 h-10" aria-hidden="true" />
        ) : isAllCalled ? (
          <RotateCcw className="w-10 h-10 text-emerald-400" aria-hidden="true" />
        ) : (
          <UserX className="w-10 h-10 text-rose-400" aria-hidden="true" />
        )}
      </div>

      <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 projector-text">
        {isEmptyClass
          ? 'Lớp học chưa có học sinh nào'
          : isAllCalled
          ? 'Đã gọi hết tất cả học sinh!'
          : isAllAbsent
          ? 'Tất cả học sinh đều vắng mặt'
          : 'Không có học sinh nào khả dụng'}
      </h3>

      <p className="text-slate-300 text-sm sm:text-base mb-8 leading-relaxed max-w-md">
        {isEmptyClass
          ? `Lớp "${activeClassroom?.name}" chưa có danh sách tên. Hãy mở bảng quản lý để thêm nhanh hoặc dán từ Excel!`
          : isAllCalled
          ? 'Mọi học sinh trong lớp đã hoàn thành lượt gọi. Hãy bấm "Làm mới lượt gọi" để bắt đầu vòng mới!'
          : 'Hãy kiểm tra lại đánh dấu "Vắng mặt" hoặc tắt chế độ "Không lặp lại" trong danh sách lớp.'}
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        {isAllCalled && (
          <button
            onClick={() => resetCalledStudents()}
            className="arcade-btn min-h-[52px] px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-base"
          >
            <RotateCcw className="w-5 h-5" aria-hidden="true" />
            <span>Làm mới lượt gọi ({calledStudents.length} bạn)</span>
          </button>
        )}

        <button
          onClick={() => setIsDrawerOpen(true)}
          className="arcade-btn min-h-[52px] px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-base"
        >
          <UserPlus className="w-5 h-5" aria-hidden="true" />
          <span>{isEmptyClass ? 'Thêm học sinh ngay' : 'Quản lý danh sách lớp'}</span>
        </button>
      </div>
    </div>
  );
};
