import type { Module } from "../types";

const f = (name: string, lines: string[]) => ({ name, lines });

const filler = (n: number, seed: string[]) =>
  Array.from({ length: n }, (_, i) => seed[i % seed.length]);

export const searchModule: Module = {
  id: "arama",
  title: "Arama",
  subtitle: "/ ? n N * — ışık hızında bul",
  icon: "🔍",
  lessons: [
    {
      id: "ar-slash",
      title: "/: İleri Arama",
      summary: "Uzun dosyada kelimeye ışınlan",
      xp: 60,
      stages: [
        {
          task: "Bu dosyada bir yerde «hazine» gizli. / ile ara ve üzerine ışınlan.",
          explain:
            "/ yazıp bir desen girince Enter ile ilk eşleşmeye atlarsın. En hızlı uzun mesafe hareketi: gideceğin yeri GÖRDÜYSEN aramak her zaman kazanır.",
          keys: ["/"],
          files: [
            f("ada.txt", [
              ...filler(17, ["kayalık sahil şeridi", "dalgalar ve kum", "palmiye gölgesi", "martı sesleri"]),
              "işte hazine burada",
              ...filler(4, ["sis ve rüzgar", "uzak ufuk çizgisi"]),
            ]),
          ],
          goal: { type: "cursor", target: { line: 17, col: 5 } },
          par: 8,
          hint: "/hazine → Enter",
        },
      ],
    },
    {
      id: "ar-nN",
      title: "n ve N: Sonraki / Önceki",
      summary: "Aramayı tekrar tuşuna bağla",
      xp: 60,
      stages: [
        {
          task: "Üç «anahtar» kelimesinin hepsine uğra: bir kez ara, sonra n n ile gez.",
          explain: "n son aramayı aynı yönde tekrarlar, N ters yönde. Dosya sonunda arama başa sarar.",
          keys: ["n", "N"],
          files: [
            f("kilit.txt", [
              "kapı kilitli duruyor",
              "pencere sıkıca kapalı",
              "mahzen karanlık ve soğuk",
              "bu anahtar birinci",
              "duvarlar taştan örülmüş",
              "tavan arası tozlu",
              "merdiven gıcırdıyor",
              "şömine sönmüş küller",
              "halı desenli ve eski",
              "yedek anahtar ikinci",
              "kitaplık dolu raflar",
              "mum ışığı titriyor",
              "ayna çatlak köşede",
              "saat durmuş gece yarısı",
              "perde savruluyor rüzgarda",
              "son anahtar burada",
            ]),
          ],
          goal: {
            type: "collect",
            targets: [
              { line: 3, col: 3 },
              { line: 9, col: 6 },
              { line: 15, col: 4 },
            ],
          },
          par: 11,
          hint: "/anahtar Enter → n → n",
        },
      ],
    },
    {
      id: "ar-star",
      title: "*: İmleçteki Kelimeyi Ara",
      summary: "Yazmadan ara — tek tuş",
      xp: 60,
      stages: [
        {
          task: "İmleç «sayac» üzerinde. * ile sonraki kullanımına atla, n ile bir sonrakine.",
          explain: "* imlecin altındaki kelimeyi alır ve TAM KELİME olarak ileri arar. # aynısını geriye yapar. Kod içinde «bu değişken başka nerede?» sorusunun cevabı.",
          keys: ["*", "#"],
          files: [f("sayac.ts", ["let sayac = 0;", "sayac += 1;", "return sayac;"])],
          cursor: { line: 0, col: 4 },
          goal: {
            type: "collect",
            targets: [
              { line: 1, col: 0 },
              { line: 2, col: 7 },
            ],
          },
          par: 2,
          hint: "* → n",
        },
      ],
    },
    {
      id: "ar-operator",
      title: "d/desen: Aramaya Kadar Sil",
      summary: "Arama da bir harekettir!",
      xp: 60,
      stages: [
        {
          task: "Baştan «KALSIN» kelimesine kadar olan her şeyi TEK komutla sil: d/KALSIN.",
          explain:
            "Arama bir hareket olduğu için operatörlerle birleşir: d/foo → foo'ya kadar sil (foo hariç). Vim grameri her yerde tutarlı.",
          keys: ["d/"],
          files: [f("kes.txt", ["çöp çöp çöp KALSIN bu kısım"])],
          goal: { type: "text", target: ["KALSIN bu kısım"] },
          par: 9,
          hint: "d → /KALSIN → Enter",
        },
      ],
    },
    {
      id: "ar-boss",
      title: "Arama Avı",
      summary: "Sarmalamalı arama golfü",
      xp: 90,
      drill: true,
      stages: [
        {
          task: "İki «hata» kaydına da uğra. Dikkat: biri aşağıda, biri YUKARIDA — arama dosya sonunda başa sarar!",
          keys: ["/", "n"],
          files: [
            f("log.txt", [
              "sistem açıldı",
              "bağlantı kuruldu",
              "ilk hata satırı",
              "işlem devam ediyor",
              "veri paketi alındı",
              "önbellek temizlendi",
              "kullanıcı giriş yaptı",
              "oturum yenilendi",
              "yedekleme başladı",
              "dosya taşındı",
              "bellek optimize edildi",
              "görev tamamlandı",
              "kritik hata burada",
              "sistem kapanıyor",
            ]),
          ],
          cursor: { line: 5, col: 0 },
          goal: {
            type: "collect",
            targets: [
              { line: 12, col: 7 },
              { line: 2, col: 4 },
            ],
          },
          par: 7,
          hint: "/hata Enter → n",
        },
      ],
    },
  ],
};

