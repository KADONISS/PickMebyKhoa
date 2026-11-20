import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Classroom, CurrentView, GameSpeed, GameType, Student, WinnerState } from '../types';
import { DEMO_STUDENT_NAMES, createStudent } from '../utils/constants';
import { soundManager } from '../utils/sound';

interface ClassroomContextType {
  classrooms: Classroom[];
  activeClassroomId: string;
  activeClassroom: Classroom | undefined;
  availableStudents: Student[];
  allStudents: Student[];
  absentStudents: Student[];
  calledStudents: Student[];
  noRepeat: boolean;
  gameSpeed: GameSpeed;
  activeGame: GameType;
  currentView: CurrentView;
  soundEnabled: boolean;
  isDrawerOpen: boolean;
  winnerState: WinnerState;

  // Actions
  createClassroom: (name: string, initialNames?: string[]) => string;
  renameClassroom: (id: string, newName: string) => void;
  deleteClassroom: (id: string) => void;
  setActiveClassroomId: (id: string) => void;
  importStudents: (classroomId: string, rawText: string, replaceExisting?: boolean) => number;
  addStudent: (classroomId: string, name: string) => void;
  removeStudent: (classroomId: string, studentId: string) => void;
  toggleStudentAbsent: (studentId: string) => void;
  toggleStudentCalled: (studentId: string) => void;
  resetCalledStudents: (classroomId?: string) => void;
  markStudentAsCalled: (studentId: string) => void;
  setNoRepeat: (noRepeat: boolean) => void;
  setGameSpeed: (speed: GameSpeed) => void;
  setActiveGame: (game: GameType) => void;
  setCurrentView: (view: CurrentView) => void;
  goToLobby: () => void;
  selectGame: (game: GameType) => void;
  toggleSound: () => void;
  setIsDrawerOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  openWinnerModal: (student: Student, game: GameType) => void;
  closeWinnerModal: () => void;
  handleWinnerRemoveFromNext: () => void;
  handleWinnerKeepInList: () => void;
  exportData: () => string;
  importData: (jsonStr: string) => { success: boolean; message: string };
}

const STORAGE_KEY_CLASSROOMS = 'vuongquocgoiten_classrooms_v1';
const STORAGE_KEY_ACTIVE_ID = 'vuongquocgoiten_active_id_v1';
const STORAGE_KEY_SETTINGS = 'vuongquocgoiten_settings_v1';

function getInitialClassrooms(): Classroom[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLASSROOMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }

  // Preloaded sample class
  const demoClass: Classroom = {
    id: 'demo-class-01',
    name: 'Lớp Demo (20 Học Sinh)',
    createdAt: Date.now(),
    students: DEMO_STUDENT_NAMES.map((name, i) => createStudent(name, i)),
  };
  return [demoClass];
}

const ClassroomContext = createContext<ClassroomContextType | null>(null);

