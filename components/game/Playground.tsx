"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { createVimState, processKey, type VimState } from "@/lib/vim";
import { VimEditor } from "@/components/vim/VimEditor";

const START_FILES = [
  {
    name: "oyun-alani.txt",
    lines: [
      "Burası serbest alan — her şey serbest!",
      "",
      "Denemek istediklerin:",
      "  ciw ile bu kelimeyi değiştir",
      "  di( parantez içini siler (deneyebilirsin)",
      '  ci" tırnak "içini" değiştirir',
      "  qa ile makro kaydet, @a ile oynat",
      "  :%s/alan/saha/g ile toplu değiştir",
      "",
      "function ornek(a, b) {",
      "  return a + b; // sayılar: 41",
      "}",
      "",
      "- elma",
      "- armut",
      "- kiraz",
    ],
  },
  { name: "notlar.md", lines: ["# Notlarım", "", ":bn ile buraya geçebilirsin"] },
];

const CHEATS: [string, [string, string][]][] = [
  [
    "Hareket",
    [
      ["h j k l", "sol/aşağı/yukarı/sağ"],
      ["w b e", "kelime ileri/geri/son"],
      ["f{x} t{x} ; ,", "karaktere git / önünde dur"],
      ["0 ^ $", "satır başı / ilk karakter / son"],
      ["gg G {n}G", "dosya başı / sonu / n. satır"],
      ["{ } %", "paragraf / parantez eşi"],
    ],
  ],
  [
    "Düzenleme",
    [
      ["i a I A o O", "insert varyantları"],
      ["d c y + hareket", "sil / değiştir / kopyala"],
      ["dd cc yy", "satır versiyonları"],
      ["x r s ~ J", "karakter işlemleri"],
      ["p P", "yapıştır (alt/üst)"],
      ["u Ctrl-r .", "undo / redo / tekrar"],
    ],
  ],
  [
    "Text Objects",
    [
      ["iw aw", "kelime içi / çevresi"],
      ['i" a" i( a( i{ it', "tırnak / parantez / etiket"],
      ["ip ap", "paragraf"],
    ],
  ],
  [
    "Güç Araçları",
    [
      ["/desen n N * #", "arama"],
      [":s/a/b/g :%s", "değiştir"],
      [":g/desen/d", "desene göre sil"],
      ['"a-z "0 "_', "registerlar"],
      ["ma `a ''", "marks"],
      ["qa … q @a @@", "makrolar"],
      [":e :bn :b :ls gf", "çoklu dosya"],
      [":m :t :normal :sort", "ex komutları"],
    ],
  ],
];

export function Playground() {
  const [vim, setVim] = useState<VimState>(() => createVimState(START_FILES, { viewportHeight: 18 }));
  const [keys, setKeys] = useState(0);

  const onKey = useCallback((key: string) => {
    setVim((v) => processKey(v, key));
    setKeys((k) => k + 1);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 w-full">
      <div className="flex items-center gap-3 mb-4 text-sm">
        <Link href="/" className="text-(--vim-text-dim) hover:text-(--vim-green)">
          ← Ana sayfa
        </Link>
        <h1 className="font-display text-3xl text-(--vim-green-bright) phosphor">SERBEST ALAN</h1>
        <span className="ml-auto text-(--vim-text-dim) tabular-nums">{keys} tuş</span>
        <button
          onClick={() => {
            setVim(createVimState(START_FILES, { viewportHeight: 18 }));
            setKeys(0);
          }}
          className="text-(--vim-text-dim) hover:text-(--vim-red) transition-colors"
        >
          ↺ Sıfırla
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
        <VimEditor state={vim} onKey={onKey} />
        <aside className="terminal-frame rounded-lg p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          <h2 className="font-display text-2xl text-(--vim-amber) phosphor-amber">KOPYA KAĞIDI</h2>
          {CHEATS.map(([section, rows]) => (
            <div key={section}>
              <h3 className="text-sm font-bold text-(--vim-green-bright) mb-1.5">{section}</h3>
              <dl className="space-y-1">
                {rows.map(([key, desc]) => (
                  <div key={key} className="flex gap-2 text-[13px]">
                    <dt className="text-(--vim-amber) whitespace-nowrap min-w-28 font-semibold">{key}</dt>
                    <dd className="text-(--vim-text-dim)">{desc}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
