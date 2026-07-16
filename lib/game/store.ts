import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LessonResult {
  stars: 1 | 2 | 3;
  bestKeys: number;
  completedAt: string;
}

interface ProgressState {
  results: Record<string, LessonResult>;
  xp: number;
  completeLesson: (lessonId: string, stars: 1 | 2 | 3, keysUsed: number, earnedXp: number) => void;
  resetProgress: () => void;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      results: {},
      xp: 0,
      completeLesson: (lessonId, stars, keysUsed, earnedXp) =>
        set((state) => {
          const prev = state.results[lessonId];
          // önceki sonuçtan daha iyiyse güncelle; XP her tamamlamada birikir ama
          // aynı dersin tekrarında yalnızca iyileştirme farkı kadar eklenir
          const improved = !prev || stars > prev.stars || keysUsed < prev.bestKeys;
          const xpGain = prev ? (stars > prev.stars ? Math.round(earnedXp / 2) : 0) : earnedXp;
          return {
            results: {
              ...state.results,
              [lessonId]: improved
                ? {
                    stars: prev ? (Math.max(prev.stars, stars) as 1 | 2 | 3) : stars,
                    bestKeys: prev ? Math.min(prev.bestKeys, keysUsed) : keysUsed,
                    completedAt: new Date().toISOString(),
                  }
                : prev,
            },
            xp: state.xp + xpGain,
          };
        }),
      resetProgress: () => set({ results: {}, xp: 0 }),
    }),
    { name: "vim-ustasi-progress" }
  )
);
