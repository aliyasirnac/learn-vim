"use client";

import { useEffect, useState } from "react";
import { createVimState, processKey, splitKeys, type VimState } from "@/lib/vim";
import { VimEditor } from "@/components/vim/VimEditor";

const START_FILES = [
  {
    name: "demo.txt",
    lines: ["vim öğrenmek zor", "ok tuşlarıyla gezmek yavaş", "tekrar eden işler sıkıcı"],
  },
];

/** [tuşlar, sonrasında bekleme ms] */
const SCRIPT: [string, number][] = [
  ["", 900],
  ["fz", 450],
  ["cwkolay<Esc>", 800],
  ["j0fo", 450],
  ["ciwhjkl ile uçmak<Esc>", 800],
  ["j0", 350],
  ["ciwmakrolarla otomatik<Esc>", 1600],
];

interface DemoEvent {
  key?: string;
  delay: number;
}

const EVENTS: DemoEvent[] = SCRIPT.flatMap(([keys, pause]) => {
  const events: DemoEvent[] = splitKeys(keys).map((k) => ({ key: k, delay: 110 }));
  events.push({ delay: pause });
  return events;
});

export function TerminalDemo() {
  const [vim, setVim] = useState<VimState>(() => createVimState(START_FILES, { viewportHeight: 5 }));

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let index = 0;

    const tick = () => {
      if (cancelled) return;
      if (index >= EVENTS.length) {
        index = 0;
        setVim(createVimState(START_FILES, { viewportHeight: 5 }));
        timer = setTimeout(tick, 700);
        return;
      }
      const event = EVENTS[index++];
      if (event.key) {
        const key = event.key;
        setVim((v) => processKey(v, key));
      }
      timer = setTimeout(tick, event.delay);
    };

    timer = setTimeout(tick, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return <VimEditor state={vim} readOnly autoFocus={false} className="pointer-events-none" />;
}
