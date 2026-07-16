import type { Lesson, Module } from "./types";
import { survivalModule, motionModule, wordModule, findCharModule, verticalModule } from "./modules/basics";
import { insertModule, operatorModule, changeModule, textObjectModule, yankModule } from "./modules/editing";
import { searchModule, substituteModule, visualModule, registerModule } from "./modules/power";
import { marksModule, macroModule, multiFileModule, exModule, bossModule } from "./modules/mastery";

export const MODULES: Module[] = [
  survivalModule,
  motionModule,
  wordModule,
  findCharModule,
  verticalModule,
  insertModule,
  operatorModule,
  changeModule,
  textObjectModule,
  yankModule,
  searchModule,
  substituteModule,
  visualModule,
  registerModule,
  marksModule,
  macroModule,
  multiFileModule,
  exModule,
  bossModule,
];

export interface LessonRef {
  module: Module;
  lesson: Lesson;
  moduleIndex: number;
  lessonIndex: number;
}

const lessonIndex = new Map<string, LessonRef>();
MODULES.forEach((module, moduleIndex) => {
  module.lessons.forEach((lesson, li) => {
    lessonIndex.set(lesson.id, { module, lesson, moduleIndex, lessonIndex: li });
  });
});

export function findLesson(id: string): LessonRef | undefined {
  return lessonIndex.get(id);
}

export function nextLesson(id: string): LessonRef | undefined {
  const ref = lessonIndex.get(id);
  if (!ref) return undefined;
  const { module, moduleIndex, lessonIndex: li } = ref;
  if (li + 1 < module.lessons.length) return lessonIndex.get(module.lessons[li + 1].id);
  const nextModule = MODULES[moduleIndex + 1];
  if (nextModule) return lessonIndex.get(nextModule.lessons[0].id);
  return undefined;
}

export const TOTAL_LESSONS = MODULES.reduce((acc, m) => acc + m.lessons.length, 0);

/**
 * Kilit kuralları (mastery learning):
 * - Modül içinde dersler sıralı açılır (önceki ders tamamlanmalı).
 * - Bir modül, önceki modülün derslerinin en az %60'ı tamamlanınca açılır.
 */
export function isModuleUnlocked(moduleIndex: number, results: Record<string, unknown>): boolean {
  if (moduleIndex === 0) return true;
  const prev = MODULES[moduleIndex - 1];
  const done = prev.lessons.filter((l) => results[l.id]).length;
  return done >= Math.ceil(prev.lessons.length * 0.6);
}

export function isLessonUnlocked(
  moduleIndex: number,
  lessonIdx: number,
  results: Record<string, unknown>
): boolean {
  if (!isModuleUnlocked(moduleIndex, results)) return false;
  if (lessonIdx === 0) return true;
  const prevLesson = MODULES[moduleIndex].lessons[lessonIdx - 1];
  return Boolean(results[prevLesson.id]);
}
