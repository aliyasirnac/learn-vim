import type { Module } from "../types";

const f = (name: string, lines: string[]) => ({ name, lines });

export const insertModule: Module = {
  id: "insert-ailesi",
  title: "Insert Ailesi",
  subtitle: "i a I A o O — doğru yerden yazmaya başla",
  icon: "✍️",
  lessons: [
    {
      id: "ia-ia",
      title: "i ve a: Önce mi Sonra mı?",
      summary: "i imlecin önüne, a arkasına yazar",
      xp: 50,
      stages: [
        {
          task: "«vm» kelimesini «vim» yap. İmleç v'nin üzerinde: a ile v'den SONRA yazmaya başla.",
          explain: "i (insert) imlecin ÖNÜNE, a (append) imlecin ARKASINA yazar. Bu küçük fark her gün yüzlerce kez karşına çıkar.",
          keys: ["a"],
          files: [f("harf.txt", ["vm"])],
          goal: { type: "text", target: ["vim"] },
          par: 3,
          hint: "a → i → Esc",
        },
        {
          task: "«im güzel» metnini «vim güzel» yap. İmleç i'nin üzerinde: v harfini ÖNE ekle.",
          keys: ["i"],
          files: [f("harf2.txt", ["im güzel"])],
          goal: { type: "text", target: ["vim güzel"] },
          par: 3,
          hint: "i → v → Esc",
        },
      ],
    },
    {
      id: "ia-IA",
      title: "I ve A: Satır Uçları",
      summary: "I satır başına, A satır sonuna yazar",
      xp: 50,
      stages: [
        {
          task: "Satırın başına iki boşluk (girinti), sonuna noktalı virgül ekle. İmleci elle taşımak yok!",
          explain: "I → satırın ilk karakterine gidip Insert; A → satır sonuna gidip Insert. ^i ve $a kombinasyonlarının kestirmesi.",
          keys: ["I", "A"],
          files: [f("kod.txt", ["console.log(mesaj)"])],
          cursor: { line: 0, col: 8 },
          goal: { type: "text", target: ["  console.log(mesaj);"] },
          par: 7,
          hint: "I ␣ ␣ Esc A ; Esc",
        },
      ],
    },
    {
      id: "ia-oO",
      title: "o ve O: Yeni Satır Aç",
      summary: "o alta, O üste satır açar",
      xp: 50,
      stages: [
        {
          task: "İki maddenin ARASINA «ikinci madde» satırını ekle.",
          explain: "o (open) imlecin altına yeni satır açıp Insert moduna girer; O üstüne açar. «Önce satır aç, sonra yaz» refleksi.",
          keys: ["o"],
          files: [f("liste.txt", ["birinci madde", "üçüncü madde"])],
          goal: { type: "text", target: ["birinci madde", "ikinci madde", "üçüncü madde"] },
          par: 14,
          hint: "o → «ikinci madde» → Esc",
        },
        {
          task: "İçeriğin ÜSTÜNE «BAŞLIK» satırı ekle.",
          keys: ["O"],
          files: [f("belge.txt", ["içerik"])],
          goal: { type: "text", target: ["BAŞLIK", "içerik"] },
          par: 8,
          hint: "O → «BAŞLIK» → Esc",
        },
      ],
    },
    {
      id: "ia-boss",
      title: "Kod Onarımı",
      summary: "Eksik parantez ve girintiyi insert komutlarıyla düzelt",
      xp: 75,
      drill: true,
      stages: [
        {
          task: "Eksik «)» parantezini b'den sonra ekle ve ikinci satıra iki boşluk girinti ver.",
          keys: ["f", "a", "I"],
          files: [
            f("onar.ts", ["function topla(a, b {", "return a + b;", "}"]),
          ],
          goal: { type: "text", target: ["function topla(a, b) {", "  return a + b;", "}"] },
          par: 10,
          hint: "fb → a) Esc → j → I␣␣Esc",
        },
      ],
    },
  ],
};

