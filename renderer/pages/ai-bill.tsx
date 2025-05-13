// @ts-nocheck
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
  PlusCircle,
  Smartphone,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Play,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  ZoomOut,
  RotateCcw,
  Move,
  Maximize,
  Minimize,
  Minus,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { parseStringPromise } from "xml2js";
import QRCode from "react-qr-code";

const toFixed2 = (num: number) => Number(num || 0).toFixed(2);
const safeNum = (v: any) => parseFloat(v) || 0;



export const RowDetailModal: React.FC<RowDetailModalProps> = ({
  open,
  onClose,
  item,
  rowIndex,
  onUpdate,
  images,
}) => {
  // ESC shortcut
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl mx-4 rounded-2xl bg-white shadow-xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-lg font-semibold mb-6">
          Row&nbsp;{rowIndex + 1} — detailed view
        </h3>

        {/* ---------- editable inputs ---------- */}
        <div className="grid lg:grid-cols-8 sm:grid-cols-2 gap-4 mb-8">
          {(
            [
              ["Product", "Product"],
              ["QTY", "QTY"],
              ["HSN", "HSN"],
              ["MRP", "MRP"],
              ["RATE", "RATE"],
              ["DIS", "DIS"],
              ["SGST", "SGST"],
              ["CGST", "CGST"],
            ] as const
          ).map(([label, key]) => (
            <label key={key} className="text-sm font-medium text-gray-600">
              {label}
              <input
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2"
                type={key === "Product" ? "text" : "number"}
                value={item[key] ?? ""}
                onChange={(e) => onUpdate(key, e.target.value)}
              />
            </label>
          ))}
        </div>

        {/* ---------- row’s cropped images ---------- */}
        <div className="flex flex-wrap gap-4 justify-center">
          {images.length === 0 && (
            <p className="text-gray-500 text-sm">No images for this row</p>
          )}
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`cell ${rowIndex}-${i}`}
              className="border rounded-lg object-contain w-[100px] h-[120px]"
            />
          ))}
        </div>
      </div>
    </div>
  );
};




export async function extractCompanyNames(xmlString) {
  const doc = await parseStringPromise(xmlString, { explicitArray: false });

  let companies = doc.ENVELOPE.BODY.DATA.COLLECTION.COMPANY;
  if (!companies) return [];

  if (!Array.isArray(companies)) companies = [companies];

  return companies.map((c) => {
    const nameNode = c.NAME;
    if (nameNode && typeof nameNode === "object" && "_" in nameNode) {
      return nameNode._;
    }
    return nameNode;
  });
}

declare global {
  interface Window {
    electronAPI: {
      createCgstLedger: (
        ledgerName: string
      ) => Promise<{ success: boolean; ledgerName?: string; error?: string }>;
    };
    electron: {
      exportAndCreatePartyNameEntry: (
        purchaserName: string,
        gst: string
      ) => Promise<{ success: boolean; partyName: string }>;
      exportLedger: (
        ledgerNames: string[] | string,
        ledgerType: string
      ) => Promise<any>;
      exportAndCreateLedger: (
        ledgerName: string | string[],
        ledgerType: string
      ) => Promise<{ success: boolean; ledgerName: string }>;
      exportUnit: (unit: any) => Promise<any>;
      exportItem: (items: any) => Promise<any>;
      createPurchaseEntry: (
        invoiceNumber: string,
        date: string,
        purchaserName: string,
        purchaseName: string,
        updatedPurchaseEntryItem: any,
        isWithinState: boolean
      ) => Promise<any>;
      getCompanyData: (xmlData: string) => Promise<any>;
      createPartyName: (
        xmlData: string,
        purchaserName: string,
        partyDetails: any
      ) => Promise<any>;
      createPurchaserLedger: (
        xmlData: string,
        ledgerName: string
      ) => Promise<any>;
      getTaxLedgerData: (xmlData: string) => Promise<any>;
      createUnit: (units: any) => Promise<any>;
      createItem: (items: any) => Promise<any>;
    };
  }
}

interface Product {
  Product: string;
  QTY: number;
  FREE: number;
  HSN: string;
  MRP: number;
  RATE: number;
  DIS: number;
  "G AMT": number;
  SGST: number;
  CGST: number;
  "NET AMT": number;
  UNIT: string;
}

interface GSTData {
  Product: string;
  HSN: string;
  SGST: number;
  CGST: number;
  gst: number;
  decimal: number;
  symbol: string;
}

interface PurchaserEntry {
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

interface ZoomableImageProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
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

