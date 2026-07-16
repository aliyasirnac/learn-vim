"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MODULES, TOTAL_LESSONS, isLessonUnlocked, isModuleUnlocked } from "@/lib/curriculum";
import { levelForXp } from "@/lib/game/scoring";
import { useProgress } from "@/lib/game/store";
import { cn } from "@/lib/utils";

export function CurriculumMap() {
  const results = useProgress((s) => s.results);
  const xp = useProgress((s) => s.xp);
  const resetProgress = useProgress((s) => s.resetProgress);
  // localStorage'daki ilerleme yalnızca istemcide var — SSR çıktısıyla
  // uyuşmazlığı önlemek için hydration bitene dek boş kabuk çiz
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );

  if (!hydrated) return <div className="min-h-screen" />;

  const level = levelForXp(xp);
  const totalStars = Object.values(results).reduce((a, r) => a + r.stars, 0);
  const doneCount = Object.keys(results).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 w-full">
      {/* başlık + HUD */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <Link href="/" className="text-sm text-(--vim-text-dim) hover:text-(--vim-green)">
            ← Ana sayfa
          </Link>
          <h1 className="font-display text-5xl text-(--vim-green-bright) phosphor mt-1">
            MÜFREDAT HARİTASI
          </h1>
          <p className="text-(--vim-text-dim) text-sm mt-1">
            {doneCount}/{TOTAL_LESSONS} ders · ★{totalStars} · her modül bir öncekinin %60&apos;ı ile açılır
          </p>
        </div>
        <div className="terminal-frame rounded-lg px-4 py-3 min-w-56">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-(--vim-amber) font-bold phosphor-amber">Sv {level.level}</span>
            <span className="text-(--vim-text-dim) tabular-nums">
              {level.current}/{level.next} XP
            </span>
          </div>
          <div className="h-2 rounded bg-[#0a130d] border border-(--vim-border) overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-(--vim-green-dim) to-(--vim-green) transition-all"
              style={{ width: `${Math.min(100, (level.current / level.next) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* modül yolu */}
      <div className="relative space-y-6">
        <div className="absolute left-6 top-4 bottom-4 w-px bg-(--vim-border)" aria-hidden />
        {MODULES.map((module, mi) => {
          const unlocked = isModuleUnlocked(mi, results);
          const moduleDone = module.lessons.filter((l) => results[l.id]).length;
          return (
            <motion.section
              key={module.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: Math.min(mi * 0.03, 0.3) }}
              className={cn("relative pl-14", !unlocked && "opacity-45 saturate-50")}
            >
              <div
                className={cn(
                  "absolute left-0 top-1 w-12 h-12 rounded-lg terminal-frame flex items-center justify-center text-2xl",
                  unlocked && moduleDone === module.lessons.length && "shadow-[0_0_18px_rgba(74,222,128,0.35)]"
                )}
              >
                {unlocked ? module.icon : "🔒"}
              </div>
              <div className="terminal-frame rounded-lg p-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="font-display text-2xl text-(--vim-green-bright)">
                    {String(mi + 1).padStart(2, "0")} · {module.title}
                  </h2>
                  <span className="text-sm text-(--vim-text-dim)">{module.subtitle}</span>
                  <span className="ml-auto text-sm tabular-nums text-(--vim-text-dim)">
                    {moduleDone}/{module.lessons.length}
                  </span>
                </div>
                <div className="mt-3 grid sm:grid-cols-2 gap-2">
                  {module.lessons.map((lesson, li) => {
                    const lessonUnlocked = isLessonUnlocked(mi, li, results);
                    const result = results[lesson.id];
                    const inner = (
                      <div
                        className={cn(
                          "rounded-md border px-3 py-2 transition-colors h-full",
                          result
                            ? "border-(--vim-green-dim) bg-[#0b1710]"
                            : lessonUnlocked
                              ? "border-(--vim-border) bg-[#0a120d] hover:border-(--vim-green-dim) hover:bg-[#0c1811]"
                              : "border-(--vim-border) bg-transparent"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              result
                                ? "text-(--vim-green-bright)"
                                : lessonUnlocked
                                  ? "text-(--vim-text)"
                                  : "text-(--vim-text-dim)"
                            )}
                          >
                            {lessonUnlocked ? lesson.title : `🔒 ${lesson.title}`}
                          </span>
                          {lesson.drill && (
                            <span className="text-[10px] px-1.5 rounded bg-(--vim-amber-dim) text-[#ffe9b3]">
                              BOSS
                            </span>
                          )}
                          <span className="ml-auto text-sm tracking-wider">
                            {[1, 2, 3].map((s) => (
                              <span
                                key={s}
                                className={
                                  result && s <= result.stars ? "text-(--vim-amber)" : "text-(--vim-border)"
                                }
                              >
                                ★
                              </span>
                            ))}
                          </span>
                        </div>
                        <p className="text-xs text-(--vim-text-dim) mt-0.5">{lesson.summary}</p>
                      </div>
                    );
                    return lessonUnlocked ? (
                      <Link key={lesson.id} href={`/learn/${lesson.id}`}>
                        {inner}
                      </Link>
                    ) : (
                      <div key={lesson.id}>{inner}</div>
                    );
                  })}
                </div>
              </div>
            </motion.section>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <button
          onClick={() => {
            if (confirm("Tüm ilerleme silinsin mi?")) resetProgress();
          }}
          className="text-xs text-(--vim-text-dim) hover:text-(--vim-red) transition-colors"
        >
          İlerlemeyi sıfırla
        </button>
      </div>
    </div>
  );
}

function subscribeNoop(): () => void {
  return () => {};
}
