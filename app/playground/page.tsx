import { Playground } from "@/components/game/Playground";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vim Serbest Pratik Alanı",
  description: "Derslerden bağımsız olarak Vim komutlarını tarayıcıdaki gerçek editörde deneyin.",
  alternates: { canonical: "/playground" },
};

export default function PlaygroundPage() {
  return <Playground />;
}
