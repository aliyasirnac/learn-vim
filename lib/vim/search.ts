import type { Position } from "./types";

/**
 * Vim "magic" desenini JS RegExp'e çevirir (öğretim için yeterli alt küme):
 * \< \> → \b ; \+ \? \( \) \| \{ → +?()|{ ; . * [] ^ $ \w \s \d aynen geçer.
 */
export function vimPatternToRegExp(pattern: string, flags = ""): RegExp | null {
  let out = "";
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === "\\") {
      const next = pattern[i + 1] ?? "";
      if (next === "<" || next === ">") out += "\\b";
      else if ("+?(){|=".includes(next)) out += next === "=" ? "?" : next;
      else out += "\\" + next;
      i += 2;
      continue;
    }
    // JS'te özel ama vim magic'te düz metin olanlar
    if ("+?(){}|".includes(ch)) out += "\\" + ch;
    else out += ch;
    i++;
  }
  try {
    return new RegExp(out, flags);
  } catch {
    return null;
  }
}

export function findAllMatches(lineText: string, pattern: string): { start: number; end: number }[] {
  const re = vimPatternToRegExp(pattern, "g");
  if (!re) return [];
  const results: { start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(lineText)) !== null) {
    results.push({ start: m.index, end: m.index + Math.max(1, m[0].length) });
    if (m[0].length === 0) re.lastIndex++;
  }
  return results;
}

/** from konumundan itibaren (hariç) desenin sonraki eşleşmesini bulur; sarmalar (wrap) */
export function findMatch(
  lines: string[],
  pattern: string,
  from: Position,
  direction: 1 | -1
): Position | null {
  if (!pattern) return null;
  const total = lines.length;
  if (direction === 1) {
    for (let offset = 0; offset <= total; offset++) {
      const line = (from.line + offset) % total;
      const matches = findAllMatches(lines[line], pattern);
      for (const match of matches) {
        if (offset === 0 && match.start <= from.col) continue;
        if (offset === total && match.start > from.col) continue;
        return { line, col: match.start };
      }
    }
  } else {
    for (let offset = 0; offset <= total; offset++) {
      const line = (from.line - offset + total * 2) % total;
      const matches = findAllMatches(lines[line], pattern).reverse();
      for (const match of matches) {
        if (offset === 0 && match.start >= from.col) continue;
        if (offset === total && match.start < from.col) continue;
        return { line, col: match.start };
      }
    }
  }
  return null;
}

/** * ve # için imlecin altındaki kelimeyi alır */
export function wordUnderCursor(lineText: string, col: number): string | null {
  if (lineText.length === 0) return null;
  const c = Math.min(col, lineText.length - 1);
  const isWord = (ch: string) => /[\p{L}\p{N}_]/u.test(ch);
  let start = c;
  if (!isWord(lineText[start])) {
    // imleçten sonraki ilk kelimeye bak
    while (start < lineText.length && !isWord(lineText[start])) start++;
    if (start >= lineText.length) return null;
  }
  let end = start;
  while (start > 0 && isWord(lineText[start - 1])) start--;
  while (end < lineText.length - 1 && isWord(lineText[end + 1])) end++;
  return lineText.slice(start, end + 1);
}
