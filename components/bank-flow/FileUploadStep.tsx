// // steps/FileUploadStep.jsx
// import {
//     Upload, CreditCard, ChevronRight, Loader2,
//     RefreshCw, Smartphone, Play, CheckCircle,
//     AlertCircle, X
// } from 'lucide-react';
// import QRCode from 'react-qr-code';
// import axios from 'axios';
// import { toast } from 'react-toastify';

// export default function FileUploadStep({
//     businessCategory,
//     businessSubcategory,
//     uploadedFiles,
//     setUploadedFiles,
//     mobileFiles,
//     setMobileFiles,
//     processing,
//     setProcessing,
//     qrSession,
//     setQRSession,
//     qrSessionLoading,
//     setQRSessionLoading,
//     processDocuments,
//     resetForm,
//     createQRSession,
//     processingProgress
// }) {
//     const handleFileUpload = (event) => {
//         const files = Array.from(event.target.files);
//         const validFiles = [];
//         const errors = [];

//         files.forEach(file => {
//             if (file.size > 20 * 1024 * 1024) {
//                 errors.push(`${file.name}: File too large (max 20MB)`);
//                 return;
//             }

//             const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
//             if (!['.pdf', '.xls', '.xlsx'].includes(fileExtension)) {
//                 errors.push(`${file.name}: Only PDF and Excel files (.xls, .xlsx) are supported`);
//                 return;
//             }

//             validFiles.push(file);
//         });

//         if (errors.length > 0) {
//             alert('File validation errors:\n' + errors.join('\n'));
//         }

//         setUploadedFiles(validFiles);
//     };

//     const getCategoryColor = (category) => {
//         const colors = {
//             service: 'blue',
//             manufacturing: 'green',
//             trading: 'purple'
//         };
//         return colors[category] || 'gray';
//     };

//     return (
//         <div className="bg-white rounded-xl shadow-sm p-8">
//             <div className="text-center mb-8">
//                 <CreditCard className="w-16 h-16 text-blue-600 mx-auto mb-4" />
//                 <h2 className="text-3xl font-bold text-gray-900">Upload Bank Statements</h2>
//                 <p className="text-gray-600 mt-2 text-lg">
//                     Upload PDF or Excel bank statements for {businessSubcategory} analysis
//                 </p>
//             </div>

//             <div className={`bg-gradient-to-r ${businessCategories.find(c => c.value === businessCategory)?.bgGradient} ${businessCategories.find(c => c.value === businessCategory)?.borderColor} border rounded-lg p-6 mb-8`}>
//                 <div className="flex items-center justify-center mb-4">
//                     <div className={`text-${getCategoryColor(businessCategory)}-600 mr-4`}>
//                         {businessCategories.find(c => c.value === businessCategory)?.icon}
//                     </div>
//                     <div className="text-center">
//                         <h3 className={`text-${getCategoryColor(businessCategory)}-800 font-bold text-xl`}>
//                             {businessSubcategory}
//                         </h3>
//                         <p className={`text-${getCategoryColor(businessCategory)}-700 text-sm`}>
//                             {businessCategories.find(c => c.value === businessCategory)?.label} • AI will classify with {businessSubcategory} context
//                         </p>
//                     </div>
//                 </div>
//             </div>

//             {/* ... feature highlights grid ... */}

//             <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
//                 {/* ... file upload area ... */}
//             </div>

//             {(uploadedFiles.length > 0 || mobileFiles.length > 0) && (
//                 <div className="mt-8 flex justify-between items-center">
//                     <button
//                         onClick={resetForm}
//                         className="text-gray-600 hover:text-gray-800 flex items-center"
//                     >
//                         <RefreshCw className="w-4 h-4 mr-2" />
//                         Start Over
//                     </button>
//                     <button
//                         onClick={processDocuments}
//                         disabled={processing || (uploadedFiles.length === 0 && mobileFiles.length === 0)}
//                         className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium disabled:opacity-50"
//                     >
//                         {processing ? (
//                             <>
//                                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                                 Processing...
//                             </>
//                         ) : (
//                             <>
//                                 Analyze Bank Statements
//                                 <ChevronRight className="w-4 h-4 ml-2" />
//                             </>
//                         )}
//                     </button>
//                 </div>
//             )}