export const substituteModule: Module = {
  id: "substitute",
  title: "Substitute & Global",
  subtitle: ":s :%s :g — toplu değiştirme sanatı",
  icon: "🪄",
  lessons: [
    {
      id: "su-s",
      title: ":s — Satırda Değiştir",
      summary: "Bul-değiştir'in Vim hali",
      xp: 70,
      stages: [
        {
          task: "Satırdaki İLK «renk» kelimesini «ton» yap: :s/renk/ton",
          explain:
            ":s/eski/yeni imlecin olduğu satırdaki ilk eşleşmeyi değiştirir. Yapı: :s/desen/yenisi/bayraklar — birazdan bayrakları da göreceksin.",
          keys: [":s"],
          files: [f("boya.txt", ["renk renk mavi"])],
          goal: { type: "text", target: ["ton renk mavi"] },
          par: 12,
          hint: ":s/renk/ton Enter",
        },
        {
          task: "Bu kez satırdaki TÜM «ye» kelimelerini «iç» yap: g bayrağını ekle.",
          explain: "g (global) bayrağı satırdaki BÜTÜN eşleşmeleri değiştirir; yoksa yalnızca ilkini.",
          keys: ["/g"],
          files: [f("fiil.txt", ["ye ye ye"])],
          goal: { type: "text", target: ["iç iç iç"] },
          par: 11,
          hint: ":s/ye/iç/g Enter",
        },
      ],
    },
    {
      id: "su-yuzde",
      title: ":%s — Tüm Dosyada",
      summary: "% = her satır demek",
      xp: 70,
      stages: [
        {
          task: "Dosyadaki TÜM «eski» kelimelerini «yeni» yap.",
          explain: "Komutun başındaki aralık nerede çalışacağını söyler: % tüm dosya demek. :%s/a/b/g = klasik proje içi bul-değiştir.",
          keys: [":%s"],
          files: [
            f("belge.txt", ["eski usül devam", "hep eski", "eski eski her yer", "yepyeni değil eski"]),
          ],
          goal: {
            type: "text",
            target: ["yeni usül devam", "hep yeni", "yeni yeni her yer", "yepyeni değil yeni"],
          },
          par: 16,
          hint: ":%s/eski/yeni/g Enter",
        },
      ],
    },
    {
      id: "su-aralik",
      title: "Aralıklar: :2,3s",
      summary: "Yalnızca istediğin satırlarda",
      xp: 70,
      stages: [
        {
          task: "SADECE 2. ve 3. satırlardaki «elma»yı «armut» yap.",
          explain: "Aralık = başlangıç,bitiş: :2,3s yalnızca 2-3 arası satırlara dokunur. . = bulunduğun satır, $ = son satır: :.,$s de geçerli.",
          keys: [":2,3s"],
          files: [f("manav.txt", ["1. elma", "2. elma", "3. elma", "4. elma"])],
          goal: { type: "text", target: ["1. elma", "2. armut", "3. armut", "4. elma"] },
          par: 18,
          hint: ":2,3s/elma/armut Enter",
        },
      ],
    },
    {
      id: "su-global",
      title: ":g — Desene Göre Komut",
      summary: "Eşleşen HER satıra komut uygula",
      xp: 70,
      stages: [
        {
          task: "Tüm yorum satırlarını (# ile olanlar) tek komutla sil: :g/#/d",
          explain:
            ":g/desen/komut → desenle eşleşen HER satırda komutu çalıştırır. :g/#/d = # içeren satırları sil. Tersine :v/desen/d eşleşMEYENleri siler.",
          keys: [":g"],
          files: [
            f("script.sh", ["kod satırı bir", "# yorum", "kod satırı iki", "# başka yorum", "kod satırı üç"]),
          ],
          goal: { type: "text", target: ["kod satırı bir", "kod satırı iki", "kod satırı üç"] },
          par: 7,
          hint: ":g/#/d Enter",
        },
      ],
    },
    {
      id: "su-boss",
      title: "Toplu Temizlik",
      summary: ":g + :%s art arda",
      xp: 90,
      drill: true,
      stages: [
        {
          task: "Önce DEBUG satırlarını topluca sil.",
          keys: [":g"],
          files: [
            f("uygulama.log", ["DEBUG: kaldır", "önemli işlem", "DEBUG: bunu da", "sonuç hazır"]),
          ],
          goal: { type: "text", target: ["önemli işlem", "sonuç hazır"] },
          par: 11,
          hint: ":g/DEBUG/d Enter",
        },
        {
          task: "Şimdi tüm «const» anahtar kelimelerini «let» yap.",
          keys: [":%s"],
          files: [f("eskikod.ts", ["const a = 1;", "const b = 2;", "const c = 3;"])],
          goal: { type: "text", target: ["let a = 1;", "let b = 2;", "let c = 3;"] },
          par: 16,
          hint: ":%s/const/let/g Enter",
        },
      ],
    },
  ],
};

