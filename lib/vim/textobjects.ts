import type { Position, TextRange } from "./types";
import { charClass } from "./text";

/**
 * Text object çözümleyici. `inner` = iw/i(/i" ailesi, değilse aw/a(/a".
 * Dönen aralık [start, end] karakter bazlı ve end DAHİLdir (operatörler
 * inclusive aralık olarak uygular).
 */
export function resolveTextObject(
  lines: string[],
  cursor: Position,
  obj: string,
  inner: boolean
): TextRange | null {
  switch (obj) {
    case "w":
      return wordObject(lines, cursor, inner, false);
    case "W":
      return wordObject(lines, cursor, inner, true);
    case '"':
    case "'":
    case "`":
      return quoteObject(lines, cursor, obj, inner);
    case "(":
    case ")":
    case "b":
      return bracketObject(lines, cursor, "(", ")", inner);
    case "{":
    case "}":
    case "B":
      return bracketObject(lines, cursor, "{", "}", inner);
    case "[":
    case "]":
      return bracketObject(lines, cursor, "[", "]", inner);
    case "<":
    case ">":
      return bracketObject(lines, cursor, "<", ">", inner);
    case "t":
      return tagObject(lines, cursor, inner);
    case "p":
      return paragraphObject(lines, cursor, inner);
    default:
      return null;
  }
}

function wordObject(lines: string[], cursor: Position, inner: boolean, big: boolean): TextRange | null {
  const text = lines[cursor.line];
  if (text.length === 0) return { start: { ...cursor, col: 0 }, end: { ...cursor, col: 0 }, linewise: false };
  const col = Math.min(cursor.col, text.length - 1);
  const cls = (c: string) => {
    const k = charClass(c);
    return big && k === "punct" ? "word" : k;
  };
  const cur = cls(text[col]);
  let start = col;
  let end = col;
  while (start > 0 && cls(text[start - 1]) === cur) start--;
  while (end < text.length - 1 && cls(text[end + 1]) === cur) end++;

  if (!inner) {
    // aw: kelimeden sonraki boşlukları da al; yoksa öncekileri
    let extEnd = end;
    while (extEnd < text.length - 1 && cls(text[extEnd + 1]) === "blank") extEnd++;
    if (extEnd === end && cur !== "blank") {
      while (start > 0 && cls(text[start - 1]) === "blank") start--;
    }
    end = extEnd;
  }
  return { start: { line: cursor.line, col: start }, end: { line: cursor.line, col: end }, linewise: false };
}

function quoteObject(lines: string[], cursor: Position, quote: string, inner: boolean): TextRange | null {
  const text = lines[cursor.line];
  // satırdaki tırnak çiftlerini bul, imleci kapsayan ya da imleçten sonraki ilk çifti seç
  const positions: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === quote && text[i - 1] !== "\\") positions.push(i);
  }
  if (positions.length < 2) return null;
  let open = -1;
  let close = -1;
  for (let i = 0; i + 1 < positions.length; i += 2) {
    const [a, b] = [positions[i], positions[i + 1]];
    if (cursor.col <= b) {
      open = a;
      close = b;
      break;
    }
  }
  if (open === -1) return null;
  if (inner) {
    if (close === open + 1) return { start: { line: cursor.line, col: open + 1 }, end: { line: cursor.line, col: open }, linewise: false };
    return { start: { line: cursor.line, col: open + 1 }, end: { line: cursor.line, col: close - 1 }, linewise: false };
  }
  // a" : kapanış tırnağından sonraki boşlukları da al
  let end = close;
  while (end < text.length - 1 && /\s/.test(text[end + 1])) end++;
  if (end === close) {
    while (open > 0 && /\s/.test(text[open - 1])) open--;
  }
  return { start: { line: cursor.line, col: open }, end: { line: cursor.line, col: end }, linewise: false };
}

