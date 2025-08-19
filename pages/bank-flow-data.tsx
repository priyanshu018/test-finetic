"use client";
import React, { useState, useEffect } from 'react';
import {
    FiArrowLeft,
    FiDownload,
    FiEye,
    FiTrash2,
    FiCalendar,
    FiUser,
    FiCreditCard,
    FiTrendingUp,
    FiTrendingDown,
    FiFilter,
    FiSearch,
    FiRefreshCw,
    FiSave,
    FiX,
    FiEdit,
    FiCheck,
    FiChevronUp,
    FiChevronDown
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { getCurrentCompanyData } from '../service/tally';
import { startTransactionProcessing } from '../service/TALLY/payment-flow';
import { statementsWithData } from '../service/TALLY/payment-flow/data-for-testing';

// Classification options
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


export default function BankFlowData() {
    const [bankStatements, setBankStatements] = useState([]);
    const [selectedStatement, setSelectedStatement] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'details'
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMonth, setFilterMonth] = useState('');

    // State for row editing (updated to match ExpenseClassifier)
    const [editingRow, setEditingRow] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [tempCategoryValue, setTempCategoryValue] = useState('');
    const [showDetails, setShowDetails] = useState(false);

    // Filter and sort state
    const [filterType, setFilterType] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [dateFilterType, setDateFilterType] = useState('all');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedMonthDate, setSelectedMonthDate] = useState('');
    const [dateRangeStart, setDateRangeStart] = useState('');
    const [dateRangeEnd, setDateRangeEnd] = useState('');

    const router = useRouter();

    useEffect(() => {
        loadBankStatements();
    }, []);

    const loadBankStatements = () => {
        try {
            const summaryList = JSON.parse(localStorage.getItem("summaryBankStatement") || "[]");

            const statementsWithData = summaryList
                .map((summary) => {
                    const key = "BankStatement_" + summary.month;
                    const encoded = localStorage.getItem(key);

                    if (!encoded) return null;

                    const decoded = JSON.parse(atob(encoded));

                    // 🔁 Normalize classifications in RESULTS (used by your UI)
                    if (Array.isArray(decoded.results)) {
                        decoded.results = decoded.results.map((txn) => {
                            let classification = txn.classification;

                            // Other Income -> Direct Income
                            if (classification === "Other Income" && txn.transaction_type === "CREDIT") {
                                classification = "Direct Income";
                            }

                            // Indirect Business -> Indirect Expense
                            // (also handle the longer variant you use in debit options)
                            if (
                                classification === "Indirect Business" ||
                                classification === "Non-Trading Variable (Indirect Business)"
                            ) {
                                classification = "Indirect Expense";
                            }

                            return { ...txn, classification };
                        });

                        // ✅ Persist normalized data back to localStorage
                        const dataToStore = {
                            header: decoded.header,
                            results: decoded.results,
                            summary: decoded.summary,
                        };
                        localStorage.setItem(key, btoa(JSON.stringify(dataToStore)));
                    }

                    return {
                        ...summary,
                        ...decoded,
                        id: summary.month,
                    };
                })
                .filter(Boolean);

            console.log({ statementsWithData });
            setBankStatements(statementsWithData);
        } catch (error) {
            console.error("Error loading bank statements:", error);
        }
    };


    const formatMonth = (monthStr) => {
        if (!monthStr) return "";
        const [year, month] = monthStr.split("-");
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

    const formatCurrency = (amount) => {
        if (!amount) return "₹0";
        return "₹" + Math.abs(amount).toLocaleString("en-IN");
    };

    const deleteStatement = (month) => {
        if (window.confirm(`Are you sure you want to delete the bank statement for ${formatMonth(month)}?`)) {
            const key = "BankStatement_" + month;
            localStorage.removeItem(key);

            const summaryList = JSON.parse(localStorage.getItem("summaryBankStatement") || "[]");
            const updatedSummary = summaryList.filter(s => s.month !== month);
            localStorage.setItem("summaryBankStatement", JSON.stringify(updatedSummary));

            loadBankStatements();
            if (selectedStatement?.month === month) {
                setSelectedStatement(null);
                setViewMode('list');
            }
        }
    };

    const exportStatement = async (statement) => {
        try {
            // Get filtered data FIRST
            const filteredData = getFilteredResults();
            const filteredSummary = getFilteredSummary();

            if (filteredData.length === 0) {
                alert("No transactions to export for the current filter criteria");
                return;
            }

            // Show confirmation with FILTERED data
            const confirmed = window.confirm(
                `Export ${filteredData.length} filtered transactions to Tally?\n\n` +
                `• Account: ${statement.header?.holder_name || 'Unknown'}\n` +
                `• Credits: ${formatCurrency(filteredSummary?.total_credit_amount)}\n` +
                `• Debits: ${formatCurrency(filteredSummary?.total_debit_amount)}\n\n` +
                `Proceed with Tally export?`
            );

            if (!confirmed) return;

            // Get current company data
            const companyName = await getCurrentCompanyData();

            if (!companyName?.data) {
                alert('Unable to connect to Tally. Please ensure Tally is running and accessible.');
                return;
            }

            // Prepare Tally info
            const tallyInfo = {
                companyName: companyName.data,
                date: "20250401",
                voucherType: "Payment",
                narrationPrefix: "Auto-entry:"
            };

            const BankName = statement.header?.ifsc_code?.match(/^[A-Za-z]+/)?.[0] || "Bank";

            const accountDetails = [
                {
                    holder_name: `${BankName}-${statement.header?.account_number}`,
                    ifsc_code: statement.header?.ifsc_code,
                    account_number: statement.header?.account_number
                }
            ];

            // Use FILTERED data for export
            const dataToExport = statementsWithData?.[0]?.results.map((item) => {
                const formattedDate = item.date?.replace(/-/g, "") || "";
                let classification = item.classification;

                if (classification === "Cash Deposit" || classification === "Cash Withdrawal") {
                    classification = "Cash";
                }

                return {
                    ...item,
                    date: formattedDate,
                    classification,
                };
            });

            alert(`Processing ${dataToExport.length} filtered transactions for Tally export...`);

            const response = await startTransactionProcessing(
                dataToExport,
                tallyInfo,
                accountDetails
            );

            if (response?.status) {
                alert(
                    `Successfully exported ${dataToExport.length} filtered transactions to Tally for ${companyName.data}!\n\n` +
                    `Statement: ${formatMonth(statement.month)}\n` +
                    `Account: ${statement.header?.holder_name}`
                );
            } else {
                throw new Error(response?.message || 'Export failed');
            }
        } catch (error) {
            console.error("Tally export failed:", error);
            alert(`Tally export failed: ${error.message}`);
        }
    };

    const viewStatementDetails = (statement) => {
        setSelectedStatement(statement);
        setViewMode('details');
        // Reset filters when viewing new statement
        setFilterType('all');
        setSearchTerm('');
        setDateFilterType('all');
        setSelectedDate('');
        setSelectedMonthDate('');
        setDateRangeStart('');
        setDateRangeEnd('');
        setSortConfig({ key: null, direction: 'asc' });
    };

    const getFilteredStatements = () => {
        let filtered = bankStatements;

        if (searchTerm) {
            filtered = filtered.filter(statement =>
                statement.header?.holder_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                statement.header?.account_number?.includes(searchTerm) ||
                formatMonth(statement.month).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterMonth) {
            filtered = filtered.filter(statement => statement.month === filterMonth);
        }

        return filtered.sort((a, b) => b.month.localeCompare(a.month));
    };

    const getUniqueMonths = () => {
        return [...new Set(bankStatements.map(s => s.month))].sort().reverse();
    };

    // ====== Functions from ExpenseClassifier ResultsStep ======

    const startRowEdit = (index, category) => {
        setEditingRow(index);
        setEditingCategory(category);
        setTempCategoryValue(selectedStatement.results[index][category] || '');
    };

    const cancelRowEdit = () => {
        setEditingRow(null);
        setEditingCategory(null);
        setTempCategoryValue('');
    };

    const saveRowChanges = (index, updateAll = false) => {
        const updatedTransactions = [...selectedStatement.results];
        const newTransaction = {
            ...updatedTransactions[index],
            [editingCategory]: tempCategoryValue
        };

        // If we're updating all similar transactions
        if (updateAll) {
            const vendorPrefix = (newTransaction.vendor || "").trim().toUpperCase().substring(0, 6);
            if (vendorPrefix.length >= 6) {
                updatedTransactions.forEach((t, i) => {
                    const tVendorPrefix = (t.vendor || "").trim().toUpperCase().substring(0, 6);
                    if (tVendorPrefix === vendorPrefix) {
                        updatedTransactions[i] = {
                            ...t,
                            [editingCategory]: tempCategoryValue
                        };
                    }
                });
            } else {
                updatedTransactions[index] = newTransaction;
            }
        } else {
            updatedTransactions[index] = newTransaction;
        }

        // Create updated statement
        const updatedStatement = {
            ...selectedStatement,
            results: updatedTransactions
        };

        // Update localStorage
        const key = "BankStatement_" + updatedStatement.month;
        const dataToStore = {
            header: updatedStatement.header,
            results: updatedStatement.results,
            summary: updatedStatement.summary
        };
        const encoded = btoa(JSON.stringify(dataToStore));
        localStorage.setItem(key, encoded);

        // Update state
        setSelectedStatement(updatedStatement);
        setBankStatements(prev =>
            prev.map(stmt => stmt.month === updatedStatement.month ? updatedStatement : stmt)
        );

        cancelRowEdit();
    };

    const startSaveProcess = (index) => {
        const matchingCount = getMatchingVendorCount(index, selectedStatement.results[index].vendor);
        if (matchingCount > 0) {
            setEditModal({
                show: true,
                index,
                newValue: tempCategoryValue,
                matchingCount,
                category: editingCategory
            });
        } else {
            saveRowChanges(index, false);
        }
    };

    const getMatchingVendorCount = (currentIndex, vendorName) => {
        if (!vendorName || !selectedStatement.results) return 0;
        const vendorPrefix = vendorName.trim().toUpperCase().substring(0, 6);
        if (vendorPrefix.length < 6) return 0;

        return selectedStatement.results.filter((t, index) => {
            if (index === currentIndex) return false;
            const tVendorPrefix = (t.vendor || "").trim().toUpperCase().substring(0, 6);
            return tVendorPrefix === vendorPrefix;
        }).length;
    };

    const getAvailableMonths = () => {
        if (!selectedStatement?.results) return [];
        const months = new Set();
        selectedStatement.results.forEach((item) => {
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
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
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
                return selectedMonthDate ? itemDate.substring(0, 7) === selectedMonthDate : true;
            case "date-range":
                if (!dateRangeStart || !dateRangeEnd) return true;
                return itemDate >= dateRangeStart && itemDate <= dateRangeEnd;
            default:
                return true;
        }
    };

    const clearDateFilters = () => {
        setDateFilterType("all");
        setSelectedDate("");
        setSelectedMonthDate("");
        setDateRangeStart("");
        setDateRangeEnd("");
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
            return <span className="inline-block w-4 h-4"></span>;
        }
        return sortConfig.direction === "asc" ? (
            <FiChevronUp className="inline-block w-4 h-4" />
        ) : (
            <FiChevronDown className="inline-block w-4 h-4" />
        );
    };

    const getFilteredResults = () => {
        if (!selectedStatement?.results) return [];
        let filtered = selectedStatement.results.filter((item) => isDateInFilter(item.date));

        // Apply transaction type filter
        switch (filterType) {
            case "debit":
                filtered = filtered.filter((item) => item.transaction_type === "DEBIT");
                break;
            case "credit":
                filtered = filtered.filter((item) => item.transaction_type === "CREDIT");
                break;
            case "suspense":
                filtered = filtered.filter((item) => item.classification === "SUSPENSE");
                break;
            case "cash":
                filtered = filtered.filter((item) =>
                    item.classification?.includes("Cash") ||
                    item.classification?.includes("Withdrawal") ||
                    item.classification?.includes("Deposit")
                );
                break;
            default:
                break;
        }

        // Apply search term filter
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

        // Apply sorting
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
            cash_transactions: filteredData.filter(
                (item) =>
                    item.classification?.includes("Cash") ||
                    item.classification?.includes("Withdrawal") ||
                    item.classification?.includes("Deposit")
            ).length,
        };
    };

    const exportToCSV = () => {
        try {
            const filteredData = getFilteredResults(); // Use filtered data
            if (filteredData.length === 0) {
                alert("No data to export for the selected filter criteria");
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
                "Description",
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
                        `"${item.description || ""}"`,
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
            } else if (dateFilterType === "specific-month" && selectedMonthDate) {
                filterSuffix = `_${selectedMonthDate}`;
            } else if (
                dateFilterType === "date-range" &&
                dateRangeStart &&
                dateRangeEnd
            ) {
                filterSuffix = `_${dateRangeStart}_to_${dateRangeEnd}`;
            }

            a.download = `bank_statement_analysis${filterSuffix}_${new Date()
                .toISOString()
                .split("T")[0]}.csv`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert(`Exported ${filteredData.length} filtered transactions to CSV!`);
        } catch (error) {
            alert("CSV export failed: " + error.message);
        }
    };

    const exportToExcel = () => {
        try {
            const filteredData = getFilteredResults(); // Use filtered data
            const filteredSummary = getFilteredSummary();

            if (filteredData.length === 0) {
                alert("No data to export for the selected filter criteria");
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
                Description: item.description || "",
            }));

            const worksheet = XLSX.utils.json_to_sheet(excelData);
            XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

            const summaryData = [
                { Metric: "Total Transactions", Value: filteredSummary?.total_items || 0 },
                { Metric: "Debit Transactions", Value: filteredSummary?.debit_transactions || 0, Amount: `₹${filteredSummary?.total_debit_amount?.toLocaleString("en-IN") || 0}` },
                { Metric: "Credit Transactions", Value: filteredSummary?.credit_transactions || 0, Amount: `₹${filteredSummary?.total_credit_amount?.toLocaleString("en-IN") || 0}` },
                { Metric: "Net Balance", Value: filteredSummary?.net_balance > 0 ? "Positive" : "Negative", Amount: `₹${filteredSummary?.net_balance?.toLocaleString("en-IN") || 0}` },
                { Metric: "Cash Transactions", Value: filteredSummary?.cash_transactions || 0 },
                { Metric: "Suspense Items", Value: filteredSummary?.suspense_items || 0 },
            ];

            const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Summary");

            let filterSuffix = "";
            if (dateFilterType === "specific-date" && selectedDate) {
                filterSuffix = `_${selectedDate}`;
            } else if (dateFilterType === "specific-month" && selectedMonthDate) {
                filterSuffix = `_${selectedMonthDate}`;
            } else if (
                dateFilterType === "date-range" &&
                dateRangeStart &&
                dateRangeEnd
            ) {
                filterSuffix = `_${dateRangeStart}_to_${dateRangeEnd}`;
            }

            XLSX.writeFile(
                workbook,
                `bank_statement_analysis${filterSuffix}_${new Date()
                    .toISOString()
                    .split("T")[0]}.xlsx`
            );

            alert(`Exported ${filteredData.length} filtered transactions to Excel!`);
        } catch (error) {
            alert("Excel export failed: " + error.message);
        }
    };

    // ====== UI Components from ExpenseClassifier ======

    const getClassificationColor = (classification) => {
        const colors = {
            'Fixed (Capital Good)': 'bg-blue-100 text-blue-800',
            'Trading Variable (Direct Business)': 'bg-green-100 text-green-800',
            'Non-Trading Variable (Indirect Business)': 'bg-purple-100 text-purple-800',
            'Indirect Expense': 'bg-purple-100 text-purple-800', // ← new
            'Cash Withdrawal': 'bg-yellow-100 text-yellow-800',
            'SUSPENSE': 'bg-gray-100 text-gray-800',
            'Direct Income': 'bg-green-100 text-green-800',
            'Other Income': 'bg-teal-100 text-teal-800',
            'Cash Deposit': 'bg-yellow-100 text-yellow-800',
        };
        return colors[classification] || 'bg-gray-100 text-gray-800';
    };

    const getTransactionTypeColor = (type) => {
        return type === 'CREDIT'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800';
    };

    const handleAddTransaction = () => {
        // Implement if needed
    };

    // ====== ResultsStep UI Integration ======

    const renderResultsStep = () => {
        const filteredResults = getFilteredResults();
        const filteredSummary = getFilteredSummary();
        const availableMonths = getAvailableMonths();

        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Header */}
                <div className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                    <FiArrowLeft className="w-5 h-5" />
                                    <span>Back to List</span>
                                </button>
                                <div className="h-6 w-px bg-gray-300"></div>
                                <h1 className="text-2xl font-semibold text-gray-900">
                                    Bank Statement Details
                                </h1>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={exportToCSV}
                                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <FiDownload className="w-4 h-4" />
                                    <span>Export to CSV</span>
                                </button>
                                <button
                                    onClick={exportToExcel}
                                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <FiDownload className="w-4 h-4" />
                                    <span>Export to Excel</span>
                                </button>
                                <button
                                    onClick={() => exportStatement(selectedStatement)}
                                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    <FiDownload className="w-4 h-4" />
                                    <span>Export to Tally</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statement Details */}
                <div className=" mx-auto px-6 py-8">
                    {/* Header Information */}
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FiUser className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Account Holder</p>
                                    <p className="font-medium text-gray-900"> {selectedStatement.header?.ifsc_code?.match(/^[A-Za-z]+/)?.[0] || 'BANK'} – xxxx{selectedStatement.header?.account_number?.slice(-4) || 'XXXX'}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <FiCreditCard className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Account Number</p>
                                    <p className="font-medium text-gray-900">{selectedStatement.header?.account_number || 'Unknown'}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <FiCalendar className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Statement Period</p>
                                    <p className="font-medium text-gray-900">{formatMonth(selectedStatement.month)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-black">
                            {/* Transaction Type Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Transaction Type
                                </label>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Transactions</option>
                                    <option value="debit">Debits Only</option>
                                    <option value="credit">Credits Only</option>
                                    <option value="suspense">Suspense Items</option>
                                    <option value="cash">Cash Transactions</option>
                                </select>
                            </div>

                            {/* Date Filter Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date Range
                                </label>
                                <select
                                    value={dateFilterType}
                                    onChange={(e) => setDateFilterType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Dates</option>
                                    <option value="specific-date">Specific Date</option>
                                    <option value="specific-month">Specific Month</option>
                                    <option value="date-range">Date Range</option>
                                </select>
                            </div>

                            {/* Date Filter Inputs */}
                            {dateFilterType === "specific-date" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Select Date
                                    </label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            )}

                            {dateFilterType === "specific-month" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Select Month
                                    </label>
                                    <select
                                        value={selectedMonthDate}
                                        onChange={(e) => setSelectedMonthDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">All Months</option>
                                        {availableMonths.map(month => (
                                            <option key={month} value={month}>
                                                {formatMonthDisplay(month)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {dateFilterType === "date-range" && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={dateRangeStart}
                                            onChange={(e) => setDateRangeStart(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={dateRangeEnd}
                                            onChange={(e) => setDateRangeEnd(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Clear Filters Button */}
                            <div className="flex items-end">
                                <button
                                    onClick={clearDateFilters}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors w-full"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Search Transactions
                            </label>
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by vendor, description, amount..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    {filteredSummary && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Total Transactions</p>
                                        <p className="text-2xl font-bold text-gray-900">{filteredSummary.total_items}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <FiCreditCard className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Total Credits</p>
                                        <p className="text-2xl font-bold text-green-600">{formatCurrency(filteredSummary.total_credit_amount)}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <FiTrendingUp className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Total Debits</p>
                                        <p className="text-2xl font-bold text-red-600">{formatCurrency(filteredSummary.total_debit_amount)}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                        <FiTrendingDown className="w-6 h-6 text-red-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Net Balance</p>
                                        <p className={`text-2xl font-bold ${filteredSummary.net_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(filteredSummary.net_balance)}
                                        </p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${filteredSummary.net_balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                        {filteredSummary.net_balance >= 0 ?
                                            <FiTrendingUp className="w-6 h-6 text-green-600" /> :
                                            <FiTrendingDown className="w-6 h-6 text-red-600" />
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Transactions Table */}
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Transaction Details ({filteredResults.length} transactions)
                            </h3>
                            <div className="text-sm text-gray-500">
                                {dateFilterType !== "all" && (
                                    <span className="bg-gray-100 px-2 py-1 rounded">
                                        Filtered view
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort('date')}
                                        >
                                            <div className="flex items-center">
                                                Date
                                                {getSortIcon('date')}
                                            </div>
                                        </th>
                                        <th
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort('vendor')}
                                        >
                                            <div className="flex items-center">
                                                Vendor
                                                {getSortIcon('vendor')}
                                            </div>
                                        </th>
                                        <th
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort('transaction_type')}
                                        >
                                            <div className="flex items-center">
                                                Type
                                                {getSortIcon('transaction_type')}
                                            </div>
                                        </th>
                                        <th
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort('amount')}
                                        >
                                            <div className="flex items-center">
                                                Amount
                                                {getSortIcon('amount')}
                                            </div>
                                        </th>
                                        <th
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort('classification')}
                                        >
                                            <div className="flex items-center">
                                                Classification
                                                {getSortIcon('classification')}
                                            </div>
                                        </th>
                                        <th
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort('category')}
                                        >
                                            <div className="flex items-center">
                                                Category
                                                {getSortIcon('category')}
                                            </div>
                                        </th>
                                        <th
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => handleSort('running_balance')}
                                        >
                                            <div className="flex items-center">
                                                Balance
                                                {getSortIcon('running_balance')}
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 text-black">
                                    {filteredResults
                                        .slice(0, 100)
                                        .map((transaction, index) => (
                                            <tr
                                                key={index}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {transaction.date || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm max-w-xs">
                                                    <span className="truncate">
                                                        {transaction.vendor || 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                                                        {transaction.transaction_type || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {formatCurrency(transaction.amount)}
                                                </td>
                                                <td className="px-6 py-4 text-sm max-w-xs">
                                                    {editingRow === index && editingCategory === 'classification' ? (
                                                        <select
                                                            value={tempCategoryValue}
                                                            onChange={(e) => setTempCategoryValue(e.target.value)}
                                                            className="w-full px-2 py-1 border rounded text-sm"
                                                            autoFocus
                                                        >
                                                            {transaction.transaction_type === 'DEBIT'
                                                                ? debitClassificationOptions.map((opt) => (
                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                ))
                                                                : creditClassificationOptions.map((opt) => (
                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                ))}
                                                        </select>
                                                    ) : (
                                                        <span
                                                            onClick={() => startRowEdit(index, 'classification')}
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${getClassificationColor(transaction.classification)}`}
                                                        >
                                                            {transaction.classification || 'Unclassified'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm max-w-xs">
                                                    {editingRow === index && editingCategory === 'category' ? (
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="text"
                                                                value={tempCategoryValue}
                                                                onChange={(e) => setTempCategoryValue(e.target.value)}
                                                                className="w-full px-2 py-1 border rounded text-sm"
                                                                autoFocus
                                                            />
                                                            <button
                                                                onClick={() => startSaveProcess(index)}
                                                                className="text-green-600"
                                                            >
                                                                <FiCheck className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={cancelRowEdit}
                                                                className="text-red-600"
                                                            >
                                                                <FiX className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span
                                                            onClick={() => startRowEdit(index, 'category')}
                                                            className="cursor-pointer"
                                                        >
                                                            {transaction.category || 'Uncategorized'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatCurrency(transaction.running_balance)}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                        {selectedStatement.results?.length > 100 && (
                            <div className="px-6 py-4 bg-gray-50 border-t text-sm text-gray-500 text-center">
                                Showing first 100 transactions out of {selectedStatement.results.length} total
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (viewMode === 'details' && selectedStatement) {
        return renderResultsStep();
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.push('/')}
                                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                            >
                                <FiArrowLeft className="w-5 h-5" />
                                <span>Back to Dashboard</span>
                            </button>
                            <div className="h-6 w-px bg-gray-300"></div>
                            <h1 className="text-2xl font-semibold text-gray-900">Bank Flow Data</h1>
                        </div>
                        <button
                            onClick={loadBankStatements}
                            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            <FiRefreshCw className="w-4 h-4" />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search by account holder, account number, or month..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="md:w-48">
                            <select
                                value={filterMonth}
                                onChange={(e) => setFilterMonth(e.target.value)}
                                className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Months</option>
                                {getUniqueMonths().map(month => (
                                    <option key={month} value={month}>{formatMonth(month)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Bank Statements List */}
                {getFilteredStatements().length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <FiCreditCard className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Bank Statements Found</h3>
                        <p className="text-gray-500 mb-4">
                            {bankStatements.length === 0 ?
                                "No bank statements have been processed yet." :
                                "No statements match your current search criteria."
                            }
                        </p>
                        {bankStatements.length === 0 && (
                            <button
                                onClick={() => router.push('/payment-workflow')}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Process New Statement
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {getFilteredStatements().map((statement) => (
                            <div key={statement.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <FiCreditCard className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">
                                                    {statement.header?.ifsc_code?.match(/^[A-Za-z]+/)?.[0] || 'BANK'}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {statement.header?.account_number || 'Unknown'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {formatMonth(statement.month)}
                                        </span>
                                    </div>

                                    {/* Summary Stats */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Total Transactions</span>
                                            <span className="font-medium text-gray-900">{statement.summary?.total_items || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Credits</span>
                                            <span className="font-medium text-green-600">{formatCurrency(statement.summary?.total_credit_amount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Debits</span>
                                            <span className="font-medium text-red-600">{formatCurrency(statement.summary?.total_debit_amount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t">
                                            <span className="text-sm font-medium text-gray-700">Net Balance</span>
                                            <span className={`font-bold ${(statement.summary?.net_balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(statement.summary?.net_balance)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => viewStatementDetails(statement)}
                                            className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            <FiEye className="w-4 h-4" />
                                            <span>View Details</span>
                                        </button>
                                        <button
                                            onClick={() => exportStatement(statement)}
                                            className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                            title="Export to Tally"
                                        >
                                            <FiDownload className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteStatement(statement.month)}
                                            className="flex items-center justify-center px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}