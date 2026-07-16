import type { Module } from "../types";

const f = (name: string, lines: string[]) => ({ name, lines });

export const marksModule: Module = {
  id: "marks-jumps",
  title: "Marks & Jumps",
  subtitle: "m ` '' Ctrl-o — konum hafızası",
  icon: "📍",
  lessons: [
    {
      id: "mk-ma",
      title: "ma ve `a: Yer İmi",
      summary: "Konumu kaydet, tek hamlede dön",
      xp: 70,
      stages: [
        {
          task: "Bulunduğun yeri ma ile işaretle, G ile dosya sonuna in, `a ile TAM konumuna geri dön.",
          explain:
            "m{harf} görünmez bir yer imi koyar. `{harf} tam o konuma (satır + sütun), '{harf} satırının başına döner. Uzun dosyada «şuraya bakıp geleyim» probleminin çözümü.",
          keys: ["m", "`"],
          files: [
            f("kazi.txt", [
              "kazı alanı girişi",
              "toprak katmanı bir",
              "dur: hazine noktası",
              ...Array.from({ length: 16 }, (_, i) => `katman ${i + 3} kayıt`),
              "en dip nokta",
            ]),
          ],
          cursor: { line: 2, col: 5 },
          goal: {
            type: "collect",
            targets: [
              { line: 19, col: 0 },
              { line: 2, col: 5 },
            ],
          },
          par: 5,
          hint: "ma → G → `a",
        },
      ],
    },
    {
      id: "mk-lastjump",
      title: "'' : Son Sıçrama Noktası",
      summary: "Zıpladın mı? '' seni geri getirir",
      xp: 70,
      stages: [
        {
          task: "G ile sona atla, sonra '' (iki tek tırnak) ile atlamadan ÖNCEKİ satıra dön.",
          explain:
            "Her büyük sıçrayışta (G, gg, arama…) Vim eski konumu otomatik kaydeder. '' bir önceki konuma döner — mark koymayı unutmuşsan bile.",
          keys: ["''"],
          files: [
            f("gezi.txt", [
              "rota başlangıcı",
              "ilk durak çeşme",
              "ikinci durak köprü",
              "üçüncü durak han",
              "mola yeri burası",
              "yol devam ediyor",
              ...Array.from({ length: 8 }, (_, i) => `kilometre ${i + 7}`),
              "varış noktası",
            ]),
          ],
          cursor: { line: 4, col: 3 },
          goal: {
            type: "collect",
            targets: [
              { line: 14, col: 0 },
              { line: 4, col: 0 },
            ],
          },
          par: 3,
          hint: "G → ''",
        },
      ],
    },
    {
      id: "mk-jumplist",
      title: "Ctrl-o: Sıçrama Geçmişi",
      summary: "Tarayıcının geri tuşu gibi",
      xp: 70,
      stages: [
        {
          task: "G ile sona, gg ile başa atla; sonra iki kez Ctrl-o ile geçmişte geriye yürü (başlangıç satırına kadar).",
          explain:
            "Vim tüm sıçramaları jumplist'te tutar. Ctrl-o geriye, Ctrl-i (Tab) ileriye gider. Kod tabanında dolaşırken «nereden gelmiştim?» derdine son.",
          keys: ["<C-o>", "<C-i>"],
          files: [
            f("tarih.txt", [
              "kayıt sıfır",
              ...Array.from({ length: 9 }, (_, i) => `kayıt ${i + 1}`),
              "buradan başladın",
              ...Array.from({ length: 8 }, (_, i) => `kayıt ${i + 11}`),
              "son kayıt",
            ]),
          ],
          cursor: { line: 10, col: 0 },
          goal: {
            type: "collect",
            targets: [
              { line: 19, col: 0 },
              { line: 0, col: 0 },
              { line: 10, col: 0 },
            ],
          },
          par: 5,
          hint: "G → gg → Ctrl-o → Ctrl-o",
        },
      ],
    },
    {
      id: "mk-boss",
      title: "Mark ile Toplu Silme",
      summary: "d'a: mark'a kadar sil",
      xp: 90,
      drill: true,
      stages: [
        {
          task: "«çöp» satırlarının ilkini ma ile işaretle, sonuncusuna in, d'a ile mark'tan buraya kadar sil.",
          keys: ["m", "d'"],
          files: [
            f("depo.txt", ["bölüm bir içerik", "çöp başlangıç", "çöp orta", "çöp son", "bölüm iki"]),
          ],
          cursor: { line: 1, col: 0 },
          goal: { type: "text", target: ["bölüm bir içerik", "bölüm iki"] },
          par: 7,
          hint: "ma → 2j → d'a",
        },
      ],
    },
  ],
};