function bracketObject(
  lines: string[],
  cursor: Position,
  open: string,
  close: string,
  inner: boolean
): TextRange | null {
  const openPos = scanForBracket(lines, cursor, open, close, -1);
  if (!openPos) return null;
  const closePos = scanForBracket(lines, cursor, open, close, 1);
  if (!closePos) return null;

  if (!inner) return { start: openPos, end: closePos, linewise: false };

  // i( : parantezlerin içi
  let start: Position = { line: openPos.line, col: openPos.col + 1 };
  let end: Position = { line: closePos.line, col: closePos.col - 1 };
  if (start.col >= lines[start.line].length && start.line < closePos.line) {
    start = { line: start.line + 1, col: 0 };
  }
  if (end.col < 0) {
    const prevLine = end.line - 1;
    end = { line: prevLine, col: Math.max(0, lines[prevLine].length - 1) };
  }
  if (start.line > end.line || (start.line === end.line && start.col > end.col)) {
    // boş parantez ()
    return { start: { line: openPos.line, col: openPos.col + 1 }, end: { line: openPos.line, col: openPos.col }, linewise: false };
  }
  // iç metin tam satırları kapsıyorsa (vim davranışı) linewise olur
  const coversFullLines =
    start.line > openPos.line &&
    end.line < closePos.line &&
    start.col === 0 &&
    end.col === Math.max(0, lines[end.line].length - 1);
  return { start, end, linewise: coversFullLines };
}

/** İmleçten geriye/ileriye eşleşmemiş bracket ara (imleç bracket üstündeyse onu sayar) */
function scanForBracket(
  lines: string[],
  cursor: Position,
  open: string,
  close: string,
  dir: 1 | -1
): Position | null {
  const target = dir === -1 ? open : close;
  const opposite = dir === -1 ? close : open;
  let depth = 0;
  let line = cursor.line;
  let col = cursor.col;
  const cursorChar = lines[line]?.[col];
  if (cursorChar === target) return { line, col };
  if (cursorChar === opposite) depth = 0; // karşı bracket üstündeysek onun eşini arıyoruz
  while (line >= 0 && line < lines.length) {
    const ch = lines[line]?.[col];
    if (ch === opposite && !(line === cursor.line && col === cursor.col)) depth++;
    else if (ch === target) {
      if (depth === 0) return { line, col };
      depth--;
    }
    col += dir;
    if (col < 0) {
      line--;
      if (line < 0) break;
      col = Math.max(0, lines[line].length - 1);
    } else if (col >= lines[line].length) {
      line++;
      col = 0;
      if (line >= lines.length) break;
    }
  }
  return null;
}

function tagObject(lines: string[], cursor: Position, inner: boolean): TextRange | null {
  // Basitleştirilmiş: aynı satırda <tag>...</tag>
  const text = lines[cursor.line];
  const re = /<([a-zA-Z][\w-]*)[^>]*>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const openStart = m.index;
    const openEnd = m.index + m[0].length - 1;
    const closeTag = `</${m[1]}>`;
    const closeStart = text.indexOf(closeTag, openEnd + 1);
    if (closeStart === -1) continue;
    const closeEnd = closeStart + closeTag.length - 1;
    if (cursor.col >= openStart && cursor.col <= closeEnd) {
      if (inner) {
        if (closeStart === openEnd + 1) return null;
        return {
          start: { line: cursor.line, col: openEnd + 1 },
          end: { line: cursor.line, col: closeStart - 1 },
          linewise: false,
        };
      }
      return {
        start: { line: cursor.line, col: openStart },
        end: { line: cursor.line, col: closeEnd },
        linewise: false,
      };
    }
  }
  return null;
}

function paragraphObject(lines: string[], cursor: Position, inner: boolean): TextRange | null {
  const isEmpty = (l: number) => (lines[l] ?? "").trim().length === 0;
  let start = cursor.line;
  let end = cursor.line;
  const onEmpty = isEmpty(cursor.line);
  while (start > 0 && isEmpty(start - 1) === onEmpty) start--;
  while (end < lines.length - 1 && isEmpty(end + 1) === onEmpty) end++;
  if (!inner && !onEmpty) {
    // ap: takip eden boş satırları da al
    while (end < lines.length - 1 && isEmpty(end + 1)) end++;
  }
  return {
    start: { line: start, col: 0 },
    end: { line: end, col: Math.max(0, (lines[end] ?? "").length - 1) },
    linewise: true,
  };
}
