import React from 'react';
import { ClassroomProvider, useClassroom } from './hooks/useClassroomStore';
import { useGlobalKeyboardControls } from './hooks/useKeyboardControls';
import { Navbar } from './components/Navbar';
import { ClassroomDrawer } from './components/ClassroomDrawer';
import { WinnerModal } from './components/WinnerModal';
import { GameLobby } from './components/GameLobby';
import { LuckyWheel } from './components/games/LuckyWheel';
import { AnimalRace } from './components/games/AnimalRace';
import { BalloonPop } from './components/games/BalloonPop';
import { MysteryChests } from './components/games/MysteryChests';
import { UfoAbduction } from './components/games/UfoAbduction';
import { ClawMachine } from './components/games/ClawMachine';
import { GachaMachine } from './components/games/GachaMachine';
import { OceanFishing } from './components/games/OceanFishing';
import { HotPotato } from './components/games/HotPotato';
import { Users, RotateCcw } from 'lucide-react';

const MainGameArea: React.FC = () => {
  const {
    currentView,
    activeGame,
    activeClassroom,
    availableStudents,
    allStudents,
    calledStudents,
    noRepeat,
    resetCalledStudents,
    setIsDrawerOpen,
  } = useClassroom();

  useGlobalKeyboardControls();

  return (
    <main className="flex-1 flex flex-col justify-between overflow-x-hidden">
      {/* Lobby or Unified Game Stage */}
      {currentView === 'lobby' ? (
        <GameLobby />
      ) : (
        <div className="flex-1 flex flex-col w-full">
          {activeGame === 'wheel' && <LuckyWheel />}
          {activeGame === 'race' && <AnimalRace />}
          {activeGame === 'balloon' && <BalloonPop />}
          {activeGame === 'chests' && <MysteryChests />}
          {activeGame === 'ufo' && <UfoAbduction />}
          {activeGame === 'claw' && <ClawMachine />}
          {activeGame === 'gacha' && <GachaMachine />}
          {activeGame === 'fishing' && <OceanFishing />}
          {activeGame === 'bomb' && <HotPotato />}
        </div>
      )}

      {/* Classroom Status Footer */}
      <footer className="bg-slate-900/90 backdrop-blur-md border-t border-slate-800 px-4 py-2.5 text-xs sm:text-sm text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 font-black text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              <span>{activeClassroom ? activeClassroom.name : 'Chưa có lớp'}</span>
            </span>
            <span className="text-slate-600" aria-hidden="true">|</span>
            <span>
              Sẵn sàng:{' '}
              <strong className="text-amber-400 font-black">{availableStudents.length}</strong>{' '}
              <span className="text-slate-400">/ {allStudents.length} HS</span>
            </span>
            {noRepeat && (
              <span className="hidden sm:inline text-slate-400 font-semibold">
                (Đã gọi: {calledStudents.length})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {noRepeat && calledStudents.length > 0 && (
              <button
                onClick={() => resetCalledStudents()}
                className="min-h-[40px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold transition-colors border border-slate-700 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Làm mới lượt gọi</span>
              </button>
            )}

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="min-h-[40px] flex items-center gap-2 px-4 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold transition-all cursor-pointer"
              title="Mở quản lý lớp học (Phím D)"
            >
              <Users className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>Danh sách lớp</span>
              <span className="kbd-badge hidden md:inline-flex">D</span>
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
};

export function App() {
  return (
    <ClassroomProvider>
      <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950">
        <Navbar />
        <MainGameArea />
        <ClassroomDrawer />
        <WinnerModal />
      </div>
    </ClassroomProvider>
  );
}

export default App;