export const macroModule: Module = {
  id: "makrolar",
  title: "Makrolar",
  subtitle: "q @ — kendini tekrarlayan işi robota ver",
  icon: "🤖",
  lessons: [
    {
      id: "mc-temel",
      title: "qa … q ve @a",
      summary: "Kaydet, oynat, arkana yaslan",
      xp: 80,
      stages: [
        {
          task: "İlk satıra «- » ekleyip alt satıra inen bir makro kaydet (qa … q), sonra 3@a ile kalanına uygula.",
          explain:
            "q{harf} tuş kaydını başlatır, q durdurur; @{harf} kaydı oynatır, @@ son oynatılanı tekrarlar. Nokta tek değişiklik tekrarıydı; makro İSTEDİĞİN UZUNLUKTA bir kombinasyonu tekrarlar. Kural: makroyu «bir birim işle + sonraki birime geç» şeklinde bitir ki sayaçla çalışsın.",
          keys: ["q", "@"],
          files: [f("liste.txt", ["elma", "armut", "kiraz", "muz"])],
          goal: { type: "text", target: ["- elma", "- armut", "- kiraz", "- muz"] },
          par: 11,
          hint: "qa → I- ␣ Esc → j → q → 3@a",
        },
      ],
    },
    {
      id: "mc-sayac",
      title: "Sayaçlı Makro: 5@a",
      summary: "Bir kayıt, istediğin kadar tekrar",
      xp: 80,
      stages: [
        {
          task: "Satır sonuna «!» ekleyen makro kaydet ve 5@a ile tüm satırları bitir.",
          keys: ["5@a"],
          files: [f("unlem.txt", ["madde 1", "madde 2", "madde 3", "madde 4", "madde 5", "madde 6"])],
          goal: {
            type: "text",
            target: ["madde 1!", "madde 2!", "madde 3!", "madde 4!", "madde 5!", "madde 6!"],
          },
          par: 10,
          hint: "qa → A! Esc → j → q → 5@a",
        },
      ],
    },
    {
      id: "mc-sarmal",
      title: "Sarmalayıcı Makro",
      summary: "I ve A'yı aynı kayıtta kullan",
      xp: 80,
      stages: [
        {
          task: "Her satırı çift tırnak içine alan makro yaz ve uygula.",
          keys: ["q", "@@"],
          files: [f("veri.txt", ["ham veri", "işlenmiş veri", "son veri"])],
          goal: { type: "text", target: ['"ham veri"', '"işlenmiş veri"', '"son veri"'] },
          par: 14,
          hint: 'qa → I" Esc → A" Esc → j → q → @a → @@',
        },
      ],
    },
    {
      id: "mc-boss",
      title: "Sayı Fabrikası",
      summary: "Makro + Ctrl-a: otomatik artan liste",
      xp: 100,
      drill: true,
      stages: [
        {
          task: "Tek satırdan artan numaralı 4 satır üret: satırı kopyala-yapıştır-artır makrosu kaydet (yy p Ctrl-a), 2@a ile tamamla.",
          keys: ["<C-a>", "q", "@"],
          files: [f("uret.txt", ["sayı 1"])],
          goal: { type: "text", target: ["sayı 1", "sayı 2", "sayı 3", "sayı 4"] },
          par: 10,
          hint: "qa → yy → p → Ctrl-a → q → 2@a",
        },
      ],
    },
  ],
};

export const multiFileModule: Module = {
  id: "coklu-dosya",
  title: "Çoklu Dosya",
  subtitle: ":e :b :bn gf — buffer'lar arasında uç",
  icon: "🗂️",
  lessons: [
    {
      id: "cd-e",
      title: ":e — Dosya Aç",
      summary: "Yeni buffer oluştur ve kaydet",
      xp: 80,
      stages: [
        {
          task: ":e yeni.txt ile yeni bir dosya aç, içine «merhaba» yaz ve :w ile kaydet.",
          explain:
            "Vim'de açık her dosya bir BUFFER'dır. :e {ad} dosyayı açar (yoksa oluşturur). Görünmese de eski buffer arka planda yaşamaya devam eder.",
          keys: [":e"],
          files: [f("notlar.txt", ["alışveriş: süt, yumurta"])],
          goal: { type: "save", files: [{ name: "yeni.txt", target: ["merhaba"] }] },
          par: 24,
          hint: ":e yeni.txt Enter → i merhaba Esc → :w Enter",
        },
      ],
    },
    {
      id: "cd-bn",
      title: ":bn ve :b — Buffer Gezgini",
      summary: "Açık dosyalar arasında geçiş",
      xp: 80,
      stages: [
        {
          task: "Üç dosya açık (:ls ile görebilirsin). :bn ile sıradaki buffer'a geç.",
          explain: ":ls açık buffer'ları listeler. :bn sonraki, :bp önceki buffer'a geçer. :b {isim} kısmi isimle atlar: :b ucu yeterli.",
          keys: [":bn", ":ls"],
          files: [f("birinci.md", ["dosya 1"]), f("ikinci.md", ["dosya 2"]), f("ucuncu.md", ["dosya 3"])],
          goal: { type: "cursor", target: { line: 0, col: 0 }, file: "ikinci.md" },
          par: 4,
          hint: ":bn Enter",
        },
        {
          task: "Şimdi İSİMLE atla: :b ucu yazarak ucuncu.md'ye geç.",
          keys: [":b"],
          files: [f("birinci.md", ["dosya 1"]), f("ikinci.md", ["dosya 2"]), f("ucuncu.md", ["dosya 3"])],
          goal: { type: "cursor", target: { line: 0, col: 0 }, file: "ucuncu.md" },
          par: 7,
          hint: ":b ucu Enter",
        },
      ],
    },
    {
      id: "cd-tasima",
      title: "Dosyalar Arası Taşıma",
      summary: "Registerlar buffer'lar arasında ortak!",
      xp: 80,
      stages: [
        {
          task: "İlk satırı yy ile kopyala, :bn ile hedef.txt'ye geç, p ile yapıştır.",
          explain: "Registerlar GLOBALdir: bir dosyada kopyaladığın her şey diğer dosyada yapıştırılabilir. Çoklu dosya iş akışının temeli.",
          keys: ["yy", ":bn", "p"],
          files: [f("kaynak.txt", ["taşınacak veri", "kalan içerik"]), f("hedef.txt", ["mevcut satır"])],
          goal: { type: "text", target: ["mevcut satır", "taşınacak veri"], file: "hedef.txt" },
          par: 7,
          hint: "yy → :bn Enter → p",
        },
      ],
    },
    {
      id: "cd-gf",
      title: "gf — Dosyaya Git",
      summary: "İmleçteki dosya adına ışınlan",
      xp: 80,
      stages: [
        {
          task: "import satırındaki dosya adının üzerine git (fu ile u'ya) ve gf ile o dosyayı aç.",
          explain: "gf (go file) imlecin altındaki yolu dosya olarak açar. Import zincirlerinde gezinmenin en hızlı yolu.",
          keys: ["gf"],
          files: [
            f("main.ts", ["import x from 'util.ts'", "kod burada devam ediyor"]),
            f("util.ts", ["export const x = 42"]),
          ],
          goal: { type: "cursor", target: { line: 0, col: 0 }, file: "util.ts" },
          par: 4,
          hint: "fu → gf",
        },
      ],
    },
    {
      id: "cd-boss",
      title: "İki Dosya Bir Görev",
      summary: ":bn + :wa tam turu",
      xp: 100,
      drill: true,
      stages: [
        {
          task: "Her iki dosyanın sonuna «!» ekle (arada :bn ile geç) ve :wa ile HEPSİNİ kaydet.",
          keys: [":wa"],
          files: [f("dosya1.txt", ["ilk dosya"]), f("dosya2.txt", ["ikinci dosya"])],
          goal: {
            type: "save",
            files: [
              { name: "dosya1.txt", target: ["ilk dosya!"] },
              { name: "dosya2.txt", target: ["ikinci dosya!"] },
            ],
          },
          par: 14,
          hint: "A! Esc → :bn Enter → A! Esc → :wa Enter",
        },
      ],
    },
  ],
};

export const exModule: Module = {
  id: "ex-gucu",
  title: "Ex Gücü",
  subtitle: ":m :t :normal :sort — satır fabrikası",
  icon: "⚙️",
  lessons: [
    {
      id: "ex-aralik",
      title: "Aralıkla Sil: :2,3d",
      summary: "Satır adresleriyle çalış",
      xp: 80,
      stages: [
        {
          task: "2. ve 3. satırları görmeden sil: :2,3d",
          explain:
            "Ex komutları satır adresleriyle çalışır: :2,3d → 2'den 3'e sil. Adresler esnek: . (buradaki satır), $ (son), +2 (iki aşağı), 'a (mark). :.,+2d = bu satırdan iki aşağıya kadar sil.",
          keys: [":d"],
          files: [f("kayit.txt", ["satır 1", "gereksiz A", "gereksiz B", "satır 4", "satır 5"])],
          goal: { type: "text", target: ["satır 1", "satır 4", "satır 5"] },
          par: 6,
          hint: ":2,3d Enter",
        },
      ],
    },
    {
      id: "ex-mt",
      title: ":m ve :t — Taşı & Kopyala",
      summary: "Satırları adresle savur",
      xp: 80,
      stages: [
        {
          task: "İmza satırını (1.) dosyanın sonuna taşı: :1m$",
          explain: ":{aralık}m{adres} taşır, :{aralık}t{adres} kopyalar. $ = son satır, 0 = en tepe. :1m$ → 1. satırı sona taşı.",
          keys: [":m"],
          files: [f("mektup.txt", ["imza", "içerik A", "içerik B"])],
          goal: { type: "text", target: ["içerik A", "içerik B", "imza"] },
          par: 5,
          hint: ":1m$ Enter",
        },
        {
          task: "Bölüm başlığını sona da KOPYALA: :1t$",
          keys: [":t"],
          files: [f("rapor.txt", ["=== BÖLÜM ===", "metin gövdesi"])],
          goal: { type: "text", target: ["=== BÖLÜM ===", "metin gövdesi", "=== BÖLÜM ==="] },
          par: 5,
          hint: ":1t$ Enter",
        },
      ],
    },
    {
      id: "ex-normal",
      title: ":normal — Toplu Tuş Enjeksiyonu",
      summary: "Normal mod komutlarını her satıra uygula",
      xp: 80,
      stages: [
        {
          task: "TÜM satırların sonuna «;» ekle: :%normal A;",
          explain:
            ":{aralık}normal {tuşlar} → seçili her satırda o tuşları basılmış say. :%normal A; = her satırda «A;» çalıştır. Makronun tek satırlık kardeşi.",
          keys: [":normal"],
          files: [f("kod.js", ["let a = 1", "let b = 2", "let c = 3"])],
          goal: { type: "text", target: ["let a = 1;", "let b = 2;", "let c = 3;"] },
          par: 12,
          hint: ":%normal A; Enter",
        },
      ],
    },
    {
      id: "ex-sort",
      title: ":sort — Anında Sırala",
      summary: "Satırları alfabetik diz",
      xp: 80,
      stages: [
        {
          task: "Meyveleri alfabetik sırala: :sort",
          keys: [":sort"],
          files: [f("meyve.txt", ["muz", "elma", "kiraz", "armut"])],
          goal: { type: "text", target: ["armut", "elma", "kiraz", "muz"] },
          par: 6,
          hint: ":sort Enter",
        },
      ],
    },
    {
      id: "ex-boss",
      title: "Satır Fabrikası",
      summary: ":sort u + :g/normal zinciri",
      xp: 100,
      drill: true,
      stages: [
        {
          task: "Sırala VE tekrarları at: :sort u",
          keys: [":sort u"],
          files: [f("tekrar.txt", ["zebra", "elma", "zebra", "armut"])],
          goal: { type: "text", target: ["armut", "elma", "zebra"] },
          par: 8,
          hint: ":sort u Enter",
        },
        {
          task: "Yalnızca «görev» satırlarının sonuna « [OK]» ekle: :g ile :normal'i birleştir.",
          keys: [":g", ":normal"],
          files: [f("gorevler.txt", ["görev: temizle", "not: sakla", "görev: bitir"])],
          goal: { type: "text", target: ["görev: temizle [OK]", "not: sakla", "görev: bitir [OK]"] },
          par: 23,
          hint: ":g/görev/normal A [OK] → Enter",
        },
      ],
    },
  ],
};

