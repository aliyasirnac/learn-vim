import { LessonPlayer } from "@/components/game/LessonPlayer";
import { findLesson, MODULES } from "@/lib/curriculum";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export function generateStaticParams() {
  return MODULES.flatMap((m) => m.lessons.map((l) => ({ lessonId: l.id })));
}

export async function generateMetadata(props: { params: Promise<{ lessonId: string }> }): Promise<Metadata> {
  const { lessonId } = await props.params;
  const ref = findLesson(lessonId);
  if (!ref) return { title: "Ders bulunamadı", robots: { index: false, follow: false } };

  return {
    title: `${ref.lesson.title} — ${ref.module.title}`,
    description: `${ref.lesson.summary}. Vim Ustası'nda bu interaktif dersi ücretsiz tamamlayın.`,
    alternates: { canonical: `/learn/${lessonId}` },
  };
}

export default async function LessonPage(props: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await props.params;
  if (!findLesson(lessonId)) notFound();
  return <LessonPlayer lessonId={lessonId} />;
}