//             {processing && (
//                 <div className="bg-white rounded-xl shadow-sm p-8 text-center">
//                     {/* ... processing indicator ... */}
//                 </div>
//             )}

//             <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mt-8">
//                 {/* ... mobile upload section ... */}
//             </div>
//         </div>
//     );
// }

import {
  Upload,
  CreditCard,
  ChevronRight,
  Loader2,
  RefreshCw,
  Smartphone,
  Play,
  CheckCircle,
  AlertCircle,
  X,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "react-toastify";
import axios from "axios";

const FileUploadStep = ({
  businessCategory,
  businessSubcategory,
  uploadedFiles,
  setUploadedFiles,
  mobileFiles,
  setMobileFiles,
  processing,
  setProcessing,
  qrSession,
  setQRSession,
  qrSessionLoading,
  setQRSessionLoading,
  processDocuments,
  resetForm,
  createQRSession,
  processingProgress,
  handleFileUpload,
  businessCategories,
}) => {
  const getCategoryColor = (category) => {
    const colors = {
      service: "blue",
      manufacturing: "green",
      trading: "purple",
    };
    return colors[category] || "gray";
  };

  const removeMobileFile = async (file, index) => {
    try {
      await axios.delete(
        `https://finetic-ai-mobile.primedepthlabs.com/delete-upload/${qrSession?.sessionId}`,
        {
          data: { key: file.key },
          headers: { "Content-Type": "application/json" },
        }
      );
      setMobileFiles((files) => files.filter((_, i) => i !== index));
    } catch (error) {
      toast.error(`Failed to remove file: ${error.message}`);
    }
  };

  const resetQRSession = () => {
    setQRSession(null);
    setMobileFiles([]);
  };

  const currentCategory = businessCategories.find(
    (c) => c.value === businessCategory
  );

  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="text-center mb-8">
        <CreditCard className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900">Upload Bank Statements</h2>
        <p className="text-gray-600 mt-2 text-lg">
          Upload PDF or Excel bank statements for {businessSubcategory} analysis
        </p>
      </div>
      {currentCategory && (
        <div
          className={`bg-gradient-to-r ${currentCategory.bgGradient} ${currentCategory.borderColor} border rounded-lg p-6 mb-8`}
        >
          <div className="flex items-center justify-center mb-4">
            <div className={`text-${getCategoryColor(businessCategory)}-600 mr-4`}>
              {currentCategory.icon}
            </div>
            <div className="text-center">
              <h3 className={`text-${getCategoryColor(businessCategory)}-800 font-bold text-xl`}>
                {businessSubcategory}
              </h3>
              <p className={`text-${getCategoryColor(businessCategory)}-700 text-sm`}>
                {currentCategory.label} • AI will classify with {businessSubcategory} context
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <ArrowDownCircle className="w-8 h-8 text-red-600 mr-3" />
            <h3 className="text-lg font-semibold text-red-900">Expense Analysis</h3>
          </div>
          <ul className="space-y-2 text-sm text-red-800">
            <li>• Fixed Assets & Capital Goods</li>
            <li>• Direct Business Expenses</li>
            <li>• Administrative Expenses</li>
            <li>• Cash Withdrawals & ATM</li>
          </ul>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <ArrowUpCircle className="w-8 h-8 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-green-900">Income Analysis</h3>
          </div>
          <ul className="space-y-2 text-sm text-green-800">
            <li>• Primary Business Revenue</li>
            <li>• Secondary Income Sources</li>
            <li>• Cash Deposits</li>
            <li>• Interest & Other Income</li>
          </ul>
        </div>
      </div>
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <div className="mb-4">
          <label className="cursor-pointer">
            <span className="text-blue-600 hover:text-blue-700 font-medium text-lg">
              Click to upload bank statement files
            </span>
            <input
              type="file"
              multiple
              accept=".pdf,.xls,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <span className="text-gray-600"> or drag and drop</span>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Requirements:</p>
          <div className="space-y-1 text-sm text-gray-600">
            <p>📁 <strong>Format:</strong> PDF or Excel files (.xls, .xlsx)</p>
            <p>📏 <strong>Size limit:</strong> 20MB per file</p>
            <p>📄 <strong>Content:</strong> Bank statements with transaction details</p>
            <p>🤖 <strong>AI:</strong> DeepSeek with {businessSubcategory} context</p>
          </div>
        </div>
        {(uploadedFiles.length > 0 || mobileFiles.length > 0) && (
          <div className="mt-8 text-left">
            <h4 className="font-medium text-gray-900 mb-4 text-center">
              📁 Uploaded Files ({uploadedFiles.length + mobileFiles.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {uploadedFiles.map((file, index) => (
                <div
                  key={`desktop-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-3">📄</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-48">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setUploadedFiles((files) => files.filter((_, i) => i !== index))
                    }
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {mobileFiles.map((file, index) => (
                <div
                  key={`mobile-${index}`}
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-3">📱</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-48">
                        {file.key.split("/").pop()}
                      </p>
                      <p className="text-xs text-blue-500">Mobile Upload</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeMobileFile(file, index)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {(uploadedFiles.length > 0 || mobileFiles.length > 0) && (
        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={resetForm}
            className="text-gray-600 hover:text-gray-800 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Start Over
          </button>
          <button
            onClick={processDocuments}
            disabled={processing || (uploadedFiles.length === 0 && mobileFiles.length === 0)}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium disabled:opacity-50"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Analyze Bank Statements
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      )}
      {processing && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center mt-8">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              {currentCategory?.icon}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Processing {businessSubcategory} Statements
          </h2>
          <p className="text-gray-600 mb-6">
            DeepSeek AI is analyzing your bank statements (PDF/Excel) with{" "}
            {businessSubcategory} business context...
          </p>
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{processingProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${processingProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mt-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Scan Bills with Your Phone
            </h3>
            <p className="text-gray-500 mb-4">
              Scan this QR code with your phone's camera to upload bills
              directly from your mobile device
            </p>
            <div className="flex flex-wrap gap-2">
              {qrSession ? (
                <>
                  <div className="flex items-center text-sm text-green-600 mb-2">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Mobile session active
                  </div>
                  {mobileFiles.length > 0 && (
                    <div className="flex items-center text-sm text-blue-600">
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      Receiving {mobileFiles.length} file
                      {mobileFiles.length > 1 ? "s" : ""}
                    </div>
                  )}
                  <button
                    onClick={resetQRSession}
                    className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Reset Session
                  </button>
                </>
              ) : (
                <>
                  <div className="text-sm text-gray-500 italic mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1 text-amber-500" />
                    No active session
                  </div>
                  <button
                    onClick={createQRSession}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                  >
                    <Play className="w-4 h-4" />
                    Start Mobile Session
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-white p-3 rounded-xl border border-blue-100 relative">
            {qrSessionLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-xl">
                <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
            {qrSession ? (
              <div className="flex flex-col items-center">
                <QRCode
                  value={qrSession.mobileUploadUrl}
                  size={180}
                  bgColor={"#FFFFFF"}
                  fgColor={"#1D4ED8"}
                  style={{ height: 180, maxWidth: "100%", width: "100%" }}
                />
                <div className="mt-3 flex flex-col items-center text-center max-w-[180px]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <a
                      href={qrSession.mobileUploadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate max-w-[120px]"
                    >
                      {qrSession.mobileUploadUrl}
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(qrSession.mobileUploadUrl);
                        toast.success("Link copied to clipboard!", {
                          position: "top-center",
                          autoClose: 2000,
                        });
                      }}
                      className="text-blue-500 hover:text-blue-700 text-xs font-medium px-2 py-1 border border-blue-100 rounded-md"
                    >
                      Copy Upload Link
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ height: 180, width: 180 }}
              >
                <Smartphone className="w-16 h-16 text-gray-300" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadStep;