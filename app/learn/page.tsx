import { CurriculumMap } from "@/components/game/CurriculumMap";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vim Öğrenme Müfredatı",
  description: "Başlangıçtan ileri seviyeye 19 modül ve oyunlaştırılmış derslerle Vim öğrenme yol haritası.",
  alternates: { canonical: "/learn" },
};

export default function LearnPage() {
  return <CurriculumMap />;
}
