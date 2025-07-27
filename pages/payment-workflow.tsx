"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import * as XLSX from "xlsx";
import { BackendLink } from "../service/api";
import {
  extractBankHolderDetails,
  startTransactionProcessing,
} from "../service/TALLY/payment-flow";
import { toast } from "react-toastify";
import { getCurrentCompanyData } from "../service/tally";
import Header from "../components/bank-flow/header";
import { AlertCircle, Briefcase, Factory, ShoppingCart } from "lucide-react";
import BusinessCategoryStep from "../components/bank-flow/BusinessCategoryStep";
import BusinessSubcategoryStep from "../components/bank-flow/BusinessSubcategoryStep";
import ResultsStep from "../components/bank-flow/ResultsStep";
import FileUploadStep from "../components/bank-flow/FileUploadStep";

const ExpenseClassifier = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessSubcategory, setBusinessSubcategory] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [header, setHeader] = useState(null);
  const [summary, setSummary] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [tempCategoryValue, setTempCategoryValue] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showDetails, setShowDetails] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [qrSession, setQRSession] = useState(null);
  const [qrSessionLoading, setQRSessionLoading] = useState(false);
  const [mobileFiles, setMobileFiles] = useState([]);
  const [receivedFiles, setReceivedFiles] = useState(0);
  const [dateFilterType, setDateFilterType] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");

  const [editModal, setEditModal] = useState({
    show: false,
    id: null,
    newClassification: null,
    matchingCount: 0,
    filteredMatchingCount: 0
  });

  const businessCategories = [
    {
      value: "service",
      label: "Service Business",
      desc: "Professional services, consulting, expertise-based businesses",
      icon: <Briefcase className="w-8 h-8" />,
      color: "blue",
      bgGradient: "from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
    },
    {
      value: "manufacturing",
      label: "Manufacturing Business",
      desc: "Production, processing, assembly, industrial operations",
      icon: <Factory className="w-8 h-8" />,
      color: "green",
      bgGradient: "from-green-50 to-green-100",
      borderColor: "border-green-200",
    },
    {
      value: "trading",
      label: "Trading Business",
      desc: "Buying, selling, import/export, distribution operations",
      icon: <ShoppingCart className="w-8 h-8" />,
      color: "purple",
      bgGradient: "from-purple-50 to-purple-100",
      borderColor: "border-purple-200",
    },
  ];

  const businessSubcategories = {
    service: [
      {
        value: "IT Services",
        desc: "Software development, tech consulting, IT support",
      },
      { value: "Consulting", desc: "Business advisory, management consulting" },
      {
        value: "Healthcare",
        desc: "Medical services, clinics, healthcare providers",
      },
      { value: "Legal Services", desc: "Law firms, legal advisory services" },
      {
        value: "Financial Services",
        desc: "Accounting, financial advisory, banking",
      },
      { value: "Education", desc: "Training institutes, educational services" },
    ],
    manufacturing: [
      {
        value: "Textile Manufacturing",
        desc: "Garment production, fabric manufacturing",
      },
      { value: "Food Processing", desc: "Food production, packaging, processing" },
      {
        value: "Electronics Manufacturing",
        desc: "Electronics assembly, component production",
      },
      { value: "Chemical Production", desc: "Chemical manufacturing, processing" },
      { value: "Automotive Parts", desc: "Auto component manufacturing" },
      {
        value: "Pharmaceuticals",
        desc: "Drug manufacturing, pharmaceutical production",
      },
    ],
    trading: [
      { value: "Import/Export", desc: "International trade, import-export business" },
      {
        value: "Wholesale Distribution",
        desc: "Bulk trading, distribution business",
      },
      { value: "Retail Operations", desc: "Retail stores, consumer sales" },
      { value: "E-commerce", desc: "Online retail, digital marketplace" },
      { value: "FMCG Trading", desc: "Fast-moving consumer goods trading" },
      {
        value: "Electronics Trading",
        desc: "Electronics and technology products trading",
      },
    ],
  };

  const debitClassificationOptions = [
    "Fixed (Capital Good)",
    "Trading Variable (Direct Business)",
    "Non-Trading Variable (Indirect Business)",
    "Cash Withdrawal",
    "SUSPENSE",
  ];

  const creditClassificationOptions = [
    "Direct Income",
    "Other Income",
    "Cash Deposit",
    "SUSPENSE",
  ];

  const getAvailableMonths = () => {
    if (!results) return [];
    const months = new Set();
    results.forEach((item) => {
      if (item.date) {
        const monthYear = item.date.substring(0, 7);
        months.add(monthYear);
      }
    });
    return Array.from(months).sort().reverse();
  };

  const formatMonthDisplay = (monthStr) => {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-");
    const monthNames = [
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
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const isDateInFilter = (itemDate) => {
    if (!itemDate) return false;
    switch (dateFilterType) {
      case "all":
        return true;
      case "specific-date":
        return selectedDate ? itemDate === selectedDate : true;
      case "specific-month":
        return selectedMonth ? itemDate.substring(0, 7) === selectedMonth : true;
      case "date-range":
        if (!dateRangeStart || !dateRangeEnd) return true;
        return itemDate >= dateRangeStart && itemDate <= dateRangeEnd;
      default:
        return true;
    }
  };

  const getFilteredSummary = () => {
    const filteredData = getFilteredResults();
    if (filteredData.length === 0) return null;

    const debits = filteredData.filter(
      (item) => item.transaction_type === "DEBIT"
    );
    const credits = filteredData.filter(
      (item) => item.transaction_type === "CREDIT"
    );
    const totalDebitAmount = debits.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );
    const totalCreditAmount = credits.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );

    return {
      total_items: filteredData.length,
      debit_transactions: debits.length,
      credit_transactions: credits.length,
      total_debit_amount: totalDebitAmount,
      total_credit_amount: totalCreditAmount,
      net_balance: totalCreditAmount - totalDebitAmount,
      suspense_items: filteredData.filter(
        (item) => item.classification === "SUSPENSE"
      ).length,
      high_confidence: filteredData.filter(
        (item) => item.confidence >= 95
      ).length,
      cash_transactions: filteredData.filter(
        (item) =>
          item.classification?.includes("Cash") ||
          item.classification?.includes("Withdrawal") ||
          item.classification?.includes("Deposit")
      ).length,
    };
  };

  const clearDateFilters = () => {
    setDateFilterType("all");
    setSelectedDate("");
    setSelectedMonth("");
    setDateRangeStart("");
    setDateRangeEnd("");
  };

  const createQRSession = async () => {
    setQRSessionLoading(true);
    try {
      const response = await fetch(
        "https://finetic-ai-mobile.primedepthlabs.com/create-bank-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
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
    }, 3000);

    return () => clearInterval(pollInterval);
  };

  const resetQRSession = () => {
    setQRSession(null);
    setReceivedFiles(0);
  };

  const processDocuments = async () => {
    setProcessing(true);
    setError(null);
    setProcessingProgress(0);

    try {
      if (uploadedFiles.length === 0 && mobileFiles.length === 0) {
        throw new Error("Please upload at least one file");
      }

      const formData = new FormData();
      formData.append("business_category", businessCategory);
      formData.append("business_subcategory", businessSubcategory);

      let mobileFileObjects = [];

      if (mobileFiles.length > 0) {
        const mobileFilePromises = mobileFiles.map(async (file, index) => {
          const response = await fetch(file.url);
          if (!response.ok) {
            throw new Error(
              `HTTP ${response.status}: ${response.statusText}`
            );
          }
          const blob = await response.blob();
          let filename =
            file.key.split("/").pop() || `mobile_file_${index + 1}`;
          if (!filename.includes(".")) {
            if (blob.type.includes("pdf")) {
              filename += ".pdf";
            } else if (
              blob.type.includes("excel") ||
              blob.type.includes("spreadsheet")
            ) {
              filename += ".xlsx";
            } else {
              filename += ".pdf";
            }
          }
          return new File([blob], filename, {
            type: blob.type || "application/pdf",
          });
        });

        mobileFileObjects = await Promise.all(mobileFilePromises);
      }

      const allFiles = [...mobileFileObjects, ...uploadedFiles];
      allFiles.forEach((file) => {
        formData.append("files", file);
      });

      const progressInterval = setInterval(() => {
        setProcessingProgress((prev) => Math.min(prev + 10, 90));
      }, 3000);

      const response = await fetch(`${BackendLink}/paymentflow/process`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Processing failed - no results returned");
      }

      const bankDetails = data.header_information
        ? extractBankHolderDetails(data.header_information)
        : {
          holder_name: "Unknown",
          ifsc_code: "Unknown",
          account_number: "Unknown",
        };

      setHeader(bankDetails);
      setResults(data.results || []);
      setSummary(
        data.summary || {
          total_items: 0,
          debit_transactions: 0,
          credit_transactions: 0,
          total_debit_amount: 0,
          total_credit_amount: 0,
          final_balance: 0,
          suspense_items: 0,
          high_confidence: 0,
        }
      );

      const latestMonth = data?.results?.[0]?.date?.substring(0, 7); // YYYY-MM
      console.log({ latestMonth })
      if (latestMonth) {
        storeBankStatement(latestMonth, bankDetails, data.summary, data.results);
      }

      setCurrentStep(4);

      if (data.processing_errors?.length > 0) {
        toast.warn(`Processed with ${data.processing_errors.length} warnings`, {
          position: "top-right",
        });
      }
    } catch (error) {
      setError(error.message);
      toast.error(`Processing failed: ${error.message}`, {
        position: "top-right",
      });
    } finally {
      setProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleFileUpload = (event) => {
    const files: any = Array.from(event.target.files);
    const validFiles = [];
    const errors = [];

    files.forEach((file) => {
      if (file.size > 20 * 1024 * 1024) {
        errors.push(`${file.name}: File too large (max 20MB)`);
        return;
      }

      const fileExtension = "." + file.name.split(".").pop().toLowerCase();
      if (![".pdf", ".xls", ".xlsx"].includes(fileExtension)) {
        errors.push(
          `${file.name}: Only PDF and Excel files (.xls, .xlsx) are supported`
        );
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      alert("File validation errors:\n" + errors.join("\n"));
    }

    setUploadedFiles(validFiles);
  };

  const startRowEdit = (id, currentClassification, currentCategory) => {
    setEditingRow(id);
    setEditingCategory(id);
    setTempCategoryValue(currentCategory || "");
  };

  const getMatchingVendorCount = (currentId, vendorName) => {
    if (!vendorName || !results) return 0;
    const vendorPrefix = vendorName.trim().toUpperCase().substring(0, 6);
    if (vendorPrefix.length < 6) return 0;
    return results.filter((item) => {
      const itemVendorPrefix = (item.vendor || "")
        .trim()
        .toUpperCase()
        .substring(0, 6);
      return item.id !== currentId && itemVendorPrefix === vendorPrefix;
    }).length;
  };

  // const saveRowChanges = (id) => {
  //   const selectElement: any = document.querySelector(
  //     `select[data-item-id="${id}"]`
  //   );
  //   const newClassification = selectElement ? selectElement.value : null;
  //   const currentItem = results.find((item) => item.id === id);
  //   if (!currentItem) return;
  //   const vendorPrefix = (currentItem.vendor || "")
  //     .trim()
  //     .toUpperCase()
  //     .substring(0, 6);
  //   setResults(
  //     results.map((item) => {
  //       const itemVendorPrefix = (item.vendor || "")
  //         .trim()
  //         .toUpperCase()
  //         .substring(0, 6);
  //       const shouldUpdate =
  //         item.id === id ||
  //         (vendorPrefix.length >= 6 && itemVendorPrefix === vendorPrefix);
  //       if (shouldUpdate) {
  //         const updates: any = {};
  //         if (newClassification) updates.classification = newClassification;
  //         if (tempCategoryValue !== undefined)
  //           updates.category = tempCategoryValue;
  //         return { ...item, ...updates };
  //       }
  //       return item;
  //     })
  //   );
  //   setEditingRow(null);
  //   setEditingCategory(null);
  //   setTempCategoryValue("");
  // };

  const saveRowChanges = (id, updateAll = false) => {
    const selectElement: any = document.querySelector(
      `select[data-item-id="${id}"]`
    );
    const newClassification = selectElement ? selectElement.value : null;
    const currentItem = results.find((item) => item.id === id);
    if (!currentItem) return;

    const vendorPrefix = (currentItem.vendor || "")
      .trim()
      .toUpperCase()
      .substring(0, 6);

    setResults(
      results.map((item) => {
        const itemVendorPrefix = (item.vendor || "")
          .trim()
          .toUpperCase()
          .substring(0, 6);

        const shouldUpdate =
          item.id === id ||
          (updateAll &&
            vendorPrefix.length >= 6 &&
            itemVendorPrefix === vendorPrefix);

        if (shouldUpdate) {
          const updates: any = {};
          if (newClassification) updates.classification = newClassification;
          if (tempCategoryValue !== undefined)
            updates.category = tempCategoryValue;
          return { ...item, ...updates };
        }
        return item;
      })
    );

    setEditingRow(null);
    setEditingCategory(null);
    setTempCategoryValue("");
  };


  const startSaveProcess = (id) => {
    const selectElement: any = document.querySelector(
      `select[data-item-id="${id}"]`
    );
    const newClassification = selectElement ? selectElement.value : null;
    const currentItem = results.find((item) => item.id === id);

    if (!currentItem) return;

    // Get counts of similar transactions
    const matchingCount = getMatchingVendorCount(id, currentItem.vendor);
    const filteredResults = getFilteredResults();
    const filteredMatchingCount = filteredResults.filter(item =>
      item.id !== id &&
      (item.vendor || "").trim().toUpperCase().substring(0, 6) ===
      (currentItem.vendor || "").trim().toUpperCase().substring(0, 6)
    ).length;

    const isFilteredView =
      dateFilterType !== "all" ||
      filterType !== "all" ||
      searchTerm !== "";

    if (isFilteredView && matchingCount > 0) {
      // Show modal
      setEditModal({
        show: true,
        id,
        newClassification,
        matchingCount,
        filteredMatchingCount
      });
    } else {
      // Save directly (update all similar)
      saveRowChanges(id, true);
    }
  };

  const cancelRowEdit = () => {
    setEditingRow(null);
    setEditingCategory(null);
    setTempCategoryValue("");
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <span className="text-gray-400">↕️</span>;
    }
    return sortConfig.direction === "asc" ? (
      <span className="text-blue-600">↑</span>
    ) : (
      <span className="text-blue-600">↓</span>
    );
  };

  const getConfidenceColor = (confidence, classification) => {
    if (classification === "SUSPENSE") {
      return "text-orange-600 bg-orange-50 border border-orange-200";
    }
    if (confidence >= 95) return "text-green-600 bg-green-50";
    if (confidence >= 85) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getClassificationColor = (classification) => {
    if (classification === "SUSPENSE") {
      return "text-orange-700 bg-orange-100 border border-orange-300";
    }
    if (classification?.includes("Fixed")) {
      return "text-blue-700 bg-blue-100";
    }
    if (classification?.includes("Trading Variable")) {
      return "text-green-700 bg-green-100";
    }
    if (classification?.includes("Non-Trading Variable")) {
      return "text-purple-700 bg-purple-100";
    }
    if (classification?.includes("Direct Income")) {
      return "text-emerald-700 bg-emerald-100";
    }
    if (classification?.includes("Other Income")) {
      return "text-teal-700 bg-teal-100";
    }
    if (classification?.includes("Cash")) {
      return "text-amber-700 bg-amber-100";
    }
    return "text-gray-700 bg-gray-100";
  };

  const getTransactionTypeColor = (transactionType) => {
    if (transactionType === "DEBIT") {
      return "text-red-700 bg-red-100 border border-red-200";
    }
    if (transactionType === "CREDIT") {
      return "text-green-700 bg-green-100 border border-green-200";
    }
    return "text-gray-700 bg-gray-100";
  };

  const exportToCSV = () => {
    try {
      const filteredData = getFilteredResults();
      if (filteredData.length === 0) {
        toast.error("No data to export for the selected filter criteria", {
          position: "top-right",
        });
        return;
      }
      const headers = [
        "Date",
        "Vendor",
        "Amount",
        "Transaction Type",
        "Balance Change",
        "Running Balance",
        "Classification",
        "Category",
        "Confidence",
        "Source File",
        "Description",
        "Business Category",
        "Business Subcategory",
      ];
      const csvRows = [
        headers.join(","),
        ...filteredData.map((item) =>
          [
            item.date || new Date().toISOString().split("T")[0],
            `"${item.vendor || "Unknown"}"`,
            item.amount || 0,
            item.transaction_type || "DEBIT",
            item.balance_change || 0,
            item.running_balance || 0,
            `"${item.classification}"`,
            `"${item.category || "Uncategorized"}"`,
            item.classification === "SUSPENSE" ? "REVIEW" : item.confidence,
            `"${item.source_file || "Unknown"}"`,
            `"${item.description || ""}"`,
            `"${businessCategory.toUpperCase()}"`,
            `"${businessSubcategory}"`,
          ].join(",")
        ),
      ];
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      let filterSuffix = "";
      if (dateFilterType === "specific-date" && selectedDate) {
        filterSuffix = `_${selectedDate}`;
      } else if (dateFilterType === "specific-month" && selectedMonth) {
        filterSuffix = `_${selectedMonth}`;
      } else if (
        dateFilterType === "date-range" &&
        dateRangeStart &&
        dateRangeEnd
      ) {
        filterSuffix = `_${dateRangeStart}_to_${dateRangeEnd}`;
      }
      a.download = `${businessCategory}_${businessSubcategory.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}_analysis${filterSuffix}_${new Date()
        .toISOString()
        .split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(
        `Exported ${filteredData.length} filtered transactions to CSV!`,
        {
          position: "top-right",
        }
      );
    } catch (error) {
      toast.error("Export failed: " + error.message, {
        position: "top-right",
      });
    }
  };

  const exportToExcel = () => {
    try {
      const filteredData = getFilteredResults();
      const filteredSummary = getFilteredSummary();
      if (filteredData.length === 0) {
        toast.error("No data to export for the selected filter criteria", {
          position: "top-right",
        });
        return;
      }
      const workbook = XLSX.utils.book_new();
      const excelData = filteredData.map((item) => ({
        Date: item.date || new Date().toISOString().split("T")[0],
        Vendor: item.vendor || "Unknown",
        Amount: item.amount || 0,
        "Transaction Type": item.transaction_type || "DEBIT",
        "Balance Change": item.balance_change || 0,
        "Running Balance": item.running_balance || 0,
        Classification: item.classification,
        Category: item.category || "Uncategorized",
        Confidence:
          item.classification === "SUSPENSE"
            ? "REVIEW"
            : `${item.confidence}%`,
        "Source File": item.source_file || "Unknown",
        Description: item.description || "",
        "Business Category": businessCategory.toUpperCase(),
        "Business Subcategory": businessSubcategory,
      }));
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Transactions");
      const summaryData = [
        { Metric: "Business Category", Value: businessCategory.toUpperCase(), Amount: "" },
        { Metric: "Business Subcategory", Value: businessSubcategory, Amount: "" },
        { Metric: "Filter Applied", Value: dateFilterType !== "all" ? "Yes" : "No", Amount: "" },
        { Metric: "Total Transactions", Value: filteredSummary?.total_items || 0, Amount: "" },
        { Metric: "Debit Transactions", Value: filteredSummary?.debit_transactions || 0, Amount: `₹${filteredSummary?.total_debit_amount?.toLocaleString("en-IN") || 0}` },
        { Metric: "Credit Transactions", Value: filteredSummary?.credit_transactions || 0, Amount: `₹${filteredSummary?.total_credit_amount?.toLocaleString("en-IN") || 0}` },
        { Metric: "Net Balance", Value: filteredSummary?.net_balance > 0 ? "Positive" : "Negative", Amount: `₹${filteredSummary?.net_balance?.toLocaleString("en-IN") || 0}` },
        { Metric: "Cash Transactions", Value: filteredSummary?.cash_transactions || 0, Amount: "" },
        { Metric: "Suspense Items", Value: filteredSummary?.suspense_items || 0, Amount: "" },
        { Metric: "High Confidence", Value: filteredSummary?.high_confidence || 0, Amount: "" },
      ];
      const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Filtered Summary");
      let filterSuffix = "";
      if (dateFilterType === "specific-date" && selectedDate) {
        filterSuffix = `_${selectedDate}`;
      } else if (dateFilterType === "specific-month" && selectedDate) {
        filterSuffix = `_${selectedMonth}`;
      } else if (
        dateFilterType === "date-range" &&
        dateRangeStart &&
        dateRangeEnd
      ) {
        filterSuffix = `_${dateRangeStart}_to_${dateRangeEnd}`;
      }
      XLSX.writeFile(
        workbook,
        `${businessCategory}_${businessSubcategory.replace(
          /[^a-zA-Z0-9]/g,
          "_"
        )}_analysis${filterSuffix}_${new Date()
          .toISOString()
          .split("T")[0]}.xlsx`
      );
      toast.success(
        `Exported ${filteredData.length} filtered transactions to Excel!`,
        {
          position: "top-right",
        }
      );
    } catch (error) {
      toast.error("Excel export failed: " + error.message, {
        position: "top-right",
      });
    }
  };

  console.log({ results, summary, header })

  const exportToTally = async () => {
    try {
      const filteredData = getFilteredResults();
      const companyName = await getCurrentCompanyData();
      const tallyInfo = {
        companyName: companyName?.data,
        date: "20250401",
        voucherType: "Payment",
        narrationPrefix: "Auto-entry:"
      }
      const BankName = header?.ifsc_code.match(/^[A-Za-z]+/)?.[0] || "";

      const accountDetails = [
        {
          holder_name: `${BankName}-${header?.account_number}`,
          ifsc_code: header?.ifsc_code,
          account_number: header?.account_number
        }
      ]

      if (filteredData.length === 0) {
        toast.error("No data to export for the selected filter criteria", {
          position: "top-right",
        });
        return;
      }
      const exportType = window.confirm(
        `Export ${filteredData.length} filtered transactions to Tally for ${companyName?.data}?\n\n` +
        `Click OK to export filtered data.\n` +
        `Click Cancel to export full data instead.`
      );
      const dataToExport = (exportType ? filteredData : results).map((item) => {
        if (
          item.classification === "Cash Deposit" ||
          item.classification === "Cash Withdrawal"
        ) {
          return {
            ...item,
            classification: "Cash",
          };
        }
        return item;
      });

      console.log({ dataToExport })

      const count = dataToExport.length;
      const isFiltered = exportType;
      const confirmed = window.confirm(
        `Confirm Tally Export for ${companyName?.data}:\n\n` +
        `• Transactions: ${count}\n` +
        `• Type: ${isFiltered ? "Filtered Data" : "Full Data"}\n` +
        `${isFiltered ? `• Filter Applied: ${getFilterDescription()}\n` : ""}` +
        `\nProceed with export?`
      );
      if (!confirmed) return;
      toast.info(`Processing ${count} transactions for Tally export...`, {
        position: "top-right",
      });
      const response = await startTransactionProcessing(
        dataToExport,
        tallyInfo,
        accountDetails
      );

      if (response?.status) {

        toast.success(
          `Successfully exported ${count} transactions to Tally for ${companyName?.data}!`,
          {
            position: "top-right",
          }
        );
      }
    } catch (error) {
      toast.error(`Export failed: ${error.message}`, {
        position: "top-right",
      });
    }
  };

  const getFilterDescription = () => {
    if (dateFilterType === "specific-date" && selectedDate) {
      return `Date: ${selectedDate}`;
    }
    if (dateFilterType === "specific-month" && selectedMonth) {
      return `Month: ${formatMonthDisplay(selectedMonth)}`;
    }
    if (dateFilterType === "date-range" && dateRangeStart && dateRangeEnd) {
      return `Range: ${dateRangeStart} to ${dateRangeEnd}`;
    }
    if (filterType !== "all") {
      return `Type: ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`;
    }
    return "Custom Filter";
  };

  const getFilteredResults = () => {
    if (!results) return [];
    let filtered = results.filter((item) => isDateInFilter(item.date));
    switch (filterType) {
      case "debit":
        filtered = filtered.filter((item) => item.transaction_type === "DEBIT");
        break;
      case "credit":
        filtered = filtered.filter(
          (item) => item.transaction_type === "CREDIT"
        );
        break;
      case "suspense":
        filtered = filtered.filter(
          (item) => item.classification === "SUSPENSE"
        );
        break;
      case "cash":
        filtered = filtered.filter(
          (item) =>
            item.classification?.includes("Cash") ||
            item.classification?.includes("Withdrawal") ||
            item.classification?.includes("Deposit")
        );
        break;
      default:
        break;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.vendor?.toLowerCase().includes(term)) ||
          (item.description?.toLowerCase().includes(term)) ||
          (item.classification?.toLowerCase().includes(term)) ||
          (item.category?.toLowerCase().includes(term)) ||
          (item.date?.includes(term)) ||
          (item.amount?.toString().includes(term))
      );
    }
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (
          sortConfig.key === "amount" ||
          sortConfig.key === "balance_change" ||
          sortConfig.key === "running_balance"
        ) {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
        } else if (sortConfig.key === "date") {
          aValue = new Date(aValue || "1900-01-01");
          bValue = new Date(bValue || "1900-01-01");
        } else {
          aValue = String(aValue || "").toLowerCase();
          bValue = String(bValue || "").toLowerCase();
        }
        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return filtered;
  };

  const resetForm = () => {
    setCurrentStep(1);
    setBusinessCategory("");
    setBusinessSubcategory("");
    setUploadedFiles([]);
    setResults(null);
    setSummary(null);
    setError(null);
    setFilterType("all");
    clearDateFilters();
  };

  const { push } = useRouter();

  const storeBankStatement = (month: string, header: any, summary: any, results: any) => {
    console.log({ month, header, summary, results })

    const key = "BankStatement_" + month;
    console.log({ key })
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify({ header, summary, results }))));
    console.log({ encoded })
    localStorage.setItem(key, encoded);

    const summaryList = JSON.parse(localStorage.getItem("summaryBankStatement") || "[]");
    const headerExists = summaryList.some((s: any) => s.month === month);
    if (!headerExists) {
      summaryList.push({ month, holder_name: header.holder_name, account_number: header.account_number });
      localStorage.setItem("summaryBankStatement", JSON.stringify(summaryList));
    }
  };


  useEffect(() => {
    createQRSession();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header currentStep={currentStep} push={push} />

      {editModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">
              Update Transaction
            </h3>
            <p className="text-gray-700 mb-4">
              You're editing in a filtered view with {editModal.filteredMatchingCount} similar
              transactions in this filter and {editModal.matchingCount} total similar transactions.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  // Update only similar transactions in current filter
                  saveRowChanges(editModal.id, true);
                  setEditModal({
                    show: false,
                    id: null,
                    newClassification: null,
                    matchingCount: 0,
                    filteredMatchingCount: 0
                  });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update {editModal.filteredMatchingCount + 1} Transactions in This Filter
              </button>

              <button
                onClick={() => {
                  // Update all similar transactions
                  saveRowChanges(editModal.id, true);
                  setEditModal({
                    show: false,
                    id: null,
                    newClassification: null,
                    matchingCount: 0,
                    filteredMatchingCount: 0
                  });
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Update All {editModal.matchingCount + 1} Similar Transactions
              </button>

              <button
                onClick={() => setEditModal({
                  show: false,
                  id: null,
                  newClassification: null,
                  matchingCount: 0,
                  filteredMatchingCount: 0
                })}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <div>
                <h3 className="text-red-800 font-medium">Processing Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <BusinessCategoryStep
            businessCategories={businessCategories}
            businessCategory={businessCategory}
            setBusinessCategory={setBusinessCategory}
            setCurrentStep={setCurrentStep}
          />
        )}
        {currentStep === 2 && (
          <BusinessSubcategoryStep
            businessCategories={businessCategories}
            businessSubcategories={businessSubcategories}
            businessCategory={businessCategory}
            businessSubcategory={businessSubcategory}
            setBusinessSubcategory={setBusinessSubcategory}
            setCurrentStep={setCurrentStep}
          />
        )}
        {currentStep === 3 && (
          <FileUploadStep
            businessCategory={businessCategory}
            businessSubcategory={businessSubcategory}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
            mobileFiles={mobileFiles}
            setMobileFiles={setMobileFiles}
            processing={processing}
            setProcessing={setProcessing}
            qrSession={qrSession}
            setQRSession={setQRSession}
            qrSessionLoading={qrSessionLoading}
            setQRSessionLoading={setQRSessionLoading}
            processDocuments={processDocuments}
            resetForm={resetForm}
            createQRSession={createQRSession}
            processingProgress={processingProgress}
            handleFileUpload={handleFileUpload}
            businessCategories={businessCategories}
          />
        )}
        {currentStep === 4 && results && summary && (
          <ResultsStep
            businessCategory={businessCategory}
            businessSubcategory={businessSubcategory}
            businessCategories={businessCategories}
            results={results}
            summary={summary}
            filterType={filterType}
            setFilterType={setFilterType}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
            editingRow={editingRow}
            setEditingRow={setEditingRow}
            editingCategory={editingCategory}
            setEditingCategory={setEditingCategory}
            tempCategoryValue={tempCategoryValue}
            setTempCategoryValue={setTempCategoryValue}
            dateFilterType={dateFilterType}
            setDateFilterType={setDateFilterType}
            selectedDate={selectedDate}
            startSaveProcess={startSaveProcess}
            setSelectedDate={setSelectedDate}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            dateRangeStart={dateRangeStart}
            setDateRangeStart={setDateRangeStart}
            dateRangeEnd={dateRangeEnd}
            setDateRangeEnd={setDateRangeEnd}
            getAvailableMonths={getAvailableMonths}
            formatMonthDisplay={formatMonthDisplay}
            getFilteredResults={getFilteredResults}
            getFilteredSummary={getFilteredSummary}
            clearDateFilters={clearDateFilters}
            startRowEdit={startRowEdit}
            saveRowChanges={saveRowChanges}
            cancelRowEdit={cancelRowEdit}
            handleSort={handleSort}
            getSortIcon={getSortIcon}
            getConfidenceColor={getConfidenceColor}
            getClassificationColor={getClassificationColor}
            getTransactionTypeColor={getTransactionTypeColor}
            exportToExcel={exportToExcel}
            exportToCSV={exportToCSV}
            exportToTally={exportToTally}
            getMatchingVendorCount={getMatchingVendorCount}
            debitClassificationOptions={debitClassificationOptions}
            creditClassificationOptions={creditClassificationOptions}
            showDetails={showDetails}
            setShowDetails={setShowDetails}
          />
        )}
      </div>
    </div>
  );
};

export default ExpenseClassifier;