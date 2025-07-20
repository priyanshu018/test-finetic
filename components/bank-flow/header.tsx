import { ArrowLeft, CheckCircle } from "lucide-react";

const Header = ({ currentStep, push }) => {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (currentStep === 1) {
                  push("/");
                } else {
                  window.history.back();
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                <span className="text-blue-600">AI</span> Business Statement Analyzer
              </h1>
              <p className="text-gray-600">
                Smart classification with date filtering, Excel support, search, and sorting features
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step <= currentStep
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;