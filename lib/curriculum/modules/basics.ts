import type { Module } from "../types";

const f = (name: string, lines: string[]) => ({ name, lines });

export const survivalModule: Module = {
  id: "hayatta-kalma",
  title: "Hayatta Kalma",
  subtitle: "Modlar, ilk düzenleme, kaydet & çık",
  icon: "🏕️",
  lessons: [
    {
      id: "hk-modlar",
      title: "İki Dünya: Modlar",
      summary: "Normal ve Insert modlarını, i / A / x / Esc tuşlarını öğren",
      xp: 50,
      stages: [
        {
          task: "İmleci hedeflere götür: önce satır sonundaki noktaya (l ile sağa), sonra alttakine (j ile aşağı).",
          explain:
            "Vim'de ok tuşlarına elveda! Sağ elin zaten h j k l üzerinde duruyor: h ← sol, j ↓ aşağı, k ↑ yukarı, l → sağ. Normal modda her tuş bir komuttur — yazı yazmaz, iş yapar.",
          keys: ["h", "j", "k", "l"],
          files: [f("harita.txt", ["başla · · hedef", "· · · · ·", "hedef · · ·"])],
          goal: { type: "collect", targets: [{ line: 0, col: 10 }, { line: 2, col: 0 }] },
          par: 22,
          hint: "10 kez l ile sağa git, sonra 2 kez j ve 10 kez h ile sol alta in.",
        },
        {
          task: "Insert moduna gir (i), 'merhaba vim' yaz ve Esc ile Normal moda dön.",
          explain:
            "i tuşu Insert moduna geçirir: artık yazdığın her şey metne eklenir. İşin bitince MUTLAKA Esc ile Normal moda dön. Vim'ciler zamanlarının çoğunu Normal modda geçirir.",
          keys: ["i", "<Esc>"],
          files: [f("ilk.txt", [""])],
          goal: { type: "text", target: ["merhaba vim"] },
          par: 13,
          hint: "i ile moda gir, «merhaba vim» yaz, Esc'e bas.",
        },
        {
          task: "Fazla olan ilk 'v' harfini x ile sil.",
          explain: "Normal modda x, imlecin altındaki karakteri siler. Insert moduna girmeye gerek yok!",
          keys: ["x"],
          files: [f("yazim.txt", ["vvim harika"])],
          goal: { type: "text", target: ["vim harika"] },
          par: 1,
          hint: "İmleç zaten ilk v'nin üzerinde: sadece x'e bas.",
        },
        {
          task: "Satırın SONUNA ünlem ekle: A ile satır sonunda Insert moduna geç.",
          explain: "A (büyük a), imleç nerede olursa olsun satırın sonuna atlar ve Insert moduna girer. 'Append' = sona ekle.",
          keys: ["A"],
          files: [f("cumle.txt", ["vim öğrenmek kolay"])],
          goal: { type: "text", target: ["vim öğrenmek kolay!"] },
          par: 3,
          hint: "A, sonra ! yaz, sonra Esc.",
        },
      ],
    },
    {
      id: "hk-kaydet-cik",
      title: "Kaydet ve Çık",
      summary: ":w, :q, :q! ve :wq — Vim'den sağ salim çıkmak",
      xp: 50,
      stages: [
        {
          task: "Satırın sonuna bir ünlem ekle (A ! Esc), sonra :w ile dosyayı kaydet.",
          explain:
            ": tuşu Komut moduna geçirir — ekranın altında komut satırı açılır. :w (write) dosyayı kaydeder. Enter ile çalıştırılır.",
          keys: [":w"],
          files: [f("notlar.txt", ["bu notu kaydet"])],
          goal: { type: "save", files: [{ name: "notlar.txt", target: ["bu notu kaydet!"] }] },
          par: 7,
          hint: "A ! Esc yazdıktan sonra :w yazıp Enter'a bas.",
        },
        {
          task: "Hiçbir şeyi değiştirmeden :q ile çık.",
          explain: ":q (quit) Vim'den çıkar — ama kaydedilmemiş değişiklik varsa seni korur ve çıkmaz.",
          keys: [":q"],
          files: [f("oku.txt", ["sadece okuma yaptık"])],
          goal: {
            type: "custom",
            description: ":q ile çıkış yap",
            check: (s) => s.quitRequested,
          },
          par: 3,
          hint: ":q yazıp Enter'a bas.",
        },
        {
          task: "Önce satırı boz (x ile bir karakter sil), sonra :q dene — çıkamazsın! :q! ile değişiklikleri ATARAK çık.",
          explain:
            "Değişiklik varken :q seni uyarır. :q! ise «kaydetme, çık gitsin» demektir. Ünlem = zorla.",
          keys: [":q!"],
          files: [f("taslak.txt", ["bozulacak taslak"])],
          goal: {
            type: "custom",
            description: ":q! ile değişiklikleri atarak çık",
            check: (s) => s.quitRequested,
          },
          par: 9,
          hint: "x, sonra :q (hata verir), sonra :q! Enter.",
        },
        {
          task: "Satır sonuna nokta ekle, sonra :wq ile hem kaydet hem çık.",
          explain: ":wq = kaydet ve çık. Alternatifleri: :x ya da Normal modda ZZ.",
          keys: [":wq", "ZZ"],
          files: [f("bitir.txt", ["işi bitir"])],
          goal: {
            type: "custom",
            description: "Kaydedip çık (dosya 'işi bitir.' olmalı)",
            check: (s) => s.quitRequested && s.buffers["bitir.txt"].savedLines.join("\n") === "işi bitir.",
          },
          par: 7,
          hint: "A . Esc sonra :wq Enter (veya ZZ).",
        },
      ],
    },
    {
      id: "hk-boss",
      title: "İlk Görev: Yazım Hatası",
      summary: "Öğrendiklerinle gerçek bir düzeltme yap",
      xp: 75,
      drill: true,
      stages: [
        {
          task: "«Vmi» kelimesini «Vim» yap (yanlış harfi silip doğrusunu ekle) ve dosyayı kaydet.",
          keys: ["x", "i", ":w"],
          files: [f("gorev.txt", ["Ben Vmi öğreniyorum"])],
          goal: { type: "save", files: [{ name: "gorev.txt", target: ["Ben Vim öğreniyorum"] }] },
          par: 14,
          hint: "6 kez l ile 'i'ye git, x ile sil, h ile 'm'ye dön, i ile moda girip i yaz, Esc, :w Enter.",
        },
      ],
    },
  ],
};

