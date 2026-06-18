import React from "react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepTitles,
}) => {
  return (
    <div className="mb-6 lg:mb-8">
      {/* Step Counter */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-[#48505E]">Step</span>
          <span className="text-lg font-semibold text-[#2db9eb]">{currentStep}</span>
          <span className="text-sm font-medium text-[#48505E]">of</span>
          <span className="text-lg font-semibold text-[#48505E]">{totalSteps}</span>
        </div>
        <div className="text-sm font-medium text-[#48505E]">
          {stepTitles[currentStep - 1]}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-[#2db9eb] to-[#346fb6] h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Step Dots */}
      <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index + 1 <= currentStep
                ? "bg-[#2db9eb]"
                : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default StepIndicator; 