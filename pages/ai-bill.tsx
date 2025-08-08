// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { BackendLink } from "../service/api";
import { useRouter } from "next/router";
import {
  getGSTData,
  createPartyName,
  createPurchaserLedger,
  getTaxLedgerData,
  createUnit,
  createItem,
  createPurchaseEntry,
  getCurrentCompanyData
} from "../service/tally";
import {
  ChevronLeft, Upload, FileText, X, ChevronRight, ArrowLeft,
  Check, Plus, CloudCog, Trash2, Filter, ZoomIn, MoveHorizontal,
  Edit, Calendar, FileDigit, Building, PlusCircle, Smartphone,
  CheckCircle, RefreshCw, AlertCircle, Play
} from "lucide-react";
import { toast } from "react-toastify";
import { ZoomOut, RotateCcw, Move, Maximize, Minimize, Minus } from "lucide-react";
import { supabase } from "../lib/supabase";
import QRCode from "react-qr-code";
import * as XLSX from "xlsx";
import { getStockItemFullData } from "../service/commonFunction";
import DocumentTypeSelector from "../components/purchase-flow/DocumentTypeSelector";
import FileUploadStep from "../components/purchase-flow/FileUploadStep";
import BillVerificationStep from "../components/purchase-flow/BillVerificationStep";
import ConfirmationStep from "../components/purchase-flow/ConfirmationStep";
import RowDetailModal from "../components/purchase-flow/RowDetailModal";
import ZoomableImage from "../components/purchase-flow/ZoomableImage";
import LoadingScreen from "../components/purchase-flow/LoadingScreen";
import Stepper from "../components/purchase-flow/Stepper";

// Utility functions
const toFixed2 = (num: number) => Number(num || 0).toFixed(2);
const safeNum = (v: any) => parseFloat(v) || 0;

export default function BillWorkflow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [role, setRole] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [billData, setBillData] = useState<any[]>([]);
  const [currentBillIndex, setCurrentBillIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("Ready to export");
  const [error, setError] = useState<string | null>(null);
  const [netAmountTotal, setNetAmountTotal] = useState<number>(0);
  const [gstTotals, setGstTotals] = useState<{ [key: string]: number }>({});
  const [selectedCompanyName, setSelectedCompanyName] = useState("");
  const [gstNumber, setGstNumber] = useState("07BGUPD3647XXXX");
  const [isWithinState, setIsWithinState] = useState(false);
  const [qrSession, setQRSession] = useState<any>(null);
  const [qrSessionLoading, setQRSessionLoading] = useState(false);
  const [mobileFiles, setMobileFiles] = useState<any[]>([]);
  const [receivedFiles, setReceivedFiles] = useState(0);
  const [tallyStockItems, setTallyStockItems] = useState<any[]>([]);
  const [rowModalIndex, setRowModalIndex] = useState<number | null>(null);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Helper functions
  const getStateFromGST = (gst: string) => gst?.substring(0, 2);
  const findIsWithinState = (ourGST: string, theirGST: string) =>
    getStateFromGST(ourGST) === getStateFromGST(theirGST);

  // Fetch current company data
  const fetchCurrentComapny = async () => {
    try {
      const response = await getCurrentCompanyData();
      setSelectedCompanyName(response?.data || "");
    } catch (error) {
      console.error("Error fetching company data:", error);
    }
  };

  // Fetch tally stock items
  const getTallyStockItems = async () => {
    try {
      const response = await getStockItemFullData();
      setTallyStockItems(response || []);
    } catch (error) {
      console.error("Error fetching stock items:", error);
    }
  };

  useEffect(() => {
    fetchCurrentComapny();
    getTallyStockItems();

    const interval = setInterval(() => {
      fetchCurrentComapny();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handle export to Excel
  const handleExportItemsToExcel = () => {
    const bill = billData[currentBillIndex];
    if (!bill || !bill.items?.length) {
      toast.warn("No items to export in this bill");
      return;
    }

    const rows = bill.items.map((row: any) => ({
      Product: row.Product,
      Quantity: row.QTY,
      HSN: row.HSN,
      MRP: row.MRP,
      Rate: row.RATE,
      Discount: row.DIS,
      SGST: row.SGST,
      CGST: row.CGST,
      IGST: row.IGST,
      "Gross Amt": row["G AMT"],
      "Net Amt": row["NET AMT"],
      Unit: row.UNIT,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook: XLSX.WorkBook = {
      Sheets: { Items: worksheet },
      SheetNames: ["Items"],
    };

    const filename = `InvoiceItems-${bill.invoiceNumber || currentBillIndex + 1}.xlsx`;
    XLSX.writeFile(workbook, filename);
    toast.success(`Exported ${rows.length} items → ${filename}`);
  };

  // Read file as data URL
  const readFile = (file: File) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });

  // Process uploaded files
  const processFiles = async (filesToProcess: File[]) => {
    const MAX_FILE_SIZE_MB = 50;
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

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

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    processFiles(selectedFiles);
  };

  // Handle drag and drop
  const handleDragOverFiles = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDropFiles = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  // Create QR session for mobile uploads
  const createQRSession = async () => {
    setQRSessionLoading(true);
    try {
      const response = await fetch(
        "https://finetic-ai-mobile.primedepthlabs.com/create-session",
        { method: "POST" }
      );

      if (!response.ok) throw new Error("Failed to create session");

      const session = await response.json();
      setQRSession(session);
      startPollingForFiles(session.sessionId);
    } catch (error) {
      console.error("Error creating session:", error);
    } finally {
      setQRSessionLoading(false);
    }
  };

  // Poll for mobile uploads
  const startPollingForFiles = (sessionId: string) => {
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
          setMobileFiles((prevFiles) => {
            const existingKeys = new Set(prevFiles.map((f: any) => f.key));
            const filteredNewFiles = newFiles.filter(
              (f: any) => !existingKeys.has(f.key)
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
    }, 3000);

    return () => clearInterval(pollInterval);
  };

  // Process all files (desktop + mobile)
  const processAllFiles = async () => {
    setIsLoading(true);
    try {
      const allFiles = [...files];

      // Process mobile files
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
          dataUrl,
          file: new File([blob], file.key.split("/").pop(), {
            type: blob.type,
          }),
          isMobile: true,
        });
      }

      setFiles(allFiles);
      setMobileFiles([]);

      // Send files to backend
      const requests = allFiles.map(async (fileObj) => {
        const formData = new FormData();
        formData.append("file", fileObj.file);
        formData.append("user_id", "2");

        const response = await axios.post(
          `${BackendLink}/extract-bill-details/`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        return response.data;
      });

      const results = await Promise.all(requests);
      setBillData(results);

      /* ---------- 🔑  PERSIST PREVIEWS PER COMPANY · MONTH · DAY ---------- */
      if (typeof window !== "undefined") {
        const company = selectedCompanyName ?? "UNNAMED_COMPANY";

        // helper for month labels
        const MONTHS = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

        // today's date (or swap in the bill's real date if you have it here)
        const now = new Date();
        const monthKey = MONTHS[now.getMonth()]; // "May"
        const dayKey = String(now.getDate()); // "13"

        // full tree from LS (or empty)
        const store: Record<string, any> = JSON.parse(
          localStorage.getItem("BILLS") || "{}"
        );

        // ensure all nesting levels exist

        /* just the new previews ─ no blobs */
        const newPreviews = allFiles
          .map((f) => f.dataUrl) // -> string[]
          .filter(Boolean);

        // push objects { imageUrl } so UI code can stay the same
        newPreviews.forEach((url, index) => {
          const allCurrentResultData = results[index]
          const billDateStr = allCurrentResultData.billDate; // e.g., '12/20/2021'
          const [month, day, year] = billDateStr.split('/');
          store[company] = store[company] ?? {};
          store[company][year] = store[company][year] ?? {};

          store[company][year][month] = store[company][year][month] ?? {};
          store[company][year][month][day] =
            store[company][year][month][day] ?? [];

          // optional dedupe
          if (
            !store[company][year][month][day].some(
              (o: any) => o.imageUrl === url
            )
          ) {
            store[company][year][month][day].push({
              imageUrl: url,
              gst: allCurrentResultData.gstNumber,
              invoiceNo: allCurrentResultData.invoiceNumber,
              invoiceValue: allCurrentResultData.totalAmount,
              senderDetails: allCurrentResultData.receiverDetails,
              receiverDetails: allCurrentResultData.receiverDetails
            });
          }
        });

        localStorage.setItem("BILLS", JSON.stringify(store));
      }


      setCurrentStep(2);
    } catch (error: any) {
      console.error("Error extracting bill details:", error);
      toast.error("Error extracting bill details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle data change
  const handleDataChange = (field: string, value: any) => {
    const newData = [...billData];
    newData[currentBillIndex] = {
      ...newData[currentBillIndex],
      [field]: value,
    };
    setBillData(newData);
  };

  // Handle item change
  const handleItemChange = (
    billIndex: number,
    itemIndex: number,
    field: string,
    value: any
  ) => {
    const newData = [...billData];
    const updatedItems = [...newData[billIndex].items];

    updatedItems[itemIndex] = { ...updatedItems[itemIndex], [field]: value };

    if (["QTY", "RATE", "DIS", "SGST", "CGST"].includes(field)) {
      const itm: any = updatedItems[itemIndex];
      const qty = safeNum(itm.QTY);
      const rate = safeNum(itm.RATE);
      const taxable = qty * rate;

      updatedItems[itemIndex]["G AMT"] = toFixed2(taxable);
      updatedItems[itemIndex]["NET AMT"] = toFixed2(taxable);
    }

    newData[billIndex].items = updatedItems;
    setBillData(newData);
    recalculateBillTotals(billIndex, newData);
  };

  // Add new item
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

  // Remove item
  const removeItem = (billIndex: number, itemIndex: number) => {
    const newData = [...billData];
    newData[billIndex].items.splice(itemIndex, 1);
    setBillData(newData);
    recalculateBillTotals(billIndex, newData);
  };

  // Recalculate bill totals
  const recalculateBillTotals = (
    billIndex: number,
    dataSource: any[] = billData
  ) => {
    const items: any[] = dataSource[billIndex].items || [];
    const taxableTotal = items.reduce(
      (sum, itm) => sum + safeNum(itm["RATE"] * itm["QTY"]),
      0
    );

    const buckets: { [k: string]: number } = {};
    items.forEach((itm) => {
      const sgst = safeNum(itm.SGST);
      const cgst = safeNum(itm.CGST);
      const igst = safeNum(itm.IGST);
      const rate = sgst + cgst + igst;

      if (!rate) return;
      const key = `${rate}%`;
      const gstAmt = safeNum(itm["NET AMT"]) * (rate / 100);
      buckets[key] = (buckets[key] || 0) + gstAmt;
    });

    setNetAmountTotal(taxableTotal);
    setGstTotals(buckets);
  };

  // Handle bill change
  const handleBillChange = (newIndex: number) => {
    setCurrentBillIndex(newIndex);
    recalculateBillTotals(newIndex);
  };

  // Helper functions for handleExport
  const formatDateToDDMMYYYY = (dateInput: Date | string): string => {
    let date: Date;

    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      if (dateInput.includes('/')) {
        const [day, month, year] = dateInput.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        date = new Date(dateInput);
      }
    } else {
      date = new Date();
    }

    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();

    return `${dd}-${mm}-${yyyy}`;
  };

  const extractGSTData = (data: any[]): GSTData[] => {
    const seenProducts = new Set<string>();
    const result: GSTData[] = [];

    for (const item of data) {
      if (seenProducts.has(item.Product)) continue;
      seenProducts.add(item.Product);

      const gstValue = (parseFloat(item.SGST) || 0) + (parseFloat(item.CGST) || 0);
      const productName = item.Product.replace(/[^a-zA-Z0-9 ]/g, "").trim();
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
  };

  const extractPurchaserEntries = (data: any[]): PurchaserEntry[] => {
    return data.map((product) => {
      const productName = product.Product.replace(/[^a-zA-Z0-9 ]/g, "").trim();
      const unit = product.UNIT?.replace(/\d+/g, "").trim() || "PCS";

      return {
        name: productName,
        price: product.RATE === 0 ? 1 : product.RATE,
        quantity: product.QTY === 0 ? 1 : product.QTY,
        unit: unit,
      };
    });
  };

  const extractUnitsFromItems = (rawItems: any[]) => {
    const uniqueUnits: any[] = [];
    rawItems.forEach((item) => {
      const unit = item?.UNIT?.replace(/\d+/g, "").trim() || "PCS";
      if (!uniqueUnits.some((u) => u.name === unit)) {
        uniqueUnits.push({ name: unit, decimal: 3 });
      }
    });
    return uniqueUnits;
  };

  const splitIgstSingleFirstRate = (igstBreakdown: { [key: string]: number }) => {
    const entries = Object.entries(igstBreakdown);
    if (entries.length === 0) {
      return {
        cgst: { percentage: "0%", amount: 0 },
        sgst: { percentage: "0%", amount: 0 },
      };
    }

    // Take the first IGST entry
    const [firstPct, firstAmt] = entries[0];
    const halfRate = parseFloat(firstPct) / 2;
    const halfRateStr = `${halfRate}%`;
    const totalHalfAmt = entries
      .map(([_, amt]) => amt / 2)
      .reduce((sum, v) => sum + v, 0);

    return {
      cgst: { percentage: halfRateStr, amount: totalHalfAmt },
      sgst: { percentage: halfRateStr, amount: totalHalfAmt },
    };
  };

  // Main handleExport function
  const handleExport = async () => {
    setIsLoading(true);
    setStatus("Exporting to Tally...");

    try {
      // Loop through all bills
      for (let i = 0; i < billData.length; i++) {
        const bill = billData[i];
        const purchaserName = role === "Purchaser"
          ? bill.receiverDetails?.name
          : bill.senderDetails?.name;

        const gst = role === "Purchaser"
          ? bill.receiverDetails?.gst
          : bill.senderDetails?.gst;

        const items = bill.items || [];
        const date = formatDateToDDMMYYYY(bill.billDate);
        const updatedItemsForExport = extractGSTData(items);
        const updatedUnits = extractUnitsFromItems(items);
        const updatedPurchaseEntryItem = extractPurchaserEntries(items);
        const invoiceNumber = bill.invoiceNumber;

        // Calculate GST totals
        const gstTotalsForBill: { [key: string]: number } = {};
        items.forEach((item: any) => {
          const gstRate = (parseFloat(item.SGST) || 0) + (parseFloat(item.CGST) || 0);
          if (gstRate > 0) {
            const rateKey = `${gstRate}%`;
            if (!gstTotalsForBill[rateKey]) {
              gstTotalsForBill[rateKey] = 0;
            }
            gstTotalsForBill[rateKey] += (parseFloat(item["RATE"]) * parseFloat(item["QTY"])) * (gstRate / 100);
          }
        });

        const { cgst, sgst } = splitIgstSingleFirstRate(gstTotalsForBill);

        // Build the payload
        const purchaseVoucherPayload = {
          invoiceNumber,
          invoiceDate: "01-04-2025",
          companyName: selectedCompanyName,
          partyName: purchaserName,
          purchaseLedger: "Purchase",
          items: updatedPurchaseEntryItem,
          gstNumber: gst || "07BGUPD3647XXXX",
          isWithinState: true,
          cgst,
          sgst,
        };

        // Create party in Tally
        const partyResponse = await createPartyName(
          selectedCompanyName,
          purchaserName,
          {
            name: purchaserName,
            parent: "Sundry Creditors",
            address: "",
            country: "India",
            state: "Punjab",
            date: date,
            gstin: gst || "04AAACI7952A1ZZ",
          }
        );

        if (!partyResponse.success) {
          throw new Error(`Failed to create party: ${partyResponse.message}`);
        }

        // Create purchase ledger
        const purchaseLedgerResponse = await createPurchaserLedger(
          selectedCompanyName,
          "Purchase"
        );

        if (!purchaseLedgerResponse.success) {
          throw new Error(`Failed to create purchase ledger: ${purchaseLedgerResponse.message}`);
        }

        // Create tax ledgers
        const taxLedgerResponse = await getTaxLedgerData(selectedCompanyName);

        if (!taxLedgerResponse.success) {
          throw new Error(`Failed to create tax ledgers: ${taxLedgerResponse.message}`);
        }

        // Create units
        const unitResponse = await createUnit(updatedUnits);
        if (!unitResponse.success) {
          throw new Error(`Failed to create units: ${unitResponse.message}`);
        }

        // Create items
        const itemResponse = await createItem(updatedItemsForExport);

        if (!itemResponse.success) {
          throw new Error(`Failed to create items: ${itemResponse.message}`);
        }


        // Create purchase entry
        const purchaseEntryResponse = await createPurchaseEntry(
          purchaseVoucherPayload
        );

        if (!purchaseEntryResponse.success) {
          throw new Error(`Failed to create purchase entry: ${purchaseEntryResponse.message}`);
        }
      }

      setStatus("Export completed successfully");
      toast.success("All bills exported to Tally successfully!");

    } catch (error: any) {
      console.error("Export error:", error);
      setError(error.message || "Export failed");
      setStatus("Export failed");
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    createQRSession();
  }, []);

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-gray-50 to-gray-100 relative">
      <LoadingScreen isLoading={isLoading} />

      {currentStep === 0 && !role ? (
        <DocumentTypeSelector
          setRole={setRole}
          setCurrentStep={setCurrentStep}
          selectedCompanyName={selectedCompanyName}
        />
      ) : (
        <>
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
              steps={["Upload Files", "Verify Data", "Confirm"]}
              currentStep={currentStep - 1}
            />

            {currentStep === 1 && (
              <FileUploadStep
                files={files}
                setFiles={setFiles}
                mobileFiles={mobileFiles}
                setMobileFiles={setMobileFiles}
                fileInputRef={fileInputRef}
                qrSession={qrSession}
                setQRSession={setQRSession}
                qrSessionLoading={qrSessionLoading}
                setQRSessionLoading={setQRSessionLoading}
                receivedFiles={receivedFiles}
                setReceivedFiles={setReceivedFiles}
                selectedCompanyName={selectedCompanyName}
                setIsLoading={setIsLoading}
                setBillData={setBillData}
                setCurrentStep={setCurrentStep}
                handleFileSelect={handleFileSelect}
                handleDragOverFiles={handleDragOverFiles}
                handleDropFiles={handleDropFiles}
                processAllFiles={processAllFiles}
                createQRSession={createQRSession}
              />
            )}

            {currentStep === 2 && (
              <BillVerificationStep
                files={files}
                billData={billData}
                setBillData={setBillData}
                currentBillIndex={currentBillIndex}
                setCurrentBillIndex={setCurrentBillIndex}
                role={role}
                isWithinState={isWithinState}
                setIsWithinState={setIsWithinState}
                gstNumber={gstNumber}
                netAmountTotal={netAmountTotal}
                setNetAmountTotal={setNetAmountTotal}
                gstTotals={gstTotals}
                setGstTotals={setGstTotals}
                setCurrentStep={setCurrentStep}
                setRowModalIndex={setRowModalIndex}
                setZoomSrc={setZoomSrc}
                tallyStockItems={tallyStockItems}
                handleDataChange={handleDataChange}
                handleItemChange={handleItemChange}
                addItem={addItem}
                removeItem={removeItem}
                handleBillChange={handleBillChange}
                handleExportItemsToExcel={handleExportItemsToExcel}
                recalculateBillTotals={recalculateBillTotals}
              />
            )}

            {currentStep === 3 && (
              <ConfirmationStep
                files={files}
                billData={billData}
                role={role}
                setCurrentStep={setCurrentStep}
                handleExport={handleExport}
                status={status}
                error={error}
              />
            )}
          </main>

          <RowDetailModal
            open={rowModalIndex !== null}
            rowIndex={rowModalIndex ?? 0}
            item={
              rowModalIndex !== null
                ? billData[currentBillIndex]?.items?.[rowModalIndex] || {}
                : {}
            }
            images={
              rowModalIndex !== null
                ? (
                  billData[currentBillIndex]?.invoice_items_cropped_images
                    ?.cell_images || []
                )
                  .filter(
                    (_, r) =>
                      r === 0 ||
                      r === rowModalIndex + 1 ||
                      r === rowModalIndex + 2
                  )
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

          {zoomSrc && (
            <div
              className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm
                         flex items-center justify-center"
              onClick={() => setZoomSrc(null)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <ZoomableImage
                  src={zoomSrc}
                  alt="Zoom preview"
                  style={{ width: "85vw", height: "85vh" }}
                />
              </div>

              <button
                onClick={() => setZoomSrc(null)}
                className="absolute top-5 right-5 text-white/80 hover:text-white
                           bg-black/50 backdrop-blur rounded-full p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}