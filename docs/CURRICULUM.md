# Vim Ustası — Müfredat Tasarımı

Tamamen ücretsiz, A'dan Z'ye oyunlaştırılmış Vim eğitimi.

## Pedagojik İlkeler

1. **Scaffolding** — Her ders TEK yeni kavram öğretir; önceki bilgilerin üstüne kurar.
2. **Flow / zorluk-beceri dengesi** — Dersler kademeli zorlaşır; her modül "boss" dersiyle biter.
3. **Mastery learning** — Modüller sırayla açılır; ilerlemek için dersleri tamamlamak gerekir.
4. **Spaced repetition** — Tekrar (drill) dersleri eski komutları yeni komutlarla karıştırır.
5. **Deliberate practice** — "Golf" mekaniği: her dersin par tuş sayısı vardır. Par altı = 3 yıldız.
   Bu, hjkl spam'lemek yerine en verimli komutu kullanmaya zorlar.
6. **Akıcılık > tanıma** — Quiz yok; her şey gerçek tuş vuruşlarıyla, emüle edilmiş Vim'de yapılır.
7. **Anında geri bildirim** — Mod, register, pending komut ekranda canlı gösterilir.

## Oyun Mekanikleri

- **Hedef türleri:** (a) noktaları topla (hareket dersleri), (b) metni hedefe dönüştür
  (düzenleme dersleri), (c) dosyaları kaydet / buffer hedefleri (çoklu dosya dersleri).
- **Puanlama:** tuş sayısı ≤ par → ⭐⭐⭐, ≤ par×1.6 → ⭐⭐, tamamlama → ⭐.
- **XP ve seviye:** yıldız başına XP; modül tamamlama bonusu.
- **İlerleme:** localStorage'da saklanır (zustand persist).

## Modüller (A → Z)

| # | Modül | Öğretilenler |
|---|-------|--------------|
| 1 | Hayatta Kalma | modlar, i / Esc, x, :w, :q, :q!, ZZ |
| 2 | Temel Hareket | h j k l, sayaçlar (5j), 0, $, ^ |
| 3 | Kelime Hareketleri | w, b, e, ge, W, B, E, sayaçlarla |
| 4 | Satır İçi Nişancılık | f, F, t, T, ; , |
| 5 | Dikey Hareket | gg, G, {n}G, {, }, %, H, M, L, Ctrl-d/u |
| 6 | Insert Ailesi | i, a, I, A, o, O, gi |
| 7 | Operatör Grameri | d + hareket, dd, D, u, Ctrl-r, . (nokta) |
| 8 | Değiştir & Yaz | c + hareket, cc, C, s, S, r, R, ~ |
| 9 | Text Objects | iw, aw, i", a", i(, a(, i{, ip, it |
| 10 | Yank & Put | y, yy, Y, p, P, J, satır/karakter yapıştırma |
| 11 | Arama | /, ?, n, N, *, #, arama + operatör (d/n) |
| 12 | Substitute | :s, :%s, aralıklar, g/c bayrakları, :g komutu |
| 13 | Visual Mod | v, V, o, seçim + operatör, gv, > < |
| 14 | Registerlar | "a-z, "0, "_, sayılı registerlar, "+ pano |
| 15 | Marks & Jumps | m, ` ', `` , Ctrl-o, Ctrl-i |
| 16 | Makrolar | q kayıt, @ oynatma, @@, sayaçlı makro, register düzenleme |
| 17 | Çoklu Dosya | :e, :ls, :b, :bn/:bp, :bd, gf, dosyalar arası yank/put |
| 18 | Ex Gücü | aralıklar (:1,5d, :.,+2m), :t, :m, :normal, :sort |
| 19 | Ustalık Kombosu | tüm modüllerin karışık "boss rush" tekrarı |

Her modül: 4–8 ders + 1 tekrar (drill) dersi. Ders = 1–5 aşama (stage).

## Motor Kapsamı (emülatör)

Normal / Insert / Visual / Visual-Line / Replace / Command-line modları; operatör
bekleme, sayaçlar, register öneki; undo/redo (insert oturumu tek undo birimi);
nokta tekrarı (.); makrolar (iç içe oynatma korumalı); marks; arama geçmişi;
çoklu buffer (:e, :b*); ex aralıkları; substitute (JS regex'e çevrilmiş desen).
