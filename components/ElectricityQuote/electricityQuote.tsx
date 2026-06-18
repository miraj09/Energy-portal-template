import React, { JSX } from "react";
import { QuoteDetailsSection } from "./components/QuoteDetails/quoteDetails";

const ElectricityQuote = (): JSX.Element => {
  return (
    <div className="flex flex-col lg:flex-row">
      {/* Main content area */}
      <div className="flex-1 w-full lg:ml-0">
        {/* Main quote details section */}
        <QuoteDetailsSection />
      </div>
    </div>
  );
};

export default ElectricityQuote;