export const motionModule: Module = {
  id: "temel-hareket",
  title: "Temel Hareket",
  subtitle: "hjkl kası, sayaçlar, 0 ^ $",
  icon: "🧭",
  lessons: [
    {
      id: "th-hjkl",
      title: "hjkl Kası",
      summary: "Dört yönde akıcı hareket",
      xp: 50,
      stages: [
        {
          task: "Tüm hedefleri sırayla topla. Ok tuşları kapalı!",
          explain: "Parmakların ana sıradan hiç ayrılmasın: j aşağı (altta çengel var: ↓), k yukarı, h sol, l sağ.",
          keys: ["h", "j", "k", "l"],
          files: [
            f("saha.txt", [
              "·   ·   ·",
              "         ",
              "·   ✖   ·",
              "         ",
              "·   ·   ·",
            ]),
          ],
          cursor: { line: 2, col: 4 },
          goal: {
            type: "collect",
            targets: [
              { line: 2, col: 8 },
              { line: 0, col: 8 },
              { line: 0, col: 0 },
              { line: 4, col: 0 },
              { line: 4, col: 8 },
            ],
          },
          par: 26,
          hint: "Sağa 4, yukarı 2, sola 8, aşağı 4, sağa 8.",
        },
      ],
    },
    {
      id: "th-sayac",
      title: "Sayaçlar: 5j Gücü",
      summary: "Komutların önüne sayı koy: 4l, 2k, 8h…",
      xp: 50,
      stages: [
        {
          task: "Aynı parkuru bu kez SAYAÇLARLA geç: 4l gibi. Par çok düşük — tek tek basarsan yetişemezsin!",
          explain:
            "Neredeyse her Vim komutu sayı kabul eder: 5j = 5 satır aşağı, 3l = 3 sağ. Bu, Vim dilbilgisinin ilk kuralı: [sayı] + [hareket].",
          keys: ["4l", "2k"],
          files: [
            f("saha2.txt", [
              "·   ·   ·",
              "         ",
              "·   ✖   ·",
              "         ",
              "·   ·   ·",
            ]),
          ],
          cursor: { line: 2, col: 4 },
          goal: {
            type: "collect",
            targets: [
              { line: 2, col: 8 },
              { line: 0, col: 8 },
              { line: 0, col: 0 },
              { line: 4, col: 0 },
              { line: 4, col: 8 },
            ],
          },
          par: 10,
          hint: "4l → 2k → 8h → 4j → 8l (her biri 2 tuş).",
        },
      ],
    },
    {
      id: "th-satir",
      title: "Satır İçi Işınlanma: 0 ^ $",
      summary: "Satır başı, ilk karakter ve satır sonu",
      xp: 50,
      stages: [
        {
          task: "Hedefleri topla: satır sonları ($), girintili ilk karakter (^) ve satır başı (0).",
          explain:
            "0 → satırın en başı (sütun 0). ^ → satırdaki ilk boşluk olmayan karakter. $ → satırın sonu. Üçü de tek tuşla ışınlar.",
          keys: ["0", "^", "$"],
          files: [
            f("uclar.txt", [
              "başlangıç ······ son",
              "   girintili satır",
              "sondan başa dön",
            ]),
          ],
          goal: {
            type: "collect",
            targets: [
              { line: 0, col: 19 },
              { line: 1, col: 3 },
              { line: 2, col: 14 },
              { line: 2, col: 0 },
            ],
          },
          par: 6,
          hint: "$ → j ^ → j $ → 0",
        },
      ],
    },
    {
      id: "th-boss",
      title: "Hareket Golfü",
      summary: "Par'ı tutturmak için en verimli yolu seç",
      xp: 75,
      drill: true,
      stages: [
        {
          task: "4 hedefi 6 tuşla topla. İpucu: $ ile satır sonuna gittikten sonra j/k satır sonlarını takip eder!",
          keys: ["7j", "$", "0"],
          files: [
            f("golf.txt", [
              "satır bir uzun",
              "iki",
              "üç",
              "dört",
              "beş",
              "altı",
              "yedi",
              "son satır burada",
            ]),
          ],
          goal: {
            type: "collect",
            targets: [
              { line: 7, col: 0 },
              { line: 7, col: 15 },
              { line: 0, col: 13 },
              { line: 0, col: 0 },
            ],
          },
          par: 6,
          hint: "7j → $ → 7k → 0",
        },
      ],
    },
  ],
};