export const operatorModule: Module = {
  id: "operator-grameri",
  title: "Operatör Grameri",
  subtitle: "d + hareket = Vim'in cümle yapısı",
  icon: "🧩",
  lessons: [
    {
      id: "op-dw",
      title: "dw ve d$: Sil + Hareket",
      summary: "Operatör + hareket = komut cümlesi",
      xp: 60,
      stages: [
        {
          task: "«gereksiz» kelimesini tek hamlede sil: kelimenin başına git (w), sonra dw.",
          explain:
            "İşte Vim'in sırrı: d (delete) bir OPERATÖRdür, tek başına bir şey yapmaz. Bir HAREKETLE birleşince anlam kazanır: dw = kelimeyi sil, d$ = satır sonuna kadar sil. [operatör] + [hareket] = sonsuz kombinasyon.",
          keys: ["d", "w"],
          files: [f("metin.txt", ["çok gereksiz kelime var"])],
          goal: { type: "text", target: ["çok kelime var"] },
          par: 3,
          hint: "w (kelime başına) → dw",
        },
        {
          task: "«gerisi gitsin» kısmını boşluğuyla birlikte sil: tg ile g'nin önüne git, d$ ile satır sonunu süpür.",
          keys: ["d", "$"],
          files: [f("metin2.txt", ["bu kalsın gerisi gitsin"])],
          goal: { type: "text", target: ["bu kalsın"] },
          par: 4,
          hint: "tg → d$",
        },
      ],
    },
    {
      id: "op-dd",
      title: "dd: Satırı Yut",
      summary: "Operatörü ikile → satıra uygula",
      xp: 60,
      stages: [
        {
          task: "Ortadaki satırı sil.",
          explain: "Bir operatörü iki kez basmak onu SATIRA uygular: dd satırı siler, (ileride) yy kopyalar, >> girintiler. Vim'in ikileme kuralı.",
          keys: ["dd"],
          files: [f("satirlar.txt", ["kalacak", "silinecek", "kalacak da"])],
          goal: { type: "text", target: ["kalacak", "kalacak da"] },
          par: 3,
          hint: "j → dd",
        },
        {
          task: "İki çöp satırı TEK komutla sil: sayaç + dd.",
          keys: ["2dd"],
          files: [f("satirlar2.txt", ["kal", "sil bir", "sil iki", "kal son"])],
          goal: { type: "text", target: ["kal", "kal son"] },
          par: 4,
          hint: "j → 2dd",
        },
      ],
    },
    {
      id: "op-D",
      title: "D: Satır Sonu Süpürgesi",
      summary: "D = d$ kısayolu",
      xp: 60,
      stages: [
        {
          task: "«:» işaretinden sonrasını sil (boşluk dahil). D, imleçten satır sonuna kadar siler.",
          keys: ["D"],
          files: [f("temizle.txt", ["önemli: buradan sonrası çöp"])],
          goal: { type: "text", target: ["önemli:"] },
          par: 3,
          hint: "w (: üzerine) → l → D",
        },
      ],
    },
    {
      id: "op-undo",
      title: "u ve Ctrl-r: Zaman Makinesi",
      summary: "Geri al, yeniden uygula — korkusuzca dene",
      xp: 60,
      stages: [
        {
          task: "İlk satırı dd ile sil, sonra u ile GERİ GETİR.",
          explain: "u (undo) son değişikliği geri alır; Ctrl-r (redo) geri alınanı yeniden uygular. Vim'de hata diye bir şey yoktur, sadece henüz u'ya basılmamış denemeler vardır.",
          keys: ["u"],
          files: [f("deneme.txt", ["bu satır silinip geri gelecek", "bu satır hep kalacak"])],
          goal: {
            type: "custom",
            description: "Satırı sil ve u ile geri getir (metin başlangıçtaki haline dönmeli)",
            check: (s) => {
              const b = s.buffers[s.currentBufferId];
              return (
                b.redoStack.length > 0 &&
                b.lines.join("\n") === "bu satır silinip geri gelecek\nbu satır hep kalacak"
              );
            },
          },
          par: 3,
          hint: "dd → u",
        },
        {
          task: "Şimdi tam tur: dd ile sil, u ile geri al, Ctrl-r ile SİLMEYİ yeniden uygula.",
          keys: ["<C-r>"],
          files: [f("deneme2.txt", ["fazla satır", "bu satır kalacak"])],
          goal: {
            type: "custom",
            description: "dd → u → Ctrl-r sırasıyla (sonuç: tek satır)",
            check: (s, meta) =>
              s.buffers[s.currentBufferId].lines.join("\n") === "bu satır kalacak" &&
              meta.keysUsed.includes("u") &&
              meta.keysUsed.includes("<C-r>"),
          },
          par: 4,
          hint: "dd → u → Ctrl-r",
        },
      ],
    },
    {
      id: "op-dot",
      title: "Nokta: Sihirli Tekrar",
      summary: ". son değişikliği tekrarlar — Vim'in en güçlü tuşu",
      xp: 60,
      stages: [
        {
          task: "Her satırdaki «TODO » etiketini sil. İlkinde dw kullan, kalanlarda sadece . (nokta)!",
          explain:
            "Nokta (.) son DEĞİŞİKLİĞİ olduğu gibi tekrarlar. Bir kez düşün, sonra nokta-nokta-nokta. Vim ustalarının %80'i bu tuşla çalışır: değişikliğini tekrarlanabilir yap, gerisini noktaya bırak.",
          keys: ["."],
          files: [f("todo.txt", ["- TODO temizle beni", "- TODO bunu da", "- TODO son"])],
          goal: { type: "text", target: ["- temizle beni", "- bunu da", "- son"] },
          par: 7,
          hint: "w → dw → j → . → j → .",
        },
      ],
    },
    {
      id: "op-boss",
      title: "Silme Ustalığı",
      summary: "f + D + dd kombinasyonu",
      xp: 90,
      drill: true,
      stages: [
        {
          task: "Yorumu ve gereksiz değişkeni temizle: hedef sadece a ve b satırları.",
          keys: ["f", "D", "dd"],
          files: [
            f("kod.ts", ["let a = 1; // eski not", "let kaldır = 0;", "let b = 2;"]),
          ],
          goal: { type: "text", target: ["let a = 1;", "let b = 2;"] },
          par: 7,
          hint: "f/ → h → D → j → dd",
        },
      ],
    },
  ],
};

