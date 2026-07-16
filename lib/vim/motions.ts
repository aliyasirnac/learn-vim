import type { MotionResult, Position, VimState } from "./types";
import { charClass, clampCol, clampLine, currentBuffer, firstNonBlankCol, lineCount } from "./text";

function charAt(lines: string[], pos: Position): string {
  return lines[pos.line]?.[pos.col] ?? "";
}

function isEmptyLine(lines: string[], line: number): boolean {
  return (lines[line] ?? "").length === 0;
}

/** Belge boyunca bir konum ilerlet; satır sonunda alt satırın 0. sütununa geçer */
function advance(lines: string[], pos: Position): Position | null {
  if (pos.col + 1 < lines[pos.line].length) return { line: pos.line, col: pos.col + 1 };
  if (pos.line + 1 < lines.length) return { line: pos.line + 1, col: 0 };
  return null;
}

function retreat(lines: string[], pos: Position): Position | null {
  if (pos.col > 0) return { line: pos.line, col: pos.col - 1 };
  if (pos.line > 0) return { line: pos.line - 1, col: Math.max(0, lines[pos.line - 1].length - 1) };
  return null;
}

type WordCls = "blank" | "word" | "punct";

function clsAt(lines: string[], pos: Position, big: boolean): WordCls {
  const cls = charClass(charAt(lines, pos));
  if (big && cls === "punct") return "word";
  return cls;
}

export function nextWordStart(lines: string[], start: Position, big: boolean): Position {
  let p: Position = start;
  const startCls = clsAt(lines, p, big);
  if (startCls !== "blank") {
    // mevcut kelime kümesinin sonuna kadar ilerle
    while (true) {
      const n = advance(lines, p);
      if (!n) return p;
      if (n.line !== p.line || clsAt(lines, n, big) !== startCls) {
        p = n;
        break;
      }
      p = n;
    }
  } else {
    const n = advance(lines, p);
    if (!n) return p;
    p = n;
  }
  // boşlukları atla; boş satır bir kelime sayılır
  while (clsAt(lines, p, big) === "blank") {
    if (p.col === 0 && isEmptyLine(lines, p.line)) return p;
    const n = advance(lines, p);
    if (!n) return p;
    p = n;
  }
  return p;
}

export function wordEnd(lines: string[], start: Position, big: boolean): Position {
  let p = advance(lines, start);
  if (!p) return start;
  // boşlukları atla (boş satırlar dahil)
  while (clsAt(lines, p, big) === "blank") {
    const n = advance(lines, p);
    if (!n) return p;
    p = n;
  }
  // kümenin sonuna git
  const cls = clsAt(lines, p, big);
  while (true) {
    const n = advance(lines, p);
    if (!n || n.line !== p.line || clsAt(lines, n, big) !== cls) return p;
    p = n;
  }
}

export function prevWordStart(lines: string[], start: Position, big: boolean): Position {
  let p = retreat(lines, start);
  if (!p) return start;
  while (clsAt(lines, p, big) === "blank") {
    if (p.col === 0 && isEmptyLine(lines, p.line)) return p;
    const n = retreat(lines, p);
    if (!n) return p;
    p = n;
  }
  const cls = clsAt(lines, p, big);
  while (true) {
    const n = retreat(lines, p);
    if (!n || n.line !== p.line || clsAt(lines, n, big) !== cls) return p;
    p = n;
  }
}

export function prevWordEnd(lines: string[], start: Position, big: boolean): Position {
  let p = retreat(lines, start);
  if (!p) return start;
  while (clsAt(lines, p, big) === "blank") {
    const n = retreat(lines, p);
    if (!n) return p;
    p = n;
  }
  return p;
}

export function findCharInLine(
  lineText: string,
  fromCol: number,
  char: string,
  type: "f" | "F" | "t" | "T",
  count: number,
  /** ; ile t/T tekrarında imlecin hemen yanındaki eşleşmeyi atla */
  skipAdjacent = false
): number | null {
  let col = fromCol;
  for (let i = 0; i < count; i++) {
    if (type === "f" || type === "t") {
      const from = type === "t" && i === 0 && skipAdjacent ? col + 2 : col + 1;
      const idx = lineText.indexOf(char, from);
      if (idx === -1) return null;
      col = idx;
    } else {
      const from = type === "T" && i === 0 && skipAdjacent ? col - 2 : col - 1;
      if (from < 0) return null;
      const idx = lineText.lastIndexOf(char, from);
      if (idx === -1) return null;
      col = idx;
    }
  }
  if (type === "t") return col - 1;
  if (type === "T") return col + 1;
  return col;
}