export const wordModule: Module = {
  id: "kelime-hareketleri",
  title: "Kelime Hareketleri",
  subtitle: "w b e ile kelime kelime uç",
  icon: "🐇",
  lessons: [
    {
      id: "kh-w",
      title: "w: Sonraki Kelime",
      summary: "Kelime başlarına zıplayarak ilerle",
      xp: 50,
      stages: [
        {
          task: "Her kelimenin başına uğrayarak hedefleri topla.",
          explain:
            "w (word) imleci bir sonraki kelimenin BAŞINA taşır. hjkl'den kat kat hızlı: metin içinde asıl mesafeyi kelimelerle alırsın.",
          keys: ["w"],
          files: [f("kelimeler.txt", ["vim ile hızlı metin düzenleme sanatı"])],
          goal: {
            type: "collect",
            targets: [
              { line: 0, col: 4 },
              { line: 0, col: 8 },
              { line: 0, col: 14 },
              { line: 0, col: 20 },
              { line: 0, col: 30 },
            ],
          },
          par: 5,
          hint: "5 kez w.",
        },
      ],
    },
    {
      id: "kh-be",
      title: "e ve b: Kelime Sonu & Geri",
      summary: "e sona, b başa (geriye) atlar",
      xp: 50,
      stages: [
        {
          task: "Önce e ile üç kelimenin sonuna, sonra b ile iki kelime geriye.",
          explain: "e (end) kelimenin SONUNA, b (back) bir önceki kelimenin BAŞINA gider. w-b-e üçlüsü kelime navigasyonunun kalbi.",
          keys: ["e", "b"],
          files: [f("kelimeler2.txt", ["vim ile hızlı metin düzenleme sanatı"])],
          goal: {
            type: "collect",
            targets: [
              { line: 0, col: 2 },
              { line: 0, col: 6 },
              { line: 0, col: 12 },
              { line: 0, col: 8 },
              { line: 0, col: 4 },
            ],
          },
          par: 5,
          hint: "e e e b b",
        },
      ],
    },
    {
      id: "kh-buyuk",
      title: "W B E: Noktalama Delen",
      summary: "BÜYÜK harfli kardeşler boşluğa kadar durmaz",
      xp: 50,
      stages: [
        {
          task: "W ile boşlukla ayrılmış «büyük kelimelerin» başlarına atla, E ile sonuncunun sonuna git.",
          explain:
            "Küçük w noktalama işaretlerinde durur: foo.bar üç kelimedir (foo, ., bar). BÜYÜK W ise yalnızca boşlukta durur — foo.bar tek WORD'dür.",
          keys: ["W", "B", "E"],
          files: [f("kod.txt", ["foo.bar(baz) qux-quux array[0] end"])],
          goal: {
            type: "collect",
            targets: [
              { line: 0, col: 13 },
              { line: 0, col: 22 },
              { line: 0, col: 31 },
              { line: 0, col: 33 },
            ],
          },
          par: 4,
          hint: "W W W E",
        },
      ],
    },
    {
      id: "kh-boss",
      title: "Kelime Golfü",
      summary: "Sayaç + kelime hareketi kombinasyonları",
      xp: 75,
      drill: true,
      stages: [
        {
          task: "Hedefleri 6 tuşla topla. Sayaçları hatırla: 3w tek hamlede üç kelime atlar.",
          keys: ["3w", "b"],
          files: [
            f("golf2.txt", [
              "bir iki üç dört beş",
              "altı yedi sekiz dokuz on",
            ]),
          ],
          goal: {
            type: "collect",
            targets: [
              { line: 0, col: 11 },
              { line: 1, col: 10 },
              { line: 1, col: 22 },
            ],
          },
          par: 6,
          hint: "3w → j b → 2w",
        },
      ],
    },
  ],
};

