export interface Position {
  line: number;
  col: number;
}

export type Mode =
  | "normal"
  | "insert"
  | "visual"
  | "visual-line"
  | "visual-block"
  | "replace"
  | "command";

export interface RegisterContent {
  text: string;
  linewise: boolean;
}

export interface VimBuffer {
  id: string;
  lines: string[];
  /** Son :w anındaki içerik — modified bayrağı buradan türetilir */
  savedLines: string[];
  cursor: Position;
  undoStack: UndoEntry[];
  redoStack: UndoEntry[];
}

export interface UndoEntry {
  lines: string[];
  cursor: Position;
}

export type OperatorKey = "d" | "c" | "y" | ">" | "<" | "gu" | "gU" | "g~" | "=";

export interface PendingState {
  /** Operatörden önceki sayaç (2dw'deki 2) */
  count: number | null;
  /** Bekleyen operatör (d, c, y, gu...) */
  operator: OperatorKey | null;
  /** Operatörden sonraki sayaç (d2w'deki 2) */
  operatorCount: number | null;
  /** "a gibi register öneki */
  register: string | null;
  /** Sonraki tuşun karakter argümanı olduğu komut: f F t T r m ` ' q @ z */
  awaitingChar:
    | null
    | "f"
    | "F"
    | "t"
    | "T"
    | "r"
    | "m"
    | "backtick"
    | "quote"
    | "q"
    | "@"
    | "register"
    | "visual-r"
    | "textobj-i"
    | "textobj-a"
    | "z";
  /** g öneki basıldı (gg, ge, gu...) */
  gPrefix: boolean;
  /** Z öneki basıldı (ZZ, ZQ) */
  zPrefix: boolean;
  /** Ctrl-w öneki (pencere komutları) */
  ctrlWPrefix: boolean;
}

export interface SearchState {
  pattern: string;
  direction: 1 | -1;
}

export interface LastFtState {
  type: "f" | "F" | "t" | "T";
  char: string;
}

export interface MacroState {
  /** Kayıt yapılan register, yoksa null */
  recording: string | null;
  /** Kayıt sırasında biriken tuşlar */
  recordedKeys: string[];
  /** @@ için son oynatılan register */
  lastPlayed: string | null;
}

export interface JumpEntry {
  bufferId: string;
  pos: Position;
}

export interface VimState {
  buffers: Record<string, VimBuffer>;
  bufferOrder: string[];
  currentBufferId: string;
  /** Alternatif buffer (Ctrl-^ ve :b# için) */
  alternateBufferId: string | null;
  mode: Mode;
  pending: PendingState;
  /** j/k için hatırlanan sütun; -1 = yok, Infinity = $ ile satır sonu takibi */
  desiredCol: number;
  registers: Record<string, RegisterContent>;
  marks: Record<string, JumpEntry>;
  search: SearchState;
  lastFt: LastFtState | null;
  macro: MacroState;
  /** Komut satırı içeriği (mode === "command" iken) */
  commandLine: string;
  commandKind: ":" | "/" | "?";
  /** Visual mod başlangıç noktası */
  visualStart: Position | null;
  /** Nokta tekrarı için son değişikliğin tuş dizisi */
  lastChange: string[] | null;
  /** Devam eden değişikliğin tuşları (insert oturumu dahil) */
  changeInProgress: string[] | null;
  /** Jumplist (Ctrl-o / Ctrl-i) */
  jumplist: JumpEntry[];
  jumplistIndex: number;
  /** Durum satırı mesajı */
  statusMessage: string;
  /** :q ile çıkış istendi — oyun katmanı yorumlar */
  quitRequested: boolean;
  /** Görünür satır sayısı (Ctrl-d, zz vb. için) */
  viewportHeight: number;
  /** Görüntü kaydırma ofseti */
  scrollTop: number;
  /** Makro/nokta tekrarı sırasında mı çalışıyoruz (yeniden kayıt önleme) */
  replayDepth: number;
  /** Salt okunur uyarısı vs. hata mı */
  statusIsError: boolean;
  /** gv için son visual seçim */
  lastVisual: { start: Position; end: Position; mode: Mode } | null;
  /** gi için son insert konumu */
  lastInsertPos: JumpEntry | null;
  /** R modunda backspace ile orijinali geri getirmek için */
  replaceSession: { line: number; startCol: number; original: string } | null;
}

export interface MotionResult {
  pos: Position;
  /** Operatör uygulanırken kapsam türü */
  kind: "exclusive" | "inclusive" | "linewise";
  /** Hedef bulunamadı (örn. f ile karakter yok) */
  failed?: boolean;
}

export interface TextRange {
  start: Position;
  end: Position;
  linewise: boolean;
}

export interface VirtualFile {
  name: string;
  lines: string[];
}