export const changeModule: Module = {
  id: "degistir",
  title: "Değiştir & Üzerine Yaz",
  subtitle: "c ailesi, r R s S ~",
  icon: "🔄",
  lessons: [
    {
      id: "ch-cw",
      title: "cw: Değiştir-Kelime",
      summary: "c = sil + Insert moduna gir",
      xp: 60,
      stages: [
        {
          task: "«eskiDeger» adını «yeniDeger» yap: kelimeye git, cw ile değiştir.",
          explain:
            "c (change) operatörü d gibi siler ama seni Insert modunda bırakır. cw = kelimeyi değiştir. Silme + yazma tek akışta.",
          keys: ["c", "w"],
          files: [f("degisken.ts", ["let isim = eskiDeger;"])],
          goal: { type: "text", target: ["let isim = yeniDeger;"] },
          par: 14,
          hint: "3w → cw → yeniDeger → Esc",
        },
      ],
    },
    {
      id: "ch-C",
      title: "C: Satır Sonunu Yeniden Yaz",
      summary: "C = c$ kısayolu",
      xp: 60,
      stages: [
        {
          task: "«eski açıklama uzun» kısmını «kısa» ile değiştir: C imleçten satır sonuna kadar değiştirir.",
          keys: ["C"],
          files: [f("aciklama.txt", ["mesaj = eski açıklama uzun"])],
          goal: { type: "text", target: ["mesaj = kısa"] },
          par: 8,
          hint: "2w → C → kısa → Esc",
        },
      ],
    },
    {
      id: "ch-rR",
      title: "r ve R: Nokta Atışı",
      summary: "r tek karakter, R sürekli üzerine yazar",
      xp: 60,
      stages: [
        {
          task: "Yılı 2026 yap: 5'in üzerine gidip r6 — Insert moduna hiç girmeden!",
          explain: "r{x} imlecin altındaki TEK karakteri {x} yapar ve Normal modda kalır. R ise Replace moduna girer: yazdıkça üzerine yazar.",
          keys: ["r"],
          files: [f("tarih.txt", ["2025-01-15"])],
          goal: { type: "text", target: ["2026-01-15"] },
          par: 4,
          hint: "f5 → r6",
        },
        {
          task: "«Ali» adını «Ege» yap: A'ya git, R ile üzerine yaz.",
          keys: ["R"],
          files: [f("form.txt", ["ad:    Ali"])],
          goal: { type: "text", target: ["ad:    Ege"] },
          par: 7,
          hint: "fA → R → Ege → Esc",
        },
      ],
    },
    {
      id: "ch-sS",
      title: "s S ~: Küçük Ama Etkili",
      summary: "s karakteri değiştirir, S satırı, ~ harf çevirir",
      xp: 60,
      stages: [
        {
          task: "Notu 98 yap: 5'in üzerinde s ile sil+yaz.",
          explain: "s (substitute) = x + i: karakteri silip Insert'e girer. S = tüm satırı boşaltıp Insert'e girer (girintiyi korur). ~ harfin büyük/küçüğünü çevirir.",
          keys: ["s"],
          files: [f("not.txt", ["not: 5"])],
          goal: { type: "text", target: ["not: 98"] },
          par: 6,
          hint: "f5 → s → 98 → Esc",
        },
        {
          task: "Şehir adlarının baş harflerini büyüt: ~ imlecin altındaki harfi çevirir.",
          keys: ["~"],
          files: [f("sehir.txt", ["paris ve berlin"])],
          goal: { type: "text", target: ["Paris ve Berlin"] },
          par: 4,
          hint: "~ → w → w → ~",
        },
        {
          task: "Satırı komple yeniden yaz (girintiyi koruyarak): S ile «  yeni» olsun.",
          keys: ["S"],
          files: [f("satir.txt", ["  eski içerik burada"])],
          goal: { type: "text", target: ["  yeni"] },
          par: 6,
          hint: "S → yeni → Esc",
        },
      ],
    },
    {
      id: "ch-boss",
      title: "Değişken Yenileme",
      summary: "cw + b kombinasyonlarıyla iki değişkeni yenile",
      xp: 90,
      drill: true,
      stages: [
        {
          task: "Değerleri güncelle: kirmizi → mavi, kucuk → dev.",
          keys: ["cw", "b"],
          files: [f("stil.ts", ["renk = kirmizi;", "boyut = kucuk;"])],
          goal: { type: "text", target: ["renk = mavi;", "boyut = dev;"] },
          par: 17,
          hint: "2w → cw mavi Esc → j → b → cw dev Esc",
        },
      ],
    },
  ],
};

