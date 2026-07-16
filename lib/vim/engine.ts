import type {
  MotionResult,
  OperatorKey,
  PendingState,
  Position,
  TextRange,
  VimState,
  VirtualFile,
} from "./types";
import {
  clampCol,
  clampLine,
  clampPosition,
  currentBuffer,
  deleteRange,
  extractText,
  firstNonBlankCol,
  insertText,
  lineAt,
  lineCount,
  orderRange,
} from "./text";
import { findCharInLine, resolveMotion } from "./motions";
import { resolveTextObject } from "./textobjects";
import { findMatch, wordUnderCursor } from "./search";
import {
  addJump,
  ensureScrollVisible,
  getRegister,
  jumpTo,
  performRedo,
  performUndo,
  pushUndo,
  setStatus,
  storeToRegisters,
} from "./helpers";
import { executeExCommand, splitKeys } from "./excommands";

const SHIFT_WIDTH = 2;
const MAX_REPLAY_KEYS = 20000;

function emptyPending(): PendingState {
  return {
    count: null,
    operator: null,
    operatorCount: null,
    register: null,
    awaitingChar: null,
    gPrefix: false,
    zPrefix: false,
    ctrlWPrefix: false,
  };
}

export function createVimState(
  files: VirtualFile[],
  options?: { activeFile?: string; cursor?: Position; viewportHeight?: number }
): VimState {
  const buffers: VimState["buffers"] = {};
  const order: string[] = [];
  for (const f of files) {
    buffers[f.name] = {
      id: f.name,
      lines: f.lines.length > 0 ? [...f.lines] : [""],
      savedLines: f.lines.length > 0 ? [...f.lines] : [""],
      cursor: { line: 0, col: 0 },
      undoStack: [],
      redoStack: [],
    };
    order.push(f.name);
  }
  const active = options?.activeFile ?? order[0];
  if (options?.cursor) {
    const buf = buffers[active];
    buf.cursor = {
      line: Math.min(options.cursor.line, buf.lines.length - 1),
      col: Math.min(options.cursor.col, Math.max(0, (buf.lines[Math.min(options.cursor.line, buf.lines.length - 1)] ?? "").length - 1)),
    };
  }
  return {
    buffers,
    bufferOrder: order,
    currentBufferId: active,
    alternateBufferId: null,
    mode: "normal",
    pending: emptyPending(),
    desiredCol: buffers[active].cursor.col,
    registers: {},
    marks: {},
    search: { pattern: "", direction: 1 },
    lastFt: null,
    macro: { recording: null, recordedKeys: [], lastPlayed: null },
    commandLine: "",
    commandKind: ":",
    visualStart: null,
    lastChange: null,
    changeInProgress: null,
    jumplist: [],
    jumplistIndex: 0,
    statusMessage: "",
    quitRequested: false,
    viewportHeight: options?.viewportHeight ?? 18,
    scrollTop: 0,
    replayDepth: 0,
    statusIsError: false,
    lastVisual: null,
    lastInsertPos: null,
    replaceSession: null,
  };
}

/** Ana giriş noktası: tek tuş işler, YENİ state döndürür */
export function processKey(state: VimState, key: string): VimState {
  const s = structuredClone(state);
  s.quitRequested = false;
  handleKeyInternal(s, key);
  ensureScrollVisible(s);
  return s;
}

function beginChange(state: VimState, key: string): void {
  const prefix: string[] = [];
  if (state.pending.register) prefix.push('"', state.pending.register);
  const total = effectiveCount(state.pending);
  if (state.pending.count !== null || state.pending.operatorCount !== null) {
    prefix.push(...String(total).split(""));
  }
  state.changeInProgress = [...prefix, key];
}

function commitChange(state: VimState): void {
  if (state.changeInProgress) {
    state.lastChange = [...state.changeInProgress];
    state.changeInProgress = null;
  }
}

function cancelChange(state: VimState): void {
  state.changeInProgress = null;
}

function feedKeys(state: VimState, keys: string[]): void {
  state.replayDepth++;
  if (state.replayDepth > 60) {
    state.replayDepth--;
    setStatus(state, "E22: Çok derin makro yinelemesi", true);
    return;
  }
  let budget = MAX_REPLAY_KEYS;
  for (const k of keys) {
    if (budget-- <= 0) break;
    handleKeyInternal(state, k);
  }
  state.replayDepth--;
}

function isRecordingTerminator(state: VimState, key: string): boolean {
  const p = state.pending;
  return (
    state.macro.recording !== null &&
    state.mode === "normal" &&
    key === "q" &&
    !p.awaitingChar &&
    !p.operator &&
    !p.gPrefix &&
    !p.zPrefix
  );
}

function handleKeyInternal(state: VimState, key: string): void {
  // makro kaydı: sonlandıran q hariç her tuş kaydedilir (yalnızca gerçek girdi)
  if (state.replayDepth === 0 && state.macro.recording !== null && !isRecordingTerminator(state, key)) {
    state.macro.recordedKeys.push(key);
  }
  // nokta tekrarı: devam eden değişikliğe tuşu ekle
  if (state.changeInProgress !== null) {
    state.changeInProgress.push(key);
  }

  switch (state.mode) {
    case "normal":
      handleNormalKey(state, key);
      break;
    case "insert":
      handleInsertKey(state, key);
      break;
    case "replace":
      handleReplaceKey(state, key);
      break;
    case "visual":
    case "visual-line":
      handleVisualKey(state, key);
      break;
    case "command":
      handleCommandKey(state, key);
      break;
    default:
      break;
  }
}

function effectiveCount(p: PendingState): number {
  return (p.count ?? 1) * (p.operatorCount ?? 1);
}

function resetPending(state: VimState): void {
  state.pending = emptyPending();
}

// ---------------------------------------------------------------------------
// NORMAL MOD
// ---------------------------------------------------------------------------

