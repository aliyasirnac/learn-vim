import { describe, expect, test } from "bun:test";
import { createVimState, processKey, splitKeys, currentBuffer } from "./index";
import type { VimState } from "./types";

function vim(lines: string[], cursor = { line: 0, col: 0 }): VimState {
  return createVimState([{ name: "test.txt", lines }], { cursor });
}

function type(state: VimState, keys: string): VimState {
  let s = state;
  for (const k of splitKeys(keys)) s = processKey(s, k);
  return s;
}

function buf(state: VimState): string[] {
  return currentBuffer(state).lines;
}

function cur(state: VimState): { line: number; col: number } {
  return currentBuffer(state).cursor;
}

describe("temel hareketler", () => {
  test("hjkl", () => {
    let s = vim(["abcdef", "ghijkl", "mnopqr"]);
    s = type(s, "jj");
    expect(cur(s)).toEqual({ line: 2, col: 0 });
    s = type(s, "k");
    expect(cur(s)).toEqual({ line: 1, col: 0 });
    s = type(s, "lll");
    expect(cur(s)).toEqual({ line: 1, col: 3 });
    s = type(s, "h");
    expect(cur(s)).toEqual({ line: 1, col: 2 });
  });

  test("sayaçla hareket 3l 2j", () => {
    let s = vim(["abcdef", "ghijkl", "mnopqr"]);
    s = type(s, "3l2j");
    expect(cur(s)).toEqual({ line: 2, col: 3 });
  });

  test("0 $ ^", () => {
    let s = vim(["  hello world"]);
    s = type(s, "$");
    expect(cur(s).col).toBe(12);
    s = type(s, "0");
    expect(cur(s).col).toBe(0);
    s = type(s, "^");
    expect(cur(s).col).toBe(2);
  });

  test("w b e kelime hareketleri", () => {
    let s = vim(["foo bar-baz qux"]);
    s = type(s, "w");
    expect(cur(s).col).toBe(4); // bar
    s = type(s, "w");
    expect(cur(s).col).toBe(7); // -
    s = type(s, "w");
    expect(cur(s).col).toBe(8); // baz
    s = type(s, "e");
    expect(cur(s).col).toBe(10); // baz sonu
    s = type(s, "b");
    expect(cur(s).col).toBe(8);
  });

  test("W B büyük kelime", () => {
    let s = vim(["foo bar-baz qux"]);
    s = type(s, "W");
    expect(cur(s).col).toBe(4);
    s = type(s, "W");
    expect(cur(s).col).toBe(12);
    s = type(s, "B");
    expect(cur(s).col).toBe(4);
  });

  test("gg ve G", () => {
    let s = vim(["bir", "iki", "üç", "dört"], { line: 1, col: 0 });
    s = type(s, "G");
    expect(cur(s).line).toBe(3);
    s = type(s, "gg");
    expect(cur(s).line).toBe(0);
    s = type(s, "3G");
    expect(cur(s).line).toBe(2);
  });

  test("f t ; ,", () => {
    let s = vim(["abcabcabc"]);
    s = type(s, "fb");
    expect(cur(s).col).toBe(1);
    s = type(s, ";");
    expect(cur(s).col).toBe(4);
    s = type(s, ",");
    expect(cur(s).col).toBe(1);
    s = type(s, "0tc");
    expect(cur(s).col).toBe(1);
  });

  test("% bracket eşleme", () => {
    let s = vim(["foo(bar(baz))"]);
    s = type(s, "f(");
    expect(cur(s).col).toBe(3);
    s = type(s, "%");
    expect(cur(s).col).toBe(12);
    s = type(s, "%");
    expect(cur(s).col).toBe(3);
  });

  test("{ } paragraf", () => {
    let s = vim(["a", "b", "", "c", "d"]);
    s = type(s, "}");
    expect(cur(s).line).toBe(2);
    s = type(s, "}");
    expect(cur(s).line).toBe(4);
    s = type(s, "{");
    expect(cur(s).line).toBe(2);
  });
});

