import type { Position, VimState, VimBuffer } from "./types";

export function currentBuffer(state: VimState): VimBuffer {
  return state.buffers[state.currentBufferId];
}

export function lineAt(state: VimState, line: number): string {
  return currentBuffer(state).lines[line] ?? "";
}

export function lineCount(state: VimState): number {
  return currentBuffer(state).lines.length;
}

export function clampLine(state: VimState, line: number): number {
  return Math.max(0, Math.min(line, lineCount(state) - 1));
}

/** Normal modda imleç satır sonundaki karakterin üzerinde durabilir ama sonrasında duramaz */
export function clampCol(state: VimState, line: number, col: number, allowPastEnd = false): number {
  const len = lineAt(state, line).length;
  const max = allowPastEnd ? len : Math.max(0, len - 1);
  return Math.max(0, Math.min(col, max));
}

export function clampPosition(state: VimState, pos: Position, allowPastEnd = false): Position {
  const line = clampLine(state, pos.line);
  return { line, col: clampCol(state, line, pos.col, allowPastEnd) };
}

export function comparePos(a: Position, b: Position): number {
  if (a.line !== b.line) return a.line - b.line;
  return a.col - b.col;
}

export function orderRange(a: Position, b: Position): [Position, Position] {
  return comparePos(a, b) <= 0 ? [a, b] : [b, a];
}

export type CharClass = "blank" | "word" | "punct";

/** Vim'in kelime sınıflandırması: boşluk / kelime karakteri (\w + türkçe harfler) / noktalama */
export function charClass(ch: string): CharClass {
  if (ch === "" || /\s/.test(ch)) return "blank";
  if (/[\p{L}\p{N}_]/u.test(ch)) return "word";
  return "punct";
}

export function firstNonBlankCol(lineText: string): number {
  const m = lineText.match(/\S/);
  return m ? (m.index as number) : 0;
}

/** Satır dizisinden [start, end) aralığındaki metni çıkarır (end hariç, karakter bazlı) */
export function extractText(lines: string[], start: Position, end: Position): string {
  if (start.line === end.line) {
    return lines[start.line].slice(start.col, end.col);
  }
  const parts: string[] = [lines[start.line].slice(start.col)];
  for (let l = start.line + 1; l < end.line; l++) parts.push(lines[l]);
  parts.push(lines[end.line].slice(0, end.col));
  return parts.join("\n");
}

/** [start, end) karakter aralığını siler, yeni satır dizisi döndürür */
export function deleteRange(lines: string[], start: Position, end: Position): string[] {
  const result = lines.slice(0, start.line);
  const merged = lines[start.line].slice(0, start.col) + lines[end.line].slice(end.col);
  result.push(merged);
  result.push(...lines.slice(end.line + 1));
  return result;
}

/** Verilen konuma karakter bazlı metin ekler (metin \n içerebilir) */
export function insertText(lines: string[], pos: Position, text: string): { lines: string[]; end: Position } {
  const before = lines[pos.line].slice(0, pos.col);
  const after = lines[pos.line].slice(pos.col);
  const inserted = text.split("\n");
  const newLines = lines.slice(0, pos.line);
  if (inserted.length === 1) {
    newLines.push(before + inserted[0] + after);
    newLines.push(...lines.slice(pos.line + 1));
    return { lines: newLines, end: { line: pos.line, col: pos.col + inserted[0].length } };
  }
  newLines.push(before + inserted[0]);
  for (let i = 1; i < inserted.length - 1; i++) newLines.push(inserted[i]);
  const lastInserted = inserted[inserted.length - 1];
  newLines.push(lastInserted + after);
  newLines.push(...lines.slice(pos.line + 1));
  return {
    lines: newLines,
    end: { line: pos.line + inserted.length - 1, col: lastInserted.length },
  };
}
