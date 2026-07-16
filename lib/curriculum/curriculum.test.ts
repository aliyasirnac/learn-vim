import { describe, expect, test } from "bun:test";
import { MODULES, findLesson } from "./index";
import { createVimState, processKey, splitKeys } from "@/lib/vim";
import { checkGoal, posKey } from "@/lib/game/scoring";
import type { GoalMeta } from "./types";

/**
 * Her aşamanın referans çözümü. Test, çözümü motordan geçirip hedefe
 * ulaştığını VE par'ı aşmadığını doğrular. Ders eklerken buraya çözüm ekle!
 */
const SOLUTIONS: Record<string, string[]> = {
  "hk-modlar": ["llllllllll" + "jj" + "hhhhhhhhhh", "imerhaba vim<Esc>", "x", "A!<Esc>"],
  "hk-kaydet-cik": ["A!<Esc>:w<CR>", ":q<CR>", "x:q!<CR>", "A.<Esc>:wq<CR>"],
  "hk-boss": ["llllllxhii<Esc>:w<CR>"],
  "th-hjkl": ["llll" + "kk" + "hhhhhhhh" + "jjjj" + "llllllll"],
  "th-sayac": ["4l2k8h4j8l"],
  "th-satir": ["$j^j$0"],
  "th-boss": ["7j$7k0"],
  "kh-w": ["wwwww"],
  "kh-be": ["eeebb"],
  "kh-buyuk": ["WWWE"],
  "kh-boss": ["3wjb2w"],
  "ft-f": ["fk;;"],
  "ft-t": ["t:;;"],
  "ft-geri": ["Fe;;"],
  "ft-boss": ["4f-2f-4F-"],
  "dk-ggG": ["Ggg", "8G3G12G"],
  "dk-paragraf": ["}}}"],
  "dk-yuzde": ["%j%j"],
  "dk-boss": ["G3G}gg"],
  "ia-ia": ["ai<Esc>", "iv<Esc>"],
  "ia-IA": ["I  <Esc>A;<Esc>"],
  "ia-oO": ["oikinci madde<Esc>", "OBAŞLIK<Esc>"],
  "ia-boss": ["fba)<Esc>jI  <Esc>"],
  "op-dw": ["wdw", "tgd$"],
  "op-dd": ["jdd", "j2dd"],
  "op-D": ["wlD"],
  "op-undo": ["ddu", "ddu<C-r>"],
  "op-dot": ["wdwj.j."],
  "op-boss": ["f/hDjdd"],
  "ch-cw": ["3wcwyeniDeger<Esc>"],
  "ch-C": ["2wCkısa<Esc>"],
  "ch-rR": ["f5r6", "fAREge<Esc>"],
  "ch-sS": ["f5s98<Esc>", "~ww~", "Syeni<Esc>"],
  "ch-boss": ["2wcwmavi<Esc>jbcwdev<Esc>"],
  "to-word": ["daw", "ciwyeşil<Esc>"],
  "to-quote": ['ci"yeni<Esc>', 'di"'],
  "to-paren": ["ci(10<Esc>", "di("],
  "to-block": ["di{", "dip"],
  "to-tag": ["citYeni<Esc>"],
  "to-boss": ['f(ci(yeni<Esc>jci"doğru<Esc>'],
  "yp-yy": ["yyjp"],
  "yp-ye": ["yejp"],
  "yp-PJ": ["yyP", "J"],
  "yp-boss": ["ddGp"],
  "ar-slash": ["/hazine<CR>"],
  "ar-nN": ["/anahtar<CR>nn"],
  "ar-star": ["*n"],
  "ar-operator": ["d/KALSIN<CR>"],
  "ar-boss": ["/hata<CR>n"],
  "su-s": [":s/renk/ton<CR>", ":s/ye/iç/g<CR>"],
  "su-yuzde": [":%s/eski/yeni/g<CR>"],
  "su-aralik": [":2,3s/elma/armut<CR>"],
  "su-global": [":g/#/d<CR>"],
  "su-boss": [":g/DEBUG/d<CR>", ":%s/const/let/g<CR>"],
  "vi-v": ["veld"],
  "vi-V": ["jVjd"],
  "vi-indent": ["jVj>"],
  "vi-obj": ["viwU"],
  "vi-boss": ["jVdGp"],
  "re-named": ['"ayyj"byyG"ap"bp'],
  "re-yank0": ['yyjdd"0p'],
  "re-blackhole": ['yyj"_ddp'],
  "re-boss": ['"gyyG"gp'],
  "mk-ma": ["maG`a"],
  "mk-lastjump": ["G''"],
  "mk-jumplist": ["Ggg<C-o><C-o>"],
  "mk-boss": ["ma2jd'a"],
  "mc-temel": ["qaI- <Esc>jq3@a"],
  "mc-sayac": ["qaA!<Esc>jq5@a"],
  "mc-sarmal": ['qaI"<Esc>A"<Esc>jq@a@@'],
  "mc-boss": ["qayyp<C-a>q2@a"],
  "cd-e": [":e yeni.txt<CR>imerhaba<Esc>:w<CR>"],
  "cd-bn": [":bn<CR>", ":b ucu<CR>"],
  "cd-tasima": ["yy:bn<CR>p"],
  "cd-gf": ["fugf"],
  "cd-boss": ["A!<Esc>:bn<CR>A!<Esc>:wa<CR>"],
  "ex-aralik": [":2,3d<CR>"],
  "ex-mt": [":1m$<CR>", ":1t$<CR>"],
  "ex-normal": [":%normal A;<CR>"],
  "ex-sort": [":sort<CR>"],
  "ex-boss": [":sort u<CR>", ":g/görev/normal A [OK]<CR>"],
  "us-nokta": ["f'ci'yok<Esc>j.j."],
  "us-regex": [":%s/\\[ \\]/[x]/g<CR>"],
  "us-final": [":%s/eski/yeni/g<CR>:bn<CR>:%s/eski/yeni<CR>:wa<CR>"],
};

