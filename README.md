# Vim Ustası

Metin düzenlemeyi bir daha asla eskisi gibi görmeyeceksin. A'dan Z'ye, tamamen ücretsiz ve oyunlaştırılmış bir Vim eğitimi: hareketlerden operatör grameriyle text object'lere, registerlardan makrolara, çoklu dosya iş akışından ex komutlarına kadar her şeyi tarayıcıda çalışan **gerçek bir Vim motoruyla** öğretir.

Video yok, quiz yok — her tuşu kendin basarsın, motor gerçek zamanlı yorumlar.

## Neden

Piyasadaki benzer siteler (VIM Adventures gibi) birkaç seviyeden sonra ücretli. Bu proje aynı fikri baştan sona, ücretsiz ve tam kapsamlı olarak sunar.

## Öne çıkanlar

- **Gerçek Vim motoru** ([lib/vim/](lib/vim/engine.ts)) — saf TypeScript, UI'dan bağımsız bir reducer: modlar, hareketler, operatör + sayaç grameri, text object'ler (`iw i" i( i{ ip it`), registerlar, makrolar, nokta tekrarı, undo/redo, marks/jumplist, arama, ex komutları (`:s :g :normal :sort` vb.) ve çoklu buffer (`:e :b :bn gf :wa`).
- **Müfredat** ([lib/curriculum/](lib/curriculum/index.ts)) — 19 modül, 84 ders. Her ders tek bir yeni kavram öğretir (scaffolding), modüller %60 tamamlanınca açılır (mastery learning), her modül eski komutları karıştıran bir tekrar/boss dersiyle biter (spaced repetition). Detaylı pedagoji notları: [docs/CURRICULUM.md](docs/CURRICULUM.md).
- **Tuş golfü** — her dersin bir "par" tuş sayısı var; en verimli komut kombinasyonunu bulmak 3 yıldız kazandırır (deliberate practice).
- **İlerleme** — zustand + `persist` ile yıldız/XP/seviye takibi, tarayıcıda kalıcı.
- **Serbest Alan** ([app/playground](app/playground/page.tsx)) — kopya kağıdıyla birlikte, ders akışı dışında serbestçe pratik yapılacak alan.

## Başlarken

```bash
bun install
bun run dev
```

[http://localhost:3000](http://localhost:3000) adresini aç. `/learn` müfredat haritası, `/playground` serbest pratik alanıdır.

## Test

```bash
bun test lib/
```

66 motor testi + 87 müfredat testi: müfredattaki **her dersin referans çözümü** motordan geçirilip hem hedefe ulaştığı hem de par'ı aşmadığı otomatik doğrulanır. Yeni ders eklerken çözümü [lib/curriculum/curriculum.test.ts](lib/curriculum/curriculum.test.ts) içindeki `SOLUTIONS` haritasına eklemek yeterli.

## Proje yapısı

```
lib/vim/          Vim motoru (engine, motions, text objects, search, ex commands)
lib/curriculum/   Modül/ders tanımları ve müfredat testi
lib/game/         Puanlama (par/yıldız/XP) ve zustand ilerleme deposu
components/vim/   VimEditor — motoru render eden terminal bileşeni
components/game/  Müfredat haritası, ders oynatıcı, serbest alan, ana sayfa demosu
docs/CURRICULUM.md  Pedagojik ilkeler ve modül listesi
```

## Teknoloji

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · zustand · framer-motion · shadcn/ui bileşenleri (kısmen kurulu — bkz. `tsconfig.json`'daki `components/ui` exclude notu)

## Not

Bu proje [özel bir Next.js sürümü](AGENTS.md) kullanır; API ve konvansiyonlar standart eğitim materyallerinden farklı olabilir. `node_modules/next/dist/docs/` altındaki dahili dokümantasyona bakın.