export const visualModule: Module = {
  id: "visual",
  title: "Visual Mod",
  subtitle: "v V — önce seç, sonra uygula",
  icon: "🖌️",
  lessons: [
    {
      id: "vi-v",
      title: "v: Karakter Seçimi",
      summary: "Gördüğünü seç, sonra karar ver",
      xp: 60,
      stages: [
        {
          task: "«bunları » kelimesini boşluğuyla seçip sil: v ile seçime başla, e l ile genişlet, d ile sil.",
          explain:
            "v Visual moda geçirir: hareket ettikçe seçim büyür. Sonra operatör bas: d sil, y kopyala, c değiştir. Operatör grameri ters çevrilmiş hali: önce kapsam, sonra eylem.",
          keys: ["v"],
          files: [f("sec.txt", ["kes bunları at"])],
          cursor: { line: 0, col: 4 },
          goal: { type: "text", target: ["kes at"] },
          par: 4,
          hint: "v → e → l → d",
        },
      ],
    },
    {
      id: "vi-V",
      title: "V: Satır Seçimi",
      summary: "Satırları blok halinde yönet",
      xp: 60,
      stages: [
        {
          task: "Ortadaki iki satırı V ile seçip sil.",
          explain: "V (büyük) satır bazlı seçer: j/k ile satır satır büyür. Çok satırlı silme/taşımanın en görsel yolu.",
          keys: ["V"],
          files: [f("liste.txt", ["başlık", "silinecek bir", "silinecek iki", "kalan son"])],
          goal: { type: "text", target: ["başlık", "kalan son"] },
          par: 4,
          hint: "j → V → j → d",
        },
      ],
    },
    {
      id: "vi-indent",
      title: "Seçim + > : Girinti",
      summary: "Bloğu topluca kaydır",
      xp: 60,
      stages: [
        {
          task: "İki fonksiyon çağrısını seçip > ile içeri it.",
          explain: "Visual seçim üzerinde > girinti ekler, < çıkarır. Normal moddaki karşılığı: >> ve >j gibi kombinasyonlar.",
          keys: [">", "<"],
          files: [f("python.py", ["if koşul:", "yap()", "devam()", "son satır dışarıda"])],
          goal: { type: "text", target: ["if koşul:", "  yap()", "  devam()", "son satır dışarıda"] },
          par: 4,
          hint: "j → V → j → >",
        },
      ],
    },
    {
      id: "vi-obj",
      title: "Seçim + Text Object",
      summary: "viw, U ve arkadaşları",
      xp: 60,
      stages: [
        {
          task: "«kelime» sözcüğünü viw ile seç ve U ile BÜYÜK harfe çevir.",
          explain: "Visual modda text object'ler de çalışır: viw kelimeyi seçer. Seçimde U büyütür, u küçültür, ~ çevirir.",
          keys: ["viw", "U"],
          files: [f("vurgu.txt", ["önemli kelime burada"])],
          cursor: { line: 0, col: 9 },
          goal: { type: "text", target: ["önemli KELIME burada"] },
          par: 4,
          hint: "viw → U",
        },
      ],
    },
    {
      id: "vi-boss",
      title: "Görsel Taşıma",
      summary: "V + d + p ile satır taşı",
      xp: 90,
      drill: true,
      stages: [
        {
          task: "«taşınacak» satırını dosyanın SONUNA taşı.",
          keys: ["V", "d", "p"],
          files: [f("tasi.txt", ["satır bir", "taşınacak", "satır iki"])],
          goal: { type: "text", target: ["satır bir", "satır iki", "taşınacak"] },
          par: 5,
          hint: "j → V → d → G → p",
        },
      ],
    },
  ],
};

