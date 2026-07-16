"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Position, VimState } from "@/lib/vim";
import { isBufferModified } from "@/lib/vim";
import { eventToVimKey } from "@/lib/vim/keys";
import { findAllMatches } from "@/lib/vim/search";
import { posKey } from "@/lib/game/scoring";
import { cn } from "@/lib/utils";

const MODE_LABELS: Record<string, { label: string; className: string }> = {
  normal: { label: "NORMAL", className: "bg-(--vim-green) text-[#06130a]" },
  insert: { label: "INSERT", className: "bg-(--vim-blue) text-[#06131a]" },
  visual: { label: "VISUAL", className: "bg-(--vim-amber) text-[#191106]" },
  "visual-line": { label: "V-LINE", className: "bg-(--vim-amber) text-[#191106]" },
  "visual-block": { label: "V-BLOCK", className: "bg-(--vim-amber) text-[#191106]" },
  replace: { label: "REPLACE", className: "bg-(--vim-red) text-[#1a0808]" },
  command: { label: "KOMUT", className: "bg-(--vim-violet) text-[#120e1a]" },
};

function pendingText(state: VimState): string {
  const p = state.pending;
  let out = "";
  if (p.register) out += `"${p.register}`;
  if (p.count !== null) out += p.count;
  if (p.operator) out += p.operator.replace(/^g/, "g");
  if (p.operatorCount !== null) out += p.operatorCount;
  if (p.gPrefix) out += "g";
  if (p.zPrefix) out += "Z";
  if (p.awaitingChar && !["register", "textobj-i", "textobj-a"].includes(p.awaitingChar)) {
    out += p.awaitingChar === "backtick" ? "`" : p.awaitingChar === "quote" ? "'" : p.awaitingChar;
  }
  if (p.awaitingChar === "textobj-i") out += "i";
  if (p.awaitingChar === "textobj-a") out += "a";
  return out;
}

interface VimEditorProps {
  state: VimState;
  onKey?: (key: string) => void;
  /** Toplanmamış hedefler (collect dersleri) */
  targets?: Position[];
  collected?: Set<string>;
  readOnly?: boolean;
  autoFocus?: boolean;
  className?: string;
  /** Ok tuşuna basılınca uyarı */
  onArrowKey?: () => void;
}

export function VimEditor({
  state,
  onKey,
  targets = [],
  collected,
  readOnly = false,
  autoFocus = true,
  className,
  onArrowKey,
}: VimEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buf = state.buffers[state.currentBufferId];
  const mode = MODE_LABELS[state.mode] ?? MODE_LABELS.normal;

  useEffect(() => {
    if (autoFocus && !readOnly) containerRef.current?.focus();
  }, [autoFocus, readOnly, state.currentBufferId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (readOnly || !onKey) return;
      const key = eventToVimKey(e);
      if (key === null) return;
      e.preventDefault();
      e.stopPropagation();
      if (key === "<Arrow>") {
        onArrowKey?.();
        return;
      }
      onKey(key);
    },
    [onKey, readOnly, onArrowKey]
  );

  // görünür pencere
  const from = state.scrollTop;
  const to = Math.min(buf.lines.length, from + state.viewportHeight);
  const visible = buf.lines.slice(from, to);

  // visual seçim aralığı
  const sel = getSelection(state);
  const targetSet = new Set(
    targets.filter((t) => !collected?.has(posKey(t.line, t.col))).map((t) => posKey(t.line, t.col))
  );
  const searchPattern = state.search.pattern;

  const isCommand = state.mode === "command";

  return (
    <div
      ref={containerRef}
      tabIndex={readOnly ? -1 : 0}
      onKeyDown={handleKeyDown}
      className={cn(
        "terminal-frame rounded-lg overflow-hidden outline-none transition-shadow",
        !readOnly && "focus:shadow-[0_0_0_2px_var(--vim-green-dim),0_20px_60px_rgba(0,0,0,0.5)]",
        className
      )}
    >
      {/* buffer sekmeleri */}
      {state.bufferOrder.length > 1 && (
        <div className="flex gap-px bg-(--vim-bg) border-b border-(--vim-border) px-2 pt-2">
          {state.bufferOrder.map((id) => (
            <div
              key={id}
              className={cn(
                "px-3 py-1 text-xs rounded-t-md border border-b-0",
                id === state.currentBufferId
                  ? "bg-(--vim-panel) border-(--vim-border) text-(--vim-green-bright)"
                  : "bg-transparent border-transparent text-(--vim-text-dim)"
              )}
            >
              {id}
              {isBufferModified(state, id) && <span className="ml-1 text-(--vim-amber)">●</span>}
            </div>
          ))}
        </div>
      )}

      {/* metin alanı */}
      <div className="px-3 py-3 text-[15px] leading-6 select-none" style={{ minHeight: `${state.viewportHeight * 1.5}rem` }}>
        {visible.map((line, i) => {
          const lineNo = from + i;
          return (
            <div key={lineNo} className="flex">
              <span className="w-8 shrink-0 text-right pr-3 text-(--vim-text-dim) opacity-60 text-[13px] leading-6">
                {lineNo + 1}
              </span>
              <LineView
                text={line}
                lineNo={lineNo}
                state={state}
                sel={sel}
                targetSet={targetSet}
                searchPattern={searchPattern}
              />
            </div>
          );
        })}
        {/* dosya sonu tilde'ları */}
        {Array.from({ length: Math.max(0, state.viewportHeight - visible.length) }, (_, i) => (
          <div key={`~${i}`} className="flex">
            <span className="w-8 shrink-0 text-right pr-3 text-(--vim-green-dim) text-[13px] leading-6">~</span>
          </div>
        ))}
      </div>

      {/* durum çubuğu */}
      <div className="flex items-center gap-0 text-[13px] border-t border-(--vim-border) bg-[#0a120d]">
        <span className={cn("px-3 py-1 font-bold tracking-wider", mode.className)}>{mode.label}</span>
        {state.macro.recording && (
          <span className="px-2 py-1 text-(--vim-red) font-semibold animate-pulse">● kayıt @{state.macro.recording}</span>
        )}
        <span className="px-3 py-1 text-(--vim-text-dim) truncate">
          {state.currentBufferId}
          {isBufferModified(state, state.currentBufferId) && <span className="text-(--vim-amber)"> [+]</span>}
        </span>
        <span className="ml-auto px-2 py-1 text-(--vim-amber) font-semibold">{pendingText(state)}</span>
        <span className="px-3 py-1 text-(--vim-text-dim) tabular-nums">
          {buf.cursor.line + 1}:{buf.cursor.col + 1}
        </span>
      </div>

      {/* komut satırı / mesaj */}
      <div className="px-3 py-1 h-7 text-[13px] bg-[#050a07] border-t border-(--vim-border) overflow-hidden whitespace-pre">
        {isCommand ? (
          <span className="text-(--vim-green-bright)">
            {state.commandKind}
            {state.commandLine}
            <span className="vim-cursor-block inline-block w-2 h-4 align-middle bg-(--vim-green) ml-px" />
          </span>
        ) : (
          <span className={cn(state.statusIsError ? "text-(--vim-red)" : "text-(--vim-text-dim)")}>
            {firstLine(state.statusMessage)}
          </span>
        )}
      </div>
    </div>
  );
}

