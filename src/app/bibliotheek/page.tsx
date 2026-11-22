import { Suspense } from "react";
import { LibraryView } from "@/components/library/library-view";

export const metadata = { title: "Bibliotheek" };

export default function Page() {
  return (
    <Suspense>
      <LibraryView />
    </Suspense>
  );
}
