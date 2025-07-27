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
    FiRefreshCw
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function BankFlowData() {
    const [bankStatements, setBankStatements] = useState([]);
    const [selectedStatement, setSelectedStatement] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'details'
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const router = useRouter();

    useEffect(() => {
        loadBankStatements();
    }, []);

    const loadBankStatements = () => {
        try {
            const summaryList = JSON.parse(localStorage.getItem("summaryBankStatement") || "[]");
            const statementsWithData = summaryList.map(summary => {
                const key = "BankStatement_" + summary.month;
                const encoded = localStorage.getItem(key);
                if (encoded) {
                    const decoded = JSON.parse(atob(encoded));
                    return {
                        ...summary,
                        ...decoded,
                        id: summary.month
                    };
                }
                return null;
            }).filter(Boolean);

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
            // Show confirmation dialog
            const confirmed = window.confirm(
                `Export bank statement for ${formatMonth(statement.month)} to Tally?\n\n` +
                `• Account: ${statement.header?.holder_name || 'Unknown'}\n` +
                `• Transactions: ${statement.results?.length || 0}\n` +
                `• Credits: ${formatCurrency(statement.summary?.total_credit_amount)}\n` +
                `• Debits: ${formatCurrency(statement.summary?.total_debit_amount)}\n\n` +
                `Proceed with Tally export?`
            );

            if (!confirmed) return;

            // Import required functions (you'll need to add these imports at the top)
            const { getCurrentCompanyData } = await import('../service/tally');
            const { startTransactionProcessing } = await import('../service/TALLY/payment-flow');

            // Get current company data
            const companyName = await getCurrentCompanyData();

            if (!companyName?.data) {
                alert('Unable to connect to Tally. Please ensure Tally is running and accessible.');
                return;
            }

            // Prepare Tally info
            const tallyInfo = {
                companyName: companyName.data,
                date: "20250401", // You might want to use actual date from statement
                voucherType: "Payment",
                narrationPrefix: "Auto-entry:"
            };

            // Extract bank name from IFSC code
            const BankName = statement.header?.ifsc_code?.match(/^[A-Za-z]+/)?.[0] || "Bank";

            // Prepare account details
            const accountDetails = [
                {
                    holder_name: `${BankName}-${statement.header?.account_number}`,
                    ifsc_code: statement.header?.ifsc_code,
                    account_number: statement.header?.account_number
                }
            ];

            // Prepare transaction data for Tally export
            const dataToExport = (statement.results || []).map((item) => {
                // Handle cash transactions
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

            // Show processing message
            alert(`Processing ${dataToExport.length} transactions for Tally export...`);

            // Start the export process
            const response = await startTransactionProcessing(
                dataToExport,
                tallyInfo,
                accountDetails
            );

            if (response?.status) {
                alert(
                    `Successfully exported ${dataToExport.length} transactions to Tally for ${companyName.data}!\n\n` +
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

    if (viewMode === 'details' && selectedStatement) {
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
                            <button
                                onClick={() => exportStatement(selectedStatement)}
                                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <FiDownload className="w-4 h-4" />
                                <span>Export to Tally</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Statement Details */}
                <div className="max-w-7xl mx-auto px-6 py-8">
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

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Transactions</p>
                                    <p className="text-2xl font-bold text-gray-900">{selectedStatement.summary?.total_items || 0}</p>
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
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedStatement.summary?.total_credit_amount)}</p>
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
                                    <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedStatement.summary?.total_debit_amount)}</p>
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
                                    <p className={`text-2xl font-bold ${(selectedStatement.summary?.net_balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(selectedStatement.summary?.net_balance)}
                                    </p>
                                </div>
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${(selectedStatement.summary?.net_balance || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                    {(selectedStatement.summary?.net_balance || 0) >= 0 ?
                                        <FiTrendingUp className="w-6 h-6 text-green-600" /> :
                                        <FiTrendingDown className="w-6 h-6 text-red-600" />
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classification</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {selectedStatement.results?.slice(0, 100).map((transaction, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {transaction.date || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                                {transaction.vendor || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.transaction_type === 'CREDIT'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {transaction.transaction_type || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {formatCurrency(transaction.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                                {transaction.classification || 'Unclassified'}
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