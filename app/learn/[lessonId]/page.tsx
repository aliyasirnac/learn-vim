import { LessonPlayer } from "@/components/game/LessonPlayer";
import { MODULES } from "@/lib/curriculum";

export function generateStaticParams() {
  return MODULES.flatMap((m) => m.lessons.map((l) => ({ lessonId: l.id })));
}

export default async function LessonPage(props: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await props.params;
  return <LessonPlayer lessonId={lessonId} />;
}
