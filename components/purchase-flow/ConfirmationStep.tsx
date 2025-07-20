import React from "react";
import { CloudCog, ArrowLeft, FileText, CheckCircle } from "lucide-react";

const ConfirmationStep = ({ 
  files, 
  billData, 
  role, 
  setCurrentStep, 
  handleExport, 
  status, 
  error 
}) => {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          Bill Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map((file, index) => {
            const bill = billData[index] || {};
            return (
              <div
                key={file.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-50 overflow-hidden relative">
                  {file.dataUrl.includes("image/") ? (
                    <img
                      src={file.dataUrl}
                      alt={`Bill ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <FileText className="w-16 h-16" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                    Bill #{index + 1}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium text-gray-500">
                      {bill.billDate || "No date specified"}
                    </p>
                    <p className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                      {bill.invoiceNumber || "No invoice #"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-800">
                      ₹{bill.totalAmount || "0.00"}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {role === "Purchaser"
                        ? `From: ${bill.senderDetails?.name || "Unknown"}`
                        : `To: ${bill.receiverDetails?.name || "Unknown"}`
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {bill.items?.length || 0} items
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentStep(2);
                    }}
                    className="mt-4 w-full text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1.5 font-medium py-1.5 border-t border-gray-100"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
            <CloudCog className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">
            Ready to Export
          </h3>
          <p className="text-gray-600 mt-2 max-w-md mx-auto">
            All bills have been processed and are ready to be exported to
            your accounting system.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
          <button
            onClick={() => setCurrentStep(2)}
            className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2 shadow border border-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Review Bills Again
          </button>

          <button
            onClick={handleExport}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg"
          >
            <CloudCog className="w-5 h-5" />
            Export Data to Tally
          </button>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-6">
          <div className="flex flex-col items-center">
            {status && (
              <div className={`flex items-center gap-2 ${
                status.includes("failed") ? "text-red-500" : "text-green-500"
              }`}>
                {!status.includes("failed") && <CheckCircle className="w-5 h-5" />}
                <span>{status}</span>
              </div>
            )}
            {error && (
              <div className="mt-3 text-red-500 text-sm max-w-md text-center">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationStep;