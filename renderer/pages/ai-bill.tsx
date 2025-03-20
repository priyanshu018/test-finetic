// // components/BillWorkflow.tsx
// import React, { useState, useRef, useEffect } from "react";
// import {
//     FiUpload,
//     FiFile,
//     FiX,
//     FiArrowLeft,
//     FiArrowRight,
//     FiCheck
// } from "react-icons/fi";
// import axios from "axios";
// import { BackendLink } from "../../service/api"
// import { useRouter } from "next/router"; // or next/navigation in app router
// import { ChevronLeft } from "lucide-react";
// /**
//  * ZoomableImage
//  * 
//  * (Same as your existing component)
//  */

// declare global {
//     interface Window {
//       electronAPI: {
//         createCgstLedger: (ledgerName: string) => Promise<{ success: boolean; ledgerName?: string; error?: string }>;
//       };
//     }
//   }

// function ZoomableImage({ src, alt, style }) {
//     const [scale, setScale] = useState(1);
//     const [offset, setOffset] = useState({ x: 0, y: 0 });
//     const [isDragging, setIsDragging] = useState(false);
//     const startDragRef = useRef({ x: 0, y: 0 });
//     const startOffsetRef = useRef({ x: 0, y: 0 });

//     const handleWheel = (e) => {
//         e.preventDefault();
//         const delta = e.deltaY < 0 ? 0.1 : -0.1;
//         setScale((prev) => Math.min(Math.max(prev + delta, 1), 3));
//     };

//     const handleMouseDown = (e) => {
//         e.preventDefault();
//         setIsDragging(true);
//         startDragRef.current = { x: e.clientX, y: e.clientY };
//         startOffsetRef.current = { ...offset };
//     };

//     const handleMouseMove = (e) => {
//         if (!isDragging) return;
//         const dx = e.clientX - startDragRef.current.x;
//         const dy = e.clientY - startDragRef.current.y;
//         setOffset({
//             x: startOffsetRef.current.x + dx / scale,
//             y: startOffsetRef.current.y + dy / scale
//         });
//     };

//     const handleMouseUp = () => {
//         setIsDragging(false);
//     };

//     useEffect(() => {
//         if (isDragging) {
//             document.addEventListener("mousemove", handleMouseMove);
//             document.addEventListener("mouseup", handleMouseUp);
//         } else {
//             document.removeEventListener("mousemove", handleMouseMove);
//             document.removeEventListener("mouseup", handleMouseUp);
//         }
//         return () => {
//             document.removeEventListener("mousemove", handleMouseMove);
//             document.removeEventListener("mouseup", handleMouseUp);
//         };
//     }, [isDragging]);

//     const handleDoubleClick = () => {
//         setScale(1);
//         setOffset({ x: 0, y: 0 });
//     };

//     return (
//         <div
//             onWheel={handleWheel}
//             onMouseDown={handleMouseDown}
//             onDoubleClick={handleDoubleClick}
//             style={{
//                 overflow: "hidden",
//                 cursor: isDragging ? "grabbing" : scale > 1 ? "grab" : "zoom-in",
//                 ...style
//             }}
//         >
//             <img
//                 src={src}
//                 alt={alt}
//                 draggable={false}
//                 style={{
//                     transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
//                     transformOrigin: "center center",
//                     transition: isDragging ? "none" : "transform 0.3s ease",
//                     userSelect: "none",
//                     pointerEvents: "none",
//                     width: "100%",
//                     height: "100%",
//                     objectFit: "contain"
//                 }}
//             />
//         </div>
//     );
// }

// /**
//  * formatTime
//  * 
//  * (Same as your existing function)
//  */
// function formatTime(ms) {
//     const totalSeconds = Math.floor(ms / 1000);
//     const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
//     const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
//     const seconds = String(totalSeconds % 60).padStart(2, "0");
//     return `${hours}:${minutes}:${seconds}`;
// }

// /**
//  * LoadingScreen
//  * 
//  * (Same as your existing component)
//  */
// export function LoadingScreen({ isLoading }) {
//     const steps = [
//         "Extracting Necessary Data...",
//         "Processing Image with AI Model...",
//         "Converting Data into Text...",
//         "Finalizing Results..."
//     ];
//     const [currentStep, setCurrentStep] = useState(0);
//     const [elapsed, setElapsed] = useState(0);
//     const router = useRouter();  // or useRouter from next/navigation if on Next 13

//     useEffect(() => {
//         const interval = setInterval(() => {
//             setCurrentStep((prev) => (prev + 1) % steps.length);
//         }, 2000);
//         return () => clearInterval(interval);
//     }, [steps.length]);

//     useEffect(() => {
//         if (isLoading) {
//             const startTime = Date.now();
//             const timer = setInterval(() => {
//                 setElapsed(Date.now() - startTime);
//             }, 1000);
//             return () => clearInterval(timer);
//         }
//     }, [isLoading]);

//     if (!isLoading) return null;

//     return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
//             <div className="flex flex-col items-center space-y-6">
//                 <div className="relative w-24 h-24">
//                     <div className="absolute inset-0 w-20 h-20 mx-auto my-auto border-4 border-t-transparent border-l-transparent border-r-white border-b-white rounded-full animate-spin-medium" />
//                 </div>
//                 <p
//                     key={currentStep}
//                     className="text-2xl font-bold text-white tracking-wider transition-opacity duration-500 ease-in-out"
//                 >
//                     {steps[currentStep]}
//                 </p>
//                 <div className="text-white text-xl font-bold">
//                     Elapsed: {formatTime(elapsed)}
//                 </div>
//             </div>
//         </div>
//     );
// }

// /**
//  * BillWorkflow
//  * 
//  * (Your main multi-step AI Bill workflow)
//  */
// export default function BillWorkflow() {
//     // Steps: 0 = Upload, 1 = Verify/Edit, 2 = Confirm
//     const [currentStep, setCurrentStep] = useState(0);
//     const [files, setFiles] = useState([]);
//     const [billData, setBillData] = useState([]);
//     const [currentBillIndex, setCurrentBillIndex] = useState(0);
//     const fileInputRef = useRef(null);
//     const [isDraggingFile, setIsDraggingFile] = useState(false);
//     const [isLoading, setIsLoading] = useState(false);
//     const [status, setStatus] = useState('Click to send keys to Tally');
//     const [error, setError] = useState<string | null>(null);


//     const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
//     const MAX_FILE_SIZE_MB = 50;
//     const stepsArray = ["Upload Bills", "Verify Data", "Confirm & Export"];

//     useEffect(() => {
//         return () => files.forEach((file) => URL.revokeObjectURL(file.dataUrl));
//     }, [files]);

//     const readFile = (file) =>
//         new Promise((resolve, reject) => {
//             const reader = new FileReader();
//             reader.onload = () => resolve(reader.result);
//             reader.onerror = (error) => reject(error);
//             reader.readAsDataURL(file);
//         });

//     const processFiles = async (filesToProcess) => {
//         const validFiles = filesToProcess.filter(
//             (file) =>
//                 allowedTypes.includes(file.type) &&
//                 file.size <= MAX_FILE_SIZE_MB * 1024 * 1024
//         );

//         if (validFiles.length === 0) {
//             alert(
//                 `Please upload valid files (JPEG, PNG, PDF) under ${MAX_FILE_SIZE_MB}MB`
//             );
//             return;
//         }

//         const filesWithPreview = await Promise.all(
//             validFiles.map(async (file) => ({
//                 id: Math.random().toString(36).substr(2, 9),
//                 name: file.name,
//                 dataUrl: await readFile(file),
//                 file
//             }))
//         );
//         setFiles((prev) => [...prev, ...filesWithPreview]);
//     };

//     const handleFileSelect = async (e) => {
//         const selectedFiles = Array.from(e.target.files || []);
//         processFiles(selectedFiles);
//     };

//     const handleDragOverFiles = (e) => {
//         e.preventDefault();
//         setIsDraggingFile(true);
//     };

//     const handleDragLeaveFiles = () => setIsDraggingFile(false);

//     const handleDropFiles = async (e) => {
//         e.preventDefault();
//         setIsDraggingFile(false);
//         const droppedFiles = Array.from(e.dataTransfer.files);
//         processFiles(droppedFiles);
//     };

//     const handleNextStep = async () => {
//         setIsLoading(true);
//         try {
//             const requests = files.map(async (fileObj) => {
//                 const formData = new FormData();
//                 formData.append("file", fileObj.file);
//                 const response = await axios.post(
//                     `${BackendLink}/extract-bill-details`,
//                     formData,
//                     {
//                         headers: {
//                             "Content-Type":
//                                 "multipart/form-data; boundary=---011000010111000001101001"
//                         }
//                     }
//                 );
//                 console.log(response.data, "data");
//                 return response.data;
//             });

//             const results = await Promise.all(requests);
//             setBillData(results);
//             setCurrentStep(1); // Move to Verify/Edit step
//         } catch (error) {
//             console.error("Error extracting bill details:", error);
//             alert("Error extracting bill details. Please try again.");
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleDataChange = (field, value) => {
//         const newData = [...billData];
//         newData[currentBillIndex] = {
//             ...newData[currentBillIndex],
//             [field]: value
//         };
//         setBillData(newData);
//     };

//     const handleItemChange = (billIndex, itemIndex, field, value) => {
//         const newData = [...billData];
//         const updatedItems = [...newData[billIndex].items];
//         updatedItems[itemIndex] = { ...updatedItems[itemIndex], [field]: value };
//         newData[billIndex].items = updatedItems;
//         setBillData(newData);
//     };

//     const addItem = (billIndex) => {
//         const newItem = {
//             Product: "",
//             QTY: "",
//             FREE: "",
//             HSN: "",
//             MRP: "",
//             RATE: "",
//             DIS: "",
//             "G AMT": "",
//             SGST: "",
//             CGST: "",
//             "NET AMT": ""
//         };
//         const newData = [...billData];
//         if (!newData[billIndex].items) {
//             newData[billIndex].items = [];
//         }
//         newData[billIndex].items.push(newItem);
//         setBillData(newData);
//     };

//     const removeItem = (billIndex, itemIndex) => {
//         const newData = [...billData];
//         newData[billIndex].items.splice(itemIndex, 1);
//         setBillData(newData);
//     };

//     const handleProductDragStart = (e, billIndex, itemIndex) => {
//         e.dataTransfer.setData("text/plain", itemIndex);
//     };

//     const handleProductDragOver = (e) => {
//         e.preventDefault();
//     };

//     const handleProductDrop = (e, billIndex, dropIndex) => {
//         e.preventDefault();
//         const draggedIndex = Number(e.dataTransfer.getData("text/plain"));
//         if (draggedIndex === dropIndex) return;
//         const newData = [...billData];
//         const items = newData[billIndex].items;
//         const temp = items[draggedIndex].Product;
//         items[draggedIndex].Product = items[dropIndex].Product;
//         items[dropIndex].Product = temp;
//         newData[billIndex].items = items;
//         setBillData(newData);
//     };

//     const removeFile = (id) => {
//         const indexToRemove = files.findIndex((f) => f.id === id);
//         setFiles((prev) => prev.filter((file) => file.id !== id));
//         setBillData((prev) => prev.filter((_, i) => i !== indexToRemove));
//     };

//     // const handleExport = () => {
//     //     console.log("Exporting data:", billData);
//     //     alert("Export completed successfully!");
//     // };

//     const handleExport = async () => {
//         setIsLoading(true);
//         setStatus('Exporting data and sending keys to Tally...');
//         setError(null);

//         try {
//             // Step 1: Export data (e.g., save to a file or send to an API)
//             console.log("Exporting data:", billData);
//             // Add your export logic here (e.g., save to a file, send to an API, etc.)


//             await window.electron.createCgstLedger('Cgst 2.5+5');
//             await window.electron.createCgstLedger('Cgst 6+5');
//             await window.electron.createCgstLedger('Cgst 9+5');
//             await window.electron.createCgstLedger('Cgst 14+5');

//             // Step 3: Notify the user
//             setStatus('Export completed successfully and keys sent to Tally!');
//             alert('Export completed successfully and keys sent to Tally!');
//         } catch (error) {
//             console.error('Error during export or sending keys:', error);
//             setStatus('Failed to export or send keys to Tally');
//             setError(error.message);
//             alert(`Error: ${error.message}`);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const fixRowCalculation = (billIndex, itemIndex) => {
//         const newData = [...billData];
//         const item = newData[billIndex].items[itemIndex];

//         const qty = parseFloat(item.QTY) || 0;
//         const rate = parseFloat(item.RATE) || 0;
//         const discount = parseFloat(item.DIS) || 0;
//         const sgstPerUnit = parseFloat(item.SGST) || 0;
//         const cgstPerUnit = sgstPerUnit;

//         const standardGross =
//             ((qty * rate * 100) - (qty * discount * 100)) / 100;

//         const totalGST = qty * (sgstPerUnit + cgstPerUnit);
//         const newNetAmt = standardGross + totalGST;

//         item["G AMT"] = standardGross.toFixed(2);
//         item.SGST = sgstPerUnit.toFixed(2);
//         item.CGST = cgstPerUnit.toFixed(2);
//         item["NET AMT"] = newNetAmt.toFixed(2);

//         newData[billIndex].items[itemIndex] = item;
//         setBillData(newData);
//     };

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 relative">
//             <LoadingScreen isLoading={isLoading} />
//             <button onClick={() => window.history.back()} className="inline-flex  absolute top-7 items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800">
//                 <ChevronLeft className="h-4 w-4 mr-1" />
//                 Back
//             </button>
//             <div className="mx-auto space-y-2">
//                 {/* Stepper */}
//                 <div className="flex justify-center mb-2">
//                     {stepsArray.map((step, index) => (
//                         <div key={step} className="flex items-center">
//                             <div
//                                 className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= index ? "bg-blue-600 text-white" : "bg-gray-300"
//                                     } transition-colors duration-300`}
//                             >
//                                 {index + 1}
//                             </div>
//                             <div
//                                 className={`ml-2 ${currentStep >= index ? "text-gray-800" : "text-gray-400"
//                                     }`}
//                             >
//                                 {step}
//                             </div>
//                             {index < stepsArray.length - 1 && (
//                                 <div
//                                     className={`w-16 h-1 mx-2 ${currentStep > index ? "bg-blue-600" : "bg-gray-300"
//                                         }`}
//                                 />
//                             )}
//                         </div>
//                     ))}
//                 </div>

//                 {/* Step 0: File Upload */}
//                 {currentStep === 0 && (
//                     <div className="space-y-6">
//                         <div
//                             onDragOver={handleDragOverFiles}
//                             onDragLeave={handleDragLeaveFiles}
//                             onDrop={handleDropFiles}
//                             className={`group relative bg-white rounded-2xl border-3 border-dashed ${isDraggingFile ? "border-blue-500 bg-blue-50" : "border-gray-300"
//                                 } transition-all duration-200 p-12 text-center cursor-pointer`}
//                             onClick={() => fileInputRef.current?.click()}
//                         >
//                             <div className="space-y-6">
//                                 <div className="inline-block p-6 bg-blue-100 rounded-full">
//                                     <FiUpload className="text-4xl text-blue-600" />
//                                 </div>
//                                 <div className="space-y-2">
//                                     <p className="text-2xl font-semibold text-gray-800">
//                                         Drag & Drop Bills or Click to Browse
//                                     </p>
//                                     <p className="text-gray-500 text-sm">
//                                         Supported formats: JPG, PNG, PDF (Max {MAX_FILE_SIZE_MB}MB each)
//                                     </p>
//                                 </div>
//                             </div>
//                             <input
//                                 type="file"
//                                 ref={fileInputRef}
//                                 multiple
//                                 accept="image/*,application/pdf"
//                                 onChange={handleFileSelect}
//                                 className="hidden"
//                             />
//                         </div>

//                         {files.length > 0 && (
//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                 {files.map((file) => (
//                                     <div
//                                         key={file.id}
//                                         className="bg-white rounded-lg p-4 flex items-center shadow-sm"
//                                     >
//                                         <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
//                                             <FiFile className="text-blue-600" />
//                                         </div>
//                                         <div className="ml-4 flex-1">
//                                             <p className="font-medium text-gray-800 truncate">
//                                                 {file.name}
//                                             </p>
//                                             <p className="text-sm text-gray-500">
//                                                 {(file.file.size / 1024 / 1024).toFixed(2)} MB
//                                             </p>
//                                         </div>
//                                         <button
//                                             onClick={() => removeFile(file.id)}
//                                             className="text-gray-400 hover:text-red-600 ml-4"
//                                         >
//                                             <FiX className="w-5 h-5" />
//                                         </button>
//                                     </div>
//                                 ))}
//                             </div>
//                         )}

//                         <div className="flex justify-end gap-4 mt-8">
//                             <button
//                                 onClick={handleNextStep}
//                                 disabled={files.length === 0}
//                                 className={`px-6 py-3 rounded-lg font-medium transition-all ${files.length
//                                     ? "bg-blue-600 text-white hover:bg-blue-700"
//                                     : "bg-gray-200 text-gray-500 cursor-not-allowed"
//                                     } flex items-center gap-2`}
//                             >
//                                 Next Step
//                                 <FiArrowRight className="w-5 h-5" />
//                             </button>
//                         </div>
//                     </div>
//                 )}

//                 {/* Step 1: Data Verification / Editing */}
//                 {currentStep === 1 && (
//                     <div className="space-y-4">
//                         <div className="sticky top-0 bg-white p-4 shadow-md z-10">
//                             <div
//                                 className="bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center"
//                                 style={{ height: "14rem" }}
//                             >
//                                 {files[currentBillIndex]?.dataUrl?.includes("image/") ? (
//                                     <ZoomableImage
//                                         src={files[currentBillIndex].dataUrl}
//                                         alt={`Bill ${currentBillIndex + 1}`}
//                                         style={{ width: "100%", height: "100%" }}
//                                     />
//                                 ) : (
//                                     <div className="text-center text-gray-500">
//                                         <FiFile className="w-16 h-16 mx-auto mb-4" />
//                                         <p>PDF Preview Not Available</p>
//                                     </div>
//                                 )}
//                             </div>
//                             <div className="flex text-black items-center justify-between mt-2">
//                                 <button
//                                     onClick={() =>
//                                         setCurrentBillIndex((prev) => Math.max(0, prev - 1))
//                                     }
//                                     disabled={currentBillIndex === 0}
//                                     className="text-gray-600 hover:text-blue-600 disabled:text-gray-300"
//                                 >
//                                     <FiArrowLeft className="w-6 h-6" />
//                                 </button>
//                                 <span className="text-gray-600">
//                                     Bill {currentBillIndex + 1} of {files.length}
//                                 </span>
//                                 <button
//                                     onClick={() => {
//                                         if (currentBillIndex === files.length - 1)
//                                             setCurrentStep(2);
//                                         else setCurrentBillIndex((prev) => prev + 1);
//                                     }}
//                                     className="text-gray-600 hover:text-blue-600"
//                                 >
//                                     <FiArrowRight className="w-6 h-6" />
//                                 </button>
//                             </div>
//                         </div>

//                         <div className="p-4 text-black bg-white rounded-md shadow-sm">
//                             <div className="grid grid-cols-2 gap-4">
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700">
//                                         GST Number
//                                     </label>
//                                     <input
//                                         type="text"
//                                         value={billData[currentBillIndex]?.gstNumber || ""}
//                                         onChange={(e) =>
//                                             handleDataChange("gstNumber", e.target.value)
//                                         }
//                                         className="mt-1 block w-full border border-gray-300 rounded-md p-2"
//                                         style={{
//                                             backgroundColor:
//                                                 billData[currentBillIndex]?.gstNumber &&
//                                                     billData[currentBillIndex]?.gstNumber.length > 15
//                                                     ? "#ffffe0"
//                                                     : "white"
//                                         }}
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700">
//                                         Invoice Number
//                                     </label>
//                                     <input
//                                         type="text"
//                                         value={billData[currentBillIndex]?.invoiceNumber || ""}
//                                         onChange={(e) =>
//                                             handleDataChange("invoiceNumber", e.target.value)
//                                         }
//                                         className="mt-1 block w-full border border-gray-300 rounded-md p-2"
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700">
//                                         Bill Date
//                                     </label>
//                                     <input
//                                         type="text"
//                                         value={billData[currentBillIndex]?.billDate || ""}
//                                         onChange={(e) =>
//                                             handleDataChange("billDate", e.target.value)
//                                         }
//                                         className="mt-1 block w-full border border-gray-300 rounded-md p-2"
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700">
//                                         Due Date
//                                     </label>
//                                     <input
//                                         type="text"
//                                         value={billData[currentBillIndex]?.dueDate || ""}
//                                         onChange={(e) =>
//                                             handleDataChange("dueDate", e.target.value)
//                                         }
//                                         className="mt-1 block w-full border border-gray-300 rounded-md p-2"
//                                     />
//                                 </div>
//                                 <div className="col-span-2">
//                                     <label className="block text-sm font-medium text-gray-700">
//                                         SalesMan
//                                     </label>
//                                     <input
//                                         type="text"
//                                         value={billData[currentBillIndex]?.salesMan || ""}
//                                         onChange={(e) =>
//                                             handleDataChange("salesMan", e.target.value)
//                                         }
//                                         className="mt-1 block w-full border border-gray-300 rounded-md p-2"
//                                     />
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="p-4 text-black bg-white rounded-md shadow-sm">
//                             <h4 className="text-lg font-medium text-gray-700 mb-2">Items</h4>
//                             <div className="overflow-auto">
//                                 <table className="min-w-full divide-y divide-gray-200">
//                                     <thead>
//                                         <tr>
//                                             {[
//                                                 "Product",
//                                                 "QTY",
//                                                 "FREE",
//                                                 "HSN",
//                                                 "MRP",
//                                                 "RATE",
//                                                 "DIS",
//                                                 "G AMT",
//                                                 "SGST",
//                                                 "CGST",
//                                                 "NET AMT",
//                                                 "Actions"
//                                             ].map((head) => (
//                                                 <th
//                                                     key={head}
//                                                     className="px-2 py-1 text-left text-xs font-medium text-gray-500 whitespace-nowrap"
//                                                 >
//                                                     {head}
//                                                 </th>
//                                             ))}
//                                         </tr>
//                                     </thead>
//                                     <tbody className="divide-y divide-gray-200">
//                                         {billData[currentBillIndex]?.items?.map((item, idx) => {
//                                             const qty = parseFloat(item.QTY);
//                                             const rate = parseFloat(item.RATE);
//                                             const gAmt = parseFloat(item["G AMT"]);
//                                             const discount = parseFloat(item.DIS) || 0;
//                                             const netAmt = parseFloat(item["NET AMT"]);
//                                             const calcGross =
//                                                 item.QTY && item.RATE ? qty * rate - qty * discount : null;
//                                             const calcNet =
//                                                 item["G AMT"] && (item["NET AMT"] || item["NET AMT"] === 0)
//                                                     ? gAmt + qty * (parseFloat(item.SGST) + parseFloat(item.CGST))
//                                                     : null;
//                                             const grossValid =
//                                                 item.QTY && item.RATE && item["G AMT"]
//                                                     ? calcGross !== null && Math.abs(calcGross - gAmt) < 0.01
//                                                     : true;
//                                             const netValid =
//                                                 item["G AMT"] &&
//                                                     (item["NET AMT"] || item["NET AMT"] === 0)
//                                                     ? calcNet !== null && Math.abs(calcNet - netAmt) < 0.01
//                                                     : true;
//                                             const rowHasError = !grossValid || !netValid;

//                                             return (
//                                                 <tr
//                                                     key={idx}
//                                                     style={{
//                                                         backgroundColor: rowHasError ? "#ffffe0" : undefined
//                                                     }}
//                                                     className="hover:bg-gray-50"
//                                                 >
//                                                     {/* Product (draggable) */}
//                                                     <td
//                                                         className="px-2 w-[350px] py-1"
//                                                         draggable
//                                                         onDragStart={(e) =>
//                                                             handleProductDragStart(e, currentBillIndex, idx)
//                                                         }
//                                                         onDragOver={handleProductDragOver}
//                                                         onDrop={(e) =>
//                                                             handleProductDrop(e, currentBillIndex, idx)
//                                                         }
//                                                     >
//                                                         <input
//                                                             type="text"
//                                                             value={item.Product || ""}
//                                                             onChange={(e) =>
//                                                                 handleItemChange(
//                                                                     currentBillIndex,
//                                                                     idx,
//                                                                     "Product",
//                                                                     e.target.value
//                                                                 )
//                                                             }
//                                                             className="w-full border border-gray-300 rounded-md p-1"
//                                                         />
//                                                     </td>
//                                                     {/* QTY */}
//                                                     <td className="px-2 w-[70px] py-1">
//                                                         <input
//                                                             type="text"
//                                                             value={item.QTY || ""}
//                                                             onChange={(e) =>
//                                                                 handleItemChange(
//                                                                     currentBillIndex,
//                                                                     idx,
//                                                                     "QTY",
//                                                                     e.target.value
//                                                                 )
//                                                             }
//                                                             className="w-full border border-gray-300 rounded-md p-1"
//                                                         />
//                                                     </td>
//                                                     {/* FREE */}
//                                                     <td className="px-2 w-[70px] py-1">
//                                                         <input
//                                                             type="text"
//                                                             value={item.FREE || ""}
//                                                             onChange={(e) =>
//                                                                 handleItemChange(
//                                                                     currentBillIndex,
//                                                                     idx,
//                                                                     "FREE",
//                                                                     e.target.value
//                                                                 )
//                                                             }
//                                                             className="w-full border border-gray-300 rounded-md p-1"
//                                                         />
//                                                     </td>
//                                                     {/* HSN */}
//                                                     <td className="px-2 w-[110px] py-1">
//                                                         <input
//                                                             type="text"
//                                                             value={item.HSN || ""}
//                                                             onChange={(e) =>
//                                                                 handleItemChange(
//                                                                     currentBillIndex,
//                                                                     idx,
//                                                                     "HSN",
//                                                                     e.target.value
//                                                                 )
//                                                             }
//                                                             className="w-full border border-gray-300 rounded-md p-1"
//                                                         />
//                                                     </td>
//                                                     {/* MRP */}
//                                                     <td className="px-2 w-[69px] py-1">
//                                                         <input
//                                                             type="number"
//                                                             value={item.MRP || ""}
//                                                             onChange={(e) =>
//                                                                 handleItemChange(
//                                                                     currentBillIndex,
//                                                                     idx,
//                                                                     "MRP",
//                                                                     e.target.value
//                                                                 )
//                                                             }
//                                                             className="w-full border border-gray-300 rounded-md p-1"
//                                                         />
//                                                     </td>
//                                                     {/* RATE */}
//                                                     <td className="px-2 py-1">
//                                                         <input
//                                                             type="number"
//                                                             value={item.RATE || ""}
//                                                             onChange={(e) =>
//                                                                 handleItemChange(
//                                                                     currentBillIndex,
//                                                                     idx,
//                                                                     "RATE",
//                                                                     e.target.value
//                                                                 )
//                                                             }
//                                                             className="w-full border border-gray-300 rounded-md p-1"
//                                                         />
//                                                     </td>
//                                                     {/* DIS */}
//                                                     <td className="px-2 py-1">
//                                                         <input
//                                                             type="text"
//                                                             value={item.DIS || ""}
//                                                             onChange={(e) =>
//                                                                 handleItemChange(
//                                                                     currentBillIndex,
//                                                                     idx,
//                                                                     "DIS",
//                                                                     e.target.value
//                                                                 )
//                                                             }
//                                                             className="w-full border border-gray-300 rounded-md p-1"
//                                                         />
//                                                     </td>
//                                                     {/* G AMT */}
//                                                     <td className="px-2 py-1">
//                                                         <input
//                                                             type="number"
//                                                             value={item["G AMT"] || ""}
//                                                             onChange={(e) =>
//                                                                 handleItemChange(
//                                                                     currentBillIndex,
//                                                                     idx,
//                                                                     "G AMT",
//                                                                     e.target.value
//                                                                 )
//                                                             }
//                                                             className="w-full border border-gray-300 rounded-md p-1"
//                                                         />
//                                                     </td>
//                                                     {/* SGST */}
//                                                     <td className="px-2 py-1">
//                                                         <input
//                                                             type="text"
//                                                             value={item.SGST || ""}
//                                                             onChange={(e) =>
//                                                                 handleItemChange(
//                                                                     currentBillIndex,
//                                                                     idx,
//                                                                     "SGST",
//                                                                     e.target.value
//                                                                 )
//                                                             }
//                                                             className="w-full border border-gray-300 rounded-md p-1"
//                                                             style={{ backgroundColor: "white" }}
//                                                         />
//                                                     </td>
//                                                     {/* CGST */}
//                                                     <td className="px-2 py-1">
//                                                         <input
//                                                             type="text"
//                                                             value={item.CGST || ""}
//                                                             onChange={(e) =>
//                                                                 handleItemChange(
//                                                                     currentBillIndex,
//                                                                     idx,
//                                                                     "CGST",
//                                                                     e.target.value
//                                                                 )
//                                                             }
//                                                             className="w-full border border-gray-300 rounded-md p-1"
//                                                             style={{ backgroundColor: "white" }}
//                                                         />
//                                                     </td>
//                                                     {/* NET AMT */}
//                                                     <td className="px-2 py-1">
//                                                         <input
//                                                             type="number"
//                                                             value={item["NET AMT"] || ""}
//                                                             onChange={(e) =>
//                                                                 handleItemChange(
//                                                                     currentBillIndex,
//                                                                     idx,
//                                                                     "NET AMT",
//                                                                     e.target.value
//                                                                 )
//                                                             }
//                                                             className="w-full border border-gray-300 rounded-md p-1"
//                                                         />
//                                                     </td>
//                                                     {/* Actions Cell */}
//                                                     <td className="px-2 py-1 flex items-center">
//                                                         <button
//                                                             onClick={() => removeItem(currentBillIndex, idx)}
//                                                             className="text-red-500 hover:text-red-700"
//                                                         >
//                                                             Remove
//                                                         </button>
//                                                         {rowHasError && (
//                                                             <button
//                                                                 onClick={() => fixRowCalculation(currentBillIndex, idx)}
//                                                                 className="ml-2 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
//                                                             >
//                                                                 Fix Calculation
//                                                             </button>
//                                                         )}
//                                                     </td>
//                                                 </tr>
//                                             );
//                                         })}
//                                     </tbody>
//                                 </table>
//                             </div>
//                             <div className="mt-4">
//                                 <button
//                                     onClick={() => addItem(currentBillIndex)}
//                                     className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
//                                 >
//                                     Add Item
//                                 </button>
//                             </div>
//                         </div>

//                         <div className="p-4 text-black bg-white rounded-md shadow-sm">
//                             <div className="grid grid-cols-2 gap-4">
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700">
//                                         Total Amount
//                                     </label>
//                                     <input
//                                         type="number"
//                                         value={billData[currentBillIndex]?.totalAmount || ""}
//                                         onChange={(e) =>
//                                             handleDataChange("totalAmount", e.target.value)
//                                         }
//                                         className="mt-1 block w-full border border-gray-300 rounded-md p-2"
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700">
//                                         Grand Total
//                                     </label>
//                                     <input
//                                         type="text"
//                                         value={billData[currentBillIndex]?.grandTotal || ""}
//                                         onChange={(e) =>
//                                             handleDataChange("grandTotal", e.target.value)
//                                         }
//                                         className="mt-1 block w-full border border-gray-300 rounded-md p-2"
//                                     />
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="p-4 text-black bg-white rounded-md shadow-sm">
//                             <h4 className="text-lg font-medium text-gray-700 mb-2">
//                                 Tax Details
//                             </h4>
//                             <div className="grid grid-cols-2 gap-4">
//                                 {[
//                                     { label: "SGST", key: "SGST" },
//                                     { label: "CGST", key: "CGST" },
//                                     { label: "CESS", key: "CESS" },
//                                     { label: "GST 5%", key: "GST_5" },
//                                     { label: "GST 12%", key: "GST_12" },
//                                     { label: "GST 18%", key: "GST_18" },
//                                     { label: "GST 28%", key: "GST_28" }
//                                 ].map(({ label, key }) => (
//                                     <div key={key}>
//                                         <label className="block text-sm font-medium text-gray-700">
//                                             {label}
//                                         </label>
//                                         <input
//                                             type="number"
//                                             value={
//                                                 billData[currentBillIndex]?.taxDetails?.[key] || ""
//                                             }
//                                             onChange={(e) =>
//                                                 handleDataChange("taxDetails", {
//                                                     ...billData[currentBillIndex]?.taxDetails,
//                                                     [key]: e.target.value
//                                                 })
//                                             }
//                                             className="mt-1 block w-full border border-gray-300 rounded-md p-2"
//                                         />
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {/* Step 2: Confirmation */}
//                 {/* {currentStep === 2 && (
//                     <div className="space-y-8">
//                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                             {files.map((file, index) => (
//                                 <div
//                                     key={file.id}
//                                     className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
//                                 >
//                                     <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-4">
//                                         {file.dataUrl.includes("image/") ? (
//                                             <img
//                                                 src={file.dataUrl}
//                                                 alt={`Bill ${index + 1}`}
//                                                 className="object-cover w-full h-full"
//                                             />
//                                         ) : (
//                                             <div className="w-full h-full flex items-center justify-center text-gray-500">
//                                                 <FiFile className="w-12 h-12" />
//                                             </div>
//                                         )}
//                                     </div>
//                                     <div className="space-y-2">
//                                         <p className="text-sm font-medium text-gray-500">
//                                             {billData[index]?.billDate || "No date specified"}
//                                         </p>
//                                         <p className="text-2xl font-semibold text-gray-800">
//                                             ${billData[index]?.totalAmount || "0.00"}
//                                         </p>
//                                         {billData[index]?.invoiceNumber && (
//                                             <p className="text-sm text-gray-600 line-clamp-2">
//                                                 {billData[index]?.invoiceNumber}
//                                             </p>
//                                         )}
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>

//                         <div className="flex justify-center gap-6 border-t pt-8">
//                             <button
//                                 onClick={() => setCurrentStep(1)}
//                                 className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
//                             >
//                                 <FiArrowLeft className="inline-block mr-2" />
//                                 Back to Editing
//                             </button>
//                             <button
//                                 onClick={handleExport}
//                                 className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
//                             >
//                                 <FiCheck className="w-5 h-5" />
//                                 Confirm & Export
//                             </button>
//                         </div>
//                     </div>
//                 )} */}

//                 {/* // Step 2: Confirmation */}
//                 {currentStep === 2 && (
//                     <div className="space-y-8">
//                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                             {files.map((file, index) => (
//                                 <div
//                                     key={file.id}
//                                     className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
//                                 >
//                                     <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-4">
//                                         {file.dataUrl.includes("image/") ? (
//                                             <img
//                                                 src={file.dataUrl}
//                                                 alt={`Bill ${index + 1}`}
//                                                 className="object-cover w-full h-full"
//                                             />
//                                         ) : (
//                                             <div className="w-full h-full flex items-center justify-center text-gray-500">
//                                                 <FiFile className="w-12 h-12" />
//                                             </div>
//                                         )}
//                                     </div>
//                                     <div className="space-y-2">
//                                         <p className="text-sm font-medium text-gray-500">
//                                             {billData[index]?.billDate || "No date specified"}
//                                         </p>
//                                         <p className="text-2xl font-semibold text-gray-800">
//                                             ${billData[index]?.totalAmount || "0.00"}
//                                         </p>
//                                         {billData[index]?.invoiceNumber && (
//                                             <p className="text-sm text-gray-600 line-clamp-2">
//                                                 {billData[index]?.invoiceNumber}
//                                             </p>
//                                         )}
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                         <p>{status}</p>
//                         {error && <p style={{ color: 'red' }}>{error}</p>}
//                         <div className="flex justify-center gap-6 border-t pt-8">
//                             <button
//                                 onClick={() => setCurrentStep(1)}
//                                 className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
//                             >
//                                 <FiArrowLeft className="inline-block mr-2" />
//                                 Back to Editing
//                             </button>
//                             <button
//                                 onClick={handleExport} // Call handleExport when the button is clicked
//                                 className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
//                             >
//                                 <FiCheck className="w-5 h-5" />
//                                 Confirm & Export
//                             </button>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }



// components/BillWorkflow.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  FiUpload,
  FiFile,
  FiX,
  FiArrowLeft,
  FiArrowRight,
  FiCheck
} from "react-icons/fi";
import axios from "axios";
import { BackendLink } from "../../service/api";
import { useRouter } from "next/router"; // or next/navigation in app router
import { ChevronLeft, CloudCog } from "lucide-react";
import { toast } from "react-toastify";