export function paragraphForward(lines: string[], start: Position, count: number): Position {
  let line = start.line;
  for (let i = 0; i < count; i++) {
    line++;
    // önce boş olmayanları atla, sonra ilk boş satırda dur
    while (line < lines.length && isEmptyLine(lines, line) && isEmptyLine(lines, Math.max(0, line - 1))) line++;
    while (line < lines.length && !isEmptyLine(lines, line)) line++;
    if (line >= lines.length) return { line: lines.length - 1, col: Math.max(0, lines[lines.length - 1].length - 1) };
  }
  return { line, col: 0 };
}

export function paragraphBackward(lines: string[], start: Position, count: number): Position {
  let line = start.line;
  for (let i = 0; i < count; i++) {
    line--;
    while (line > 0 && isEmptyLine(lines, line) && isEmptyLine(lines, Math.min(lines.length - 1, line + 1))) line--;
    while (line > 0 && !isEmptyLine(lines, line)) line--;
    if (line <= 0) return { line: 0, col: 0 };
  }
  return { line, col: 0 };
}

const BRACKET_PAIRS: Record<string, { match: string; forward: boolean }> = {
  "(": { match: ")", forward: true },
  "[": { match: "]", forward: true },
  "{": { match: "}", forward: true },
  ")": { match: "(", forward: false },
  "]": { match: "[", forward: false },
  "}": { match: "{", forward: false },
};

export function matchBracket(lines: string[], start: Position): Position | null {
  // imleçten satır sonuna kadar ilk bracket'ı bul
  const lineText = lines[start.line];
  let col = start.col;
  while (col < lineText.length && !(lineText[col] in BRACKET_PAIRS)) col++;
  if (col >= lineText.length) return null;

  const open = lineText[col];
  const { match, forward } = BRACKET_PAIRS[open];
  let depth = 0;
  let p: Position | null = { line: start.line, col };
  while (p) {
    const ch = charAt(lines, p);
    if (ch === open) depth++;
    else if (ch === match) {
      depth--;
      if (depth === 0) return p;
    }
    p = forward ? advance(lines, p) : retreat(lines, p);
  }
  return null;
}

export interface MotionContext {
  count: number;
  /** Operatör hedefi olarak mı çalışıyor (dw'nin özel durumları için) */
  forOperator: boolean;
}

/**
 * Basit (tek tuşluk) hareketleri çözer. Karmaşık olanlar (f/t, arama, marks)
 * engine tarafında ele alınır çünkü ek girdi beklerler.
 */