function handleNormalKey(state: VimState, key: string): void {
  const p = state.pending;
  const buf = currentBuffer(state);

  if (key === "<Esc>") {
    resetPending(state);
    cancelChange(state);
    setStatus(state, "");
    return;
  }

  if (p.awaitingChar) {
    handleAwaitedChar(state, key);
    return;
  }

  // sayaçlar
  if (/^[1-9]$/.test(key) || (key === "0" && (p.operator ? p.operatorCount !== null : p.count !== null))) {
    if (p.operator) p.operatorCount = (p.operatorCount ?? 0) * 10 + parseInt(key, 10);
    else p.count = (p.count ?? 0) * 10 + parseInt(key, 10);
    return;
  }

  // g öneki
  if (p.gPrefix) {
    handleGPrefixed(state, key);
    return;
  }
  if (key === "g") {
    p.gPrefix = true;
    return;
  }
  if (p.zPrefix) {
    p.zPrefix = false;
    if (key === "Z") {
      buf.savedLines = [...buf.lines];
      state.quitRequested = true;
      setStatus(state, `"${state.currentBufferId}" yazıldı, çıkış istendi`);
    } else if (key === "Q") {
      state.quitRequested = true;
      setStatus(state, "Değişiklikler atıldı, çıkış istendi");
    }
    resetPending(state);
    return;
  }
  if (key === "Z") {
    p.zPrefix = true;
    return;
  }
  if (key === "z") {
    p.awaitingChar = "z";
    return;
  }

  // register öneki
  if (key === '"') {
    p.awaitingChar = "register";
    return;
  }

  // guu / gUU / g~~ satır varyantları (ikinci tuş g öneksiz gelir)
  if (
    (p.operator === "gu" && key === "u") ||
    (p.operator === "gU" && key === "U") ||
    (p.operator === "g~" && key === "~")
  ) {
    applyLinewiseOperator(state, p.operator);
    return;
  }

  // operatörler
  if (key === "d" || key === "c" || key === "y" || key === ">" || key === "<") {
    if (p.operator === key) {
      // dd / cc / yy / >> / <<
      applyLinewiseOperator(state, key as OperatorKey);
      return;
    }
    if (p.operator) {
      resetPending(state);
      return;
    }
    p.operator = key as OperatorKey;
    if (key !== "y") beginChange(state, key);
    return;
  }

  // operatör beklerken text object
  if (p.operator && (key === "i" || key === "a")) {
    p.awaitingChar = key === "i" ? "textobj-i" : "textobj-a";
    return;
  }

  // karakter bekleyen komutlar
  if (key === "f" || key === "F" || key === "t" || key === "T") {
    p.awaitingChar = key;
    return;
  }
  if (key === "r" && !p.operator) {
    beginChange(state, key);
    p.awaitingChar = "r";
    return;
  }
  if (key === "m" && !p.operator) {
    p.awaitingChar = "m";
    return;
  }
  if (key === "`") {
    p.awaitingChar = "backtick";
    return;
  }
  if (key === "'") {
    p.awaitingChar = "quote";
    return;
  }
  if (key === "q" && !p.operator) {
    if (state.macro.recording !== null) {
      // kaydı bitir
      state.registers[state.macro.recording] = {
        text: state.macro.recordedKeys.join(""),
        linewise: false,
      };
      setStatus(state, `q kaydı bitti: @${state.macro.recording}`);
      state.macro.recording = null;
      state.macro.recordedKeys = [];
      return;
    }
    p.awaitingChar = "q";
    return;
  }
  if (key === "@" && !p.operator) {
    p.awaitingChar = "@";
    return;
  }

  // komut satırı / arama
  if (key === ":") {
    state.mode = "command";
    state.commandKind = ":";
    state.commandLine = "";
    return;
  }
  if (key === "/" || key === "?") {
    state.mode = "command";
    state.commandKind = key;
    state.commandLine = "";
    return;
  }

  // basit komutlar
  switch (key) {
    case "i":
      enterInsert(state, buf.cursor, key);
      return;
    case "I":
      enterInsert(state, { line: buf.cursor.line, col: firstNonBlankCol(lineAt(state, buf.cursor.line)) }, key);
      return;
    case "a":
      enterInsert(state, { line: buf.cursor.line, col: Math.min(buf.cursor.col + 1, lineAt(state, buf.cursor.line).length) }, key);
      return;
    case "A":
      enterInsert(state, { line: buf.cursor.line, col: lineAt(state, buf.cursor.line).length }, key);
      return;
    case "o": {
      beginChange(state, key);
      pushUndo(state);
      const indent = lineAt(state, buf.cursor.line).match(/^\s*/)?.[0] ?? "";
      buf.lines.splice(buf.cursor.line + 1, 0, indent);
      state.mode = "insert";
      buf.cursor = { line: buf.cursor.line + 1, col: indent.length };
      state.changeInProgress = state.changeInProgress ?? ["o"];
      return;
    }
    case "O": {
      beginChange(state, key);
      pushUndo(state);
      const indent = lineAt(state, buf.cursor.line).match(/^\s*/)?.[0] ?? "";
      buf.lines.splice(buf.cursor.line, 0, indent);
      state.mode = "insert";
      buf.cursor = { line: buf.cursor.line, col: indent.length };
      return;
    }
    case "v":
      state.mode = "visual";
      state.visualStart = { ...buf.cursor };
      resetPending(state);
      beginChange(state, "v");
      return;
    case "V":
      state.mode = "visual-line";
      state.visualStart = { ...buf.cursor };
      resetPending(state);
      beginChange(state, "V");
      return;
    case "<C-v>":
      setStatus(state, "Visual-Block bu sürümde yok — v ve V ile devam!", true);
      resetPending(state);
      return;
    case "x": {
      beginChange(state, key);
      const n = effectiveCount(p);
      const text = lineAt(state, buf.cursor.line);
      if (text.length === 0) {
        resetPending(state);
        cancelChange(state);
        return;
      }
      pushUndo(state);
      const end = Math.min(buf.cursor.col + n, text.length);
      const removed = text.slice(buf.cursor.col, end);
      buf.lines[buf.cursor.line] = text.slice(0, buf.cursor.col) + text.slice(end);
      storeToRegisters(state, removed, false, "delete", p.register);
      buf.cursor.col = clampCol(state, buf.cursor.line, buf.cursor.col);
      state.desiredCol = buf.cursor.col;
      resetPending(state);
      commitChange(state);
      return;
    }
    case "X": {
      beginChange(state, key);
      const n = Math.min(effectiveCount(p), buf.cursor.col);
      if (n <= 0) {
        resetPending(state);
        cancelChange(state);
        return;
      }
      pushUndo(state);
      const text = lineAt(state, buf.cursor.line);
      const removed = text.slice(buf.cursor.col - n, buf.cursor.col);
      buf.lines[buf.cursor.line] = text.slice(0, buf.cursor.col - n) + text.slice(buf.cursor.col);
      storeToRegisters(state, removed, false, "delete", p.register);
      buf.cursor.col -= n;
      state.desiredCol = buf.cursor.col;
      resetPending(state);
      commitChange(state);
      return;
    }
    case "s": {
      beginChange(state, key);
      const n = effectiveCount(p);
      pushUndo(state);
      const text = lineAt(state, buf.cursor.line);
      const end = Math.min(buf.cursor.col + n, text.length);
      const removed = text.slice(buf.cursor.col, end);
      buf.lines[buf.cursor.line] = text.slice(0, buf.cursor.col) + text.slice(end);
      if (removed) storeToRegisters(state, removed, false, "delete", p.register);
      state.mode = "insert";
      resetPending(state);
      return;
    }
    case "S": {
      beginChange(state, key);
      applyLinewiseOperatorImpl(state, "c", effectiveCount(p));
      return;
    }
    case "C": {
      beginChange(state, key);
      pushUndo(state);
      const text = lineAt(state, buf.cursor.line);
      const removed = text.slice(buf.cursor.col);
      buf.lines[buf.cursor.line] = text.slice(0, buf.cursor.col);
      if (removed) storeToRegisters(state, removed, false, "delete", p.register);
      state.mode = "insert";
      resetPending(state);
      return;
    }
    case "D": {
      beginChange(state, key);
      pushUndo(state);
      const text = lineAt(state, buf.cursor.line);
      const removed = text.slice(buf.cursor.col);
      buf.lines[buf.cursor.line] = text.slice(0, buf.cursor.col);
      if (removed) storeToRegisters(state, removed, false, "delete", p.register);
      buf.cursor.col = clampCol(state, buf.cursor.line, buf.cursor.col);
      state.desiredCol = buf.cursor.col;
      resetPending(state);
      commitChange(state);
      return;
    }
    case "Y": {
      applyLinewiseOperatorImpl(state, "y", effectiveCount(p));
      return;
    }
    case "p":
    case "P": {
      beginChange(state, key);
      pasteRegister(state, key === "p" ? "after" : "before");
      commitChange(state);
      return;
    }
    case "J": {
      beginChange(state, key);
      joinLines(state, Math.max(2, effectiveCount(p)), true);
      resetPending(state);
      commitChange(state);
      return;
    }
    case "~": {
      beginChange(state, key);
      pushUndo(state);
      const n = effectiveCount(p);
      const text = lineAt(state, buf.cursor.line);
      let out = text;
      const end = Math.min(buf.cursor.col + n, text.length);
      for (let c = buf.cursor.col; c < end; c++) {
        const ch = out[c];
        const swapped = ch === ch.toLowerCase() ? ch.toUpperCase() : ch.toLowerCase();
        out = out.slice(0, c) + swapped + out.slice(c + 1);
      }
      buf.lines[buf.cursor.line] = out;
      buf.cursor.col = clampCol(state, buf.cursor.line, end);
      state.desiredCol = buf.cursor.col;
      resetPending(state);
      commitChange(state);
      return;
    }
    case "R": {
      beginChange(state, key);
      pushUndo(state);
      state.mode = "replace";
      state.replaceSession = {
        line: buf.cursor.line,
        startCol: buf.cursor.col,
        original: lineAt(state, buf.cursor.line),
      };
      resetPending(state);
      return;
    }
    case "u":
      performUndo(state);
      buf.cursor = clampPosition(state, buf.cursor);
      resetPending(state);
      return;
    case "<C-r>":
      performRedo(state);
      buf.cursor = clampPosition(state, buf.cursor);
      resetPending(state);
      return;
    case ".": {
      if (state.lastChange) {
        const keys = [...state.lastChange];
        resetPending(state);
        feedKeys(state, keys);
        if (state.mode !== "normal") feedKeys(state, ["<Esc>"]);
      } else {
        setStatus(state, "Tekrarlanacak değişiklik yok");
      }
      return;
    }
    case "n":
    case "N": {
      const dir = key === "n" ? state.search.direction : ((state.search.direction * -1) as 1 | -1);
      searchMove(state, dir);
      return;
    }
    case "*":
    case "#": {
      const word = wordUnderCursor(lineAt(state, buf.cursor.line), buf.cursor.col);
      if (!word) {
        setStatus(state, "E348: İmleç altında kelime yok", true);
        resetPending(state);
        return;
      }
      state.search = { pattern: `\\<${word}\\>`, direction: key === "*" ? 1 : -1 };
      searchMove(state, state.search.direction);
      return;
    }
    case ";":
    case ",": {
      if (!state.lastFt) {
        resetPending(state);
        return;
      }
      const { type, char } = state.lastFt;
      let effType = type;
      if (key === ",") {
        effType = type === "f" ? "F" : type === "F" ? "f" : type === "t" ? "T" : "t";
      }
      const col = findCharInLine(
        lineAt(state, buf.cursor.line),
        buf.cursor.col,
        char,
        effType,
        effectiveCount(p),
        effType === "t" || effType === "T"
      );
      if (col !== null) {
        const kind = effType === "f" || effType === "t" ? "inclusive" : "exclusive";
        applyMotionOrMove(state, { pos: { line: buf.cursor.line, col }, kind });
      } else {
        resetPending(state);
        cancelChange(state);
      }
      return;
    }
    case "<C-o>": {
      if (state.jumplistIndex > 0) {
        if (state.jumplistIndex === state.jumplist.length) {
          state.jumplist.push({ bufferId: state.currentBufferId, pos: { ...buf.cursor } });
        }
        state.jumplistIndex--;
        const entry = state.jumplist[state.jumplistIndex];
        jumpTo(state, entry.bufferId, entry.pos);
      }
      resetPending(state);
      return;
    }
    case "<C-i>":
    case "<Tab>": {
      if (state.jumplistIndex < state.jumplist.length - 1) {
        state.jumplistIndex++;
        const entry = state.jumplist[state.jumplistIndex];
        jumpTo(state, entry.bufferId, entry.pos);
      }
      resetPending(state);
      return;
    }
    case "<C-a>":
    case "<C-x>": {
      beginChange(state, key);
      incrementNumber(state, key === "<C-a>" ? effectiveCount(p) : -effectiveCount(p));
      resetPending(state);
      commitChange(state);
      return;
    }
    case "<C-d>": {
      const half = Math.floor(state.viewportHeight / 2);
      buf.cursor.line = clampLine(state, buf.cursor.line + half);
      state.scrollTop = Math.min(Math.max(0, lineCount(state) - state.viewportHeight), state.scrollTop + half);
      buf.cursor.col = clampCol(state, buf.cursor.line, state.desiredCol);
      resetPending(state);
      return;
    }
    case "<C-u>": {
      const half = Math.floor(state.viewportHeight / 2);
      buf.cursor.line = clampLine(state, buf.cursor.line - half);
      state.scrollTop = Math.max(0, state.scrollTop - half);
      buf.cursor.col = clampCol(state, buf.cursor.line, state.desiredCol);
      resetPending(state);
      return;
    }
    case "<C-f>": {
      buf.cursor.line = clampLine(state, buf.cursor.line + state.viewportHeight);
      state.scrollTop = Math.min(Math.max(0, lineCount(state) - state.viewportHeight), state.scrollTop + state.viewportHeight);
      buf.cursor.col = clampCol(state, buf.cursor.line, state.desiredCol);
      resetPending(state);
      return;
    }
    case "<C-b>": {
      buf.cursor.line = clampLine(state, buf.cursor.line - state.viewportHeight);
      state.scrollTop = Math.max(0, state.scrollTop - state.viewportHeight);
      buf.cursor.col = clampCol(state, buf.cursor.line, state.desiredCol);
      resetPending(state);
      return;
    }
    case "<C-g>": {
      const modified = buf.lines.join("\n") !== buf.savedLines.join("\n") ? " [Değişti]" : "";
      setStatus(state, `"${state.currentBufferId}"${modified} ${lineCount(state)} satır --%${Math.round(((buf.cursor.line + 1) / lineCount(state)) * 100)}--`);
      resetPending(state);
      return;
    }
    case "<C-^>": {
      if (!state.alternateBufferId || !state.buffers[state.alternateBufferId]) {
        setStatus(state, "E23: Alternatif dosya yok", true);
        resetPending(state);
        return;
      }
      const target = state.alternateBufferId;
      state.alternateBufferId = state.currentBufferId;
      state.currentBufferId = target;
      state.scrollTop = 0;
      setStatus(state, `"${target}"`);
      resetPending(state);
      return;
    }
    default:
      break;
  }

  // hareketler (operatör hedefi ya da imleç taşıma)
  const motion = resolveMotion(state, key, { count: effectiveCount(p), forOperator: p.operator !== null });
  if (motion) {
    if (["G", "{", "}", "%", "H", "M", "L"].includes(key) && !p.operator) addJump(state);
    applyMotionOrMove(state, motion, key);
    return;
  }

  // tanınmayan tuş — bekleyeni sıfırla
  resetPending(state);
}

