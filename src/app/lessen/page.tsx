import { Suspense } from "react";
import { LessonsView } from "@/components/lessons/lessons-view";

export const metadata = { title: "Mijn lessen" };

export default function Page() {
  return (
    <Suspense>
      <LessonsView />
    </Suspense>
  );
}
