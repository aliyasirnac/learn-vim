"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createVimState, processKey, type VimState } from "@/lib/vim";
import { prettyKey } from "@/lib/vim/keys";
import { findLesson, nextLesson } from "@/lib/curriculum";
import type { GoalMeta, LessonStage } from "@/lib/curriculum/types";
import { checkGoal, posKey, starsFor, xpFor } from "@/lib/game/scoring";
import { useProgress } from "@/lib/game/store";
import { cn } from "@/lib/utils";
import { VimEditor } from "@/components/vim/VimEditor";

function initStage(stage: LessonStage): VimState {
  return createVimState(stage.files, {
    activeFile: stage.activeFile,
    cursor: stage.cursor,
    viewportHeight: Math.max(8, Math.min(16, Math.max(...stage.files.map((f) => f.lines.length)) + 2)),
  });
}

export function LessonPlayer({ lessonId }: { lessonId: string }) {
  const ref = findLesson(lessonId);
  const completeLesson = useProgress((s) => s.completeLesson);

  const [stageIndex, setStageIndex] = useState(0);
  const [prevKeys, setPrevKeys] = useState(0);
  const [transition, setTransition] = useState(false);
  const [done, setDone] = useState<{ stars: 1 | 2 | 3; keys: number; xp: number } | null>(null);
  const [runNonce, setRunNonce] = useState(0);

  const totalPar = useMemo(() => ref?.lesson.stages.reduce((a, s) => a + s.par, 0) ?? 0, [ref]);

  const handleStageComplete = useCallback(
    (stageKeys: number) => {
      if (!ref) return;
      const isLast = stageIndex === ref.lesson.stages.length - 1;
      if (isLast) {
        const totalKeys = prevKeys + stageKeys;
        const stars = starsFor(totalPar, totalKeys);
        const xp = xpFor(ref.lesson.xp, stars);
        completeLesson(ref.lesson.id, stars, totalKeys, xp);
        setDone({ stars, keys: totalKeys, xp });
        return;
      }
      setTransition(true);
      setTimeout(() => {
        setPrevKeys((p) => p + stageKeys);
        setStageIndex((i) => i + 1);
        setTransition(false);
      }, 1000);
    },
    [ref, stageIndex, prevKeys, totalPar, completeLesson]
  );

  if (!ref) {
    return (
      <div className="p-10 text-center">
        <p className="text-(--vim-red)">Ders bulunamadı.</p>
        <Link className="text-(--vim-green) underline" href="/learn">
          Haritaya dön
        </Link>
      </div>
    );
  }

  const { lesson, module: mod } = ref;
  const stage = lesson.stages[stageIndex];
  const next = nextLesson(lessonId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 w-full">
      {/* üst bar */}
      <div className="flex items-center gap-3 mb-5 text-sm">
        <Link href="/learn" className="text-(--vim-text-dim) hover:text-(--vim-green) transition-colors">
          ← Harita
        </Link>
        <span className="text-(--vim-text-dim)">/</span>
        <span className="text-(--vim-text-dim)">
          {mod.icon} {mod.title}
        </span>
        <span className="text-(--vim-text-dim)">/</span>
        <span className="text-(--vim-green-bright) font-semibold">{lesson.title}</span>
        <div className="ml-auto flex items-center gap-2">
          {lesson.stages.map((_, i) => (
            <span
              key={i}
              className={cn(
                "w-2.5 h-2.5 rounded-full border",
                i < stageIndex
                  ? "bg-(--vim-green) border-(--vim-green)"
                  : i === stageIndex
                    ? "border-(--vim-green) bg-transparent"
                    : "border-(--vim-border) bg-transparent"
              )}
            />
          ))}
        </div>
      </div>

      <StageRunner
        key={`${lessonId}-${stageIndex}-${runNonce}`}
        stage={stage}
        stageIndex={stageIndex}
        stageCount={lesson.stages.length}
        drill={Boolean(lesson.drill)}
        frozen={transition || Boolean(done)}
        showTransition={transition}
        onComplete={handleStageComplete}
        onRetry={() => setRunNonce((n) => n + 1)}
      />

      {/* ders sonu ekranı */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              className="terminal-frame rounded-xl p-8 max-w-md w-full text-center space-y-5"
            >
              <p className="font-display text-5xl text-(--vim-green-bright) phosphor flicker-in">
                DERS TAMAM
              </p>
              <div className="text-4xl tracking-widest">
                {[1, 2, 3].map((s) => (
                  <motion.span
                    key={s}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 * s, type: "spring" }}
                    className={cn(
                      "inline-block mx-1",
                      s <= done.stars ? "text-(--vim-amber) phosphor-amber" : "text-(--vim-border)"
                    )}
                  >
                    ★
                  </motion.span>
                ))}
              </div>
              <div className="text-sm text-(--vim-text-dim) space-y-1">
                <p>
                  Tuş: <span className="text-(--vim-text) font-bold">{done.keys}</span> · Par:{" "}
                  <span className="text-(--vim-amber) font-bold">{totalPar}</span>
                </p>
                <p>
                  Kazanılan XP: <span className="text-(--vim-green) font-bold">+{done.xp}</span>
                </p>
                {done.stars < 3 && (
                  <p className="text-xs">3 yıldız için {totalPar} tuş ya da altında bitir.</p>
                )}
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setDone(null);
                    setStageIndex(0);
                    setPrevKeys(0);
                    setRunNonce((n) => n + 1);
                  }}
                  className="px-4 py-2 rounded border border-(--vim-border) text-(--vim-text-dim) hover:text-(--vim-text) hover:border-(--vim-green-dim) transition-colors"
                >
                  ↺ Tekrar Oyna
                </button>
                {next ? (
                  <Link
                    href={`/learn/${next.lesson.id}`}
                    className="px-4 py-2 rounded bg-(--vim-green) text-[#06130a] font-bold hover:bg-(--vim-green-bright) transition-colors"
                  >
                    Sonraki Ders →
                  </Link>
                ) : (
                  <Link
                    href="/learn"
                    className="px-4 py-2 rounded bg-(--vim-amber) text-[#191106] font-bold"
                  >
                    🏆 Haritaya Dön
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface StageRunnerProps {
  stage: LessonStage;
  stageIndex: number;
  stageCount: number;
  drill: boolean;
  frozen: boolean;
  showTransition: boolean;
  onComplete: (stageKeys: number) => void;
  onRetry: () => void;
}

/** Tek aşamanın oyun döngüsü — key ile remount edilerek sıfırlanır */
function StageRunner({
  stage,
  stageIndex,
  stageCount,
  drill,
  frozen,
  showTransition,
  onComplete,
  onRetry,
}: StageRunnerProps) {
  const [vim, setVim] = useState<VimState>(() => initStage(stage));
  const [keysUsed, setKeysUsed] = useState<string[]>([]);
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [arrowWarn, setArrowWarn] = useState(false);
  const arrowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(false);

  const onKey = useCallback(
    (key: string) => {
      if (frozen || completedRef.current) return;
      const next = processKey(vim, key);
      const newKeys = [...keysUsed, key];
      const buf = next.buffers[next.currentBufferId];
      const pk = posKey(buf.cursor.line, buf.cursor.col);
      let newCollected = collected;
      if (
        stage.goal.type === "collect" &&
        stage.goal.targets.some((t) => posKey(t.line, t.col) === pk) &&
        !collected.has(pk)
      ) {
        newCollected = new Set(collected);
        newCollected.add(pk);
      }
      setVim(next);
      setKeysUsed(newKeys);
      if (newCollected !== collected) setCollected(newCollected);

      const meta: GoalMeta = { keysUsed: newKeys, collected: [...newCollected] };
      if (checkGoal(stage.goal, next, meta)) {
        completedRef.current = true;
        onComplete(newKeys.length);
      }
    },
    [vim, keysUsed, collected, frozen, stage, onComplete]
  );

  const onArrowKey = useCallback(() => {
    setArrowWarn(true);
    if (arrowTimer.current) clearTimeout(arrowTimer.current);
    arrowTimer.current = setTimeout(() => setArrowWarn(false), 1800);
  }, []);

  const uncollectedTargets = stage.goal.type === "collect" ? stage.goal.targets : [];
  const collectRemaining =
    stage.goal.type === "collect"
      ? stage.goal.targets.filter((t) => !collected.has(posKey(t.line, t.col))).length
      : 0;

  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-5 items-start">
      {/* görev paneli */}
      <div className="terminal-frame rounded-lg p-5 space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl text-(--vim-green-bright) phosphor">
            Aşama {stageIndex + 1}/{stageCount}
          </h2>
          {drill && (
            <span className="text-xs px-2 py-0.5 rounded bg-(--vim-amber-dim) text-[#ffe9b3]">TEKRAR</span>
          )}
        </div>

        {stage.explain && (
          <p className="text-sm leading-relaxed text-(--vim-text) border-l-2 border-(--vim-green-dim) pl-3">
            {stage.explain}
          </p>
        )}

        <div className="rounded-md bg-[#0a130d] border border-(--vim-border) p-3">
          <p className="text-[13px] uppercase tracking-widest text-(--vim-text-dim) mb-1">Görev</p>
          <p className="text-[15px] leading-relaxed text-(--vim-green-bright)">{stage.task}</p>
          {stage.goal.type === "collect" && (
            <p className="mt-2 text-sm text-(--vim-amber)">
              Kalan hedef: {collectRemaining} / {stage.goal.targets.length}
            </p>
          )}
          {stage.goal.type === "custom" && (
            <p className="mt-2 text-xs text-(--vim-text-dim)">{stage.goal.description}</p>
          )}
        </div>

        {stage.keys && stage.keys.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {stage.keys.map((k) => (
              <kbd
                key={k}
                className="px-2 py-1 rounded border border-(--vim-border) bg-[#0d1811] text-(--vim-green-bright) text-sm shadow-[0_2px_0_var(--vim-border)]"
              >
                {prettyKey(k)}
              </kbd>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 text-sm tabular-nums">
          <div>
            <span className="text-(--vim-text-dim)">Tuş: </span>
            <span
              className={cn(
                "font-bold",
                keysUsed.length <= stage.par ? "text-(--vim-green)" : "text-(--vim-amber)"
              )}
            >
              {keysUsed.length}
            </span>
          </div>
          <div>
            <span className="text-(--vim-text-dim)">Par: </span>
            <span className="font-bold text-(--vim-amber) phosphor-amber">{stage.par}</span>
          </div>
          <button
            onClick={onRetry}
            className="ml-auto text-(--vim-text-dim) hover:text-(--vim-red) transition-colors"
          >
            ↺ Baştan
          </button>
        </div>

        <div>
          {showHint ? (
            <p className="text-sm text-(--vim-amber) border border-(--vim-amber-dim) rounded-md p-3 bg-[#141005]">
              💡 {stage.hint}
            </p>
          ) : (
            <button
              onClick={() => setShowHint(true)}
              className="text-sm text-(--vim-text-dim) hover:text-(--vim-amber) transition-colors underline decoration-dotted"
            >
              Takıldın mı? İpucu göster
            </button>
          )}
        </div>

        <AnimatePresence>
          {arrowWarn && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm text-(--vim-red)"
            >
              🚫 Ok tuşları bu dojoda yasak — hjkl kullan!
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* editör */}
      <div className="relative">
        <VimEditor
          state={vim}
          onKey={onKey}
          targets={uncollectedTargets}
          collected={collected}
          onArrowKey={onArrowKey}
        />
        <AnimatePresence>
          {showTransition && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg"
            >
              <span className="font-display text-4xl text-(--vim-green-bright) phosphor flicker-in">
                AŞAMA TAMAM ✓
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
