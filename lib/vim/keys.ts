/** KeyboardEvent → Vim tuş gösterimi. null = yok say, "<Arrow>" = ok tuşu uyarısı */
export function eventToVimKey(e: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}): string | null {
  const { key } = e;
  if (["Shift", "Control", "Alt", "Meta", "CapsLock", "Dead"].includes(key)) return null;
  if (key.startsWith("Arrow")) return "<Arrow>";
  if (e.metaKey || e.altKey) return null;
  if (e.ctrlKey) {
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
      return key.length === 1 ? key : null;
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