  const adjustZoom = (amount: number) => {
    const newZoom = Math.max(1, Math.min(5, zoom + amount));
    if (newZoom === zoom) return;

    if (!containerRef.current || !imageRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    if (newZoom > zoom) {
      const scaleFactor = newZoom / zoom;
      const newPosX = (position.x - centerX) * scaleFactor + centerX;
      const newPosY = (position.y - centerY) * scaleFactor + centerY;
      setPosition({ x: newPosX, y: newPosY });
    } else {
      const scaleFactor = newZoom / zoom;
      const newPosX = position.x * scaleFactor;
      const newPosY = position.y * scaleFactor;

      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      } else {
        setPosition({ x: newPosX, y: newPosY });
      }
    }

    setZoom(newZoom);

    if (!isFirstVisit && !showGuide) {
      setShowGuide(true);
      const timer = setTimeout(() => setShowGuide(false), 2000);
      return () => clearTimeout(timer);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.003;
    adjustZoom(delta);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
      if (containerRef.current) {
        containerRef.current.style.cursor = "grabbing";
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = zoom > 1 ? "grab" : "default";
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    } else {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      setZoom(2);
      setPosition({
        x: (centerX - clickX) * 2,
        y: (centerY - clickY) * 2,
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
        cursor: isDragging ? "grabbing" : zoom > 1 ? "grab" : "default",
        userSelect: "none",
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
          transformOrigin: "center",
          transition: isDragging ? "none" : "transform 0.2s ease-out",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          pointerEvents: "none",
        }}
      />

      <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm shadow-sm">
        <ZoomIn className="w-3.5 h-3.5" />
        {Math.round(zoom * 100)}%
      </div>

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

      {showGuide && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-opacity">
          <div className="bg-white rounded-xl p-5 max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Image Controls
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="bg-blue-100 rounded-full p-1.5">
                  <Move className="w-5 h-5 text-blue-700" />
                </div>
                <span className="text-gray-600">
                  Drag to pan when zoomed in
                </span>
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
                <span className="text-gray-600">
                  Double-click to toggle zoom
                </span>
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
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
    2,
    "0"
  );
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function LoadingScreen({ isLoading }: { isLoading: boolean }) {
  const steps = [
    "Extracting Necessary Data...",
    "Processing Image with AI Model...",
    "Converting Data into Text...",
    "Finalizing Results...",
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
          <div
            className="absolute inset-0 w-full h-full border-4 border-t-transparent border-l-transparent border-r-blue-500 border-b-blue-500 rounded-full animate-spin"
            style={{ animationDuration: "1.5s" }}
          />
          <CloudCog className="w-10 h-10 text-blue-600" />
        </div>

        <div className="space-y-2 text-center">
          <p className="text-xl font-semibold text-gray-800">
            {steps[currentStep]}
          </p>
          <div className="text-gray-500 font-medium flex items-center gap-2 justify-center">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
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
          <div
            className="h-full bg-blue-500 rounded-full animate-pulse"
            style={{ width: `${(currentStep + 1) * 25}%` }}
          ></div>
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
          <div key={step} className="flex-1 relative">
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 ${currentStep >= index
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
                className={`mt-2 text-center ${currentStep >= index
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

const TextField = ({ label, value, onChange, style = {} }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
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
    <label className="block text-sm font-medium text-gray-700">{label}</label>
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

  const [rowModalIndex, setRowModalIndex] = useState<number | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [role, setRole] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [billData, setBillData] = useState<any[]>([]);
  const [currentBillIndex, setCurrentBillIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("Ready to export");
  const [error, setError] = useState<string | null>(null);
  const [netAmountTotal, setNetAmountTotal] = useState<number>(0);
  const [gstTotals, setGstTotals] = useState<{ [key: string]: number }>({});
  const [companyList, setCompanyList] = useState([
    "Prime Depth Labs", "Test 1", "Test 2"
  ])
  const [selectedCompanyName, setSelectedCompanyName] = useState("");
  const [gstNumber, setGstNumber] = useState("");

  const [qrSession, setQRSession] = useState(null);
  const [qrSessionLoading, setQRSessionLoading] = useState(false);
  const [mobileFiles, setMobileFiles] = useState([]);
  const [receivedFiles, setReceivedFiles] = useState(0);

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
        file,
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

  const getUserDataByEmail = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const email = session?.user?.user_metadata?.email;
        if (email) {
          const fetchUserData = async () => {
            const userData = await getUserDataByEmail(email);
          };
          fetchUserData();
        }
      }
    );
  }, []);

  // const handleNextStep = async () => {
  //   setIsLoading(true);
  //   try {
  //     const requests = files.map(async (fileObj) => {
  //       const formData = new FormData();
  //       formData.append("file", fileObj.file);
  //       formData.append("user_id", "2");
  //       const response = await axios.post(
  //         `${BackendLink}/extract-bill-details/`,
  //         formData,
  //         {
  //           headers: {
  //             "Content-Type":
  //               "multipart/form-data; boundary=---011000010111000001101001",
  //           },
  //         }
  //       );
  //       return response.data;
  //     });

  //     const results = await Promise.all(requests);
  //     setBillData(results);
  //     setCurrentStep(2);
  //   } catch (error: any) {
  //     console.error("Error extracting bill details:", error);
  //     toast.error("Error extracting bill details. Please try again.");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };


  const handleNextStep = async () => {
    setIsLoading(true);
    try {
      const allFiles = [...files];


      /* ---------- bring mobile-captured files into the same array ---------- */
      for (const file of mobileFiles) {
        const res = await fetch(file.url);
        const blob = await res.blob();
        const dataUrl: string = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        allFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.key.split("/").pop(),
          dataUrl,                                   // ✨ preview & LS payload
          file: new File([blob], file.key.split("/").pop(), { type: blob.type }),
          isMobile: true,
        });
      }

      /* ---------- 🔑  PERSIST PREVIEWS PER COMPANY · MONTH · DAY ---------- */
      if (typeof window !== "undefined") {
        const company = selectedCompanyName ?? "UNNAMED_COMPANY";

        // helper for month labels
        const MONTHS = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];

        // today’s date (or swap in the bill’s real date if you have it here)
        const now = new Date();
        const monthKey = MONTHS[now.getMonth()];    // "May"
        const dayKey = String(now.getDate());     // "13"

        // full tree from LS (or empty)
        const store: Record<string, any> = JSON.parse(
          localStorage.getItem("BILLS") || "{}"
        );

        // ensure all nesting levels exist
        store[company] = store[company] ?? {};
        store[company][monthKey] = store[company][monthKey] ?? {};
        store[company][monthKey][dayKey] = store[company][monthKey][dayKey] ?? [];

        /* just the new previews ─ no blobs */
        const newPreviews = allFiles
          .map(f => f.dataUrl)              // -> string[]
          .filter(Boolean);

        // push objects { imageUrl } so UI code can stay the same
        newPreviews.forEach(url => {
          // optional dedupe
          if (!store[company][monthKey][dayKey].some((o: any) => o.imageUrl === url)) {
            store[company][monthKey][dayKey].push({ imageUrl: url });
          }
        });

        localStorage.setItem("BILLS", JSON.stringify(store));
      }

      /* -------------------------------------------------------------------- */


      for (const file of mobileFiles) {
        const res = await fetch(file.url);
        const blob = await res.blob();
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });

        const fileObj = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.key.split('/').pop(),
          dataUrl, // for preview
          file: new File([blob], file.key.split('/').pop(), { type: blob.type }),
          isMobile: true,
        };

        allFiles.push(fileObj);
      }

      setFiles(allFiles); // 👈 this enables preview
      setMobileFiles([]); // optional: clear mobileFiles state if now in `files`

      // Send files to backend
      const requests = allFiles.map(async (fileObj) => {
        const formData = new FormData();
        formData.append("file", fileObj.file);
        formData.append("user_id", "2");

        const response = await axios.post(
          `${BackendLink}/extract-bill-details/`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        return response.data;
      });

      const results = await Promise.all(requests);
      setBillData(results);
      setCurrentStep(2);
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
      [field]: value,
    };
    setBillData(newData);
  };

  const handleItemChange = (
    billIndex: number,
    itemIndex: number,
    field: string,
    value: any
  ) => {
    const newData = [...billData];
    const updatedItems = [...newData[billIndex].items];

    // mutate edited field
    updatedItems[itemIndex] = { ...updatedItems[itemIndex], [field]: value };

    // recompute amounts whenever base or tax fields change
    if (["QTY", "RATE", "DIS", "SGST", "CGST"].includes(field)) {
      const itm: Product = updatedItems[itemIndex];
      const qty = safeNum(itm.QTY);
      const rate = safeNum(itm.RATE);

      // taxable value (no GST)
      const taxable = qty * rate;

      updatedItems[itemIndex]["G AMT"] = toFixed2(taxable); // gross value before tax/discount
      updatedItems[itemIndex]["NET AMT"] = toFixed2(taxable); // net = taxable ONLY
    }

    newData[billIndex].items = updatedItems;
    setBillData(newData);

    recalculateBillTotals(billIndex, newData);
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
      "NET AMT": "",
      UNIT: "PCS",
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

    // Recalculate totals after removing an item
    recalculateBillTotals(billIndex, itemIndex, "", "");
  };

  const handleProductDragStart = (
    e: React.DragEvent<HTMLTableCellElement>,
    billIndex: number,
    itemIndex: number
  ) => {
    e.dataTransfer.setData("text/plain", itemIndex.toString());
  };

  const handleProductDragOver = (e: React.DragEvent<HTMLTableCellElement>) => {
    e.preventDefault();
  };

  const handleProductDrop = (
    e: React.DragEvent<HTMLTableCellElement>,
    billIndex: number,
    dropIndex: number
  ) => {
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

  const removeFile = async (id: string) => {

    const indexToRemove = files.findIndex((f) => f.id === id);
    setFiles((prev) => prev.filter((file) => file.id !== id));
    setBillData((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  // Function to handle bill selection change
  const handleBillChange = (newIndex: number) => {
    setCurrentBillIndex(newIndex);

    // Recalculate totals for the newly selected bill
    if (billData.length > 0 && billData[newIndex]?.items?.length > 0) {
      // Calculate initial totals for the new bill
      const totalNetAmount = billData[newIndex].items.reduce((total, item) => {
        return total + (parseFloat(item["NET AMT"]) || 0);
      }, 0);

      // Calculate GST totals by rate
      const gstRateTotals: { [key: string]: number } = {};

      billData[newIndex].items.forEach((item) => {
        const gstRate =
          (parseFloat(item.SGST) || 0) + (parseFloat(item.CGST) || 0);
        const gAmount = parseFloat(item["NET AMT"]) || 0;
        const gstAmount = (gAmount * gstRate) / 100;
        console.log({ gstRate, gAmount });
        if (gstRate > 0) {
          const rateKey = `${gstRate}%`;
          if (!gstRateTotals[rateKey]) {
            gstRateTotals[rateKey] = 0;
          }
          gstRateTotals[rateKey] += gstAmount;
        }
      });

      setNetAmountTotal(totalNetAmount);
      setGstTotals(gstRateTotals);
    } else {
      // Reset totals if there are no items
      setNetAmountTotal(0);
      setGstTotals({});
    }
  };

  function formatDateToDDMMYYYY(dateInput: Date | string): string {
    let date: Date;

    if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      if (dateInput?.includes("/")) {
        const parts = dateInput.split("/");
        if (parts.length === 3) {
          const [part1, part2, part3] = parts;
          const num1 = parseInt(part1, 10);
          const num2 = parseInt(part2, 10);
          const num3 = parseInt(part3, 10);

          let day: number, month: number, year: number;
          if (num1 > 12) {
            day = num1;
            month = num2;
          } else if (num2 > 12) {
            month = num1;
            day = num2;
          } else {
            day = num1;
            month = num2;
          }
          year = num3;

          date = new Date(year, month - 1, day);
        } else {
          date = new Date(dateInput);
        }
      } else {
        date = new Date(dateInput);
      }
    }

    const dd = date.getDate().toString().padStart(2, "0");
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const yyyy = date.getFullYear();

    return `${dd}-${mm}-${yyyy}`;
  }

  function extractGSTData(data: Product[]): GSTData[] {
    const seenProducts = new Set<string>();
    const result: GSTData[] = [];

    for (const item of data) {
      if (seenProducts.has(item.Product)) {
        continue;
      }
      seenProducts.add(item.Product);

      const gstValue =
        (parseFloat(item.SGST) || 0) + (parseFloat(item.CGST) || 0);
      const productName = item.Product.replace(/['"]/g, "");
      const unit = item.UNIT?.replace(/\d+/g, "").trim() || "PCS";

      result.push({
        Product: productName,
        HSN: item.HSN,
        SGST: item.SGST,
        CGST: item.CGST,
        gst: gstValue,
        decimal: gstValue / 100,
        symbol: unit,
      });
    }

    return result;
  }

  function extractPurchaserEntries(data: Product[]): PurchaserEntry[] {
    return data.map((product) => {
      const productName = product.Product.replace(/['"]/g, "");
      const unit = product.UNIT?.replace(/\d+/g, "").trim() || "PCS";

      return {
        name: productName,
        price: product.RATE === 0 ? 1 : product.RATE,
        quantity: product.QTY === 0 ? 1 : product.QTY,
        unit: unit,
      };
    });
  }

  function extractUnitsFromItems(rawItems) {
    const uniqueUnits = [];
    rawItems.forEach((item) => {
      const unit = item?.UNIT?.replace(/\d+/g, "").trim() || "PCS";
      if (!uniqueUnits.some((u) => u.name === unit)) {
        uniqueUnits.push({ name: unit, decimal: 3 });
      }
    });
    return uniqueUnits;
  }

  function splitIgstSingleFirstRate(igstBreakdown) {
    const entries = Object.entries(igstBreakdown);
    if (entries.length === 0) {
      return {
        cgst: { percentage: "0%", amount: 0 },
        sgst: { percentage: "0%", amount: 0 },
      };
    }

    // take only the first IGST entry
    const [firstPct, firstAmt] = entries[0]; // e.g. ["12%", 1587.6]
    const halfRate = parseFloat(firstPct) / 2; // 6
    const halfRateStr = `${halfRate}%`; // "6%"

    // total amount is still sum of all halves
    const totalHalfAmt = entries
      .map(([_, amt]) => amt / 2)
      .reduce((sum, v) => sum + v, 0);

    // return {
    //   cgst: { percentage: halfRateStr, amount: totalHalfAmt },
    //   sgst: { percentage: halfRateStr, amount: totalHalfAmt }
    // };

    return {
      cgst: { percentage: "2.5%", amount: totalHalfAmt },
      sgst: { percentage: "2.5%", amount: totalHalfAmt },
    };
  }

  // Create a new QR session
  const createQRSession = async () => {
    setQRSessionLoading(true);
    try {
      const response = await fetch("https://finetic-ai-mobile.primedepthlabs.com/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to create session");

      const session = await response.json();
      console.log(session, "here is ression");
      setQRSession(session);

      // Start polling for new files
      startPollingForFiles(session.sessionId);
    } catch (error) {
      console.error("Error creating session:", error);
    } finally {
      setQRSessionLoading(false);
    }
  };

  // Reset the QR session
  const resetQRSession = () => {
    setQRSession(null);
    setReceivedFiles(0);
  };

  // Poll for new files uploaded from mobile
  const startPollingForFiles = (sessionId) => {
    const pollInterval = setInterval(async () => {
      if (!sessionId) {
        clearInterval(pollInterval);
        return;
      }

      try {
        const response = await fetch(
          `https://finetic-ai-mobile.primedepthlabs.com/check-uploads/${sessionId}`
        );
        if (!response.ok) throw new Error("Failed to check uploads");

        const { files: newFiles } = await response.json();

        if (newFiles.length > 0) {
          // Update files only if there are new ones
          setMobileFiles((prevFiles) => {
            const existingKeys = new Set(prevFiles.map((f) => f.key));
            const filteredNewFiles = newFiles.filter(
              (f) => !existingKeys.has(f.key)
            );

            if (filteredNewFiles.length > 0) {
              setReceivedFiles((prev) => prev + filteredNewFiles.length);
              return [...prevFiles, ...filteredNewFiles];
            }

            return prevFiles;
          });
        }
      } catch (error) {
        console.error("Error polling for files:", error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  };

  console.log({ billData });

  const handleExport = async () => {
    const ledgerNames = [
      "Cgst0",
      "Cgst2.5",
      "Cgst6",
      "Cgst9",
      "Cgst14",
      "Igst0",
      "Igst5",
      "Igst12",
      "Igst18",
      "Igst28",
      "Ut/Sgst0",
      "Ut/Sgst2.5",
      "Ut/Sgst6",
      "Ut/Sgst9",
      "Ut/Sgst14",
    ];

    const ledgerXmlData = `
    <ENVELOPE>
      <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export</TALLYREQUEST>
        <TYPE>Collection</TYPE>
        <ID>Ledgers</ID>
      </HEADER>
      <BODY>
        <DESC>
          <STATICVARIABLES>
            <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
            <SVCURRENTCOMPANY>${selectedCompanyName}</SVCURRENTCOMPANY>
          </STATICVARIABLES>
          <TDL>
            <TDLMESSAGE>
              <COLLECTION ISMODIFY="No" ISFIXED="No" ISINITIALIZE="No" ISOPTION="No" ISINTERNAL="No" NAME="Ledgers">
                <TYPE>Ledger</TYPE>
                <NATIVEMETHOD>Address</NATIVEMETHOD>
                <NATIVEMETHOD>Masterid</NATIVEMETHOD>
                <NATIVEMETHOD>*</NATIVEMETHOD>
              </COLLECTION>
            </TDLMESSAGE>
          </TDL>
        </DESC>
      </BODY>
    </ENVELOPE>`;

    if (billData && billData.length > 1) {
      for (let bill of billData) {
        const purchaserName =
          role === "Purchaser"
            ? bill.receiverDetails?.name
            : bill.senderDetails?.name;
        const gst =
          role === "Purchaser"
            ? bill.receiverDetails?.gst
            : bill.senderDetails?.gst;
        const items = bill.items;
        const date = formatDateToDDMMYYYY(bill.billDate);
        const updatedItemsForExport = extractGSTData(items);
        const updatedUnits = extractUnitsFromItems(items);
        const updatedPurchaseEntryItem = extractPurchaserEntries(items);
        const invoiceNumber = bill.invoiceNumber;
        const { cgst, sgst } = splitIgstSingleFirstRate(gstTotals);

        // 2) Build the base payload
        const purchaseVoucherPayload = {
          invoiceNumber,
          invoiceDate: "01-04-2025",
          companyName: "PrimeDepth Labs",
          partyName: purchaserName,
          purchaseLedger: "Purchase",
          items: updatedPurchaseEntryItem,
          gstNumber: "ABCDE1234F",
          isWithinState: true,
          cgst,
          sgst,
        };

        const responsePartyName = await window.electron.createPartyName(
          ledgerXmlData,
          purchaserName,
          {
            name: purchaserName,
            parent: "Sundry Creditors",
            address: "",
            country: "India",
            state: "Punjab",
            date: "01-04-2025",
            gstin: gst || "04AAACI7952A1ZZ",
          }
        );

        console.log({
          name: purchaserName,
          parent: "Sundry Creditors",
          address: "",
          country: "India",
          state: "Punjab",
          date: "01-04-2025",
          gstin: gst || "04AAACI7952A1ZZ",
        });

        console.log({
          purchaserName,
          updatedUnits,
          updatedItemsForExport,
          purchaseVoucherPayload,
        });

        if (responsePartyName.success) {
          const responsePurchase = await window.electron.createPurchaserLedger(
            ledgerXmlData,
            "Purchase"
          );
          if (responsePurchase.success) {
            const responseTaxLedger = await window.electron.getTaxLedgerData(
              ledgerXmlData
            );
            if (responseTaxLedger.success) {
              const responseUnit = await window.electron.createUnit(
                updatedUnits
              );
              if (responseUnit?.success) {
                const responseItems = await window.electron.createItem(
                  updatedItemsForExport
                );
                if (responseItems.success) {
                  const responsePurchaseVoucher =
                    await window.electron.createPurchaseEntry(
                      purchaseVoucherPayload
                    );

                  console.log({ responsePurchaseVoucher });
                  if (responsePurchaseVoucher.success) {
                    alert("Success: Voucher Created ");
                  }
                } else {
                  alert("Error: while creating Items");
                }
              } else {
                alert("Error: while creating Unit");
              }
            } else {
              alert("Error: while creating Tax Ledger");
            }
          } else {
            alert("Error: while creating Purchase Ledger");
          }
        } else {
          alert("Error: while creating Party Ledger");
        }
      }
    } else if (billData && billData.length === 1) {
      const bill = billData[0];
      const purchaserName =
        role === "Purchaser"
          ? bill.receiverDetails?.name
          : bill.senderDetails?.name;
      const gst =
        role === "Purchaser"
          ? bill.receiverDetails?.gst
          : bill.senderDetails?.gst;
      const items = bill.items;
      const date = formatDateToDDMMYYYY(bill.billDate);
      const updatedItemsForExport = extractGSTData(items);
      const updatedUnits = extractUnitsFromItems(items);
      const updatedPurchaseEntryItem = extractPurchaserEntries(items);
      const invoiceNumber = bill.invoiceNumber;
      const { cgst, sgst } = splitIgstSingleFirstRate(gstTotals);

      // 2) Build the base payload
      const purchaseVoucherPayload = {
        invoiceNumber,
        invoiceDate: "01-04-2025",
        companyName: "PrimeDepth Labs",
        partyName: purchaserName,
        purchaseLedger: "Purchase",
        items: updatedPurchaseEntryItem,
        gstNumber: "ABCDE1234F",
        isWithinState: true,
        sgst,
        cgst,
      };

      console.log(
        { purchaserName },
        { updatedUnits },
        { updatedItemsForExport },
        { purchaseVoucherPayload },
        { updatedItemsForExport }
      );

      const responsePartyName = await window.electron.createPartyName(
        ledgerXmlData,
        purchaserName,
        {
          name: purchaserName,
          parent: "Sundry Creditors",
          address: "",
          country: "India",
          state: "Punjab",
          date: "01-04-2025",
          gstin: gst || "04AAACI7952A1ZZ",
        }
      );

      if (responsePartyName.success) {
        const responsePurchase = await window.electron.createPurchaserLedger(
          ledgerXmlData,
          "Purchase"
        );
        if (responsePurchase.success) {
          const responseTaxLedger = await window.electron.getTaxLedgerData(
            ledgerXmlData
          );
          if (responseTaxLedger.success) {
            const responseUnit = await window.electron.createUnit(updatedUnits);
            if (responseUnit?.success) {
              const responseItems = await window.electron.createItem(
                updatedItemsForExport
              );
              if (responseItems.success) {
                const responsePurchaseVoucher =
                  await window.electron.createPurchaseEntry(
                    purchaseVoucherPayload
                  );

                console.log({ responsePurchaseVoucher });
                if (responsePurchaseVoucher.success) {
                  alert("Success: Voucher Created ");
                }
              } else {
                alert("Error: while creating Items");
              }
            } else {
              alert("Error: while creating Unit");
            }
          } else {
            alert("Error: while creating Tax Ledger");
          }
        } else {
          alert("Error: while creating Purchase Ledger");
        }
      } else {
        alert("Error: while creating Party Ledger");
      }
    }
  };

  const recalculateBillTotals = (
    billIndex: number,
    dataSource: any[] = billData
  ) => {
    const items: Product[] = dataSource[billIndex].items || [];

    // total taxable
    const taxableTotal = items.reduce(
      (sum, itm) => sum + safeNum(itm["NET AMT"]),
      0
    );

    // GST buckets
    const buckets: { [k: string]: number } = {};
    items.forEach((itm) => {
      const sgst = safeNum(itm.SGST);
      const cgst = safeNum(itm.CGST);
      const rate = sgst + cgst;
      if (!rate) return;
      const key = `${rate}%`;
      const gstAmt = safeNum(itm["NET AMT"]) * (rate / 100);
      buckets[key] = (buckets[key] || 0) + gstAmt;
    });

    setNetAmountTotal(taxableTotal);
    setGstTotals(buckets);
  };

  useEffect(() => {
    fetchCompanies();
    fetchGstDetails();
  }, [selectedCompanyName]);

  useEffect(() => {
    // when the list arrives, select the 1st company only if user hasn't chosen one
    if (!selectedCompanyName && companyList.length > 0) {
      setSelectedCompanyName(companyList[0]);
    }
  }, [companyList, selectedCompanyName]);
  

  // Add this useEffect to initialize totals when bill data changes
  useEffect(() => {
    if (billData.length > 0 && billData[currentBillIndex]?.items?.length > 0) {
      // Calculate initial totals
      const totalNetAmount = billData[currentBillIndex].items.reduce(
        (total, item) => {
          console.log(item["NET AMT"], "net amount");
          return total + (parseFloat(item["NET AMT"]) || 0);
        },
        0
      );

      // Calculate GST totals by rate
      const gstRateTotals: { [key: string]: number } = {};

      billData[currentBillIndex].items.forEach((item) => {
        const gstRate =
          (parseFloat(item.SGST) || 0) + (parseFloat(item.CGST) || 0);
        const gAmount = parseFloat(item["NET AMT"]) || 0;
        const gstAmount = gAmount * (gstRate / 100);
        if (gstRate > 0) {
          const rateKey = `${gstRate}%`;
          if (!gstRateTotals[rateKey]) {
            gstRateTotals[rateKey] = 0;
          }
          gstRateTotals[rateKey] += gstAmount;
        }
      });

      setNetAmountTotal(totalNetAmount);
      setGstTotals(gstRateTotals);
    }
  }, [billData, currentBillIndex]);

  const fetchCompanies = async () => {
    setIsLoading(true);

    const xmlData = `<ENVELOPE>
      <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export</TALLYREQUEST>
        <TYPE>Collection</TYPE>
        <ID>List of Companies</ID>
      </HEADER>
      <BODY>
        <DESC>
          <STATICVARIABLES>
            <SVIsSimpleCompany>No</SVIsSimpleCompany>
          </STATICVARIABLES>
          <TDL>
            <TDLMESSAGE>
              <COLLECTION ISMODIFY="No" ISFIXED="No" ISINITIALIZE="Yes" ISOPTION="No" ISINTERNAL="No" NAME="List of Companies">
                <TYPE>Company</TYPE>
                <NATIVEMETHOD>Name</NATIVEMETHOD>
              </COLLECTION>
              <ExportHeader>EmpId:5989</ExportHeader>
            </TDLMESSAGE>
          </TDL>
        </DESC>
      </BODY>
    </ENVELOPE>`;

    try {
      const response = await window.electron.getCompanyData(xmlData);
      const data = response.data;
      const companyList = await extractCompanyNames(data);
      setCompanyList(companyList);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGstDetails = async () => {
    const xmlData = `<ENVELOPE>
    <HEADER>
      <VERSION>1</VERSION>
      <TALLYREQUEST>Export</TALLYREQUEST>
      <TYPE>Collection</TYPE>
      <ID>Ledgers</ID>
    </HEADER>
    <BODY>
      <DESC>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          <SVCURRENTCOMPANY>${selectedCompanyName}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
        <TDL>
          <TDLMESSAGE>
            <COLLECTION ISMODIFY="No" ISFIXED="No" ISINITIALIZE="No" ISOPTION="No" ISINTERNAL="No" NAME="Ledgers">
              <TYPE>Ledger</TYPE>
              <NATIVEMETHOD>Address</NATIVEMETHOD>
              <NATIVEMETHOD>Masterid</NATIVEMETHOD>
              <NATIVEMETHOD>*</NATIVEMETHOD>
            </COLLECTION>
          </TDLMESSAGE>
        </TDL>
      </DESC>
    </BODY>
  </ENVELOPE>`;

    try {
      const response = await window.electron.getGSTData(xmlData);
      setGstNumber(response?.[0]?.gst);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    createQRSession()
  }, [])

  // Add the BillTotals component
  const BillTotals = () => {
    const gstTotalAmount = Object.values(gstTotals).reduce(
      (sum, amount) => sum + amount,
      0
    );
    console.log({ gstTotals });
    return (
      <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Bill Totals
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-3">
              GST Breakup
            </h4>

            {Object.keys(gstTotals).length === 0 ? (
              <p className="text-gray-500 text-sm">No GST data available</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(gstTotals).map(([rate, amount]) => (
                  <div
                    key={rate}
                    className="flex justify-between items-center text-sm"
                  >
                    <div className="flex items-center">
                      <span className="font-medium">{rate} GST</span>
                      <span className="text-gray-500 ml-2">
                        (CGST: {parseFloat(rate) / 2}%, SGST:{" "}
                        {parseFloat(rate) / 2}%)
                      </span>
                    </div>
                    <span className="font-medium text-black">
                      ₹{amount.toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-medium text-black">
                    Total GST Amount
                  </span>
                  <span className="font-bold text-black">
                    ₹{gstTotalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-3">
              Bill Summary
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700">Taxable Amount</span>
                <span className="font-medium text-black">
                  ₹{netAmountTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700">Total GST</span>
                <span className="font-medium  text-black">
                  ₹{gstTotalAmount.toFixed(2)}
                </span>
              </div>
              <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center">
                <span className="font-medium">Gross Amount Total</span>
                <span className="text-xl font-bold text-blue-700">
                  ₹{(netAmountTotal + gstTotalAmount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (currentStep === 0 && !role) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
        <header className="py-6 px-8 border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto flex items-center">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-800 ml-6">
              Bill Management System
            </h1>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-2xl font-bold text-gray-800">
                {currentStep === 0 ? "Select Company" : "Select Document Type"}
              </h2>
              <p className="text-gray-600 mt-1">
                {currentStep === 0
                  ? "Choose the company you want to work with"
                  : "Choose the type of bills you want to manage"}
              </p>
            </div>

            {currentStep === 0 ? (
              <div className="p-8 space-y-6">
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label
                        htmlFor="company"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Select Company
                      </label>
                      <div className="relative">
                        <select
                          id="company"
                          value={selectedCompanyName}
                          onChange={(e) =>
                            setSelectedCompanyName(e.target.value)
                          }
                          className="block w-full pl-3 pr-10 py-3 text-black border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border-2"
                        >
                          {companyList.length === 0 && (
                            <option value="">No companies available</option>
                          )}
                          {companyList &&
                            companyList?.map((company, index) => (
                              <option key={index} value={company}>
                                {company}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="p-8 space-y-6">
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500">
                      Selected Company:
                    </span>
                    <span className="ml-2 text-sm font-semibold text-gray-900">
                      {selectedCompanyName}
                    </span>
                    <button
                      onClick={() => setCurrentStep(0)}
                      className="ml-3 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Change
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <button
                    onClick={() => {
                      setRole("Purchaser");
                    }}
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
                      Enter and manage bills for items or services you've
                      purchased
                    </p>
                    <div className="mt-6 bg-blue-500 text-white px-5 py-2 rounded-full font-medium text-sm relative z-10 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                      Select
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setRole("Seller");
                    }}
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
                      Create and manage bills for products or services you've
                      sold
                    </p>
                    <div className="mt-6 bg-green-500 text-white px-5 py-2 rounded-full font-medium text-sm relative z-10 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                      Select
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* --- GST Number Field --- */}
            <div className="mb-6 px-8 text-black">
              <div>
                <label
                  htmlFor="gstNumber"
                  className="block text-sm font-medium text-black"
                >
                  GST Number
                </label>
                <input
                  type="text"
                  id="gstNumber"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="Enter GST Number"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end my-6 px-4">
              <button
                onClick={() => setCurrentStep(1)}
                disabled={!selectedCompanyName}
                className={`px-6 py-2 rounded-md text-white font-medium transition-all 
                        ${!selectedCompanyName
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  }`}
              >
                Continue
              </button>
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
        <div className="mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-xl font-bold text-gray-800 hidden md:block">
              {role === "Purchaser"
                ? "Purchase Bill Management"
                : "Sales Bill Management"}
            </h1>
          </div>

          <div className="text-sm flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full">
            <span className="font-medium text-blue-700">
              {role === "Purchaser" ? "Purchase Mode" : "Sales Mode"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Stepper
          steps={["Role Selection", "Upload Files", "Verify Data", "Confirm"]}
          currentStep={currentStep}
        />

        {currentStep === 1 && (
          <div className="space-y-8">
            {/* Drag & Drop Area - Keep original functionality */}
            <div
              onDragOver={handleDragOverFiles}
              onDragLeave={handleDragLeaveFiles}
              onDrop={handleDropFiles}
              className={`group relative bg-white rounded-2xl border-2 border-dashed ${isDraggingFile
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-300"
                } transition-all duration-200 py-16 px-6 text-center cursor-pointer shadow-lg hover:shadow-xl`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-6 relative z-10">
                <div className="inline-flex flex-col items-center">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors duration-200 group-hover:scale-110 transform">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                      Drag & Drop Bills
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Supported formats: JPG, PDF (Max {MAX_FILE_SIZE_MB}MB
                      each)
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

              {/* Visual elements for better appearance */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-6 left-6 w-16 h-16 bg-blue-100 rounded-full opacity-20"></div>
                <div className="absolute bottom-6 right-6 w-20 h-20 bg-blue-100 rounded-full opacity-20"></div>
              </div>
            </div>

            {/* QR Code Section - Enhanced with mobile upload functionality */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
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
                        {receivedFiles > 0 && (
                          <div className="w-full text-sm text-blue-600">
                            {receivedFiles}{" "}
                            {receivedFiles === 1 ? "file" : "files"} received
                            from mobile
                          </div>
                        )}
                        {/* <button
                          onClick={resetQRSession}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Reset Session
                        </button> */}
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
                    <QRCode
                      value={qrSession.mobileUploadUrl}
                      size={180}
                      bgColor={"#FFFFFF"}
                      fgColor={"#1D4ED8"}
                      style={{ height: 180, maxWidth: "100%", width: "100%" }}
                    />
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

            {/* File List - Original structure with enhanced styling */}
            {(files.length > 0 || mobileFiles.length > 0) && (
              <div className="space-y-4 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Uploaded Files ({files.length + mobileFiles.length})
                  </h3>
                  {(files.length > 1 || mobileFiles.length > 0) && (
                    <button
                      onClick={() => {
                        setFiles([]);
                        setMobileFiles([]);
                      }}
                      className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Desktop uploaded files */}
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
                        onClick={async (e) => {
                          e.stopPropagation();
                          await removeFile(file.id);
                        }}
                        className="text-gray-400 hover:text-red-600 ml-4 transition-colors rounded-full p-1.5 hover:bg-red-50"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}

                  {/* Mobile uploaded files */}
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
                        onClick={async (e) => {
                          e.stopPropagation();
                          console.log(e, file, qrSession)
                          await axios.delete(`https://finetic-ai-mobile.primedepthlabs.com/delete-upload/${qrSession?.sessionId}`, {
                            data: { key: file.key },
                            headers: { "Content-Type": "application/json" }
                          })
                          setMobileFiles((files) =>
                            files.filter((f) => f.key !== file.key)
                          );

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
                disabled={files.length === 0 && mobileFiles.length === 0}
                className={`px-6 py-3 rounded-lg font-medium text-base transition-all flex items-center gap-2 ${files.length > 0 || mobileFiles.length > 0
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

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white p-6 shadow-lg rounded-xl mb-6">
              <div className="gap-6">
                <div className="flex gap-6">
                  <div className="w-1/2">
                    <div
                      className="bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center"
                      style={{ height: "30rem" }}
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
                        onClick={() =>
                          handleBillChange(Math.max(0, currentBillIndex - 1))
                        }
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
                            onClick={() => handleBillChange(idx)}
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
                          else handleBillChange(currentBillIndex + 1);
                        }}
                        className="flex items-center justify-center p-2 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="w-1/2">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <FileDigit className="w-5 h-5" />
                        Bill Information
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <TextField
                          label="Invoice Number"
                          value={
                            billData[currentBillIndex]?.invoiceNumber || ""
                          }
                          onChange={(e) =>
                            handleDataChange("invoiceNumber", e.target.value)
                          }
                        />

                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            Bill Date
                          </label>
                          <input
                            type="text"
                            value={billData[currentBillIndex]?.billDate || ""}
                            onChange={(e) =>
                              handleDataChange("billDate", e.target.value)
                            }
                            className="block w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white hover:bg-gray-50 focus:bg-white"
                            placeholder="DD/MM/YYYY"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                          <Building className="w-5 h-5" />
                          {role === "Purchaser"
                            ? "Receiver Details"
                            : "Sender Details"}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <TextField
                            label={
                              role === "Purchaser"
                                ? "Receiver Name"
                                : "Sender Name"
                            }
                            value={
                              role === "Purchaser"
                                ? billData[currentBillIndex]?.receiverDetails
                                  ?.name || ""
                                : billData[currentBillIndex]?.senderDetails
                                  ?.name || ""
                            }
                            onChange={(e) => {
                              if (role === "Purchaser") {
                                handleDataChange("receiverDetails", {
                                  ...billData[currentBillIndex]
                                    ?.receiverDetails,
                                  name: e.target.value,
                                });
                              } else {
                                handleDataChange("senderDetails", {
                                  ...billData[currentBillIndex]?.senderDetails,
                                  name: e.target.value,
                                });
                              }
                            }}
                          />

                          <TextField
                            label={
                              role === "Purchaser"
                                ? "Receiver GST"
                                : "Sender GST"
                            }
                            value={
                              role === "Purchaser"
                                ? billData[currentBillIndex]?.receiverDetails
                                  ?.gst || ""
                                : billData[currentBillIndex]?.senderDetails
                                  ?.gst || ""
                            }
                            onChange={(e) => {
                              if (role === "Purchaser") {
                                handleDataChange("receiverDetails", {
                                  ...billData[currentBillIndex]
                                    ?.receiverDetails,
                                  gst: e.target.value,
                                });
                              } else {
                                handleDataChange("senderDetails", {
                                  ...billData[currentBillIndex]?.senderDetails,
                                  gst: e.target.value,
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
                        "HSN",
                        "MRP",
                        "RATE",
                        "DIS",
                        "SGST",
                        "CGST",
                        "G AMT",
                        "Actions",
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
                    {billData[currentBillIndex]?.items?.map(
                      (item: any, idx: number) => {
                        return (
                          <>
                            <tr
                              key={idx}
                              className={`transition-colors mt-10 ${item.Qty == 0 || item.RATE == 0
                                ? "bg-red-300"
                                : ""
                                }`}
                            >
                              <td
                                className="px-3 py-2.5 w-72 relative"
                                draggable
                                onDragStart={(e) =>
                                  handleProductDragStart(
                                    e,
                                    currentBillIndex,
                                    idx
                                  )
                                }
                                onDragOver={handleProductDragOver}
                                onDrop={(e) =>
                                  handleProductDrop(e, currentBillIndex, idx)
                                }
                              >
                                <div className="flex items-center group">
                                  <MoveHorizontal className="w-4 h-4 text-gray-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
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
                                </div>
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
                              <td className="px-3 py-2 w-28">
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
                              <td className="px-3 py-2 w-28">
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
                              <td className="px-3 py-2 w-24">
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
                              <td className="px-3 py-2 w-16">
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
                                />
                              </td>
                              <td className="px-3 py-2 w-16">
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
                                />
                              </td>
                              <td className="px-3 py-2 w-28">
                                <p className="w-full rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                  {item["G AMT"]}
                                </p>
                              </td>
                              <td className="px-3 py-2 w-10">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() =>
                                      removeItem(currentBillIndex, idx)
                                    }
                                    className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition-colors"
                                    title="Remove item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            <tr className="pb-10">
                              <td
                                className={`px-3 py-2.5 text-center border-b-8 border-gray-300 ${item.Qty == 0 || item.RATE == 0
                                  ? "bg-red-300"
                                  : ""
                                  }`}
                                colSpan={11}
                              >
                                <div className="gap-2 mx-auto w-[fit-content]">
                                  {billData[
                                    currentBillIndex
                                  ].invoice_items_cropped_images?.cell_images
                                    .filter(
                                      (item, index) =>
                                        index === 0 ||
                                        index === idx + 1 ||
                                        index === idx + 2
                                    )
                                    .map((row: any, rowIndex: number) => (
                                      <div
                                        key={rowIndex}
                                        className="flex flex-wrap gap-2"
                                      >
                                        {row.map(
                                          (img: string, colIndex: number) =>
                                            img ? (
                                              <img
                                                key={colIndex}
                                                src={`${img}`}
                                                onClick={() => {
                                                  setRowModalIndex(idx)
                                                }}
                                                alt={`Invoice cell ${rowIndex}-${colIndex}`}
                                                className="w-[90px] border-2 border h-[30px] object-contain border"
                                              />
                                            ) : (
                                              <div
                                                key={colIndex}
                                                className="w-[100px] h-[100px] border flex items-center justify-center text-xs text-gray-500"
                                              >
                                                No Image
                                              </div>
                                            )
                                        )}
                                      </div>
                                    ))}
                                </div>
                              </td>
                            </tr>
                          </>
                        );
                      }
                    )}

                    {(!billData[currentBillIndex]?.items ||
                      billData[currentBillIndex]?.items.length === 0) && (
                        <tr>
                          <td
                            colSpan={12}
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            <div className="flex flex-col items-center">
                              <svg
                                className="w-12 h-12 text-gray-300 mb-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1}
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
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

            {/* Add the BillTotals component here, right after the items table */}
            <BillTotals />

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Financial Summary
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    value={billData[currentBillIndex]?.totalAmount || ""}
                    onChange={(e) =>
                      handleDataChange("totalAmount", e.target.value)
                    }
                    className="block w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white hover:bg-gray-50 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Grand Total
                  </label>
                  <input
                    type="text"
                    value={billData[currentBillIndex]?.grandTotal || ""}
                    onChange={(e) =>
                      handleDataChange("grandTotal", e.target.value)
                    }
                    className="block w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white hover:bg-gray-50 focus:bg-white font-medium"
                  />
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
                    handleBillChange(currentBillIndex + 1);
                  }
                }}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md"
              >
                {currentBillIndex === files.length - 1
                  ? "Proceed to Confirm"
                  : "Next Bill"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                Bill Summary
              </h3>

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
                            ? `From: ${billData[index]?.senderDetails?.name ||
                            "Unknown"
                            }`
                            : `To: ${billData[index]?.receiverDetails?.name ||
                            "Unknown"
                            }`}
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
                <p className="text-center text-gray-500 text-sm">
                  {status}
                  {error && (
                    <span className="block text-red-500 mt-2">{error}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
      <RowDetailModal
        open={rowModalIndex !== null}
        rowIndex={rowModalIndex ?? 0}
        item={
          rowModalIndex !== null
            ? billData[currentBillIndex]?.items[rowModalIndex]
            : {}
        }
        images={
          rowModalIndex !== null
            ? (
              billData[currentBillIndex]
                .invoice_items_cropped_images?.cell_images ?? []
            )
              .filter((_, r) => r === 0 || r === rowModalIndex + 1 || r === rowModalIndex + 2)
              .flat()
              .filter(Boolean)
            : []
        }
        onUpdate={(field, val) =>
          rowModalIndex !== null &&
          handleItemChange(currentBillIndex, rowModalIndex, field, val)
        }
        onClose={() => setRowModalIndex(null)}
      />

    </div>
  );
}
