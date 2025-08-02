import React from "react";
import { Check } from "lucide-react";

interface StepperProps {
  steps: string[];
  currentStep: number;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-10">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step} className="flex-1 relative">
            {/* Connector line between steps */}
            {index > 0 && (
              <div className={`absolute top-5 left-0 w-full h-0.5 z-0 ${
                currentStep >= index ? "bg-blue-600" : "bg-gray-200"
              }`} style={{ left: "-50%" }}></div>
            )}
            
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 ${
                  currentStep >= index
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {currentStep > index ? (
                  <Check className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              <div
                className={`mt-2 text-center ${
                  currentStep >= index
                    ? "text-gray-800 font-medium"
                    : "text-gray-400"
                }`}
              >
                <span className="hidden md:block">{step}</span>
                <span className="md:hidden">{step.split(" ")[0]}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stepper;