function handleGPrefixed(state: VimState, key: string): void {
  const p = state.pending;
  const buf = currentBuffer(state);
  p.gPrefix = false;

  // gu / gU / g~ operatörleri
  if (key === "u" || key === "U" || key === "~") {
    const op = ("g" + key) as OperatorKey;
    if (p.operator === op) {
      applyLinewiseOperator(state, op);
      return;
    }
    if (!p.operator) {
      p.operator = op;
      beginChange(state, "g");
      if (state.changeInProgress) state.changeInProgress.push(key);
      return;
    }
    resetPending(state);
    return;
  }
  // operatör beklerken gu için satır kısayolu: guu → yukarıda; gugu ise operator=gu iken g...u
  if ((p.operator === "gu" && key === "u") || (p.operator === "gU" && key === "U") || (p.operator === "g~" && key === "~")) {
    applyLinewiseOperator(state, p.operator);
    return;
  }

  switch (key) {
    case "g":
    case "e":
    case "E":
    case "_": {
      const motion = resolveMotion(state, key, { count: effectiveCount(p), forOperator: p.operator !== null }, true);
      if (motion) {
        if (key === "g" && !p.operator) addJump(state);
        applyMotionOrMove(state, motion, "g" + key);
      } else {
        resetPending(state);
      }
      return;
    }
    case "v": {
      if (state.lastVisual) {
        state.mode = state.lastVisual.mode;
        state.visualStart = { ...state.lastVisual.start };
        buf.cursor = clampPosition(state, state.lastVisual.end);
      } else {
        setStatus(state, "Önceki seçim yok", true);
      }
      resetPending(state);
      return;
    }
    case "i": {
      if (state.lastInsertPos && state.lastInsertPos.bufferId === state.currentBufferId) {
        enterInsert(state, clampPosition(state, state.lastInsertPos.pos, true), "gi");
      } else {
        enterInsert(state, buf.cursor, "gi");
      }
      return;
    }
    case "J": {
      beginChange(state, "gJ");
      joinLines(state, Math.max(2, effectiveCount(p)), false);
      resetPending(state);
      commitChange(state);
      return;
    }
    case "f": {
      const word = lineAt(state, buf.cursor.line).match(/[\w./-]+/g)?.find((_, idx, arr) => {
        // imlecin üzerinde olduğu dosya adını bul
        let col = 0;
        const text = lineAt(state, buf.cursor.line);
        for (let i2 = 0; i2 <= idx; i2++) {
          col = text.indexOf(arr[i2], col);
          if (i2 < idx) col += arr[i2].length;
        }
        return buf.cursor.col >= col && buf.cursor.col < col + arr[idx].length;
      });
      if (word && state.buffers[word]) {
        addJump(state);
        state.alternateBufferId = state.currentBufferId;
        state.currentBufferId = word;
        state.scrollTop = 0;
        setStatus(state, `"${word}"`);
      } else {
        setStatus(state, `E447: Dosya bulunamadı: ${word ?? "?"}`, true);
      }
      resetPending(state);
      return;
    }
    default:
      resetPending(state);
  }
}

