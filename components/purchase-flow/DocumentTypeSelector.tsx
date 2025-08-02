import React from "react";
import { Building, ArrowLeft } from "lucide-react";

const DocumentTypeSelector = ({ setRole, setCurrentStep, selectedCompanyName }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="py-6 px-8 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex items-center">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            <span className="font-medium">Back</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-800 ml-6">
            Purchase Bill Workflow
          </h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-2xl font-bold text-gray-800">
              Select Document Type
            </h2>
            <p className="text-gray-600 mt-1">
              Choose the type of bills you want to manage
            </p>
            <div className="mt-2 flex items-center text-sm text-blue-600">
              <Building className="w-4 h-4 mr-1" />
              Company: {selectedCompanyName || "Loading companies..."}
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button
                onClick={() => { setRole("Purchaser"); setCurrentStep(1); }}
                className="group relative flex flex-col items-center p-8 border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-5 group-hover:bg-blue-200 transition-colors duration-200 relative z-10">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1 relative z-10">
                  Purchase Bills
                </h3>
                <p className="text-gray-500 text-center mx-auto max-w-xs relative z-10">
                  Enter and manage bills for items or services you've purchased
                </p>
                <div className="mt-6 bg-blue-500 text-white px-5 py-2 rounded-full font-medium text-sm relative z-10 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                  Select
                </div>
              </button>

              <button
                onClick={() => { setRole("Seller"); setCurrentStep(1); }}
                className="group relative flex flex-col items-center p-8 border border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-5 group-hover:bg-green-200 transition-colors duration-200 relative z-10">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1 relative z-10">
                  Sales Bills
                </h3>
                <p className="text-gray-500 text-center mx-auto max-w-xs relative z-10">
                  Create and manage bills for products or services you've sold
                </p>
                <div className="mt-6 bg-green-500 text-white px-5 py-2 rounded-full font-medium text-sm relative z-10 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                  Select
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DocumentTypeSelector;