export function resolveMotion(
  state: VimState,
  key: string,
  ctx: MotionContext,
  gPrefix = false
): MotionResult | null {
  const buf = currentBuffer(state);
  const lines = buf.lines;
  const cur = buf.cursor;
  const n = ctx.count;

  if (gPrefix) {
    switch (key) {
      case "g": {
        const line = state.pending.count !== null || state.pending.operatorCount !== null ? clampLine(state, n - 1) : 0;
        return { pos: { line, col: firstNonBlankCol(lines[line]) }, kind: "linewise" };
      }
      case "e": {
        let p = cur;
        for (let i = 0; i < n; i++) p = prevWordEnd(lines, p, false);
        return { pos: p, kind: "inclusive" };
      }
      case "E": {
        let p = cur;
        for (let i = 0; i < n; i++) p = prevWordEnd(lines, p, true);
        return { pos: p, kind: "inclusive" };
      }
      case "_": {
        const line = clampLine(state, cur.line + n - 1);
        const text = lines[line];
        const m = text.match(/\S(?=\s*$)/);
        return { pos: { line, col: m ? (m.index as number) : 0 }, kind: "inclusive" };
      }
      default:
        return null;
    }
  }

  switch (key) {
    case "h":
    case "<BS>":
      return { pos: { line: cur.line, col: Math.max(0, cur.col - n) }, kind: "exclusive" };
    case "l":
    case " ":
      return {
        pos: { line: cur.line, col: clampCol(state, cur.line, cur.col + n, ctx.forOperator) },
        kind: "exclusive",
      };
    case "j":
    case "<C-n>":
      return { pos: { line: clampLine(state, cur.line + n), col: cur.col }, kind: "linewise" };
    case "k":
    case "<C-p>":
      return { pos: { line: clampLine(state, cur.line - n), col: cur.col }, kind: "linewise" };
    case "+":
    case "<CR>": {
      const line = clampLine(state, cur.line + n);
      return { pos: { line, col: firstNonBlankCol(lines[line]) }, kind: "linewise" };
    }
    case "-": {
      const line = clampLine(state, cur.line - n);
      return { pos: { line, col: firstNonBlankCol(lines[line]) }, kind: "linewise" };
    }
    case "0":
      return { pos: { line: cur.line, col: 0 }, kind: "exclusive" };
    case "^":
      return { pos: { line: cur.line, col: firstNonBlankCol(lines[cur.line]) }, kind: "exclusive" };
    case "$": {
      const line = clampLine(state, cur.line + n - 1);
      return { pos: { line, col: Math.max(0, lines[line].length - 1) }, kind: "inclusive" };
    }
    case "|":
      return { pos: { line: cur.line, col: clampCol(state, cur.line, n - 1) }, kind: "exclusive" };
    case "w":
    case "W": {
      const big = key === "W";
      let p = cur;
      for (let i = 0; i < n; i++) p = nextWordStart(lines, p, big);
      if (ctx.forOperator) {
        // Özel durum: satırın son kelimesinde dw satır sonunu aşmaz
        if (p.line > cur.line) {
          const hasWordAtCursor = lines[cur.line].slice(cur.col).trim().length > 0;
          if (hasWordAtCursor) return { pos: { line: cur.line, col: lines[cur.line].length }, kind: "exclusive" };
        }
        // Belge sonu: sonraki kelime yoksa satır sonuna kadar sil
        const atDocEnd = p.line === lines.length - 1 && p.col >= Math.max(0, lines[p.line].length - 1);
        if (atDocEnd && charClass(lines[p.line][p.col] ?? "") !== "blank") {
          return { pos: { line: p.line, col: lines[p.line].length }, kind: "exclusive" };
        }
      }
      return { pos: p, kind: "exclusive" };
    }
    case "b": {
      let p = cur;
      for (let i = 0; i < n; i++) p = prevWordStart(lines, p, false);
      return { pos: p, kind: "exclusive" };
    }
    case "B": {
      let p = cur;
      for (let i = 0; i < n; i++) p = prevWordStart(lines, p, true);
      return { pos: p, kind: "exclusive" };
    }
    case "e": {
      let p = cur;
      for (let i = 0; i < n; i++) p = wordEnd(lines, p, false);
      return { pos: p, kind: "inclusive" };
    }
    case "E": {
      let p = cur;
      for (let i = 0; i < n; i++) p = wordEnd(lines, p, true);
      return { pos: p, kind: "inclusive" };
    }
    case "G": {
      const hasCount = state.pending.count !== null || state.pending.operatorCount !== null;
      const line = hasCount ? clampLine(state, n - 1) : lineCount(state) - 1;
      return { pos: { line, col: firstNonBlankCol(lines[line]) }, kind: "linewise" };
    }
    case "{":
      return { pos: paragraphBackward(lines, cur, n), kind: "exclusive" };
    case "}":
      return { pos: paragraphForward(lines, cur, n), kind: "exclusive" };
    case "%": {
      const m = matchBracket(lines, cur);
      if (!m) return { pos: cur, kind: "inclusive", failed: true };
      return { pos: m, kind: "inclusive" };
    }
    case "H": {
      const line = clampLine(state, state.scrollTop + (n - 1));
      return { pos: { line, col: firstNonBlankCol(lines[line]) }, kind: "linewise" };
    }
    case "M": {
      const last = Math.min(lineCount(state) - 1, state.scrollTop + state.viewportHeight - 1);
      const line = clampLine(state, Math.floor((state.scrollTop + last) / 2));
      return { pos: { line, col: firstNonBlankCol(lines[line]) }, kind: "linewise" };
    }
    case "L": {
      const line = clampLine(state, Math.min(lineCount(state) - 1, state.scrollTop + state.viewportHeight - 1) - (n - 1));
      return { pos: { line, col: firstNonBlankCol(lines[line]) }, kind: "linewise" };
    }
    default:
      return null;
  }
}
