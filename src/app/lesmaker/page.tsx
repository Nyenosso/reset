import { Suspense } from "react";
import { BuilderView } from "@/components/lesson/builder-view";

export const metadata = { title: "Lesmaker" };

export default function Page() {
  return (
    <Suspense>
      <BuilderView />
    </Suspense>
  );
}
