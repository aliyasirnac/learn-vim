import Link from "next/link";
import { TerminalDemo } from "@/components/game/TerminalDemo";
import { MODULES, TOTAL_LESSONS } from "@/lib/curriculum";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Vim Ustası",
  description: "Tarayıcıda çalışan gerçek Vim motoruyla oyunlaştırılmış Türkçe Vim eğitimi.",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any",
  inLanguage: "tr-TR",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
};

const FEATURES = [
  {
    icon: "⌨️",
    title: "Gerçek Vim Motoru",
    text: "Video yok, quiz yok. Tarayıcıda çalışan gerçek bir modal editörde her tuşu kendin basarsın.",
  },
  {
    icon: "🗺️",
    title: "A'dan Z'ye Müfredat",
    text: `${MODULES.length} modül, ${TOTAL_LESSONS} ders: hjkl'den makrolara, registerlardan çoklu dosya iş akışına.`,
  },
  {
    icon: "⛳",
    title: "Tuş Golfü",
    text: "Her dersin bir «par» değeri var. hjkl spam'i seni kurtarmaz — en verimli komutu bulan 3 yıldızı alır.",
  },
  {
    icon: "🆓",
    title: "Sonuna Kadar Ücretsiz",
    text: "3. seviyede duvara toslamak yok. Makrolar da, ileri seviye de — hepsi açık, hepsi bedava.",
  },
];

export default function Home() {
  return (
    <div className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {/* hero */}
      <section className="mx-auto max-w-5xl px-4 pt-16 pb-10 text-center">
        <p className="text-(--vim-text-dim) text-sm tracking-[0.35em] uppercase">:enter the dojo</p>
        <h1 className="font-display text-7xl sm:text-8xl md:text-9xl text-(--vim-green-bright) phosphor flicker-in mt-2">
          VIM USTASI
        </h1>
        <p className="mt-3 text-lg text-(--vim-text) max-w-2xl mx-auto leading-relaxed">
          Metin düzenlemeyi bir daha asla eskisi gibi görmeyeceksin.{" "}
          <span className="text-(--vim-amber)">Oyunlaştırılmış</span>, pedagojik ve{" "}
          <span className="text-(--vim-green)">tamamen ücretsiz</span> Vim eğitimi.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link
            href="/learn"
            className="px-8 py-3 rounded-md bg-(--vim-green) text-[#06130a] font-bold text-lg hover:bg-(--vim-green-bright) transition-colors shadow-[0_0_24px_rgba(74,222,128,0.35)]"
          >
            ▶ Eğitime Başla
          </Link>
          <Link
            href="/playground"
            className="px-8 py-3 rounded-md border border-(--vim-border) text-(--vim-text) hover:border-(--vim-green-dim) hover:text-(--vim-green-bright) transition-colors text-lg"
          >
            Serbest Alan
          </Link>
        </div>
      </section>

      {/* canlı demo */}
      <section className="mx-auto max-w-3xl px-4 pb-14">
        <TerminalDemo />
        <p className="text-center text-xs text-(--vim-text-dim) mt-2">
          ↑ Bu bir video değil — sitenin kendi Vim motoru kendini tanıtıyor.
        </p>
      </section>

      {/* özellikler */}
      <section className="mx-auto max-w-5xl px-4 pb-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <h2 className="sr-only">Vim Ustası özellikleri</h2>
        {FEATURES.map((feature) => (
          <div key={feature.title} className="terminal-frame rounded-lg p-5">
            <div className="text-3xl">{feature.icon}</div>
            <h3 className="font-display text-2xl text-(--vim-green-bright) mt-2">{feature.title}</h3>
            <p className="text-sm text-(--vim-text-dim) leading-relaxed mt-1">{feature.text}</p>
          </div>
        ))}
      </section>

      {/* müfredat önizleme */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <h2 className="font-display text-4xl text-(--vim-green-bright) phosphor text-center mb-6">
          YOL HARİTASI
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {MODULES.map((m, i) => (
            <Link
              key={m.id}
              href="/learn"
              className="px-3 py-1.5 rounded-full border border-(--vim-border) text-sm text-(--vim-text-dim) hover:text-(--vim-green-bright) hover:border-(--vim-green-dim) transition-colors"
            >
              {String(i + 1).padStart(2, "0")} {m.icon} {m.title}
            </Link>
          ))}
        </div>
        <p className="text-center text-(--vim-text-dim) text-sm mt-8">
          vimtutor + Practical Vim müfredatı · scaffolding & deliberate practice pedagojisi ·{" "}
          <span className="text-(--vim-green)">:wq</span> demeyi de öğreneceksin, korkma.
        </p>
      </section>
    </div>
  );
}
