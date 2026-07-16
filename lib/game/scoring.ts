import type { Goal, GoalMeta } from "@/lib/curriculum/types";
import type { VimState } from "@/lib/vim";
import { isBufferModified } from "@/lib/vim";

export function starsFor(par: number, keysUsed: number): 1 | 2 | 3 {
  if (keysUsed <= par) return 3;
  if (keysUsed <= Math.ceil(par * 1.6)) return 2;
  return 1;
}

export function posKey(line: number, col: number): string {
  return `${line}:${col}`;
}

export function checkGoal(goal: Goal, state: VimState, meta: GoalMeta): boolean {
  const buf = state.buffers[state.currentBufferId];
  switch (goal.type) {
    case "cursor": {
      if (goal.file && state.currentBufferId !== goal.file) return false;
      return buf.cursor.line === goal.target.line && buf.cursor.col === goal.target.col;
    }
    case "collect": {
      return goal.targets.every((t) => meta.collected.includes(posKey(t.line, t.col)));
    }
    case "text": {
      const target = goal.file ? state.buffers[goal.file] : buf;
      if (!target) return false;
      if (state.mode !== "normal") return false;
      return linesEqual(target.lines, goal.target);
    }
    case "textAndCursor": {
      if (state.mode !== "normal") return false;
      return (
        linesEqual(buf.lines, goal.target) &&
        buf.cursor.line === goal.cursor.line &&
        buf.cursor.col === goal.cursor.col
      );
    }
    case "save": {
      if (goal.files && goal.files.length > 0) {
        return goal.files.every((f) => {
          const b = state.buffers[f.name];
          if (!b) return false;
          if (isBufferModified(state, f.name)) return false;
          if (f.target && !linesEqual(b.savedLines, f.target)) return false;
          return true;
        });
      }
      return Object.keys(state.buffers).every((id) => !isBufferModified(state, id));
    }
    case "custom":
      return goal.check(state, meta);
  }
}

function linesEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((l, i) => l === b[i]);
}

/** Ders XP'si: yıldıza göre ölçeklenir */
export function xpFor(baseXp: number, stars: number): number {
  return Math.round(baseXp * (0.5 + stars * 0.25));
}

export function levelForXp(xp: number): { level: number; current: number; next: number } {
  // her seviye bir öncekinden %25 daha pahalı
  let level = 1;
  let threshold = 200;
  let remaining = xp;
  while (remaining >= threshold) {
    remaining -= threshold;
    threshold = Math.round(threshold * 1.25);
    level++;
  }
  return { level, current: remaining, next: threshold };
}