describe("müfredat: her aşamanın çözümü hedefe ulaşır ve par'ı aşmaz", () => {
  for (const mod of MODULES) {
    for (const lesson of mod.lessons) {
      const solutions = SOLUTIONS[lesson.id];
      test(`${mod.id} / ${lesson.id}`, () => {
        expect(solutions, `${lesson.id} için çözüm tanımlı değil`).toBeDefined();
        expect(solutions.length).toBe(lesson.stages.length);

        lesson.stages.forEach((stage, si) => {
          const keys = splitKeys(solutions[si]);
          let state = createVimState(stage.files, {
            activeFile: stage.activeFile,
            cursor: stage.cursor,
            viewportHeight: 18,
          });
          const meta: GoalMeta = { keysUsed: [], collected: [] };
          let done = false;
          for (const key of keys) {
            state = processKey(state, key);
            meta.keysUsed.push(key);
            const buf = state.buffers[state.currentBufferId];
            const pk = posKey(buf.cursor.line, buf.cursor.col);
            if (!meta.collected.includes(pk)) meta.collected.push(pk);
            if (checkGoal(stage.goal, state, meta)) {
              done = true;
              break;
            }
          }
          expect(done, `${lesson.id}#${si}: çözüm hedefe ulaşmadı`).toBe(true);
          expect(
            meta.keysUsed.length,
            `${lesson.id}#${si}: çözüm (${meta.keysUsed.length}) par'ı (${stage.par}) aşıyor`
          ).toBeLessThanOrEqual(stage.par);
        });
      });
    }
  }
});

describe("müfredat bütünlüğü", () => {
  test("ders id'leri benzersiz", () => {
    const ids = MODULES.flatMap((m) => m.lessons.map((l) => l.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("findLesson çalışıyor", () => {
    expect(findLesson("hk-modlar")?.module.id).toBe("hayatta-kalma");
  });

  test("collect hedefleri geçerli konumlarda", () => {
    for (const m of MODULES) {
      for (const l of m.lessons) {
        for (const s of l.stages) {
          if (s.goal.type === "collect") {
            for (const t of s.goal.targets) {
              const file = s.files.find((fl) => fl.name === (s.activeFile ?? s.files[0].name))!;
              const line = file.lines[t.line];
              expect(line, `${l.id}: satır ${t.line} yok`).toBeDefined();
              expect(
                t.col,
                `${l.id}: hedef {${t.line},${t.col}} satır uzunluğunu aşıyor ("${line}")`
              ).toBeLessThanOrEqual(Math.max(0, line.length - 1));
            }
          }
        }
      }
    }
  });
});