describe("düzenleme", () => {
  test("x ve sayaçla x", () => {
    let s = vim(["abcdef"]);
    s = type(s, "x");
    expect(buf(s)).toEqual(["bcdef"]);
    s = type(s, "3x");
    expect(buf(s)).toEqual(["ef"]);
  });

  test("dd ve p", () => {
    let s = vim(["bir", "iki", "üç"]);
    s = type(s, "dd");
    expect(buf(s)).toEqual(["iki", "üç"]);
    s = type(s, "p");
    expect(buf(s)).toEqual(["iki", "bir", "üç"]);
  });

  test("dw", () => {
    let s = vim(["foo bar baz"]);
    s = type(s, "dw");
    expect(buf(s)).toEqual(["bar baz"]);
    s = type(s, "d2w");
    expect(buf(s)).toEqual([""]);
  });

  test("d$ ve D", () => {
    let s = vim(["hello world"], { line: 0, col: 5 });
    s = type(s, "d$");
    expect(buf(s)).toEqual(["hello"]);
    let s2 = vim(["hello world"], { line: 0, col: 5 });
    s2 = type(s2, "D");
    expect(buf(s2)).toEqual(["hello"]);
  });

  test("cw → ce davranışı", () => {
    let s = vim(["hello world"]);
    s = type(s, "cwmerhaba<Esc>");
    expect(buf(s)).toEqual(["merhaba world"]);
  });

  test("cc satırı değiştirir, girintiyi korur", () => {
    let s = vim(["  eski satır"]);
    s = type(s, "ccyeni<Esc>");
    expect(buf(s)).toEqual(["  yeni"]);
  });

  test("r ve R", () => {
    let s = vim(["abc"]);
    s = type(s, "rx");
    expect(buf(s)).toEqual(["xbc"]);
    s = type(s, "lRYZ<Esc>");
    expect(buf(s)).toEqual(["xYZ"]);
  });

  test("~ büyük/küçük harf", () => {
    let s = vim(["abc"]);
    s = type(s, "3~");
    expect(buf(s)).toEqual(["ABC"]);
  });

  test("J satır birleştirme", () => {
    let s = vim(["foo", "  bar"]);
    s = type(s, "J");
    expect(buf(s)).toEqual(["foo bar"]);
  });

  test("o O yeni satır", () => {
    let s = vim(["bir"]);
    s = type(s, "oiki<Esc>");
    expect(buf(s)).toEqual(["bir", "iki"]);
    s = type(s, "Osıfır<Esc>");
    expect(buf(s)).toEqual(["bir", "sıfır", "iki"]);
  });

  test("undo redo", () => {
    let s = vim(["merhaba"]);
    s = type(s, "dd");
    expect(buf(s)).toEqual([""]);
    s = type(s, "u");
    expect(buf(s)).toEqual(["merhaba"]);
    s = type(s, "<C-r>");
    expect(buf(s)).toEqual([""]);
  });

  test("insert oturumu tek undo birimi", () => {
    let s = vim(["x"]);
    s = type(s, "iabc<Esc>");
    expect(buf(s)).toEqual(["abcx"]);
    s = type(s, "u");
    expect(buf(s)).toEqual(["x"]);
  });

  test("nokta tekrarı: dw", () => {
    let s = vim(["foo bar baz qux"]);
    s = type(s, "dw..");
    expect(buf(s)).toEqual(["qux"]);
  });

  test("nokta tekrarı: insert ile", () => {
    let s = vim(["a", "b"]);
    s = type(s, "A!<Esc>jA!<Esc>");
    expect(buf(s)).toEqual(["a!", "b!"]);
    let s2 = vim(["a", "b"]);
    s2 = type(s2, "A!<Esc>j.");
    expect(buf(s2)).toEqual(["a!", "b!"]);
  });

  test("<C-a> sayı artırma", () => {
    let s = vim(["x = 41"]);
    s = type(s, "<C-a>");
    expect(buf(s)).toEqual(["x = 42"]);
    s = type(s, "10<C-x>");
    expect(buf(s)).toEqual(["x = 32"]);
  });
});

