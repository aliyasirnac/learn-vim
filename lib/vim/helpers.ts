import type { Position, VimState } from "./types";
import { currentBuffer } from "./text";

export function setStatus(state: VimState, msg: string, isError = false): void {
  state.statusMessage = msg;
  state.statusIsError = isError;
}

/** Değişiklikten ÖNCE çağrılır; mevcut içeriği undo yığınına koyar */
export function pushUndo(state: VimState): void {
  const buf = currentBuffer(state);
  buf.undoStack.push({ lines: [...buf.lines], cursor: { ...buf.cursor } });
  if (buf.undoStack.length > 200) buf.undoStack.shift();
  buf.redoStack = [];
}

export function performUndo(state: VimState): void {
  const buf = currentBuffer(state);
  const entry = buf.undoStack.pop();
  if (!entry) {
    setStatus(state, "En eski değişiklikteyiz");
    return;
  }
  buf.redoStack.push({ lines: [...buf.lines], cursor: { ...buf.cursor } });
  buf.lines = entry.lines;
  buf.cursor = entry.cursor;
  setStatus(state, "1 değişiklik geri alındı");
}

export function performRedo(state: VimState): void {
  const buf = currentBuffer(state);
  const entry = buf.redoStack.pop();
  if (!entry) {
    setStatus(state, "En yeni değişiklikteyiz");
    return;
  }
  buf.undoStack.push({ lines: [...buf.lines], cursor: { ...buf.cursor } });
  buf.lines = entry.lines;
  buf.cursor = entry.cursor;
  setStatus(state, "1 değişiklik yinelendi");
}

export function getRegister(state: VimState, name: string): { text: string; linewise: boolean } {
  return state.registers[name] ?? { text: "", linewise: false };
}

/**
 * Yank/delete sonucunu register'lara vim kurallarıyla yazar.
 * - Belirtilmiş register varsa oraya (A-Z büyükse ekleyerek) + unnamed'e
 * - Yank → "0 ; satır bazlı/çok satırlı delete → "1-"9 kaydırma ; küçük delete → "-
 */
export function storeToRegisters(
  state: VimState,
  text: string,
  linewise: boolean,
  kind: "yank" | "delete",
  named: string | null
): void {
  if (named === "_") return; // kara delik
  if (named) {
    if (/[A-Z]/.test(named)) {
      const lower = named.toLowerCase();
      const prev = getRegister(state, lower);
      const joined = prev.linewise || linewise ? prev.text.replace(/\n?$/, "\n") + text : prev.text + text;
      state.registers[lower] = { text: joined, linewise: prev.linewise || linewise };
    } else {
      state.registers[named] = { text, linewise };
    }
    state.registers['"'] = { text, linewise };
    return;
  }
  state.registers['"'] = { text, linewise };
  if (kind === "yank") {
    state.registers["0"] = { text, linewise };
  } else {
    if (linewise || text.includes("\n")) {
      for (let i = 9; i >= 2; i--) {
        if (state.registers[String(i - 1)]) state.registers[String(i)] = state.registers[String(i - 1)];
      }
      state.registers["1"] = { text, linewise };
    } else {
      state.registers["-"] = { text, linewise };
    }
  }
}

export function addJump(state: VimState): void {
  const buf = currentBuffer(state);
  // ileri kısmı buda ve yeni sıçramayı ekle
  state.jumplist = state.jumplist.slice(0, state.jumplistIndex);
  state.jumplist.push({ bufferId: state.currentBufferId, pos: { ...buf.cursor } });
  if (state.jumplist.length > 100) state.jumplist.shift();
  state.jumplistIndex = state.jumplist.length;
  // '' ve `` için son sıçrama konumu
  state.marks["'"] = { bufferId: state.currentBufferId, pos: { ...buf.cursor } };
  state.marks["`"] = { bufferId: state.currentBufferId, pos: { ...buf.cursor } };
}

export function jumpTo(state: VimState, bufferId: string, pos: Position): void {
  if (bufferId !== state.currentBufferId && state.buffers[bufferId]) {
    state.alternateBufferId = state.currentBufferId;
    state.currentBufferId = bufferId;
  }
  const buf = currentBuffer(state);
  buf.cursor = {
    line: Math.max(0, Math.min(pos.line, buf.lines.length - 1)),
    col: Math.max(0, Math.min(pos.col, Math.max(0, (buf.lines[Math.min(pos.line, buf.lines.length - 1)] ?? "").length - 1))),
  };
}

export function isBufferModified(state: VimState, bufferId: string): boolean {
  const buf = state.buffers[bufferId];
  if (!buf) return false;
  if (buf.lines.length !== buf.savedLines.length) return true;
  return buf.lines.some((l, i) => l !== buf.savedLines[i]);
}

export function ensureScrollVisible(state: VimState): void {
  const buf = currentBuffer(state);
  const margin = 2;
  if (buf.cursor.line < state.scrollTop + margin) {
    state.scrollTop = Math.max(0, buf.cursor.line - margin);
  } else if (buf.cursor.line > state.scrollTop + state.viewportHeight - 1 - margin) {
    state.scrollTop = Math.min(
      Math.max(0, buf.lines.length - state.viewportHeight),
      buf.cursor.line - state.viewportHeight + 1 + margin
    );
  }
}