declare global {
  interface Window {
    electronAPI: {
      createCgstLedger: (ledgerName: string) => Promise<{ success: boolean; ledgerName?: string; error?: string }>;
    };
  }
}

function ZoomableImage({ src, alt, style }) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startDragRef = useRef({ x: 0, y: 0 });
  const startOffsetRef = useRef({ x: 0, y: 0 });

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setScale((prev) => Math.min(Math.max(prev + delta, 1), 3));
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    startDragRef.current = { x: e.clientX, y: e.clientY };
    startOffsetRef.current = { ...offset };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startDragRef.current.x;
    const dy = e.clientY - startDragRef.current.y;
    setOffset({
      x: startOffsetRef.current.x + dx / scale,
      y: startOffsetRef.current.y + dy / scale
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleDoubleClick = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      style={{
        overflow: "hidden",
        cursor: isDragging ? "grabbing" : scale > 1 ? "grab" : "zoom-in",
        ...style
      }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "center center",
          transition: isDragging ? "none" : "transform 0.3s ease",
          userSelect: "none",
          pointerEvents: "none",
          width: "100%",
          height: "100%",
          objectFit: "contain"
        }}
      />
    </div>
  );
}

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function LoadingScreen({ isLoading }: { isLoading: boolean }) {
  const steps = [
    "Extracting Necessary Data...",
    "Processing Image with AI Model...",
    "Converting Data into Text...",
    "Finalizing Results..."
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [steps.length]);

  useEffect(() => {
    if (isLoading) {
      const startTime = Date.now();
      const timer = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80">
      <div className="flex flex-col items-center space-y-4 p-4 bg-white rounded-lg shadow-lg">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 w-16 h-16 mx-auto my-auto border-4 border-t-transparent border-l-transparent border-r-blue-500 border-b-blue-500 rounded-full animate-spin" />
        </div>
        <p className="text-xl font-semibold text-gray-800">
          {steps[currentStep]}
        </p>
        <div className="text-gray-600 font-medium">
          Elapsed: {formatTime(elapsed)}
        </div>
      </div>
    </div>
  );
}

export default function BillWorkflow() {
  // Steps: 0 = Role Selection & Upload, 1 = Verify/Edit, 2 = Confirm
  const [currentStep, setCurrentStep] = useState(0);
  const [role, setRole] = useState(""); // role: "Purchaser" or "Seller"
  const [files, setFiles] = useState<any[]>([]);
  const [billData, setBillData] = useState<any[]>([]);
  const [currentBillIndex, setCurrentBillIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Click to send keys to Tally');
  const [error, setError] = useState<string | null>(null);

  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  const MAX_FILE_SIZE_MB = 50;
  const stepsArray = ["Role & Upload Bills", "Verify Data", "Confirm & Export"];

  useEffect(() => {
    return () => files.forEach((file) => URL.revokeObjectURL(file.dataUrl));
  }, [files]);

  const readFile = (file: File) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });

  const processFiles = async (filesToProcess: File[]) => {
    const validFiles = filesToProcess.filter(
      (file) =>
        allowedTypes.includes(file.type) &&
        file.size <= MAX_FILE_SIZE_MB * 1024 * 1024
    );

    if (validFiles.length === 0) {
      alert(
        `Please upload valid files (JPEG, PNG, PDF) under ${MAX_FILE_SIZE_MB}MB`
      );
      return;
    }

    const filesWithPreview = await Promise.all(
      validFiles.map(async (file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        dataUrl: await readFile(file),
        file
      }))
    );
    setFiles((prev) => [...prev, ...filesWithPreview]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    processFiles(selectedFiles);
  };

  const handleDragOverFiles = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeaveFiles = () => setIsDraggingFile(false);

  const handleDropFiles = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleNextStep = async () => {
    setIsLoading(true);
    try {
      const requests = files.map(async (fileObj) => {
        const formData = new FormData();
        formData.append("file", fileObj.file);
        const response = await axios.post(
          `${BackendLink}/extract-bill-details`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data; boundary=---011000010111000001101001"
            }
          }
        );
        console.log(response.data, "data");
        return response.data;
      });

      const results = await Promise.all(requests);
      setBillData(results);
      setCurrentStep(1); // Move to Verify/Edit step
    } catch (error: any) {
      console.error("Error extracting bill details:", error);
      alert("Error extracting bill details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataChange = (field: string, value: any) => {
    const newData = [...billData];
    newData[currentBillIndex] = {
      ...newData[currentBillIndex],
      [field]: value
    };
    setBillData(newData);
  };

  const handleItemChange = (billIndex: number, itemIndex: number, field: string, value: any) => {
    const newData = [...billData];
    const updatedItems = [...newData[billIndex].items];
    updatedItems[itemIndex] = { ...updatedItems[itemIndex], [field]: value };
    newData[billIndex].items = updatedItems;
    setBillData(newData);
  };

  const addItem = (billIndex: number) => {
    const newItem = {
      Product: "",
      QTY: "",
      FREE: "",
      HSN: "",
      MRP: "",
      RATE: "",
      DIS: "",
      "G AMT": "",
      SGST: "",
      CGST: "",
      "NET AMT": ""
    };
    const newData = [...billData];
    if (!newData[billIndex].items) {
      newData[billIndex].items = [];
    }
    newData[billIndex].items.push(newItem);
    setBillData(newData);
  };

  const removeItem = (billIndex: number, itemIndex: number) => {
    const newData = [...billData];
    newData[billIndex].items.splice(itemIndex, 1);
    setBillData(newData);
  };

  const handleProductDragStart = (e: React.DragEvent<HTMLTableCellElement>, billIndex: number, itemIndex: number) => {
    e.dataTransfer.setData("text/plain", itemIndex.toString());
  };

  const handleProductDragOver = (e: React.DragEvent<HTMLTableCellElement>) => {
    e.preventDefault();
  };

  const handleProductDrop = (e: React.DragEvent<HTMLTableCellElement>, billIndex: number, dropIndex: number) => {
    e.preventDefault();
    const draggedIndex = Number(e.dataTransfer.getData("text/plain"));
    if (draggedIndex === dropIndex) return;
    const newData = [...billData];
    const items = newData[billIndex].items;
    const temp = items[draggedIndex].Product;
    items[draggedIndex].Product = items[dropIndex].Product;
    items[dropIndex].Product = temp;
    newData[billIndex].items = items;
    setBillData(newData);
  };

  const removeFile = (id: string) => {
    const indexToRemove = files.findIndex((f) => f.id === id);
    setFiles((prev) => prev.filter((file) => file.id !== id));
    setBillData((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleCheckCgst = async () => {
    const ledgerNames = [
      'Cgst0', 'Cgst2.5', 'Cgst6', 'Cgst9', 'Cgst14',
      'Igst0', 'Igst5', 'Igst12', 'Igst18', 'Igst28',
      'Ut/Sgst0', 'Ut/Sgst2.5', 'Ut/Sgst6', 'Ut/Sgst9', 'Ut/Sgst14'
    ];

    const purchaserName = role === "Purchaser" ? billData?.[0]?.receiverDetails?.name : billData?.[0]?.senderDetails?.name

    try {
      const response = await window.electron.exportItem(billData?.[0]?.items)
      // const response = await window.electron.exportLedger(ledgerNames,false);
      // const response2 = await window.electron.exportLedger(purchaserName,role === "Purchaser");
      // alert("Check Done")
 

      // if (response.created && response.created.length > 0) {
      //   if (response.existed && response.existed.length > 0) {
      //     toast(`Some ledgers already existed: ${response.existed.join(", ")}. New ledgers created: ${response.created.join(", ")}`);
      //   } else {
      //     toast(`New ledgers created: ${response.created.join(", ")}`);
      //   }
      // } else {
      //   toast("All ledgers already exist.");
      // }
    } catch (error) {
      console.error("Error while processing ledgers:", error);
      toast("Error while processing ledgers. Check console for details.");
    }
  }


  const handleExport = async () => {
    console.log(role)
    console.log(billData)
    handleCheckCgst()


    // setIsLoading(true);
    // setStatus('Exporting data and sending keys to Tally...');
    // setError(null);

    // try {
    //   console.log("Exporting data:", billData);
    //   await window.electronAPI.createCgstLedger('Cgst 2.5+5');
    //   await window.electronAPI.createCgstLedger('Cgst 6+5');
    //   await window.electronAPI.createCgstLedger('Cgst 9+5');
    //   await window.electronAPI.createCgstLedger('Cgst 14+5');

    //   setStatus('Export completed successfully and keys sent to Tally!');
    //   alert('Export completed successfully and keys sent to Tally!');
    // } catch (error: any) {
    //   console.error('Error during export or sending keys:', error);
    //   setStatus('Failed to export or send keys to Tally');
    //   setError(error.message);
    //   alert(`Error: ${error.message}`);
    // } finally {
    //   setIsLoading(false);
    // }
  };

  const fixRowCalculation = (billIndex: number, itemIndex: number) => {
    const newData = [...billData];
    const item = newData[billIndex].items[itemIndex];

    const qty = parseFloat(item.QTY) || 0;
    const rate = parseFloat(item.RATE) || 0;
    const discount = parseFloat(item.DIS) || 0;
    const sgstPerUnit = parseFloat(item.SGST) || 0;
    const cgstPerUnit = sgstPerUnit;

    const standardGross =
      ((qty * rate * 100) - (qty * discount * 100)) / 100;

    const totalGST = qty * (sgstPerUnit + cgstPerUnit);
    const newNetAmt = standardGross + totalGST;

    item["G AMT"] = standardGross.toFixed(2);
    item.SGST = sgstPerUnit.toFixed(2);
    item.CGST = cgstPerUnit.toFixed(2);
    item["NET AMT"] = newNetAmt.toFixed(2);

    newData[billIndex].items[itemIndex] = item;
    setBillData(newData);
  };

  // Role selection UI if no role is selected yet
  if (currentStep === 0 && !role) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 to-white p-8">
        <h2 className="text-4xl font-extrabold text-gray-800 mb-8">
          Select Your Role
        </h2>
        <div className="flex space-x-8">
          <button
            onClick={() => setRole("Purchaser")}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 transition"
          >
            Purchaser
          </button>
          <button
            onClick={() => setRole("Seller")}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg hover:from-green-600 hover:to-green-700 transition"
          >
            Seller
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-8 relative">
      <LoadingScreen isLoading={isLoading} />
      <button
        onClick={() => window.history.back()}
        className="absolute top-6 left-6 inline-flex items-center text-lg font-medium text-blue-600 hover:text-blue-800 transition"
      >
        <ChevronLeft className="h-5 w-5 mr-1" />
        Back
      </button>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Stepper */}
        <div className="flex justify-center space-x-4">
          {stepsArray.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= index ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
                  } transition-colors duration-300`}
              >
                {index + 1}
              </div>
              <div className={`ml-3 font-medium ${currentStep >= index ? "text-gray-800" : "text-gray-500"}`}>
                {step}
              </div>
              {index < stepsArray.length - 1 && (
                <div className={`w-20 h-1 mx-4 ${currentStep > index ? "bg-blue-600" : "bg-gray-300"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Role & File Upload */}
        {currentStep === 0 && role && (
          <div className="space-y-8">
            <div
              onDragOver={handleDragOverFiles}
              onDragLeave={handleDragLeaveFiles}
              onDrop={handleDropFiles}
              className={`group relative bg-white rounded-2xl border-2 border-dashed ${isDraggingFile ? "border-blue-500 bg-blue-50" : "border-gray-300"
                } transition-all duration-200 p-12 text-center cursor-pointer shadow-md`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-4">
                <div className="inline-block p-4 bg-blue-100 rounded-full">
                  <FiUpload className="text-5xl text-blue-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-semibold text-gray-800">
                    Drag & Drop Bills or Click to Browse
                  </p>
                  <p className="text-gray-500 text-base">
                    Supported formats: JPG, PNG, PDF (Max {MAX_FILE_SIZE_MB}MB each)
                  </p>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {files.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="bg-white rounded-xl p-4 flex items-center shadow-lg"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <FiFile className="text-blue-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="font-medium text-gray-800 truncate">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-gray-400 hover:text-red-600 ml-4 transition"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleNextStep}
                disabled={files.length === 0}
                className={`px-8 py-4 rounded-lg font-semibold transition-all flex items-center gap-3 ${files.length
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
              >
                Next Step
                <FiArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Data Verification / Editing */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="sticky top-0 bg-white p-4 shadow-lg rounded-lg z-10">
              <div
                className="bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center"
                style={{ height: "14rem" }}
              >
                {files[currentBillIndex]?.dataUrl?.includes("image/") ? (
                  <ZoomableImage
                    src={files[currentBillIndex].dataUrl}
                    alt={`Bill ${currentBillIndex + 1}`}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <FiFile className="w-16 h-16 mx-auto mb-4" />
                    <p>PDF Preview Not Available</p>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() =>
                    setCurrentBillIndex((prev) => Math.max(0, prev - 1))
                  }
                  disabled={currentBillIndex === 0}
                  className="text-gray-600 hover:text-blue-600 disabled:text-gray-300 transition"
                >
                  <FiArrowLeft className="w-6 h-6" />
                </button>
                <span className="text-gray-600 font-medium">
                  Bill {currentBillIndex + 1} of {files.length}
                </span>
                <button
                  onClick={() => {
                    if (currentBillIndex === files.length - 1)
                      setCurrentStep(2);
                    else setCurrentBillIndex((prev) => prev + 1);
                  }}
                  className="text-gray-600 hover:text-blue-600 transition"
                >
                  <FiArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg">
              <div className="grid grid-cols-2 gap-6">
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700">
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={billData[currentBillIndex]?.gstNumber || ""}
                    onChange={(e) =>
                      handleDataChange("gstNumber", e.target.value)
                    }
                    className="mt-2 block w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                      backgroundColor:
                        billData[currentBillIndex]?.gstNumber &&
                        billData[currentBillIndex]?.gstNumber.length > 15
                          ? "#ffffe0"
                          : "white"
                    }}
                  />
                </div> */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={billData[currentBillIndex]?.invoiceNumber || ""}
                    onChange={(e) =>
                      handleDataChange("invoiceNumber", e.target.value)
                    }
                    className="mt-2 block w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bill Date
                  </label>
                  <input
                    type="text"
                    value={billData[currentBillIndex]?.billDate || ""}
                    onChange={(e) =>
                      handleDataChange("billDate", e.target.value)
                    }
                    className="mt-2 block w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Due Date
                  </label>
                  <input
                    type="text"
                    value={billData[currentBillIndex]?.dueDate || ""}
                    onChange={(e) =>
                      handleDataChange("dueDate", e.target.value)
                    }
                    className="mt-2 block w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div> */}
                {/* Updated field: Purchase/Seller Name */}
                {/* <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {role === "Purchaser" ? "Purchaser Name" : "Seller Name"}
                  </label>
                  <input
                    type="text"
                    value={billData[currentBillIndex]?.salesMan || ""}
                    onChange={(e) =>
                      handleDataChange("salesMan", e.target.value)
                    }
                    className="mt-2 block w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div> */}
              </div>
            </div>

            {/* Conditional section for Receiver/Sender Details */}
            <div className="p-6 bg-white rounded-xl shadow-lg">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {role === "Purchaser" ? "Receiver Name" : "Sender Name"}
                  </label>
                  <input
                    type="text"
                    value={
                      role === "Purchaser"
                        ? billData[currentBillIndex]?.receiverDetails?.name || ""
                        : billData[currentBillIndex]?.senderDetails?.name || ""
                    }
                    onChange={(e) => {
                      if (role === "Purchaser") {
                        handleDataChange("receiverDetails", {
                          ...billData[currentBillIndex]?.receiverDetails,
                          name: e.target.value
                        });
                      } else {
                        handleDataChange("senderDetails", {
                          ...billData[currentBillIndex]?.senderDetails,
                          name: e.target.value
                        });
                      }
                    }}
                    className="mt-2 block w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {role === "Purchaser" ? "Receiver GST" : "Sender GST"}
                  </label>
                  <input
                    type="text"
                    value={
                      role === "Purchaser"
                        ? billData[currentBillIndex]?.receiverDetails?.gst || ""
                        : billData[currentBillIndex]?.senderDetails?.gst || ""
                    }
                    onChange={(e) => {
                      if (role === "Purchaser") {
                        handleDataChange("receiverDetails", {
                          ...billData[currentBillIndex]?.receiverDetails,
                          gst: e.target.value
                        });
                      } else {
                        handleDataChange("senderDetails", {
                          ...billData[currentBillIndex]?.senderDetails,
                          gst: e.target.value
                        });
                      }
                    }}
                    className="mt-2 block w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg">
              <h4 className="text-xl font-semibold text-gray-800 mb-4">Items</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      {[
                        "Product",
                        "QTY",
                        "FREE",
                        "HSN",
                        "MRP",
                        "RATE",
                        "DIS",
                        "G AMT",
                        "SGST",
                        "CGST",
                        "NET AMT",
                        "Actions"
                      ].map((head) => (
                        <th
                          key={head}
                          className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {billData[currentBillIndex]?.items?.map((item: any, idx: number) => {
                      const qty = parseFloat(item.QTY);
                      const rate = parseFloat(item.RATE);
                      const gAmt = parseFloat(item["G AMT"]);
                      const discount = parseFloat(item.DIS) || 0;
                      const netAmt = parseFloat(item["NET AMT"]);
                      const calcGross = item.QTY && item.RATE ? qty * rate - qty * discount : null;
                      const calcNet =
                        item["G AMT"] && (item["NET AMT"] || item["NET AMT"] === 0)
                          ? gAmt + qty * (parseFloat(item.SGST) + parseFloat(item.CGST))
                          : null;
                      const grossValid =
                        item.QTY && item.RATE && item["G AMT"]
                          ? calcGross !== null && Math.abs(calcGross - gAmt) < 0.01
                          : true;
                      const netValid =
                        item["G AMT"] &&
                          (item["NET AMT"] || item["NET AMT"] === 0)
                          ? calcNet !== null && Math.abs(calcNet - netAmt) < 0.01
                          : true;
                      const rowHasError = !grossValid || !netValid;

                      return (
                        <tr
                          key={idx}
                          style={{
                            backgroundColor: rowHasError ? "#ffffe0" : undefined
                          }}
                          className="hover:bg-gray-50"
                        >
                          <td
                            className="px-3 py-2 w-72"
                            draggable
                            onDragStart={(e) =>
                              handleProductDragStart(e, currentBillIndex, idx)
                            }
                            onDragOver={handleProductDragOver}
                            onDrop={(e) =>
                              handleProductDrop(e, currentBillIndex, idx)
                            }
                          >
                            <input
                              type="text"
                              value={item.Product || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  currentBillIndex,
                                  idx,
                                  "Product",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2 w-20">
                            <input
                              type="text"
                              value={item.QTY || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  currentBillIndex,
                                  idx,
                                  "QTY",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2 w-20">
                            <input
                              type="text"
                              value={item.FREE || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  currentBillIndex,
                                  idx,
                                  "FREE",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2 w-28">
                            <input
                              type="text"
                              value={item.HSN || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  currentBillIndex,
                                  idx,
                                  "HSN",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2 w-20">
                            <input
                              type="number"
                              value={item.MRP || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  currentBillIndex,
                                  idx,
                                  "MRP",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item.RATE || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  currentBillIndex,
                                  idx,
                                  "RATE",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.DIS || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  currentBillIndex,
                                  idx,
                                  "DIS",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item["G AMT"] || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  currentBillIndex,
                                  idx,
                                  "G AMT",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.SGST || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  currentBillIndex,
                                  idx,
                                  "SGST",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              style={{ backgroundColor: "white" }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.CGST || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  currentBillIndex,
                                  idx,
                                  "CGST",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              style={{ backgroundColor: "white" }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item["NET AMT"] || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  currentBillIndex,
                                  idx,
                                  "NET AMT",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2 flex items-center">
                            <button
                              onClick={() => removeItem(currentBillIndex, idx)}
                              className="text-red-500 hover:text-red-700 transition"
                            >
                              Remove
                            </button>
                            {(!grossValid || !netValid) && (
                              <button
                                onClick={() => fixRowCalculation(currentBillIndex, idx)}
                                className="ml-2 px-3 py-1 bg-green-500 text-white rounded transition hover:bg-green-600"
                              >
                                Fix Calculation
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => addItem(currentBillIndex)}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition"
                >
                  Add Item
                </button>
              </div>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    value={billData[currentBillIndex]?.totalAmount || ""}
                    onChange={(e) =>
                      handleDataChange("totalAmount", e.target.value)
                    }
                    className="mt-2 block w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Grand Total
                  </label>
                  <input
                    type="text"
                    value={billData[currentBillIndex]?.grandTotal || ""}
                    onChange={(e) =>
                      handleDataChange("grandTotal", e.target.value)
                    }
                    className="mt-2 block w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg">
              <h4 className="text-xl font-semibold text-gray-800 mb-4">
                Tax Details
              </h4>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: "SGST", key: "SGST" },
                  { label: "CGST", key: "CGST" },
                  { label: "CESS", key: "CESS" },
                  { label: "GST 5%", key: "GST_5" },
                  { label: "GST 12%", key: "GST_12" },
                  { label: "GST 18%", key: "GST_18" },
                  { label: "GST 28%", key: "GST_28" }
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700">
                      {label}
                    </label>
                    <input
                      type="number"
                      value={
                        billData[currentBillIndex]?.taxDetails?.[key] || ""
                      }
                      onChange={(e) =>
                        handleDataChange("taxDetails", {
                          ...billData[currentBillIndex]?.taxDetails,
                          [key]: e.target.value
                        })
                      }
                      className="mt-2 block w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Confirmation */}
        {currentStep === 2 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {files.map((file, index) => (
                <div
                  key={file.id}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-4">
                    {file.dataUrl.includes("image/") ? (
                      <img
                        src={file.dataUrl}
                        alt={`Bill ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <FiFile className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      {billData[index]?.billDate || "No date specified"}
                    </p>
                    <p className="text-2xl font-semibold text-gray-800">
                      ${billData[index]?.totalAmount || "0.00"}
                    </p>
                    {billData[index]?.invoiceNumber && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {billData[index]?.invoiceNumber}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-lg font-medium text-gray-800">{status}</p>
            {error && <p className="text-center text-red-500">{error}</p>}
            <div className="flex justify-center gap-6 border-t pt-8">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-8 py-4 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 shadow"
              >
                <FiArrowLeft className="inline-block mr-2" />
                Back to Editing
              </button>
              <button
                onClick={handleExport}
                className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow"
              >
                <FiCheck className="w-6 h-6" />
                Confirm & Export
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