describe("yank & put", () => {
  test("yy p P", () => {
    let s = vim(["bir", "iki"]);
    s = type(s, "yyp");
    expect(buf(s)).toEqual(["bir", "bir", "iki"]);
    s = type(s, "GyyP");
    expect(buf(s)).toEqual(["bir", "bir", "iki", "iki"]);
  });

  test("yw ve karakter bazlı p", () => {
    let s = vim(["foo bar"]);
    s = type(s, "yw$p");
    expect(buf(s)).toEqual(["foo barfoo "]);
  });

  test("3p tekrar yapıştırma", () => {
    let s = vim(["ab"]);
    s = type(s, "yl3p");
    expect(buf(s)).toEqual(["aaaab"]);
  });
});

describe("text objects", () => {
  test("diw ve daw", () => {
    let s = vim(["foo bar baz"], { line: 0, col: 5 });
    s = type(s, "diw");
    expect(buf(s)).toEqual(["foo  baz"]);
    let s2 = vim(["foo bar baz"], { line: 0, col: 5 });
    s2 = type(s2, "daw");
    expect(buf(s2)).toEqual(["foo baz"]);
  });

  test('di" ve da"', () => {
    let s = vim(['say "hello world" end'], { line: 0, col: 8 });
    s = type(s, 'di"');
    expect(buf(s)).toEqual(['say "" end']);
    let s2 = vim(['say "hello world" end'], { line: 0, col: 8 });
    s2 = type(s2, 'da"');
    expect(buf(s2)).toEqual(["say end"]);
  });

  test("di( iç içe", () => {
    let s = vim(["f(g(x), y)"], { line: 0, col: 4 });
    s = type(s, "di(");
    expect(buf(s)).toEqual(["f(g(), y)"]);
  });

  test("ci{ çok satırlı", () => {
    let s = vim(["if (x) {", "  body();", "}"], { line: 1, col: 3 });
    s = type(s, "di{");
    expect(buf(s)).toEqual(["if (x) {", "}"]);
  });

  test("dip paragraf", () => {
    let s = vim(["a", "b", "", "c"], { line: 0, col: 0 });
    s = type(s, "dip");
    expect(buf(s)).toEqual(["", "c"]);
  });
});

describe("arama", () => {
  test("/ n N", () => {
    let s = vim(["foo bar", "baz foo", "foo qux"]);
    s = type(s, "/foo<CR>");
    expect(cur(s)).toEqual({ line: 1, col: 4 });
    s = type(s, "n");
    expect(cur(s)).toEqual({ line: 2, col: 0 });
    s = type(s, "n"); // sarmalama
    expect(cur(s)).toEqual({ line: 0, col: 0 });
    s = type(s, "N");
    expect(cur(s)).toEqual({ line: 2, col: 0 });
  });

  test("* imleç altındaki kelime", () => {
    let s = vim(["alpha beta", "gamma alpha"]);
    s = type(s, "*");
    expect(cur(s)).toEqual({ line: 1, col: 6 });
  });

  test("d/desen operatör hedefi", () => {
    let s = vim(["foo bar baz"]);
    s = type(s, "d/baz<CR>");
    expect(buf(s)).toEqual(["baz"]);
  });
});

