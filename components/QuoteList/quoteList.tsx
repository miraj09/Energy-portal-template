"use client";
import React, { JSX } from "react";
import { useSearchParams } from "next/navigation";
import { QuoteTable } from "@/components/QuoteList/components/quoteTable/quoteTable";

interface QuoteListProps {
  quoteType?: 'electricity' | 'gas';
}

const QuoteList = ({ quoteType = 'electricity' }: QuoteListProps): JSX.Element => {
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');
  
  return (
    <div className="flex flex-col lg:flex-row">
      {/* Main content area */}
      <div className="flex-1 w-full lg:ml-0">

        {/* Main quote details section */}
        <QuoteTable quoteType={quoteType} quoteId={quoteId} />
      </div>
    </div>
  );
};

export default QuoteList;
