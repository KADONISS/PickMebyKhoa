import React from 'react';
import { ClassroomProvider, useClassroom } from './hooks/useClassroomStore';
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
import { GAME_INFOS } from './utils/constants';
import { Users, RotateCcw, ArrowLeft, LayoutGrid } from 'lucide-react';

const MainGameArea: React.FC = () => {
  const {
    currentView,
    activeGame,
    goToLobby,
    activeClassroom,
    availableStudents,
    allStudents,
    calledStudents,
    noRepeat,
    resetCalledStudents,
    setIsDrawerOpen,
  } = useClassroom();

  const currentGameInfo = GAME_INFOS.find((g) => g.id === activeGame);

  return (
    <main className="flex-1 flex flex-col justify-between overflow-x-hidden">
      {/* If current view is the dedicated Game Selection Lobby */}
      {currentView === 'lobby' ? (
        <GameLobby />
      ) : (
        /* If current view is a Game Stage */
        <div className="flex-1 flex flex-col items-center justify-start p-2 sm:p-4">
          {/* In-Game Header: Back to Game Selection Lobby + Current Game Badge */}
          <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-3 mb-2 px-2">
            <button
              onClick={goToLobby}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-amber-400/30 text-amber-300 hover:text-amber-200 font-black text-xs sm:text-sm shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Quay lại Sảnh Trò Chơi để chọn trò khác"
            >
              <ArrowLeft className="w-4 h-4" />
              <LayoutGrid className="w-4 h-4 text-amber-400" />
              <span>Đổi Trò Chơi</span>
            </button>

            {currentGameInfo && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs sm:text-sm font-black text-slate-200">
                <span className="text-base">{currentGameInfo.icon}</span>
                <span>{currentGameInfo.title}</span>
                <span className="hidden sm:inline-block text-[10px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  {currentGameInfo.badge}
                </span>
              </div>
            )}
          </div>

          {/* Active Game Component (all 9 games) */}
          <div className="w-full flex-1 flex items-center justify-center">
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
        </div>
      )}

      {/* Classroom Status Footer */}
      <footer className="bg-slate-900/80 backdrop-blur-md border-t border-slate-800/80 px-4 py-2.5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{activeClassroom ? activeClassroom.name : 'Chưa có lớp'}</span>
            </span>
            <span className="text-slate-600">|</span>
            <span>
              Sẵn sàng:{' '}
              <strong className="text-amber-400">{availableStudents.length}</strong> / {allStudents.length}
            </span>
            {noRepeat && (
              <span className="hidden sm:inline text-slate-500">
                (Đã gọi: {calledStudents.length})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {noRepeat && calledStudents.length > 0 && (
              <button
                onClick={() => resetCalledStudents()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold transition-colors border border-slate-700 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Làm mới lượt gọi</span>
              </button>
            )}

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Danh sách lớp</span>
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
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950">
        <Navbar />
        <MainGameArea />
        <ClassroomDrawer />
        <WinnerModal />
      </div>
    </ClassroomProvider>
  );
}

export default App;