describe("substitute ve ex", () => {
  test(":s/old/new", () => {
    let s = vim(["old old", "old"]);
    s = type(s, ":s/old/new<CR>");
    expect(buf(s)).toEqual(["new old", "old"]);
  });

  test(":%s/old/new/g", () => {
    let s = vim(["old old", "old"]);
    s = type(s, ":%s/old/new/g<CR>");
    expect(buf(s)).toEqual(["new new", "new"]);
  });

  test(":1,2d aralıklı silme", () => {
    let s = vim(["a", "b", "c"]);
    s = type(s, ":1,2d<CR>");
    expect(buf(s)).toEqual(["c"]);
  });

  test(":g/pat/d", () => {
    let s = vim(["keep", "TODO x", "keep2", "TODO y"]);
    s = type(s, ":g/TODO/d<CR>");
    expect(buf(s)).toEqual(["keep", "keep2"]);
  });

  test(":sort", () => {
    let s = vim(["c", "a", "b"]);
    s = type(s, ":sort<CR>");
    expect(buf(s)).toEqual(["a", "b", "c"]);
  });

  test(":m taşıma", () => {
    let s = vim(["a", "b", "c"]);
    s = type(s, ":1m$<CR>");
    expect(buf(s)).toEqual(["b", "c", "a"]);
  });

  test(":t kopyalama", () => {
    let s = vim(["a", "b"]);
    s = type(s, ":1t$<CR>");
    expect(buf(s)).toEqual(["a", "b", "a"]);
  });
});

describe("visual mod", () => {
  test("v seçim + d", () => {
    let s = vim(["hello world"]);
    s = type(s, "vllld");
    expect(buf(s)).toEqual(["o world"]);
  });

  test("V satır seçimi + d", () => {
    let s = vim(["a", "b", "c"]);
    s = type(s, "Vjd");
    expect(buf(s)).toEqual(["c"]);
  });

  test("viw seçim genişletme + y", () => {
    let s = vim(["foo barbar baz"], { line: 0, col: 6 });
    s = type(s, "viwy");
    expect(s.registers['"'].text).toBe("barbar");
  });

  test("visual > girinti", () => {
    let s = vim(["a", "b"]);
    s = type(s, "Vj>");
    expect(buf(s)).toEqual(["  a", "  b"]);
  });

  test("visual U büyük harf", () => {
    let s = vim(["abc def"]);
    s = type(s, "vllU");
    expect(buf(s)).toEqual(["ABC def"]);
  });

  test("gv son seçimi geri getirir", () => {
    let s = vim(["abcdef"]);
    s = type(s, "vll<Esc>");
    expect(s.mode).toBe("normal");
    s = type(s, "gvd");
    expect(buf(s)).toEqual(["def"]);
  });
});

describe("registerlar", () => {
  test("named register \"ayy \"ap", () => {
    let s = vim(["bir", "iki"]);
    s = type(s, '"ayyj"ap');
    expect(buf(s)).toEqual(["bir", "iki", "bir"]);
  });

  test("yank register 0 delete'ten etkilenmez", () => {
    let s = vim(["yanked", "deleted"]);
    s = type(s, "yyjdd");
    expect(s.registers["0"].text).toBe("yanked\n");
    expect(s.registers['"'].text).toBe("deleted\n");
    s = type(s, '"0p');
    expect(buf(s)).toEqual(["yanked", "yanked"]);
  });

  test("kara delik \"_dd", () => {
    let s = vim(["a", "b"]);
    s = type(s, "yy" + 'j"_dd');
    expect(s.registers['"'].text).toBe("a\n");
  });

  test("büyük harf register ekleme", () => {
    let s = vim(["bir", "iki"]);
    s = type(s, '"ayyj"Ayy');
    expect(s.registers["a"].text).toBe("bir\niki\n");
  });
});

describe("makrolar", () => {
  test("qa kayıt @a oynatma", () => {
    let s = vim(["a", "b", "c"]);
    s = type(s, "qaA!<Esc>jq");
    expect(buf(s)).toEqual(["a!", "b", "c"]);
    s = type(s, "@a");
    expect(buf(s)).toEqual(["a!", "b!", "c"]);
    s = type(s, "@@");
    expect(buf(s)).toEqual(["a!", "b!", "c!"]);
  });

  test("sayaçlı makro 2@a", () => {
    let s = vim(["1", "2", "3"]);
    s = type(s, "qaI#<Esc>jq2@a");
    expect(buf(s)).toEqual(["#1", "#2", "#3"]);
  });
});

