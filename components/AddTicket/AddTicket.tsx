"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Label } from "@/ui/label";
import TicketForm from "./components/TicketForm";
import LOAForm from "./components/LOAForm";

const AddTicket = () => {
  const searchParams = useSearchParams();
  const [selectedQueryType, setSelectedQueryType] = useState("");
  const [isQueryTypeDisabled, setIsQueryTypeDisabled] = useState(false);
  const [initialCompanyId, setInitialCompanyId] = useState<string | null>(null);

  // Goal:
  // - Show the Query Type options (same as `TicketsTable.tsx` lines 74–83)
  // - Render `TicketForm` for any option except "OTHERS"
  // - Render `LOAForm` when "OTHERS" is selected
  //
  // Assumptions:
  // - "other" refers to the "OTHERS" query type value.
  // - When the page is opened with ?companyId=XXX, that ID should be used
  //   to pre-select the company in the LOA form (if/when it is shown).
  useEffect(() => {
    const queryTypeFromUrl = searchParams?.get("queryType");
    const companyIdFromUrl = searchParams?.get("companyId");

    if (queryTypeFromUrl) {
      setSelectedQueryType(queryTypeFromUrl);
      setIsQueryTypeDisabled(true);
    }

    if (companyIdFromUrl) {
      setInitialCompanyId(companyIdFromUrl);
    }
  }, [searchParams]);

  // NOTE:
  // - We keep the internal value "OTHERS" for compatibility with any
  //   existing backend or table logic that expects this query type.
  // - The user-facing label is changed to "LOA (Letter Of Authority)"
  //   so the button clearly represents the LOA flow, while still
  //   reusing the existing conditional logic that renders `LOAForm`.
  const queryTypeOptions = [
    { value: "CONTRACT_STATUS_QUERY", label: "CONTRACT STATUS QUERY" },
    { value: "INVOICE", label: "INVOICE" },
    { value: "RE_APPLY_REQUEST", label: "RE APPLY REQUEST" },
    { value: "BESPOKE_PRICE_QUERY", label: "BESPOKE PRICE QUERY" },
    { value: "PRE_CREDIT_CHECK", label: "PRE-CREDIT CHECK" },
    { value: "COMMISSION_QUERY", label: "COMMISSION QUERY" },
    { value: "LOA", label: "LOA (Letter Of Authority)" },
    { value: "OBJECTION", label: "OBJECTION" },
    { value: "OTHERS", label: "OTHERS" },
  ];

  const selectedQueryTypeLabel =
    queryTypeOptions.find((option) => option.value === selectedQueryType)?.label ??
    selectedQueryType;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header with back button */}
        {/* <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mr-4 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div> */}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Create Ticket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Query Type Selector */}
              {!selectedQueryType ? (
                <div className="space-y-2">
                  <Label
                    htmlFor="queryType"
                    className="text-sm font-medium text-gray-700"
                  >
                    Query Type{" "}
                    <span className="text-red-500" aria-hidden>
                      *
                    </span>
                  </Label>
                  <div
                    id="queryType"
                    role="radiogroup"
                    aria-label="Query Type"
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {queryTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={false}
                        onClick={() => setSelectedQueryType(option.value)}
                        disabled={isQueryTypeDisabled}
                        className={[
                          "px-4 py-3 rounded-lg border-2 font-medium transition-all duration-200",
                          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "border-gray-300 bg-white text-gray-700 hover:border-primary hover:bg-primary hover:text-primary-foreground",
                        ].join(" ")}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Query Type:</span>{" "}
                    {selectedQueryTypeLabel}
                  </div>
                  {!isQueryTypeDisabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedQueryType("")}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Change
                    </button>
                  )}
                </div>
              )}

              {/* Conditional Form */}
              {!selectedQueryType ? (
                <div className="text-sm text-gray-600">
                  Select a query type to continue.
                </div>
              ) : selectedQueryType === "LOA" ? (
                <LOAForm
                  queryType={selectedQueryType}
                  initialCompanyId={initialCompanyId}
                />
              ) : (
                <TicketForm queryType={selectedQueryType} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddTicket;
