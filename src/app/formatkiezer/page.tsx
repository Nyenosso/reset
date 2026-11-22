import { Suspense } from "react";
import { FormatPickerView } from "@/components/picker/picker-view";

export const metadata = { title: "Formatkiezer" };

export default function Page() {
  return (
    <Suspense>
      <FormatPickerView />
    </Suspense>
  );
}
