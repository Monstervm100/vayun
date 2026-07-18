"use client";

import { use } from "react";
import Link from "next/link";
import LessonPlayer, { type Lesson } from "@/components/lesson/LessonPlayer";
import lessons from "@/data/lessons.json";

export default function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = use(params);
  const lesson = (lessons as Lesson[]).find((l) => l.id === lessonId);

  if (!lesson) {
    return (
      <div className="pt-10 text-center">
        <p className="text-lg font-bold">Lesson not found 🤔</p>
        <Link href="/learn" className="mt-2 inline-block font-bold text-emerald-600 hover:underline">← Back to the learning path</Link>
      </div>
    );
  }
  return <LessonPlayer lesson={lesson} />;
}