export const textObjectModule: Module = {
  id: "text-objects",
  title: "Text Objects",
  subtitle: "iw i\" i( — kapsamı Vim düşünsün",
  icon: "📦",
  lessons: [
    {
      id: "to-word",
      title: "iw ve aw: Kelimenin İçi & Dışı",
      summary: "İmleç kelimenin NERESİNDE olursa olsun",
      xp: 70,
      stages: [
        {
          task: "İmleç kelimenin ORTASINDA! daw ile «gereksiz» kelimesini boşluğuyla birlikte sil.",
          explain:
            "Text object'ler hareketlerden farklıdır: imleç nerede olursa olsun NESNENİN tamamını kapsar. iw = kelimenin içi (inner), aw = kelime + boşluğu (around). dw imleçten itibaren siler; diw kelimenin tamamını siler.",
          keys: ["daw"],
          files: [f("kelime.txt", ["bu gereksiz kelime"])],
          cursor: { line: 0, col: 7 },
          goal: { type: "text", target: ["bu kelime"] },
          par: 3,
          hint: "daw — imleci taşımana gerek yok!",
        },
        {
          task: "«mavi» kelimesini «yeşil» yap: ciw ile.",
          keys: ["ciw"],
          files: [f("renk.txt", ["renk: mavi tonu"])],
          cursor: { line: 0, col: 8 },
          goal: { type: "text", target: ["renk: yeşil tonu"] },
          par: 9,
          hint: "ciw → yeşil → Esc",
        },
      ],
    },
    {
      id: "to-quote",
      title: 'i" : Tırnakların İçi',
      summary: "String düzenlemenin süper gücü",
      xp: 70,
      stages: [
        {
          task: "Tırnak içindeki metni «yeni» yap. İmleç tırnaklardan ÖNCE olsa bile ci\" çalışır!",
          explain: 'i" tırnak içini, a" tırnaklarla birlikte seçer. Vim satırdaki ilk tırnak çiftini kendisi bulur.',
          keys: ['ci"'],
          files: [f("mesaj.ts", ['mesaj = "eski metin"'])],
          goal: { type: "text", target: ['mesaj = "yeni"'] },
          par: 8,
          hint: 'ci" → yeni → Esc',
        },
        {
          task: "Tırnakların içini tamamen boşalt: di\".",
          keys: ['di"'],
          files: [f("hata.ts", ['hata("kaldır beni")'])],
          goal: { type: "text", target: ['hata("")'] },
          par: 3,
          hint: 'di"',
        },
      ],
    },
    {
      id: "to-paren",
      title: "i( ve a(: Parantez Operasyonları",
      summary: "Fonksiyon argümanlarında cerrahi müdahale",
      xp: 70,
      stages: [
        {
          task: "Argümanları «10» ile değiştir: ci( parantez içini temizler.",
          keys: ["ci("],
          files: [f("cagri.ts", ["topla(3, 5)"])],
          cursor: { line: 0, col: 7 },
          goal: { type: "text", target: ["topla(10)"] },
          par: 6,
          hint: "ci( → 10 → Esc",
        },
        {
          task: "İç içe parantezlerde İÇTEKİNİ boşalt: imleç x üzerinde, di( en yakın çifti bulur.",
          keys: ["di("],
          files: [f("icice.ts", ["f(g(x))"])],
          cursor: { line: 0, col: 4 },
          goal: { type: "text", target: ["f(g())"] },
          par: 3,
          hint: "di(",
        },
      ],
    },
    {
      id: "to-block",
      title: "i{ ve ip: Blok & Paragraf",
      summary: "Çok satırlı kapsamlar",
      xp: 70,
      stages: [
        {
          task: "Süslü parantez bloğunun içini tamamen sil: di{.",
          keys: ["di{"],
          files: [f("blok.ts", ["if (koşul) {", "  eskiKod();", "}"])],
          cursor: { line: 1, col: 2 },
          goal: { type: "text", target: ["if (koşul) {", "}"] },
          par: 3,
          hint: "di{",
        },
        {
          task: "İlk paragrafı komple sil: dip.",
          keys: ["dip"],
          files: [f("yazi.txt", ["ilk paragraf", "devamı", "", "ikinci paragraf"])],
          goal: { type: "text", target: ["", "ikinci paragraf"] },
          par: 3,
          hint: "dip",
        },
      ],
    },
    {
      id: "to-tag",
      title: "it: HTML Etiket İçi",
      summary: "Web geliştiricinin dostu",
      xp: 70,
      stages: [
        {
          task: "Başlığı «Yeni» yap: cit etiket içini değiştirir.",
          keys: ["cit"],
          files: [f("sayfa.html", ["<h1>Eski Başlık</h1>"])],
          cursor: { line: 0, col: 6 },
          goal: { type: "text", target: ["<h1>Yeni</h1>"] },
          par: 8,
          hint: "cit → Yeni → Esc",
        },
      ],
    },
    {
      id: "to-boss",
      title: "Nesne Cerrahı",
      summary: "Parantez + tırnak operasyonu",
      xp: 90,
      drill: true,
      stages: [
        {
          task: "İki düzeltme: parantez içi «yeni», tırnak içi «doğru» olsun.",
          keys: ["ci(", 'ci"'],
          files: [f("ameliyat.txt", ["kutu(eski içerik)", 'mesaj "yanlış" idi'])],
          goal: { type: "text", target: ["kutu(yeni)", 'mesaj "doğru" idi'] },
          par: 20,
          hint: 'f( → ci( yeni Esc → j → ci" doğru Esc',
        },
      ],
    },
  ],
};

export const yankModule: Module = {
  id: "yank-put",
  title: "Yank & Put",
  subtitle: "y p P J — kopyala, yapıştır, birleştir",
  icon: "📋",
  lessons: [
    {
      id: "yp-yy",
      title: "yy ve p: Satırı Çoğalt",
      summary: "Vim'in kopyala-yapıştırı",
      xp: 60,
      stages: [
        {
          task: "İlk satırı kopyala (yy) ve ayracın ALTINA yapıştır (j ile in, p).",
          explain:
            "y (yank) kopyalama operatörüdür: yy satırı kopyalar. p (put) imlecin altına/arkasına, P üstüne/önüne yapıştırır. Silinen her şey de (dd, dw…) aynı panoya gider — dd+p = taşı!",
          keys: ["yy", "p"],
          files: [f("coğalt.txt", ["önemli satır", "--- ayraç ---"])],
          goal: { type: "text", target: ["önemli satır", "--- ayraç ---", "önemli satır"] },
          par: 4,
          hint: "yy → j → p",
        },
      ],
    },
    {
      id: "yp-ye",
      title: "ye: Kelime Kopyala",
      summary: "Karakter bazlı yank ve yapıştırma",
      xp: 60,
      stages: [
        {
          task: "«kopyala» kelimesini ye ile kopyala, alt satıra p ile yapıştır.",
          explain: "y de bir operatör: ye = kelime sonuna kadar kopyala. Karakter bazlı kopyalanan metin p ile imlecin arkasına eklenir.",
          keys: ["ye"],
          files: [f("kelime.txt", ["kopyala beni", ""])],
          goal: { type: "text", target: ["kopyala beni", "kopyala"] },
          par: 4,
          hint: "ye → j → p",
        },
      ],
    },
    {
      id: "yp-PJ",
      title: "P ve J: Üste Yapıştır & Birleştir",
      summary: "Yönü sen seç, satırları kaynaştır",
      xp: 60,
      stages: [
        {
          task: "İmza satırını kopyalayıp P ile ÜSTE yapıştır (iki kopya olsun).",
          keys: ["P"],
          files: [f("imza.txt", ["imza satırı"])],
          goal: { type: "text", target: ["imza satırı", "imza satırı"] },
          par: 3,
          hint: "yy → P",
        },
        {
          task: "İki satırı tek satırda birleştir: J araya akıllıca boşluk koyar.",
          keys: ["J"],
          files: [f("birlestir.txt", ["merhaba", "dünya"])],
          goal: { type: "text", target: ["merhaba dünya"] },
          par: 1,
          hint: "J",
        },
      ],
    },
    {
      id: "yp-boss",
      title: "Satır Tetris'i",
      summary: "dd + p ile satırları yeniden sırala",
      xp: 90,
      drill: true,
      stages: [
        {
          task: "Satırları «bir, iki, üç» sırasına sok. İpucu: dd kestiğini panoda tutar!",
          keys: ["dd", "p", "G"],
          files: [f("siral.txt", ["üç", "bir", "iki"])],
          goal: { type: "text", target: ["bir", "iki", "üç"] },
          par: 4,
          hint: "dd → G → p",
        },
      ],
    },
  ],
};
