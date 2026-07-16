import type { Position, VimState, VirtualFile } from "@/lib/vim";

export interface GoalMeta {
  /** Bu aşamada basılan tuşlar */
  keysUsed: string[];
  /** collect hedefi için ziyaret edilen konumlar */
  collected: string[];
}

export type Goal =
  /** İmleci hedef konuma getir (opsiyonel: belirli dosyada) */
  | { type: "cursor"; target: Position; file?: string }
  /** Tüm işaretli noktaları imleçle ziyaret et */
  | { type: "collect"; targets: Position[] }
  /** Aktif dosya metnini hedefe dönüştür */
  | { type: "text"; target: string[]; file?: string }
  /** Metin + imleç konumu birlikte */
  | { type: "textAndCursor"; target: string[]; cursor: Position }
  /** Tüm dosyalar kaydedilmiş olmalı (opsiyonel hedef içeriklerle) */
  | { type: "save"; files?: { name: string; target?: string[] }[] }
  /** Serbest kontrol (ör. register içeriği, mod, arama deseni) */
  | { type: "custom"; description: string; check: (state: VimState, meta: GoalMeta) => boolean };

export interface LessonStage {
  /** Görev talimatı (kısa, emir kipi) */
  task: string;
  /** Yeni kavram anlatımı — genelde ilk aşamada */
  explain?: string;
  /** Bu aşamada öne çıkan tuşlar (UI rozetleri) */
  keys?: string[];
  files: VirtualFile[];
  activeFile?: string;
  cursor?: Position;
  goal: Goal;
  /** Altın (3 yıldız) tuş sayısı */
  par: number;
  /** Takılınca gösterilecek çözüm */
  hint: string;
}

export interface Lesson {
  id: string;
  title: string;
  summary: string;
  stages: LessonStage[];
  xp: number;
  /** Tekrar/boss dersi mi (spaced repetition işareti) */
  drill?: boolean;
}

export interface Module {
  id: string;
  title: string;
  subtitle: string;
  /** Basit emoji ikon */
  icon: string;
  lessons: Lesson[];
}
