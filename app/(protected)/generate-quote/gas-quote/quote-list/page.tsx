import { QuoteList } from "@/components/QuoteList";
import { Suspense } from "react";

export default function QuoteListPage() {
  return (
    <Suspense>
      <QuoteList quoteType="gas" />
    </Suspense>
  );
}