export const bossModule: Module = {
  id: "ustalik",
  title: "Ustalık Sınavı",
  subtitle: "Hepsi bir arada — boss rush",
  icon: "🏆",
  lessons: [
    {
      id: "us-nokta",
      title: "Sınav 1: Nokta Zinciri",
      summary: "ci' + . ile üç satırlık refactor",
      xp: 120,
      drill: true,
      stages: [
        {
          task: "Üç değeri de 'yok' yap. İlkini ci' ile değiştir, kalanları j ve . ile bitir. Par: 13!",
          keys: ["ci'", "."],
          files: [
            f("tema.ts", ["const renk = 'kırmızı';", "const boyut = 'büyük';", "const tema = 'koyu';"]),
          ],
          goal: {
            type: "text",
            target: ["const renk = 'yok';", "const boyut = 'yok';", "const tema = 'yok';"],
          },
          par: 13,
          hint: "f' → ci'yok Esc → j → . → j → .",
        },
      ],
    },
    {
      id: "us-regex",
      title: "Sınav 2: Onay Kutuları",
      summary: "Substitute + özel karakter kaçışı",
      xp: 120,
      drill: true,
      stages: [
        {
          task: "Tüm görevleri işaretle: [ ] → [x]. Köşeli parantezleri \\[ ile kaçırman gerekecek!",
          keys: [":%s"],
          files: [
            f("yapilacak.md", [
              "- [ ] kahvaltı hazırla",
              "- [ ] vim öğren",
              "- [ ] dünyayı kurtar",
              "- [ ] uyu",
            ]),
          ],
          goal: {
            type: "text",
            target: ["- [x] kahvaltı hazırla", "- [x] vim öğren", "- [x] dünyayı kurtar", "- [x] uyu"],
          },
          par: 16,
          hint: ":%s/\\[ \\]/[x]/g Enter",
        },
      ],
    },
    {
      id: "us-final",
      title: "FİNAL: Proje Refactor",
      summary: "Çoklu dosya + substitute + kaydet",
      xp: 200,
      drill: true,
      stages: [
        {
          task: "«eski» fonksiyon adını her İKİ dosyada da «yeni» yap (:%s), :bn ile geç, sonunda :wa ile tümünü kaydet.",
          keys: [":%s", ":bn", ":wa"],
          files: [
            f("app.ts", ["function eski() {", "  return 'kod';", "}"]),
            f("readme.md", ["# Proje", "eski() çağrısı var"]),
          ],
          goal: {
            type: "save",
            files: [
              { name: "app.ts", target: ["function yeni() {", "  return 'kod';", "}"] },
              { name: "readme.md", target: ["# Proje", "yeni() çağrısı var"] },
            ],
          },
          par: 38,
          hint: ":%s/eski/yeni/g → :bn → :%s/eski/yeni → :wa",
        },
      ],
    },
  ],
};
