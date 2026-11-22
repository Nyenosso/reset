import { Suspense } from "react";
import { PrintView } from "@/components/lesson/print-view";

export const metadata = { title: "Afdrukken" };

export default function Page() {
  return (
    <Suspense>
      <PrintView />
    </Suspense>
  );
}