function firstLine(s: string): string {
  const lines = s.split("\n");
  return lines.length > 1 ? `${lines[0]} …(${lines.length} satır)` : s;
}

interface Selection {
  start: Position;
  end: Position;
  linewise: boolean;
}

function getSelection(state: VimState): Selection | null {
  if ((state.mode !== "visual" && state.mode !== "visual-line") || !state.visualStart) return null;
  const buf = state.buffers[state.currentBufferId];
  const a = state.visualStart;
  const b = buf.cursor;
  const [start, end] = a.line < b.line || (a.line === b.line && a.col <= b.col) ? [a, b] : [b, a];
  return { start, end, linewise: state.mode === "visual-line" };
}

function LineView({
  text,
  lineNo,
  state,
  sel,
  targetSet,
  searchPattern,
}: {
  text: string;
  lineNo: number;
  state: VimState;
  sel: Selection | null;
  targetSet: Set<string>;
  searchPattern: string;
}) {
  const buf = state.buffers[state.currentBufferId];
  const cursor = buf.cursor;
  const isCursorLine = cursor.line === lineNo;
  const chars = text.length > 0 ? [...text] : [];
  // imleç satır sonundaysa (insert) görünür olsun diye bir hücre ekle
  const cells = isCursorLine && cursor.col >= chars.length ? [...chars, " "] : chars;

  const searchCols = new Set<number>();
  if (searchPattern) {
    for (const m of findAllMatches(text, searchPattern)) {
      for (let c = m.start; c < m.end; c++) searchCols.add(c);
    }
  }

  const inSelection = (col: number): boolean => {
    if (!sel) return false;
    if (lineNo < sel.start.line || lineNo > sel.end.line) return false;
    if (sel.linewise) return true;
    if (sel.start.line === sel.end.line) return col >= sel.start.col && col <= sel.end.col;
    if (lineNo === sel.start.line) return col >= sel.start.col;
    if (lineNo === sel.end.line) return col <= sel.end.col;
    return true;
  };

  const isInsertLike = state.mode === "insert" || state.mode === "command";
  const isReplace = state.mode === "replace";

  return (
    <span className="whitespace-pre relative">
      {cells.length === 0 && !isCursorLine && " "}
      {cells.map((ch, col) => {
        const cursorHere = isCursorLine && cursor.col === col && state.mode !== "command";
        const target = targetSet.has(posKey(lineNo, col));
        return (
          <span
            key={col}
            className={cn(
              "relative inline-block min-w-[1ch]",
              inSelection(col) && "bg-(--vim-green-dim) text-(--vim-green-bright)",
              searchCols.has(col) && !inSelection(col) && "bg-(--vim-amber-dim) text-[#ffe9b3]",
              target && "coin-target rounded-sm text-(--vim-amber) font-bold",
              cursorHere && !isInsertLike && !isReplace && "vim-cursor-block bg-(--vim-cursor) text-[#06130a] rounded-[2px]",
              cursorHere && isReplace && "underline decoration-(--vim-red) decoration-2"
            )}
          >
            {cursorHere && isInsertLike && (
              <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-(--vim-blue) vim-cursor-block" />
            )}
            {ch}
          </span>
        );
      })}
    </span>
  );
}
