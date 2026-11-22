import { Suspense } from "react";
import { CoachView } from "@/components/coach/coach-view";

export const metadata = { title: "Coachmodus" };

export default function Page() {
  return (
    <Suspense>
      <CoachView />
    </Suspense>
  );
}
