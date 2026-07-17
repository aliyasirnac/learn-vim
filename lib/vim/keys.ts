/**
 * Yalnızca "kontrol" tuşlarını (Esc, Enter, Backspace, Tab, ok tuşları, Ctrl
 * kombinasyonları) `keydown`'dan çözer. Basılabilir karakterler (harfler,
 * rakamlar, noktalama — AltGr ile üretilenler ve ölü tuş / IME birleştirmesi
 * gerektirenler dahil) BİLEREK null döner: bunlar tarayıcının native metin
 * girişi/compose mekanizmasına bırakılıp gizli bir <input>'un `input` olayından
 * okunur (bkz. VimEditor). Aksi halde Türkçe gibi klavyelerde ölü tuş olan `^`
 * ve `` ` `` hiç üretilemez, AltGr ile yazılan `{ } [ ]` de bloklanır.
 *
 * null = yok say ya da native girişe bırak, "<Arrow>" = ok tuşu uyarısı
 */
export function resolveControlKey(e: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}): string | null {
  const { key } = e;
  if (["Shift", "Control", "Alt", "Meta", "CapsLock", "Dead", "Process", "Unidentified"].includes(key)) {
    return null;
  }
  if (key.startsWith("Arrow")) return "<Arrow>";

  // Cmd/Win (Meta) kombinasyonları OS/tarayıcı kısayolu — asla vim girdisi değil.
  if (e.metaKey) return null;

  // Ctrl (Alt basılı değilken) → <C-x>. Alt da basılıysa bu genelde AltGr'dir
  // (Windows Ctrl+Alt olarak bildirir) ve basılabilir bir karakter üretir;
  // native girişe bırakılır.
  if (e.ctrlKey && !e.altKey) {
    if (key.length === 1) {
      if (key === "6" || key === "^") return "<C-^>";
      return `<C-${key.toLowerCase()}>`;
    }
    return null;
  }

  switch (key) {
    case "Escape":
      return "<Esc>";
    case "Enter":
      return "<CR>";
    case "Backspace":
      return "<BS>";
    case "Tab":
      return "<Tab>";
    default:
      return null;
  }
}

/** Tuşu insan okur gösterime çevirir (rozetler için) */
export function prettyKey(key: string): string {
  switch (key) {
    case "<Esc>":
      return "Esc";
    case "<CR>":
      return "↵";
    case "<BS>":
      return "⌫";
    case "<Tab>":
      return "Tab";
    case " ":
      return "␣";
    default:
      return key.replace(/^<C-(.+)>$/, "Ctrl-$1");
  }
}