export const ClassroomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [classrooms, setClassrooms] = useState<Classroom[]>(getInitialClassrooms);

  const [activeClassroomId, setActiveClassroomIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (saved && classrooms.some((c) => c.id === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return classrooms[0]?.id || 'demo-class-01';
  });

  const [noRepeat, setNoRepeatState] = useState<boolean>(true);
  const [gameSpeed, setGameSpeedState] = useState<GameSpeed>('normal');
  const [activeGame, setActiveGameState] = useState<GameType>('wheel');
  const [currentView, setCurrentViewState] = useState<CurrentView>('lobby');
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const [winnerState, setWinnerState] = useState<WinnerState>({
    isOpen: false,
    winner: null,
    game: null,
  });

  // Load settings on start
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.noRepeat === 'boolean') setNoRepeatState(s.noRepeat);
        if (s.gameSpeed) setGameSpeedState(s.gameSpeed);
        if (s.activeGame) setActiveGameState(s.activeGame);
        if (s.currentView) setCurrentViewState(s.currentView);
        if (typeof s.soundEnabled === 'boolean') {
          setSoundEnabledState(s.soundEnabled);
          soundManager.setMuted(!s.soundEnabled);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save classrooms to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLASSROOMS, JSON.stringify(classrooms));
    } catch (err) {
      console.error('Failed to save classrooms to localStorage', err);
    }
  }, [classrooms]);

  // Save active id
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeClassroomId);
    } catch {
      // ignore
    }
  }, [activeClassroomId]);

  // Save settings
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_SETTINGS,
        JSON.stringify({
          noRepeat,
          gameSpeed,
          activeGame,
          currentView,
          soundEnabled,
        })
      );
    } catch {
      // ignore
    }
  }, [noRepeat, gameSpeed, activeGame, currentView, soundEnabled]);

  const activeClassroom = useMemo(() => {
    return classrooms.find((c) => c.id === activeClassroomId) || classrooms[0];
  }, [classrooms, activeClassroomId]);

  const allStudents = useMemo(() => {
    return activeClassroom ? activeClassroom.students : [];
  }, [activeClassroom]);

  const availableStudents = useMemo(() => {
    if (!activeClassroom) return [];
    return activeClassroom.students.filter((s) => {
      if (s.isAbsent) return false;
      if (noRepeat && s.isCalled) return false;
      return true;
    });
  }, [activeClassroom, noRepeat]);

  const absentStudents = useMemo(() => {
    if (!activeClassroom) return [];
    return activeClassroom.students.filter((s) => s.isAbsent);
  }, [activeClassroom]);

  const calledStudents = useMemo(() => {
    if (!activeClassroom) return [];
    return activeClassroom.students.filter((s) => !s.isAbsent && s.isCalled);
  }, [activeClassroom]);

  const setActiveClassroomId = useCallback((id: string) => {
    setActiveClassroomIdState(id);
  }, []);

  const createClassroom = useCallback((name: string, initialNames?: string[]): string => {
    const newId = `class_${Date.now()}`;
    const newStudents = (initialNames || []).map((n, i) => createStudent(n, i));
    const newClass: Classroom = {
      id: newId,
      name: name.trim() || 'Lớp Mới',
      createdAt: Date.now(),
      students: newStudents,
    };
    setClassrooms((prev) => [...prev, newClass]);
    setActiveClassroomIdState(newId);
    return newId;
  }, []);

  const renameClassroom = useCallback((id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setClassrooms((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c))
    );
  }, []);

  const deleteClassroom = useCallback(
    (id: string) => {
      setClassrooms((prev) => {
        const remaining = prev.filter((c) => c.id !== id);
        if (remaining.length === 0) {
          const defaultClass: Classroom = {
            id: `class_${Date.now()}`,
            name: 'Lớp Học 1',
            createdAt: Date.now(),
            students: [],
          };
          setActiveClassroomIdState(defaultClass.id);
          return [defaultClass];
        }
        if (activeClassroomId === id) {
          setActiveClassroomIdState(remaining[0].id);
        }
        return remaining;
      });
    },
    [activeClassroomId]
  );

  const importStudents = useCallback(
    (classroomId: string, rawText: string, replaceExisting: boolean = false): number => {
      const lines = rawText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length === 0) return 0;

      setClassrooms((prev) =>
        prev.map((c) => {
          if (c.id !== classroomId) return c;
          const startIndex = replaceExisting ? 0 : c.students.length;
          const newStudentItems = lines.map((name, i) =>
            createStudent(name, startIndex + i)
          );
          return {
            ...c,
            students: replaceExisting ? newStudentItems : [...c.students, ...newStudentItems],
          };
        })
      );
      return lines.length;
    },
    []
  );

  const addStudent = useCallback((classroomId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setClassrooms((prev) =>
      prev.map((c) => {
        if (c.id !== classroomId) return c;
        const newStudent = createStudent(trimmed, c.students.length);
        return {
          ...c,
          students: [...c.students, newStudent],
        };
      })
    );
  }, []);

  const removeStudent = useCallback((classroomId: string, studentId: string) => {
    setClassrooms((prev) =>
      prev.map((c) => {
        if (c.id !== classroomId) return c;
        return {
          ...c,
          students: c.students.filter((s) => s.id !== studentId),
        };
      })
    );
  }, []);

  const toggleStudentAbsent = useCallback(
    (studentId: string) => {
      setClassrooms((prev) =>
        prev.map((c) => {
          if (c.id !== activeClassroomId) return c;
          return {
            ...c,
            students: c.students.map((s) =>
              s.id === studentId ? { ...s, isAbsent: !s.isAbsent } : s
            ),
          };
        })
      );
    },
    [activeClassroomId]
  );

  const toggleStudentCalled = useCallback(
    (studentId: string) => {
      setClassrooms((prev) =>
        prev.map((c) => {
          if (c.id !== activeClassroomId) return c;
          return {
            ...c,
            students: c.students.map((s) =>
              s.id === studentId ? { ...s, isCalled: !s.isCalled } : s
            ),
          };
        })
      );
    },
    [activeClassroomId]
  );

  const resetCalledStudents = useCallback(
    (classroomId?: string) => {
      const targetId = classroomId || activeClassroomId;
      setClassrooms((prev) =>
        prev.map((c) => {
          if (c.id !== targetId) return c;
          return {
            ...c,
            students: c.students.map((s) => ({ ...s, isCalled: false })),
          };
        })
      );
    },
    [activeClassroomId]
  );

  const markStudentAsCalled = useCallback(
    (studentId: string) => {
      setClassrooms((prev) =>
        prev.map((c) => {
          if (c.id !== activeClassroomId) return c;
          return {
            ...c,
            students: c.students.map((s) =>
              s.id === studentId ? { ...s, isCalled: true } : s
            ),
          };
        })
      );
    },
    [activeClassroomId]
  );

  const setNoRepeat = useCallback((val: boolean) => {
    setNoRepeatState(val);
  }, []);

  const setGameSpeed = useCallback((spd: GameSpeed) => {
    setGameSpeedState(spd);
  }, []);

  const setActiveGame = useCallback((game: GameType) => {
    setActiveGameState(game);
  }, []);

  const setCurrentView = useCallback((view: CurrentView) => {
    setCurrentViewState(view);
  }, []);

  const goToLobby = useCallback(() => {
    soundManager.playClick();
    setCurrentViewState('lobby');
  }, []);

  const selectGame = useCallback((game: GameType) => {
    soundManager.playClick();
    setActiveGameState(game);
    setCurrentViewState('game');
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      const next = !prev;
      soundManager.setMuted(!next);
      return next;
    });
  }, []);

  const openWinnerModal = useCallback((student: Student, game: GameType) => {
    setWinnerState({
      isOpen: true,
      winner: student,
      game,
    });
  }, []);

  const closeWinnerModal = useCallback(() => {
    setWinnerState({
      isOpen: false,
      winner: null,
      game: null,
    });
  }, []);

  const handleWinnerRemoveFromNext = useCallback(() => {
    if (winnerState.winner) {
      markStudentAsCalled(winnerState.winner.id);
    }
    closeWinnerModal();
  }, [winnerState.winner, markStudentAsCalled, closeWinnerModal]);

  const handleWinnerKeepInList = useCallback(() => {
    closeWinnerModal();
  }, [closeWinnerModal]);

  const exportData = useCallback((): string => {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      classrooms,
      activeClassroomId,
      settings: {
        noRepeat,
        gameSpeed,
        activeGame,
        currentView,
      },
    };
    return JSON.stringify(payload, null, 2);
  }, [classrooms, activeClassroomId, noRepeat, gameSpeed, activeGame, currentView]);

  const importData = useCallback(
    (jsonStr: string): { success: boolean; message: string } => {
      try {
        const parsed = JSON.parse(jsonStr);
        if (!parsed || !Array.isArray(parsed.classrooms) || parsed.classrooms.length === 0) {
          return {
            success: false,
            message: 'Tệp JSON không hợp lệ hoặc không có danh sách lớp học.',
          };
        }

        const validClassrooms: Classroom[] = parsed.classrooms.map((c: any, index: number) => ({
          id: c.id || `class_imp_${Date.now()}_${index}`,
          name: c.name || `Lớp ${index + 1}`,
          createdAt: c.createdAt || Date.now(),
          students: Array.isArray(c.students)
            ? c.students.map((s: any, sIdx: number) => ({
                id: s.id || `student_imp_${Date.now()}_${sIdx}`,
                name: s.name || `Học sinh ${sIdx + 1}`,
                isAbsent: Boolean(s.isAbsent),
                isCalled: Boolean(s.isCalled),
                avatarEmoji: s.avatarEmoji,
                color: s.color,
              }))
            : [],
        }));

        setClassrooms(validClassrooms);
        if (parsed.activeClassroomId && validClassrooms.some((c) => c.id === parsed.activeClassroomId)) {
          setActiveClassroomIdState(parsed.activeClassroomId);
        } else {
          setActiveClassroomIdState(validClassrooms[0].id);
        }

        return {
          success: true,
          message: `Nhập thành công ${validClassrooms.length} lớp học!`,
        };
      } catch (err: any) {
        return {
          success: false,
          message: `Lỗi đọc dữ liệu: ${err.message || 'Cấu trúc file không đúng'}`,
        };
      }
    },
    []
  );

  return (
    <ClassroomContext.Provider
      value={{
        classrooms,
        activeClassroomId,
        activeClassroom,
        availableStudents,
        allStudents,
        absentStudents,
        calledStudents,
        noRepeat,
        gameSpeed,
        activeGame,
        currentView,
        soundEnabled,
        isDrawerOpen,
        winnerState,

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
        markStudentAsCalled,
        setNoRepeat,
        setGameSpeed,
        setActiveGame,
        setCurrentView,
        goToLobby,
        selectGame,
        toggleSound,
        setIsDrawerOpen,
        openWinnerModal,
        closeWinnerModal,
        handleWinnerRemoveFromNext,
        handleWinnerKeepInList,
        exportData,
        importData,
      }}
    >
      {children}
    </ClassroomContext.Provider>
  );
};

export const useClassroom = () => {
  const context = useContext(ClassroomContext);
  if (!context) {
    throw new Error('useClassroom must be used within a ClassroomProvider');
  }
  return context;
};
