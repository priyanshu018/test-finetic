import React from "react";
import { Upload, FileText, Trash2, Smartphone, CheckCircle, RefreshCw, AlertCircle, Play, ChevronRight, X } from "lucide-react";
import { toast } from "react-toastify";
import QRCode from "react-qr-code";

const FileUploadStep = ({
  files,
  setFiles,
  mobileFiles,
  setMobileFiles,
  fileInputRef,
  qrSession,
  setQRSession,
  qrSessionLoading,
  setQRSessionLoading,
  receivedFiles,
  setReceivedFiles,
  selectedCompanyName,
  setIsLoading,
  setBillData,
  setCurrentStep,
  handleFileSelect,
  handleDragOverFiles,
  handleDropFiles,
  processAllFiles,
  createQRSession
}) => {
  // Remove a file
  const removeFile = async (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
    setBillData((prev) => prev.filter((_, i) => i !== files.findIndex(f => f.id === id)));
  };

  // Remove a mobile file
  const removeMobileFile = async (key: string) => {
    if (qrSession?.sessionId) {
      await fetch(
        `https://finetic-ai-mobile.primedepthlabs.com/delete-upload/${qrSession.sessionId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key })
        }
      );
    }
    setMobileFiles((files) => files.filter((f) => f.key !== key));
  };

  // Reset QR session
  const resetQRSession = () => {
    setQRSession(null);
    setReceivedFiles(0);
    setMobileFiles([]);
  };

  return (
    <div className="space-y-8">
      <div
        onDragOver={handleDragOverFiles}
        onDrop={handleDropFiles}
        className="group relative bg-white rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-300 transition-all duration-200 py-16 px-6 text-center cursor-pointer shadow-lg hover:shadow-xl"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-6 relative z-10">
          <div className="inline-flex flex-col items-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors duration-200 group-hover:scale-110 transform">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>

            {mobileFiles.length > 0 && (
              <div className="mb-4 w-full max-w-md mx-auto">
                <div className="text-sm text-gray-600 mb-2">
                  Uploading {mobileFiles.length} file{mobileFiles.length > 1 ? 's' : ''} from mobile...
                </div>
                <div className="space-y-2">
                  {mobileFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm text-gray-700 truncate max-w-[180px]">
                        {file.key.split('/').pop()}
                      </span>
                      <span className="text-xs text-gray-500">
                        Uploading...
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                {mobileFiles.length > 0 ? 'Add More Files' : 'Drag & Drop Bills'}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Supported formats: JPG, PDF (Max 50MB each)
              </p>
              <button className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all mx-auto">
                <span>Browse Files</span>
              </button>
            </div>
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".jpg,.jpeg,.pdf,image/jpeg,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
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
                      Receiving {mobileFiles.length} file{mobileFiles.length > 1 ? 's' : ''}
                    </div>
                  )}
                  {receivedFiles > 0 && (
                    <div className="w-full text-sm text-blue-600">
                      {receivedFiles} file{receivedFiles === 1 ? "" : "s"} received from mobile
                    </div>
                  )}
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
                <div className="bg-white p-2 rounded">
                  <QRCode
                    value={qrSession.mobileUploadUrl}
                    size={180}
                    bgColor={"#FFFFFF"}
                    fgColor={"#1D4ED8"}
                  />
                </div>

                <div className="mt-3 flex flex-col items-center text-center max-w-[180px]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <a
                      href={qrSession.mobileUploadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate max-w-[120px]"
                      title={qrSession.mobileUploadUrl}
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
              <div className="w-full h-full flex items-center justify-center" style={{ height: 180, width: 180 }}>
                <Smartphone className="w-16 h-16 text-gray-300" />
              </div>
            )}
          </div>
        </div>
      </div>

      {(files.length > 0 || mobileFiles.length > 0) && (
        <div className="space-y-4 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Uploaded Files ({files.length + mobileFiles.length})
            </h3>
            {(files.length > 0 || mobileFiles.length > 0) && (
              <button
                onClick={() => {
                  setFiles([]);
                  setMobileFiles([]);
                  resetQRSession();
                }}
                className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-xl p-4 flex items-center shadow-md hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FileText className="text-blue-600 w-6 h-6" />
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-gray-400 hover:text-red-600 ml-4 transition-colors rounded-full p-1.5 hover:bg-red-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}

            {mobileFiles.map((file) => (
              <div
                key={file.key}
                className="bg-white rounded-xl p-4 flex items-start gap-4 shadow-md hover:shadow-lg transition-shadow border border-gray-100 border-l-4 border-l-blue-500"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Smartphone className="text-blue-600 w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {file.key.split("/").pop()}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                      Mobile Upload
                    </span>
                  </p>

                  {file.url.endsWith(".pdf") ? (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline text-sm"
                    >
                      View PDF
                    </a>
                  ) : (
                    <img
                      src={file.url}
                      alt="Uploaded Preview"
                      className="rounded-lg border border-gray-200 max-w-xs max-h-40 object-contain"
                    />
                  )}
                </div>

                <button
                  onClick={() => removeMobileFile(file.key)}
                  className="text-gray-400 hover:text-red-600 ml-4 transition-colors rounded-full p-1.5 hover:bg-red-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 flex justify-end">
        <button
          onClick={processAllFiles}
          disabled={files.length === 0 && mobileFiles.length === 0}
          className={`px-6 py-3 rounded-lg font-medium text-base transition-all flex items-center gap-2 ${
            files.length > 0 || mobileFiles.length > 0
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          Process Files
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default FileUploadStep;