function handleAwaitedChar(state: VimState, key: string): void {
  const p = state.pending;
  const buf = currentBuffer(state);
  const kind = p.awaitingChar;
  p.awaitingChar = null;

  // <Esc> her beklemeyi iptal eder
  if (key === "<Esc>") {
    resetPending(state);
    cancelChange(state);
    return;
  }
  if (key.length > 1 && key !== "<CR>" && key !== " ") {
    resetPending(state);
    cancelChange(state);
    return;
  }

  switch (kind) {
    case "f":
    case "F":
    case "t":
    case "T": {
      state.lastFt = { type: kind, char: key };
      const col = findCharInLine(lineAt(state, buf.cursor.line), buf.cursor.col, key, kind, effectiveCount(p));
      if (col === null) {
        resetPending(state);
        cancelChange(state);
        return;
      }
      const motionKind = kind === "f" || kind === "t" ? "inclusive" : "exclusive";
      applyMotionOrMove(state, { pos: { line: buf.cursor.line, col }, kind: motionKind });
      return;
    }
    case "r": {
      const n = effectiveCount(p);
      const text = lineAt(state, buf.cursor.line);
      if (key === "<CR>") {
        pushUndo(state);
        const before = text.slice(0, buf.cursor.col);
        const after = text.slice(buf.cursor.col + 1);
        buf.lines.splice(buf.cursor.line, 1, before, after);
        buf.cursor = { line: buf.cursor.line + 1, col: 0 };
        resetPending(state);
        commitChange(state);
        return;
      }
      if (buf.cursor.col + n > text.length) {
        resetPending(state);
        cancelChange(state);
        return;
      }
      pushUndo(state);
      buf.lines[buf.cursor.line] = text.slice(0, buf.cursor.col) + key.repeat(n) + text.slice(buf.cursor.col + n);
      buf.cursor.col = buf.cursor.col + n - 1;
      state.desiredCol = buf.cursor.col;
      resetPending(state);
      commitChange(state);
      return;
    }
    case "m": {
      state.marks[key] = { bufferId: state.currentBufferId, pos: { ...buf.cursor } };
      setStatus(state, `Mark ${key} kondu`);
      resetPending(state);
      return;
    }
    case "backtick":
    case "quote": {
      const mark = state.marks[key];
      if (!mark) {
        setStatus(state, `E20: Mark yok: ${key}`, true);
        resetPending(state);
        cancelChange(state);
        return;
      }
      if (!p.operator) addJump(state);
      if (mark.bufferId !== state.currentBufferId) {
        jumpTo(state, mark.bufferId, mark.pos);
        resetPending(state);
        return;
      }
      const pos =
        kind === "backtick"
          ? clampPosition(state, mark.pos)
          : { line: clampLine(state, mark.pos.line), col: firstNonBlankCol(lineAt(state, clampLine(state, mark.pos.line))) };
      applyMotionOrMove(state, { pos, kind: kind === "backtick" ? "exclusive" : "linewise" });
      return;
    }
    case "q": {
      if (!/^[a-z0-9]$/i.test(key)) {
        resetPending(state);
        return;
      }
      state.macro.recording = key.toLowerCase();
      state.macro.recordedKeys = [];
      setStatus(state, `q kaydı: @${key.toLowerCase()}`);
      resetPending(state);
      return;
    }
    case "@": {
      const n = effectiveCount(p);
      let regName = key === "@" ? state.macro.lastPlayed : key;
      if (!regName) {
        setStatus(state, "E748: Daha önce kullanılan register yok", true);
        resetPending(state);
        return;
      }
      regName = regName.toLowerCase();
      const reg = getRegister(state, regName);
      if (!reg.text) {
        setStatus(state, `Register boş: @${regName}`, true);
        resetPending(state);
        return;
      }
      state.macro.lastPlayed = regName;
      resetPending(state);
      for (let i = 0; i < n; i++) {
        feedKeys(state, splitKeys(reg.text));
      }
      return;
    }
    case "register": {
      if (/^[a-zA-Z0-9"+*_-]$/.test(key)) {
        p.register = key;
      }
      return;
    }
    case "textobj-i":
    case "textobj-a": {
      const inner = kind === "textobj-i";
      const range = resolveTextObject(buf.lines, buf.cursor, key, inner);
      if (!range || !p.operator) {
        resetPending(state);
        cancelChange(state);
        return;
      }
      applyOperatorToRange(state, p.operator, range, p.register);
      return;
    }
    case "z": {
      const line = buf.cursor.line;
      if (key === "z") state.scrollTop = Math.max(0, line - Math.floor(state.viewportHeight / 2));
      else if (key === "t") state.scrollTop = line;
      else if (key === "b") state.scrollTop = Math.max(0, line - state.viewportHeight + 1);
      resetPending(state);
      return;
    }
    case "visual-r": {
      applyVisualReplace(state, key);
      return;
    }
    default:
      resetPending(state);
  }
}

/** Hareket sonucunu uygular: operatör varsa aralığa, yoksa imleci taşır */
function applyMotionOrMove(state: VimState, motion: MotionResult, key?: string): void {
  const p = state.pending;
  const buf = currentBuffer(state);

  if (motion.failed) {
    resetPending(state);
    cancelChange(state);
    return;
  }

  if (p.operator) {
    let effMotion = motion;
    // cw → ce özel durumu (imleç boşlukta değilse)
    if (p.operator === "c" && (key === "w" || key === "W")) {
      const ch = lineAt(state, buf.cursor.line)[buf.cursor.col] ?? "";
      if (ch && !/\s/.test(ch)) {
        const alt = resolveMotion(state, key === "w" ? "e" : "E", {
          count: effectiveCount(p),
          forOperator: true,
        });
        if (alt) effMotion = alt;
      }
    }
    const range = motionToRange(state, buf.cursor, effMotion);
    applyOperatorToRange(state, p.operator, range, p.register);
    return;
  }

  // sadece imleç hareketi
  const target = clampPosition(state, motion.pos);
  buf.cursor = target;
  const isVertical = key === "j" || key === "k" || key === "<C-n>" || key === "<C-p>";
  if (key === "$") {
    state.desiredCol = Number.MAX_SAFE_INTEGER;
    buf.cursor.col = clampCol(state, buf.cursor.line, Number.MAX_SAFE_INTEGER);
  } else if (isVertical) {
    buf.cursor.col = clampCol(state, buf.cursor.line, Math.max(state.desiredCol, 0) === 0 ? motion.pos.col : state.desiredCol);
  } else {
    state.desiredCol = buf.cursor.col;
  }
  resetPending(state);
}

function motionToRange(state: VimState, from: Position, motion: MotionResult): TextRange {
  const [start, end] = orderRange(from, motion.pos);
  if (motion.kind === "linewise") {
    return { start: { line: start.line, col: 0 }, end: { line: end.line, col: 0 }, linewise: true };
  }
  if (motion.kind === "inclusive") {
    return { start, end, linewise: false };
  }
  // exclusive: bitiş konumu hariç → end.col - 1'e kadar dahil
  if (end.col === 0 && end.line > start.line) {
    // satır başına exclusive: önceki satırın sonuna kadar
    const prevLine = end.line - 1;
    return {
      start,
      end: { line: prevLine, col: Math.max(0, lineAt(state, prevLine).length - 1) },
      linewise: false,
    };
  }
  return { start, end: { line: end.line, col: Math.max(0, end.col - 1) }, linewise: false };
}

/** dd/yy/cc/>>/<< ve guu/gUU */
function applyLinewiseOperator(state: VimState, op: OperatorKey): void {
  applyLinewiseOperatorImpl(state, op, effectiveCount(state.pending));
}

function applyLinewiseOperatorImpl(state: VimState, op: OperatorKey, count: number): void {
  const buf = currentBuffer(state);
  const startLine = buf.cursor.line;
  const endLine = clampLine(state, startLine + count - 1);
  applyOperatorToRange(
    state,
    op,
    { start: { line: startLine, col: 0 }, end: { line: endLine, col: 0 }, linewise: true },
    state.pending.register
  );
}

/** Operatörü verilen aralığa uygular. Aralık end-DAHİL (charwise) ya da linewise. */
function applyOperatorToRange(state: VimState, op: OperatorKey, range: TextRange, register: string | null): void {
  const buf = currentBuffer(state);

  if (range.linewise) {
    const start = range.start.line;
    const end = range.end.line;
    const lines = buf.lines.slice(start, end + 1);
    const text = lines.join("\n") + "\n";

    switch (op) {
      case "y": {
        storeToRegisters(state, text, true, "yank", register);
        buf.cursor = { line: start, col: firstNonBlankCol(buf.lines[start]) };
        setStatus(state, lines.length > 1 ? `${lines.length} satır kopyalandı` : "");
        resetPending(state);
        cancelChange(state);
        return;
      }
      case "d": {
        pushUndo(state);
        storeToRegisters(state, text, true, "delete", register);
        buf.lines.splice(start, lines.length);
        if (buf.lines.length === 0) buf.lines = [""];
        const newLine = clampLine(state, start);
        buf.cursor = { line: newLine, col: firstNonBlankCol(buf.lines[newLine]) };
        setStatus(state, lines.length > 1 ? `${lines.length} satır silindi` : "");
        resetPending(state);
        commitChange(state);
        return;
      }
      case "c": {
        pushUndo(state);
        storeToRegisters(state, text, true, "delete", register);
        const indent = buf.lines[start].match(/^\s*/)?.[0] ?? "";
        buf.lines.splice(start, lines.length, indent);
        buf.cursor = { line: start, col: indent.length };
        state.mode = "insert";
        resetPending(state);
        return;
      }
      case ">":
      case "<": {
        pushUndo(state);
        for (let l = start; l <= end; l++) {
          if (op === ">") {
            if (buf.lines[l].length > 0) buf.lines[l] = " ".repeat(SHIFT_WIDTH) + buf.lines[l];
          } else {
            buf.lines[l] = buf.lines[l].replace(new RegExp(`^ {1,${SHIFT_WIDTH}}`), "");
          }
        }
        buf.cursor = { line: start, col: firstNonBlankCol(buf.lines[start]) };
        resetPending(state);
        commitChange(state);
        return;
      }
      case "gu":
      case "gU":
      case "g~": {
        pushUndo(state);
        for (let l = start; l <= end; l++) {
          buf.lines[l] = transformCase(buf.lines[l], op);
        }
        buf.cursor = { line: start, col: buf.cursor.col };
        resetPending(state);
        commitChange(state);
        return;
      }
      default:
        resetPending(state);
        return;
    }
  }

  // charwise: [start, end] dahil → deleteRange için end+1
  const endExclusive: Position = { line: range.end.line, col: range.end.col + 1 };
  const text = extractText(buf.lines, range.start, endExclusive);

  switch (op) {
    case "y": {
      storeToRegisters(state, text, false, "yank", register);
      buf.cursor = clampPosition(state, range.start);
      resetPending(state);
      cancelChange(state);
      return;
    }
    case "d": {
      pushUndo(state);
      storeToRegisters(state, text, false, "delete", register);
      buf.lines = deleteRange(buf.lines, range.start, endExclusive);
      buf.cursor = clampPosition(state, range.start);
      state.desiredCol = buf.cursor.col;
      resetPending(state);
      commitChange(state);
      return;
    }
    case "c": {
      pushUndo(state);
      storeToRegisters(state, text, false, "delete", register);
      buf.lines = deleteRange(buf.lines, range.start, endExclusive);
      buf.cursor = clampPosition(state, range.start, true);
      state.mode = "insert";
      resetPending(state);
      return;
    }
    case "gu":
    case "gU":
    case "g~": {
      pushUndo(state);
      transformCaseRange(state, range.start, endExclusive, op);
      buf.cursor = clampPosition(state, range.start);
      resetPending(state);
      commitChange(state);
      return;
    }
    case ">":
    case "<": {
      // charwise girinti yine satır bazlı çalışır
      applyOperatorToRange(
        state,
        op,
        { start: { line: range.start.line, col: 0 }, end: { line: range.end.line, col: 0 }, linewise: true },
        register
      );
      return;
    }
    default:
      resetPending(state);
  }
}

function transformCase(text: string, op: "gu" | "gU" | "g~"): string {
  if (op === "gu") return text.toLowerCase();
  if (op === "gU") return text.toUpperCase();
  return [...text].map((ch) => (ch === ch.toLowerCase() ? ch.toUpperCase() : ch.toLowerCase())).join("");
}

function transformCaseRange(state: VimState, start: Position, endExclusive: Position, op: "gu" | "gU" | "g~"): void {
  const buf = currentBuffer(state);
  for (let l = start.line; l <= endExclusive.line && l < buf.lines.length; l++) {
    const from = l === start.line ? start.col : 0;
    const to = l === endExclusive.line ? endExclusive.col : buf.lines[l].length;
    const line = buf.lines[l];
    buf.lines[l] = line.slice(0, from) + transformCase(line.slice(from, to), op) + line.slice(to);
  }
}

function pasteRegister(state: VimState, where: "after" | "before"): void {
  const p = state.pending;
  const buf = currentBuffer(state);
  const n = effectiveCount(p);
  const reg = getRegister(state, p.register ?? '"');
  if (!reg.text) {
    setStatus(state, "Register boş", true);
    resetPending(state);
    cancelChange(state);
    return;
  }
  pushUndo(state);
  if (reg.linewise) {
    const lines = reg.text.replace(/\n$/, "").split("\n");
    const repeated: string[] = [];
    for (let i = 0; i < n; i++) repeated.push(...lines);
    const at = where === "after" ? buf.cursor.line + 1 : buf.cursor.line;
    buf.lines.splice(at, 0, ...repeated);
    buf.cursor = { line: at, col: firstNonBlankCol(buf.lines[at]) };
  } else {
    const text = reg.text.repeat(n);
    const lineText = lineAt(state, buf.cursor.line);
    const col = where === "after" ? Math.min(buf.cursor.col + 1, lineText.length) : buf.cursor.col;
    const { lines, end } = insertText(buf.lines, { line: buf.cursor.line, col }, text);
    buf.lines = lines;
    buf.cursor = clampPosition(state, { line: end.line, col: Math.max(col, end.col - 1) });
  }
  state.desiredCol = buf.cursor.col;
  resetPending(state);
}

function joinLines(state: VimState, count: number, withSpace: boolean): void {
  const buf = currentBuffer(state);
  const joins = count - 1;
  if (buf.cursor.line + 1 >= buf.lines.length) {
    setStatus(state, "");
    return;
  }
  pushUndo(state);
  for (let i = 0; i < joins && buf.cursor.line + 1 < buf.lines.length; i++) {
    const cur = buf.lines[buf.cursor.line];
    const next = buf.lines[buf.cursor.line + 1];
    if (withSpace) {
      const trimmedNext = next.replace(/^\s+/, "");
      const sep = cur.length === 0 || cur.endsWith(" ") ? "" : " ";
      buf.lines.splice(buf.cursor.line, 2, cur + sep + trimmedNext);
      // imleç birleşme noktasında (eklenen boşluk ya da eklenen metnin başı)
      buf.cursor.col = cur.length;
    } else {
      buf.lines.splice(buf.cursor.line, 2, cur + next);
      buf.cursor.col = cur.length;
    }
  }
  buf.cursor.col = clampCol(state, buf.cursor.line, buf.cursor.col);
}

function incrementNumber(state: VimState, delta: number): void {
  const buf = currentBuffer(state);
  const text = lineAt(state, buf.cursor.line);
  const re = /-?\d+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const start = m.index;
    const end = m.index + m[0].length;
    if (end > buf.cursor.col) {
      pushUndo(state);
      const value = parseInt(m[0], 10) + delta;
      const newText = text.slice(0, start) + String(value) + text.slice(end);
      buf.lines[buf.cursor.line] = newText;
      buf.cursor.col = start + String(value).length - 1;
      state.desiredCol = buf.cursor.col;
      return;
    }
  }
  setStatus(state, "Satırda sayı yok", true);
}

function searchMove(state: VimState, direction: 1 | -1): void {
  const p = state.pending;
  const buf = currentBuffer(state);
  if (!state.search.pattern) {
    setStatus(state, "E35: Önceki arama deseni yok", true);
    resetPending(state);
    return;
  }
  let pos: Position | null = { ...buf.cursor };
  const n = effectiveCount(p);
  for (let i = 0; i < n && pos; i++) {
    pos = findMatch(buf.lines, state.search.pattern, pos, direction);
  }
  if (!pos) {
    setStatus(state, `E486: Desen bulunamadı: ${state.search.pattern}`, true);
    resetPending(state);
    cancelChange(state);
    return;
  }
  if (p.operator) {
    applyMotionOrMove(state, { pos, kind: "exclusive" });
    return;
  }
  addJump(state);
  buf.cursor = clampPosition(state, pos);
  state.desiredCol = buf.cursor.col;
  setStatus(state, `${direction === 1 ? "/" : "?"}${state.search.pattern}`);
  resetPending(state);
}

// ---------------------------------------------------------------------------
// INSERT / REPLACE MODLARI
// ---------------------------------------------------------------------------

function enterInsert(state: VimState, pos: Position, key: string): void {
  const buf = currentBuffer(state);
  if (!state.changeInProgress) beginChange(state, key);
  pushUndo(state);
  state.mode = "insert";
  buf.cursor = clampPosition(state, pos, true);
  resetPending(state);
}

function exitInsert(state: VimState): void {
  const buf = currentBuffer(state);
  state.mode = "normal";
  state.lastInsertPos = { bufferId: state.currentBufferId, pos: { ...buf.cursor } };
  buf.cursor.col = Math.max(0, buf.cursor.col - 1);
  buf.cursor = clampPosition(state, buf.cursor);
  state.desiredCol = buf.cursor.col;
  state.replaceSession = null;
  commitChange(state);
}

function handleInsertKey(state: VimState, key: string): void {
  const buf = currentBuffer(state);
  const text = lineAt(state, buf.cursor.line);

  switch (key) {
    case "<Esc>":
      exitInsert(state);
      return;
    case "<CR>": {
      const indent = text.match(/^\s*/)?.[0] ?? "";
      const before = text.slice(0, buf.cursor.col);
      const after = text.slice(buf.cursor.col);
      buf.lines.splice(buf.cursor.line, 1, before, indent + after);
      buf.cursor = { line: buf.cursor.line + 1, col: indent.length };
      return;
    }
    case "<BS>": {
      if (buf.cursor.col > 0) {
        buf.lines[buf.cursor.line] = text.slice(0, buf.cursor.col - 1) + text.slice(buf.cursor.col);
        buf.cursor.col--;
      } else if (buf.cursor.line > 0) {
        const prev = buf.lines[buf.cursor.line - 1];
        buf.lines.splice(buf.cursor.line - 1, 2, prev + text);
        buf.cursor = { line: buf.cursor.line - 1, col: prev.length };
      }
      return;
    }
    case "<Tab>": {
      const spaces = " ".repeat(SHIFT_WIDTH);
      buf.lines[buf.cursor.line] = text.slice(0, buf.cursor.col) + spaces + text.slice(buf.cursor.col);
      buf.cursor.col += spaces.length;
      return;
    }
    case "<C-w>": {
      const before = text.slice(0, buf.cursor.col);
      const trimmed = before.replace(/\s+$/, "");
      const cut = trimmed.replace(/[\p{L}\p{N}_]+$|[^\s\p{L}\p{N}_]+$/u, "");
      buf.lines[buf.cursor.line] = cut + text.slice(buf.cursor.col);
      buf.cursor.col = cut.length;
      return;
    }
    case "<C-u>": {
      buf.lines[buf.cursor.line] = text.slice(buf.cursor.col);
      buf.cursor.col = 0;
      return;
    }
    default: {
      if (key.length === 1) {
        buf.lines[buf.cursor.line] = text.slice(0, buf.cursor.col) + key + text.slice(buf.cursor.col);
        buf.cursor.col += key.length;
      }
    }
  }
}

function handleReplaceKey(state: VimState, key: string): void {
  const buf = currentBuffer(state);
  const text = lineAt(state, buf.cursor.line);

  switch (key) {
    case "<Esc>":
      exitInsert(state);
      return;
    case "<BS>": {
      // orijinal karakteri geri getir
      const sess = state.replaceSession;
      if (buf.cursor.col > 0) {
        buf.cursor.col--;
        if (sess && buf.cursor.line === sess.line && buf.cursor.col >= sess.startCol && buf.cursor.col < sess.original.length) {
          buf.lines[buf.cursor.line] =
            text.slice(0, buf.cursor.col) + sess.original[buf.cursor.col] + text.slice(buf.cursor.col + 1);
        }
      }
      return;
    }
    case "<CR>": {
      const before = text.slice(0, buf.cursor.col);
      const after = text.slice(buf.cursor.col);
      buf.lines.splice(buf.cursor.line, 1, before, after);
      buf.cursor = { line: buf.cursor.line + 1, col: 0 };
      state.replaceSession = null;
      return;
    }
    default: {
      if (key.length === 1) {
        buf.lines[buf.cursor.line] =
          text.slice(0, buf.cursor.col) + key + text.slice(Math.min(buf.cursor.col + 1, text.length));
        buf.cursor.col++;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// VISUAL MOD
// ---------------------------------------------------------------------------

function visualRange(state: VimState): TextRange {
  const buf = currentBuffer(state);
  const [start, end] = orderRange(state.visualStart ?? buf.cursor, buf.cursor);
  if (state.mode === "visual-line") {
    return { start: { line: start.line, col: 0 }, end: { line: end.line, col: 0 }, linewise: true };
  }
  return { start, end, linewise: false };
}

function saveLastVisual(state: VimState): void {
  const buf = currentBuffer(state);
  if (state.visualStart) {
    state.lastVisual = { start: { ...state.visualStart }, end: { ...buf.cursor }, mode: state.mode };
    const [s, e] = orderRange(state.visualStart, buf.cursor);
    state.marks["<"] = { bufferId: state.currentBufferId, pos: s };
    state.marks[">"] = { bufferId: state.currentBufferId, pos: e };
  }
}

function exitVisual(state: VimState): void {
  saveLastVisual(state);
  state.mode = "normal";
  state.visualStart = null;
  resetPending(state);
}

function handleVisualKey(state: VimState, key: string): void {
  const p = state.pending;
  const buf = currentBuffer(state);

  if (key === "<Esc>") {
    exitVisual(state);
    cancelChange(state);
    return;
  }

  if (p.awaitingChar) {
    handleVisualAwaitedChar(state, key);
    return;
  }

  // sayaçlar
  if (/^[1-9]$/.test(key) || (key === "0" && p.count !== null)) {
    p.count = (p.count ?? 0) * 10 + parseInt(key, 10);
    return;
  }

  if (key === '"') {
    p.awaitingChar = "register";
    return;
  }

  if (p.gPrefix) {
    p.gPrefix = false;
    if (key === "u" || key === "U" || key === "~") {
      const range = visualRange(state);
      saveLastVisual(state);
      state.mode = "normal";
      state.visualStart = null;
      applyOperatorToRange(state, ("g" + key) as OperatorKey, range, p.register);
      commitChange(state);
      return;
    }
    if (key === "g" || key === "e" || key === "E" || key === "_") {
      const motion = resolveMotion(state, key, { count: effectiveCount(p), forOperator: false }, true);
      if (motion) {
        buf.cursor = clampPosition(state, motion.pos);
        state.desiredCol = buf.cursor.col;
      }
      p.count = null;
      return;
    }
    if (key === "v") {
      exitVisual(state);
      return;
    }
    return;
  }
  if (key === "g") {
    p.gPrefix = true;
    return;
  }

  switch (key) {
    case "v":
      if (state.mode === "visual") exitVisual(state);
      else state.mode = "visual";
      return;
    case "V":
      if (state.mode === "visual-line") exitVisual(state);
      else state.mode = "visual-line";
      return;
    case "o": {
      if (state.visualStart) {
        const tmp = { ...state.visualStart };
        state.visualStart = { ...buf.cursor };
        buf.cursor = clampPosition(state, tmp);
      }
      return;
    }
    case "d":
    case "x": {
      const range = visualRange(state);
      saveLastVisual(state);
      state.mode = "normal";
      state.visualStart = null;
      applyOperatorToRange(state, "d", range, p.register);
      commitChange(state);
      return;
    }
    case "c":
    case "s": {
      const range = visualRange(state);
      saveLastVisual(state);
      state.visualStart = null;
      applyOperatorToRange(state, "c", range, p.register);
      return;
    }
    case "y": {
      const range = visualRange(state);
      saveLastVisual(state);
      state.mode = "normal";
      state.visualStart = null;
      applyOperatorToRange(state, "y", range, p.register);
      cancelChange(state);
      return;
    }
    case ">":
    case "<": {
      const range = visualRange(state);
      saveLastVisual(state);
      state.mode = "normal";
      state.visualStart = null;
      applyOperatorToRange(
        state,
        key as OperatorKey,
        { start: { line: range.start.line, col: 0 }, end: { line: range.end.line, col: 0 }, linewise: true },
        null
      );
      commitChange(state);
      return;
    }
    case "~": {
      const range = visualRange(state);
      saveLastVisual(state);
      state.mode = "normal";
      state.visualStart = null;
      applyOperatorToRange(state, "g~", range, null);
      commitChange(state);
      return;
    }
    case "U":
    case "u": {
      const range = visualRange(state);
      saveLastVisual(state);
      state.mode = "normal";
      state.visualStart = null;
      applyOperatorToRange(state, key === "U" ? "gU" : "gu", range, null);
      commitChange(state);
      return;
    }
    case "r": {
      p.awaitingChar = "visual-r";
      return;
    }
    case "J": {
      const range = visualRange(state);
      saveLastVisual(state);
      state.mode = "normal";
      state.visualStart = null;
      buf.cursor = { line: range.start.line, col: buf.cursor.col };
      joinLines(state, range.end.line - range.start.line + 1, true);
      resetPending(state);
      commitChange(state);
      return;
    }
    case "p":
    case "P": {
      const reg = getRegister(state, p.register ?? '"');
      if (!reg.text) {
        setStatus(state, "Register boş", true);
        exitVisual(state);
        return;
      }
      const savedText = reg.text;
      const savedLinewise = reg.linewise;
      const range = visualRange(state);
      saveLastVisual(state);
      state.mode = "normal";
      state.visualStart = null;
      applyOperatorToRange(state, "d", range, null);
      // silme sonrası imleç range.start'ta; şimdi yapıştır
      if (savedLinewise) {
        const lines = savedText.replace(/\n$/, "").split("\n");
        buf.lines.splice(buf.cursor.line + (range.linewise ? 0 : 1), 0, ...lines);
        const at = buf.cursor.line + (range.linewise ? 0 : 1);
        buf.cursor = { line: at, col: firstNonBlankCol(buf.lines[at]) };
      } else {
        const { lines, end } = insertText(buf.lines, buf.cursor, savedText);
        buf.lines = lines;
        buf.cursor = clampPosition(state, { line: end.line, col: Math.max(0, end.col - 1) });
      }
      commitChange(state);
      return;
    }
    case ":": {
      saveLastVisual(state);
      state.mode = "command";
      state.commandKind = ":";
      state.commandLine = "'<,'>";
      state.visualStart = null;
      return;
    }
    case "i":
    case "a": {
      p.awaitingChar = key === "i" ? "textobj-i" : "textobj-a";
      return;
    }
    case "f":
    case "F":
    case "t":
    case "T": {
      p.awaitingChar = key;
      return;
    }
    case "*":
    case "#": {
      const word = wordUnderCursor(lineAt(state, buf.cursor.line), buf.cursor.col);
      if (word) {
        state.search = { pattern: `\\<${word}\\>`, direction: key === "*" ? 1 : -1 };
        const pos = findMatch(buf.lines, state.search.pattern, buf.cursor, state.search.direction);
        if (pos) buf.cursor = clampPosition(state, pos);
      }
      p.count = null;
      return;
    }
    case "n":
    case "N": {
      if (state.search.pattern) {
        const dir = key === "n" ? state.search.direction : ((state.search.direction * -1) as 1 | -1);
        const pos = findMatch(buf.lines, state.search.pattern, buf.cursor, dir);
        if (pos) buf.cursor = clampPosition(state, pos);
      }
      p.count = null;
      return;
    }
    default:
      break;
  }

  // hareketler seçimi genişletir
  const motion = resolveMotion(state, key, { count: effectiveCount(p), forOperator: false });
  if (motion && !motion.failed) {
    buf.cursor = clampPosition(state, motion.pos);
    if (key === "$") state.desiredCol = Number.MAX_SAFE_INTEGER;
    else if (key !== "j" && key !== "k") state.desiredCol = buf.cursor.col;
    p.count = null;
    return;
  }
  p.count = null;
}

function handleVisualAwaitedChar(state: VimState, key: string): void {
  const p = state.pending;
  const buf = currentBuffer(state);
  const kind = p.awaitingChar;
  p.awaitingChar = null;

  if (key === "<Esc>") {
    resetPending(state);
    return;
  }

  switch (kind) {
    case "f":
    case "F":
    case "t":
    case "T": {
      state.lastFt = { type: kind, char: key };
      const col = findCharInLine(lineAt(state, buf.cursor.line), buf.cursor.col, key, kind, effectiveCount(p));
      if (col !== null) {
        buf.cursor.col = col;
        state.desiredCol = col;
      }
      p.count = null;
      return;
    }
    case "register": {
      if (/^[a-zA-Z0-9"+*_-]$/.test(key)) p.register = key;
      return;
    }
    case "visual-r": {
      applyVisualReplace(state, key);
      return;
    }
    case "textobj-i":
    case "textobj-a": {
      const range = resolveTextObject(buf.lines, buf.cursor, key, kind === "textobj-i");
      if (range && state.visualStart) {
        if (range.linewise && state.mode === "visual") state.mode = "visual-line";
        state.visualStart = { ...range.start };
        buf.cursor = clampPosition(state, range.end);
      }
      p.count = null;
      return;
    }
    default:
      resetPending(state);
  }
}

function applyVisualReplace(state: VimState, char: string): void {
  if (char.length !== 1) {
    exitVisual(state);
    return;
  }
  const buf = currentBuffer(state);
  const range = visualRange(state);
  saveLastVisual(state);
  state.mode = "normal";
  state.visualStart = null;
  pushUndo(state);
  const startLine = range.start.line;
  const endLine = range.end.line;
  for (let l = startLine; l <= endLine; l++) {
    const from = range.linewise ? 0 : l === startLine ? range.start.col : 0;
    const to = range.linewise ? buf.lines[l].length : l === endLine ? range.end.col + 1 : buf.lines[l].length;
    const line = buf.lines[l];
    buf.lines[l] = line.slice(0, from) + char.repeat(Math.max(0, to - from)) + line.slice(to);
  }
  buf.cursor = clampPosition(state, range.start);
  resetPending(state);
  commitChange(state);
}

// ---------------------------------------------------------------------------
// KOMUT SATIRI MODU
// ---------------------------------------------------------------------------

function handleCommandKey(state: VimState, key: string): void {
  if (key === "<Esc>") {
    state.mode = "normal";
    state.commandLine = "";
    resetPending(state);
    cancelChange(state);
    return;
  }
  if (key === "<BS>") {
    if (state.commandLine.length === 0) {
      state.mode = "normal";
      resetPending(state);
      return;
    }
    state.commandLine = state.commandLine.slice(0, -1);
    return;
  }
  if (key === "<CR>") {
    const cmd = state.commandLine;
    const kind = state.commandKind;
    state.mode = "normal";
    state.commandLine = "";

    if (kind === ":") {
      executeExCommand(state, cmd, { feedKeys });
      resetPending(state);
      return;
    }

    // arama
    const buf = currentBuffer(state);
    const direction = kind === "/" ? 1 : -1;
    if (cmd) state.search = { pattern: cmd, direction };
    if (!state.search.pattern) {
      resetPending(state);
      return;
    }
    const pos = findMatch(buf.lines, state.search.pattern, buf.cursor, direction);
    if (!pos) {
      setStatus(state, `E486: Desen bulunamadı: ${state.search.pattern}`, true);
      resetPending(state);
      cancelChange(state);
      return;
    }
    if (state.pending.operator) {
      // d/desen<CR> — operatör hedefi olarak arama
      applyMotionOrMove(state, { pos, kind: "exclusive" });
      return;
    }
    addJump(state);
    buf.cursor = clampPosition(state, pos);
    state.desiredCol = buf.cursor.col;
    setStatus(state, `${kind}${state.search.pattern}`);
    resetPending(state);
    return;
  }
  if (key.length === 1) {
    state.commandLine += key;
  }
}
