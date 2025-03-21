import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { BackendLink } from "../../service/api";
import { useRouter } from "next/router";
import {
  ChevronLeft,
  Upload,
  FileText,
  X,
  ChevronRight,
  ArrowLeft,
  Check,
  Plus,
  CloudCog,
  Trash2,
  Filter,
  ZoomIn,
  MoveHorizontal,
  Edit,
  Calendar,
  FileDigit,
  Building,
  PlusCircle
} from "lucide-react";
import { toast } from "react-toastify";
import { ZoomOut, RotateCcw, Move, Maximize, Minimize, Minus } from "lucide-react";

declare global {
  interface Window {
    electronAPI: {
      createCgstLedger: (ledgerName: string) => Promise<{ success: boolean; ledgerName?: string; error?: string }>;
    };
    electron: {
      exportItem: (items: any) => Promise<any>;
      exportLedger: (ledgerNames: string[] | string, isPurchaser: boolean) => Promise<any>;
    };
  }
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({ src, alt, style }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Show initial guide on first render


  const adjustZoom = (amount: number) => {
    // Calculate new zoom level with limits
    const newZoom = Math.max(1, Math.min(5, zoom + amount));

    // If no change, don't do anything
    if (newZoom === zoom) return;

    // Get container and image dimensions
    if (!containerRef.current || !imageRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Calculate the center point of the container
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    // Calculate new position to zoom toward center
    if (newZoom > zoom) {
      // Zooming in - adjust position to keep center point fixed
      const scaleFactor = newZoom / zoom;
      const newPosX = (position.x - centerX) * scaleFactor + centerX;
      const newPosY = (position.y - centerY) * scaleFactor + centerY;
      setPosition({ x: newPosX, y: newPosY });
    } else {
      // Zooming out - adjust position gradually back to center
      const scaleFactor = newZoom / zoom;
      const newPosX = position.x * scaleFactor;
      const newPosY = position.y * scaleFactor;

      // If we're zooming out to 1, reset position entirely
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      } else {
        setPosition({ x: newPosX, y: newPosY });
      }
    }

    // Apply new zoom
    setZoom(newZoom);

    // Show guide briefly when zooming
    if (!isFirstVisit && !showGuide) {
      setShowGuide(true);
      const timer = setTimeout(() => setShowGuide(false), 2000);
      return () => clearTimeout(timer);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.003; // Smaller increment for smoother zoom
    adjustZoom(delta);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      // Show grab cursor
      if (containerRef.current) {
        containerRef.current.style.cursor = "grabbing";
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Reset cursor
    if (containerRef.current) {
      containerRef.current.style.cursor = zoom > 1 ? "grab" : "default";
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    } else {
      // Get the click position relative to the container
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Calculate center offsets
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Zoom in centered on the click point
      setZoom(2);
      setPosition({
        x: (centerX - clickX) * 2,
        y: (centerY - clickY) * 2
      });
    }
  };

  const resetView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setShowGuide(true);
    setTimeout(() => setShowGuide(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-xl bg-gray-50"
      style={{
        ...style,
        cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
        userSelect: 'none'
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          transformOrigin: 'center',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none' // Prevent image dragging interference
        }}
      />

      {/* Zoom Percentage Indicator */}
      <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm shadow-sm">
        <ZoomIn className="w-3.5 h-3.5" />
        {Math.round(zoom * 100)}%
      </div>

      {/* Controls Panel */}
      <div className="absolute top-3 right-3 transition-opacity opacity-80 hover:opacity-100">
        <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-lg flex gap-1 border border-gray-200">
          <button
            onClick={() => adjustZoom(-0.25)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-700 transition-colors"
            title="Zoom out"
            disabled={zoom <= 1}
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={() => adjustZoom(0.25)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-700 transition-colors"
            title="Zoom in"
            disabled={zoom >= 5}
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-6 my-auto bg-gray-200 mx-0.5"></div>

          <button
            onClick={resetView}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-700 transition-colors"
            title="Reset view"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-700 transition-colors"
            title="Toggle fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Controls (bottom) */}
      <div className="md:hidden absolute bottom-12 left-1/2 transform -translate-x-1/2 transition-opacity opacity-80 hover:opacity-100">
        <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-lg flex gap-1 border border-gray-200">
          <button
            onClick={() => adjustZoom(-0.25)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
            disabled={zoom <= 1}
          >
            <Minus className="w-5 h-5" />
          </button>

          <button
            onClick={() => adjustZoom(0.25)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
            disabled={zoom >= 5}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Usage Guide Overlay */}
      {showGuide && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-opacity">
          <div className="bg-white rounded-xl p-5 max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Image Controls</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="bg-blue-100 rounded-full p-1.5">
                  <Move className="w-5 h-5 text-blue-700" />
                </div>
                <span className="text-gray-600">Drag to pan when zoomed in</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-blue-100 rounded-full p-1.5">
                  <ZoomIn className="w-5 h-5 text-blue-700" />
                </div>
                <span className="text-gray-600">Scroll to zoom in/out</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-blue-100 rounded-full p-1.5">
                  <Maximize className="w-5 h-5 text-blue-700" />
                </div>
                <span className="text-gray-600">Double-click to toggle zoom</span>
              </li>
            </ul>
            <button
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-700 transition-colors"
              onClick={() => setShowGuide(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Subtle instruction hint when zoom > 1 */}
      {zoom > 1 && !showGuide && (
        <div className="absolute bottom-12 left-3 bg-black/40 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm opacity-80">
          <Move className="w-3 h-3" />
          <span>Drag to pan</span>
        </div>
      )}
    </div>
  );
};

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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-6 p-8 bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 w-full h-full border-4 border-t-transparent border-blue-500/20 rounded-full animate-spin" />
          <div className="absolute inset-0 w-full h-full border-4 border-t-transparent border-l-transparent border-r-blue-500 border-b-blue-500 rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
          <CloudCog className="w-10 h-10 text-blue-600" />
        </div>

        <div className="space-y-2 text-center">
          <p className="text-xl font-semibold text-gray-800">
            {steps[currentStep]}
          </p>
          <div className="text-gray-500 font-medium flex items-center gap-2 justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="#CBD5E0" />
              <path
                strokeLinecap="round"
                d="M12 6v6l4 2"
                strokeWidth="2"
                stroke="currentColor"
              />
            </svg>
            {formatTime(elapsed)}
          </div>
        </div>

        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: `${(currentStep + 1) * 25}%` }}></div>
        </div>
      </div>
    </div>
  );
}

interface StepperProps {
  steps: string[];
  currentStep: number;
}

const Stepper = ({ steps, currentStep }: StepperProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-10">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step} className="flex-1  relative">
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 ${currentStep >= index
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "bg-gray-200 text-gray-500"
                }`}>
                {currentStep > index ? (
                  <Check className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              <div className={`mt-2 text-center ${currentStep >= index ? "text-gray-800 font-medium" : "text-gray-400"
                }`}>
                <span className="hidden md:block">{step}</span>
                <span className="md:hidden">{step.split(' ')[0]}</span>
              </div>
            </div>


          </div>
        ))}
      </div>
    </div>
  );
};

const TextField = ({ label, value, onChange, style = {} }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      type="text"
      value={value || ""}
      onChange={onChange}
      className="block w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white hover:bg-gray-50 focus:bg-white"
      style={style}
    />
  </div>
);

const NumberField = ({ label, value, onChange, style = {} }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      type="number"
      value={value || ""}
      onChange={onChange}
      className="block w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white hover:bg-gray-50 focus:bg-white"
      style={style}
    />
  </div>
);

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
  const [status, setStatus] = useState('Ready to export');
  const [error, setError] = useState<string | null>(null);

  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  const MAX_FILE_SIZE_MB = 50;

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
      toast.error(
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
      setCurrentStep(2); // Move to Verify/Edit step
    } catch (error: any) {
      console.error("Error extracting bill details:", error);
      toast.error("Error extracting bill details. Please try again.");
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

  const handleCheckAllGstLedger = async (isPurchaser) => {


    try {
      setIsLoading(true);
      const response2 = await window.electron.exportItem(billData?.[0]?.items);
      setIsLoading(false);
      toast.success("Data exported successfully!");
    } catch (error) {
      console.error("Error while processing ledgers:", error);
      toast.error("Error while processing ledgers. Check console for details.");
      setIsLoading(false);
    }
  };

  function formatDateToDDMMYYYY(dateInput: Date | string): string {
    let date: Date;
  
    if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      // If the input contains '/' it might be in a non-ISO format.
      if (dateInput?.includes('/')) {
        const parts = dateInput.split('/');
        if (parts.length === 3) {
          const [part1, part2, part3] = parts;
          const num1 = parseInt(part1, 10);
          const num2 = parseInt(part2, 10);
          const num3 = parseInt(part3, 10);
  
          let day: number, month: number, year: number;
          // Heuristic to decide which part is the day or month:
          if (num1 > 12) {
            // If the first number is greater than 12, assume dd/mm/yyyy.
            day = num1;
            month = num2;
          } else if (num2 > 12) {
            // If the second number is greater than 12, assume mm/dd/yyyy.
            month = num1;
            day = num2;
          } else {
            // Ambiguous: default to dd/mm/yyyy.
            day = num1;
            month = num2;
          }
          year = num3;
  
          date = new Date(year, month - 1, day);
        } else {
          // If not exactly 3 parts, let Date handle it.
          date = new Date(dateInput);
        }
      } else {
        // For other formats (like ISO), use the Date constructor.
        date = new Date(dateInput);
      }
    }
  
    // Format day and month with leading zeros if needed.
    const dd = date.getDate().toString().padStart(2, '0');
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const yyyy = date.getFullYear();
  
    return `${dd}-${mm}-${yyyy}`;
  }
  

  const handleExport = async () => {
    console.log(role);
    console.log(billData);
    const purchaserName = role === "Purchaser" ? billData?.[0]?.receiverDetails?.name : billData?.[0]?.senderDetails?.name;
    const ledgerNames = [
      'Cgst0', 'Cgst2.5', 'Cgst6', 'Cgst9', 'Cgst14',
      'Igst0', 'Igst5', 'Igst12', 'Igst18', 'Igst28',
      'Ut/Sgst0', 'Ut/Sgst2.5', 'Ut/Sgst6', 'Ut/Sgst9', 'Ut/Sgst14'
    ];
    const items = billData?.[0]?.items
    const isPurchaser = role === "Purchaser"
    const date = formatDateToDDMMYYYY(billData?.[0]?.billDate)
    const invoiceNumber = billData?.[0]?.invoiceNumber
    // const allLedgerResponse = await window.electron.exportLedger(ledgerNames, false)
    // const purchaserLedgerResponse = await window.electron.exportLedger(purchaserName, isPurchaser)
    // const unitResponse = await window.electron.exportUnit({ Name: "pcs", conversionRate: 3 });
    // const itemResponse = await window.electron.exportItem(billData?.[0]?.items);
    // console.log("allLedgerResponse:", allLedgerResponse, "purchaserLedgerResponse:", purchaserLedgerResponse, "itemResponse:", itemResponse, "unitResponse:", unitResponse)
    // const respone = await window.electron.createPurchaseEntry(billData?.invoiceNumber,"02-11-2024",purchaserName,)
    // handleCheckAllGstLedger(role === "Purchaser");
    console.log(invoiceNumber,date,purchaserName,purchaserName,items,true,)


    
    // await window.electron.createPurchaseEntry("123456", "02-11-2024", "Priyanshu", "Purchase", [
    //   { name: "Item", quantity: 2, price: 100 },
    //   { name: "Item Name", quantity: 1, price: 50 }
    // ], true, 0, 14, 12);
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
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
        <header className="py-6 px-8 border-b border-gray-200 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-800 ml-6">Bill Management System</h1>
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
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Purchase Bills Option */}
                <button
                  onClick={() => {
                    setRole("Purchaser");
                    setCurrentStep(1);
                  }}
                  className="group relative flex flex-col items-center p-8 border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-5 group-hover:bg-blue-200 transition-colors duration-200 relative z-10">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1 relative z-10">Purchase Bills</h3>
                  <p className="text-gray-500 text-center mx-auto max-w-xs relative z-10">
                    Enter and manage bills for items or services you've purchased
                  </p>
                  <div className="mt-6 bg-blue-500 text-white px-5 py-2 rounded-full font-medium text-sm relative z-10 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                    Select
                  </div>
                </button>

                {/* Sales Bills Option */}
                <button
                  onClick={() => {
                    setRole("Seller");
                    setCurrentStep(1);
                  }}
                  className="group relative flex flex-col items-center p-8 border border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-5 group-hover:bg-green-200 transition-colors duration-200 relative z-10">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1 relative z-10">Sales Bills</h3>
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
      <LoadingScreen isLoading={isLoading} />

      <header className="py-6 px-8 border-b border-gray-200 bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-xl font-bold text-gray-800 hidden md:block">
              {role === "Purchaser" ? "Purchase Bill Management" : "Sales Bill Management"}
            </h1>
          </div>

          <div className="text-sm flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full">
            <span className="font-medium text-blue-700">
              {role === "Purchaser" ? "Purchase Mode" : "Sales Mode"}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Stepper
          steps={["Role Selection", "Upload Files", "Verify Data", "Confirm"]}
          currentStep={currentStep}
        />

        {/* Step 1: File Upload */}
        {currentStep === 1 && (
          <div className="space-y-8">
            <div
              onDragOver={handleDragOverFiles}
              onDragLeave={handleDragLeaveFiles}
              onDrop={handleDropFiles}
              className={`group relative bg-white rounded-2xl border-2 border-dashed ${isDraggingFile
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
                } transition-all duration-200 py-16 px-6 text-center cursor-pointer shadow-lg hover:shadow-xl`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-6 relative z-10">
                <div className="inline-flex flex-col items-center">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors duration-200 group-hover:scale-110 transform">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-800">
                      Drag & Drop Bills
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Supported formats: JPG, PNG, PDF (Max {MAX_FILE_SIZE_MB}MB each)
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
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {files.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Uploaded Files ({files.length})
                  </h3>
                  {files.length > 1 && (
                    <button
                      onClick={() => setFiles([])}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        className="text-gray-400 hover:text-red-600 ml-4 transition-colors rounded-full p-1.5 hover:bg-red-50"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-6">
              <button
                onClick={handleNextStep}
                disabled={files.length === 0}
                className={`px-6 py-3 rounded-lg font-medium text-base transition-all flex items-center gap-2 ${files.length
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
              >
                Process Files
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Data Verification / Editing */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white p-6 shadow-lg rounded-xl mb-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-1/2">
                  <div
                    className="bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center"
                    style={{ height: "18rem" }}
                  >
                    {files[currentBillIndex]?.dataUrl?.includes("image/") ? (
                      <ZoomableImage
                        src={files[currentBillIndex].dataUrl}
                        alt={`Bill ${currentBillIndex + 1}`}
                        style={{ width: "100%", height: "100%" }}
                      />
                    ) : (
                      <div className="text-center text-gray-500">
                        <FileText className="w-16 h-16 mx-auto mb-4" />
                        <p>PDF Preview Not Available</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => setCurrentBillIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentBillIndex === 0}
                      className={`flex items-center justify-center p-2 rounded-full ${currentBillIndex === 0
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                        } transition-colors`}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2">
                      {files.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentBillIndex(idx)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${currentBillIndex === idx
                            ? "bg-blue-600 w-6"
                            : "bg-gray-300 hover:bg-gray-400"
                            }`}
                          aria-label={`Go to bill ${idx + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        if (currentBillIndex === files.length - 1)
                          setCurrentStep(3);
                        else
                          setCurrentBillIndex((prev) => prev + 1);
                      }}
                      className="flex items-center justify-center p-2 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="lg:w-1/2 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FileDigit className="w-5 h-5" />
                    Bill Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextField
                      label="Invoice Number"
                      value={billData[currentBillIndex]?.invoiceNumber || ""}
                      onChange={(e) => handleDataChange("invoiceNumber", e.target.value)}
                    />

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Bill Date
                      </label>
                      <input
                        type="text"
                        value={billData[currentBillIndex]?.billDate || ""}
                        onChange={(e) => handleDataChange("billDate", e.target.value)}
                        className="block w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white hover:bg-gray-50 focus:bg-white"
                        placeholder="DD/MM/YYYY"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                      <Building className="w-5 h-5" />
                      {role === "Purchaser" ? "Receiver Details" : "Sender Details"}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <TextField
                        label={role === "Purchaser" ? "Receiver Name" : "Sender Name"}
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
                      />

                      <TextField
                        label={role === "Purchaser" ? "Receiver GST" : "Sender GST"}
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
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Item Details
                </h3>

                <button
                  onClick={() => addItem(currentBillIndex)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors shadow-sm"
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Add Item
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
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
                          className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
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
                          className={`hover:bg-gray-50 transition-colors ${rowHasError ? "bg-yellow-50" : ""}`}
                        >
                          <td
                            className="px-3 py-2.5 w-72 relative"
                            draggable
                            onDragStart={(e) => handleProductDragStart(e, currentBillIndex, idx)}
                            onDragOver={handleProductDragOver}
                            onDrop={(e) => handleProductDrop(e, currentBillIndex, idx)}
                          >
                            <div className="flex items-center group">
                              <MoveHorizontal className="w-4 h-4 text-gray-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                              <input
                                type="text"
                                value={item.Product || ""}
                                onChange={(e) => handleItemChange(currentBillIndex, idx, "Product", e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2 w-20">
                            <input
                              type="text"
                              value={item.QTY || ""}
                              onChange={(e) => handleItemChange(currentBillIndex, idx, "QTY", e.target.value)}
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2 w-20">
                            <input
                              type="text"
                              value={item.FREE || ""}
                              onChange={(e) => handleItemChange(currentBillIndex, idx, "FREE", e.target.value)}
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2 w-28">
                            <input
                              type="text"
                              value={item.HSN || ""}
                              onChange={(e) => handleItemChange(currentBillIndex, idx, "HSN", e.target.value)}
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2 w-20">
                            <input
                              type="number"
                              value={item.MRP || ""}
                              onChange={(e) => handleItemChange(currentBillIndex, idx, "MRP", e.target.value)}
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item.RATE || ""}
                              onChange={(e) => handleItemChange(currentBillIndex, idx, "RATE", e.target.value)}
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.DIS || ""}
                              onChange={(e) => handleItemChange(currentBillIndex, idx, "DIS", e.target.value)}
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item["G AMT"] || ""}
                              onChange={(e) => handleItemChange(currentBillIndex, idx, "G AMT", e.target.value)}
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.SGST || ""}
                              onChange={(e) => handleItemChange(currentBillIndex, idx, "SGST", e.target.value)}
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.CGST || ""}
                              onChange={(e) => handleItemChange(currentBillIndex, idx, "CGST", e.target.value)}
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item["NET AMT"] || ""}
                              onChange={(e) => handleItemChange(currentBillIndex, idx, "NET AMT", e.target.value)}
                              className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => removeItem(currentBillIndex, idx)}
                                className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                              {(!grossValid || !netValid) && (
                                <button
                                  onClick={() => fixRowCalculation(currentBillIndex, idx)}
                                  className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded transition-colors"
                                  title="Fix calculation"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {(!billData[currentBillIndex]?.items || billData[currentBillIndex]?.items.length === 0) && (
                      <tr>
                        <td colSpan={12} className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="mb-2">No items found in this bill</p>
                            <button
                              onClick={() => addItem(currentBillIndex)}
                              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add an item
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Summary</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                  <input
                    type="number"
                    value={billData[currentBillIndex]?.totalAmount || ""}
                    onChange={(e) => handleDataChange("totalAmount", e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white hover:bg-gray-50 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Grand Total</label>
                  <input
                    type="text"
                    value={billData[currentBillIndex]?.grandTotal || ""}
                    onChange={(e) => handleDataChange("grandTotal", e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white hover:bg-gray-50 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-md font-semibold text-gray-700 mb-4">Tax Details</h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "SGST", key: "SGST" },
                    { label: "CGST", key: "CGST" },
                    { label: "CESS", key: "CESS" },
                    { label: "GST 5%", key: "GST_5" },
                    { label: "GST 12%", key: "GST_12" },
                    { label: "GST 18%", key: "GST_18" },
                    { label: "GST 28%", key: "GST_28" }
                  ].map(({ label, key }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-600">{label}</label>
                      <input
                        type="number"
                        value={billData[currentBillIndex]?.taxDetails?.[key] || ""}
                        onChange={(e) =>
                          handleDataChange("taxDetails", {
                            ...billData[currentBillIndex]?.taxDetails,
                            [key]: e.target.value
                          })
                        }
                        className="block w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white hover:bg-gray-50 focus:bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Files
              </button>

              <button
                onClick={() => {
                  if (currentBillIndex === files.length - 1) {
                    setCurrentStep(3);
                  } else {
                    setCurrentBillIndex(prev => prev + 1);
                  }
                }}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md"
              >
                {currentBillIndex === files.length - 1 ? 'Proceed to Confirm' : 'Next Bill'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Bill Summary</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {files.map((file, index) => (
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
                          {billData[index]?.billDate || "No date specified"}
                        </p>
                        <p className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                          {billData[index]?.invoiceNumber || "No invoice #"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-gray-800">
                          ₹{billData[index]?.totalAmount || "0.00"}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {role === "Purchaser"
                            ? `From: ${billData[index]?.senderDetails?.name || "Unknown"}`
                            : `To: ${billData[index]?.receiverDetails?.name || "Unknown"}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {billData[index]?.items?.length || 0} items
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setCurrentBillIndex(index);
                          setCurrentStep(2);
                        }}
                        className="mt-4 w-full text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1.5 font-medium py-1.5 border-t border-gray-100"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
                  <CloudCog className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Ready to Export</h3>
                <p className="text-gray-600 mt-2 max-w-md mx-auto">
                  All bills have been processed and are ready to be exported to your accounting system.
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
                <p className="text-center text-gray-500 text-sm">
                  {status}
                  {error && <span className="block text-red-500 mt-2">{error}</span>}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}