export const findCharModule: Module = {
  id: "satir-ici-nisancilik",
  title: "Satır İçi Nişancılık",
  subtitle: "f t ; , ile karaktere ışınlan",
  icon: "🎯",
  lessons: [
    {
      id: "ft-f",
      title: "f: Karakteri Bul",
      summary: "f{karakter} satırda ileri arar, ; tekrarlar",
      xp: 50,
      stages: [
        {
          task: "Her 'k' harfine uğra. fk ile ilkine, ; ile sonrakilere.",
          explain:
            "f{x} (find) imleci satırdaki bir sonraki {x} karakterinin ÜZERİNE taşır. ; aynı aramayı tekrarlar, , ters yönde tekrarlar. Satır içinde en hızlı ulaşım.",
          keys: ["f", ";"],
          files: [f("meyve.txt", ["kavun karpuz kiraz kayısı"])],
          goal: {
            type: "collect",
            targets: [
              { line: 0, col: 6 },
              { line: 0, col: 13 },
              { line: 0, col: 19 },
            ],
          },
          par: 4,
          hint: "fk ; ;",
        },
      ],
    },
    {
      id: "ft-t",
      title: "t: Karakterin Önünde Dur",
      summary: "t hedefin bir öncesine gider — operatörlerle altın değerinde",
      xp: 50,
      stages: [
        {
          task: "Her ':' karakterinin hemen ÖNÜNDEKİ konuma uğra: t: ile başla, ; ile devam et.",
          explain: "t{x} (till) imleci {x}'in bir SOLUNA getirir. İleride dt: gibi kombinasyonlarda parlar: «:'a kadar sil».",
          keys: ["t", ";"],
          files: [f("etiket.txt", ["ay: yıldız: güneş: son"])],
          goal: {
            type: "collect",
            targets: [
              { line: 0, col: 1 },
              { line: 0, col: 9 },
              { line: 0, col: 16 },
            ],
          },
          par: 4,
          hint: "t: ; ;",
        },
      ],
    },
    {
      id: "ft-geri",
      title: "F ve , : Geriye Nişan",
      summary: "F geriye arar, , yönü tersine çevirir",
      xp: 50,
      stages: [
        {
          task: "Satırın sonundasın. F ile geriye giderek her 'elma'nın başındaki e'lere uğra.",
          explain: "F{x} aynı işi geriye doğru yapar. ; son aramayı aynı yönde, , ters yönde tekrarlar.",
          keys: ["F", ";"],
          files: [f("geri.txt", ["elma armut elma kiraz elma"])],
          cursor: { line: 0, col: 25 },
          goal: {
            type: "collect",
            targets: [
              { line: 0, col: 22 },
              { line: 0, col: 11 },
              { line: 0, col: 0 },
            ],
          },
          par: 4,
          hint: "Fe ; ;",
        },
      ],
    },
    {
      id: "ft-boss",
      title: "Keskin Nişancı Golfü",
      summary: "Sayaçlı f/F: 4f- gibi",
      xp: 75,
      drill: true,
      stages: [
        {
          task: "Hedefleri 9 tuşla topla. Sayaç + f: 4f- dördüncü tireye ışınlar.",
          keys: ["4f-", "2F-"],
          files: [f("tire.txt", ["a-b-c-d-e-f-g"])],
          goal: {
            type: "collect",
            targets: [
              { line: 0, col: 7 },
              { line: 0, col: 11 },
              { line: 0, col: 3 },
            ],
          },
          par: 9,
          hint: "4f- → 2f- → 4F-",
        },
      ],
    },
  ],
};

export const verticalModule: Module = {
  id: "dikey-hareket",
  title: "Dikey Hareket",
  subtitle: "gg G {n}G { } % — dosyada ışınlanma",
  icon: "🛗",
  lessons: [
    {
      id: "dk-ggG",
      title: "gg ve G: Baştan Sona",
      summary: "Dosyanın başına ve sonuna tek hamle",
      xp: 50,
      stages: [
        {
          task: "Önce G ile son satıra, sonra gg ile ilk satıra ışınlan.",
          explain: "G dosyanın son satırına, gg ilk satırına gider. Sayıyla: 8G → 8. satır. Vim'de satır numarası = adres.",
          keys: ["gg", "G"],
          files: [
            f("uzun.txt", Array.from({ length: 15 }, (_, i) => `satır ${i + 1}`)),
          ],
          cursor: { line: 7, col: 0 },
          goal: {
            type: "collect",
            targets: [
              { line: 14, col: 0 },
              { line: 0, col: 0 },
            ],
          },
          par: 3,
          hint: "G sonra gg",
        },
        {
          task: "Numaralı ışınlanma: 8. satıra, sonra 3. satıra, sonra 12. satıra git.",
          keys: ["8G"],
          files: [
            f("adres.txt", Array.from({ length: 15 }, (_, i) => `satır ${i + 1}`)),
          ],
          goal: {
            type: "collect",
            targets: [
              { line: 7, col: 0 },
              { line: 2, col: 0 },
              { line: 11, col: 0 },
            ],
          },
          par: 7,
          hint: "8G → 3G → 12G",
        },
      ],
    },
    {
      id: "dk-paragraf",
      title: "{ ve }: Paragraf Zıplama",
      summary: "Boş satırdan boş satıra sıçra",
      xp: 50,
      stages: [
        {
          task: "} ile paragraf aralarındaki boşluklara, son olarak dosya sonuna atla.",
          explain: "} bir sonraki boş satıra, { bir öncekine zıplar. Kod blokları ve paragraflar arasında hızlı gezinme.",
          keys: ["{", "}"],
          files: [
            f("makale.txt", [
              "birinci paragraf",
              "devam ediyor",
              "",
              "ikinci paragraf",
              "o da sürüyor",
              "",
              "üçüncü ve",
              "paragraf üç son",
            ]),
          ],
          goal: {
            type: "collect",
            targets: [
              { line: 2, col: 0 },
              { line: 5, col: 0 },
              { line: 7, col: 14 },
            ],
          },
          par: 3,
          hint: "} } }",
        },
      ],
    },
    {
      id: "dk-yuzde",
      title: "%: Parantez Eşi",
      summary: "Açılan neyse kapananına atla",
      xp: 50,
      stages: [
        {
          task: "% ile parantez ve süslü parantez eşleri arasında zıpla, hedefleri topla.",
          explain: "% imleç bir parantezin üstündeyken (ya da satırda ilkine bakarken) eşine ışınlar. Kod okumada vazgeçilmez.",
          keys: ["%"],
          files: [
            f("kod2.txt", [
              "function hesapla(x) {",
              "  if (x > 10) {",
              "    return (x * 2);",
              "  }",
              "}",
            ]),
          ],
          goal: {
            type: "collect",
            targets: [
              { line: 0, col: 18 },
              { line: 1, col: 14 },
              { line: 3, col: 2 },
              { line: 4, col: 0 },
            ],
          },
          par: 4,
          hint: "% (kapanan pareni bulur) → j ({ üstüne düşer) → % → j",
        },
      ],
    },
    {
      id: "dk-boss",
      title: "Dikey Golf",
      summary: "gg G {n}G } kombinasyonu",
      xp: 75,
      drill: true,
      stages: [
        {
          task: "Hedefleri 8 tuşla topla: satır adresleri ve paragraf zıplamalarını karıştır.",
          keys: ["G", "gg", "{n}G", "}"],
          files: [
            f("golf3.txt", [
              "bölüm bir",
              "içerik",
              "",
              "bölüm iki",
              "içerik devam",
              "daha fazla içerik",
              "",
              "bölüm üç",
              "son içerik",
              "kapanış satırı",
            ]),
          ],
          goal: {
            type: "collect",
            targets: [
              { line: 9, col: 0 },
              { line: 2, col: 0 },
              { line: 6, col: 0 },
              { line: 0, col: 0 },
            ],
          },
          par: 8,
          hint: "G → 3G → } → gg (6 tuş).",
        },
      ],
    },
  ],
};