describe("marks ve jumps", () => {
  test("ma ve `a", () => {
    let s = vim(["bir", "iki", "üç"], { line: 1, col: 1 });
    s = type(s, "maGgg`a");
    expect(cur(s)).toEqual({ line: 1, col: 1 });
  });

  test("'a satır başına gider", () => {
    let s = vim(["bir", "  iki", "üç"], { line: 1, col: 3 });
    s = type(s, "maG'a");
    expect(cur(s)).toEqual({ line: 1, col: 2 });
  });

  test("d`a operatörle", () => {
    let s = vim(["abcdef"], { line: 0, col: 4 });
    s = type(s, "ma0d`a");
    expect(buf(s)).toEqual(["ef"]);
  });

  test("<C-o> geri sıçrama", () => {
    let s = vim(["a", "b", "c", "d", "e"]);
    s = type(s, "G");
    expect(cur(s).line).toBe(4);
    s = type(s, "<C-o>");
    expect(cur(s).line).toBe(0);
    s = type(s, "<C-i>");
    expect(cur(s).line).toBe(4);
  });
});

describe("çoklu dosya", () => {
  test(":e ile yeni buffer, :bn/:bp gezinme", () => {
    let s = createVimState([{ name: "a.txt", lines: ["AAA"] }]);
    s = type(s, ":e b.txt<CR>");
    expect(s.currentBufferId).toBe("b.txt");
    s = type(s, "iBBB<Esc>");
    s = type(s, ":bn<CR>");
    expect(s.currentBufferId).toBe("a.txt");
    s = type(s, ":bp<CR>");
    expect(s.currentBufferId).toBe("b.txt");
  });

  test("dosyalar arası yank/put", () => {
    let s = createVimState([
      { name: "a.txt", lines: ["kopyala beni"] },
      { name: "b.txt", lines: ["hedef"] },
    ]);
    s = type(s, "yy:b b.txt<CR>p");
    expect(s.currentBufferId).toBe("b.txt");
    expect(buf(s)).toEqual(["hedef", "kopyala beni"]);
  });

  test(":w kaydetme ve modified takibi", () => {
    let s = vim(["orijinal"]);
    s = type(s, "A!<Esc>");
    expect(currentBuffer(s).savedLines).toEqual(["orijinal"]);
    s = type(s, ":w<CR>");
    expect(currentBuffer(s).savedLines).toEqual(["orijinal!"]);
  });

  test(":q değişiklik varken engellenir", () => {
    let s = vim(["x"]);
    s = type(s, "A!<Esc>:q<CR>");
    expect(s.quitRequested).toBe(false);
    expect(s.statusIsError).toBe(true);
    s = type(s, ":wq<CR>");
    expect(s.quitRequested).toBe(true);
  });

  test("<C-^> alternatif buffer", () => {
    let s = createVimState([
      { name: "a.txt", lines: ["A"] },
      { name: "b.txt", lines: ["B"] },
    ]);
    s = type(s, ":b b.txt<CR><C-^>");
    expect(s.currentBufferId).toBe("a.txt");
    s = type(s, "<C-^>");
    expect(s.currentBufferId).toBe("b.txt");
  });
});

describe("gU/gu operatörleri", () => {
  test("gUw", () => {
    let s = vim(["hello world"]);
    s = type(s, "gUw");
    expect(buf(s)).toEqual(["HELLO world"]);
  });

  test("guu satır", () => {
    let s = vim(["HELLO WORLD"]);
    s = type(s, "guu");
    expect(buf(s)).toEqual(["hello world"]);
  });
});

describe("ZZ ve ZQ", () => {
  test("ZZ kaydet ve çık", () => {
    let s = vim(["x"]);
    s = type(s, "A!<Esc>ZZ");
    expect(s.quitRequested).toBe(true);
    expect(currentBuffer(s).savedLines).toEqual(["x!"]);
  });
});
