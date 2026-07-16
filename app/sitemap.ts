import type { MetadataRoute } from "next";
import { MODULES } from "@/lib/curriculum";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/learn`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/playground`, changeFrequency: "monthly", priority: 0.6 },
  ];
  const lessons = MODULES.flatMap((module) =>
    module.lessons.map((lesson) => ({
      url: `${siteUrl}/learn/${lesson.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }))
  );
  return [...staticPages, ...lessons];
}