export const registerModule: Module = {
  id: "registerlar",
  title: "Registerlar",
  subtitle: '"a-z "0 "_ — çoklu pano gücü',
  icon: "🗃️",
  lessons: [
    {
      id: "re-named",
      title: '"a: İsimli Kayıt',
      summary: "26 ayrı pano cebin olsun",
      xp: 70,
      stages: [
        {
          task: 'İlk satırı a register\'ına ("ayy), ikinciyi b\'ye ("byy) kopyala; sona git ve sırayla yapıştır ("ap, "bp).',
          explain:
            'Vim\'de tek pano yok, 26+ tane var! "{harf} öneki komutun hangi register\'ı kullanacağını seçer: "ayy → a\'ya kopyala, "ap → a\'dan yapıştır. Büyük harf ("A) mevcut içeriğe EKLER.',
          keys: ['"a', '"b'],
          files: [f("kayit.txt", ["A metni", "B metni", "--- hedef ---"])],
          goal: {
            type: "custom",
            description: 'a ve b registerlarını kullanarak iki satırı sona kopyala',
            check: (s) => {
              const b = s.buffers[s.currentBufferId];
              return (
                s.registers["a"]?.text === "A metni\n" &&
                s.registers["b"]?.text === "B metni\n" &&
                b.lines.join("|") === "A metni|B metni|--- hedef ---|A metni|B metni"
              );
            },
          },
          par: 16,
          hint: '"ayy → j → "byy → G → "ap → "bp',
        },
      ],
    },
    {
      id: "re-yank0",
      title: '"0: Yank Kasası',
      summary: "Silme işlemi kopyanı ezemez",
      xp: 70,
      stages: [
        {
          task: 'İlk satırı kopyala, ikinci satırı dd ile sil (panoyu ezer!), sonra "0p ile KOPYALADIĞINI yapıştır.',
          explain:
            'Kopyaladın, sonra bir şey sildin, yapıştırınca silineni mi aldın? Klasik tuzak! Yank her zaman "0\'a da yazılır; silmeler onu ezemez. "0p seni kurtarır.',
          keys: ['"0'],
          files: [f("kasa.txt", ["kopyala", "üzerine yaz silinecek", "hedef:"])],
          goal: { type: "text", target: ["kopyala", "hedef:", "kopyala"] },
          par: 8,
          hint: 'yy → j → dd → "0p',
        },
      ],
    },
    {
      id: "re-blackhole",
      title: '"_: Kara Delik',
      summary: "İz bırakmadan sil",
      xp: 70,
      stages: [
        {
          task: 'İlk satırı kopyala, «çöp» satırını "_dd ile panoya DOKUNMADAN sil, sonra p ile kopyanı yapıştır.',
          explain: '"_ kara deliktir: oraya giden hiçbir yerde saklanmaz. "_dd panonu korumak için silmenin nazik yolu.',
          keys: ['"_'],
          files: [f("delik.txt", ["taşınacak", "çöp", "hedef üstü"])],
          goal: { type: "text", target: ["taşınacak", "hedef üstü", "taşınacak"] },
          par: 8,
          hint: 'yy → j → "_dd → p',
        },
      ],
    },
    {
      id: "re-boss",
      title: "Register Soygunu",
      summary: "Named register turu",
      xp: 90,
      drill: true,
      stages: [
        {
          task: 'Gizli satırı g register\'ına kopyala ("gyy), dosyanın sonuna git ve "gp ile yapıştır.',
          keys: ['"g'],
          files: [f("soygun.txt", ["gizli: parola123", "", "normal metin"])],
          goal: {
            type: "custom",
            description: 'g register\'ı ile ilk satırı sona kopyala',
            check: (s) => {
              const b = s.buffers[s.currentBufferId];
              return (
                s.registers["g"]?.text === "gizli: parola123\n" &&
                b.lines.join("|") === "gizli: parola123||normal metin|gizli: parola123"
              );
            },
          },
          par: 8,
          hint: '"gyy → G → "gp',
        },
      ],
    },
  ],
};
