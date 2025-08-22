import {
    Info,
    Calendar,
    CalendarDays,
    Filter,
    Download,
    BookMarked,
    PlusCircle,
    Eye,
    EyeOff,
    Edit2,
    Save,
    X,
} from "lucide-react";
import DateFilter from "./DateFilter";
import SummaryCards from "./SummaryCards";
import TransactionTable from "./TransactionTable";
import { useEffect, useState } from "react";

const EditableBankDetails = ({ header, setHeader }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedDetails, setEditedDetails] = useState(header);

    const handleSave = () => {
        setHeader(editedDetails);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedDetails(header);
        setIsEditing(false);
    };

    const handleChange = (field, value) => {
        setEditedDetails(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200 text-black">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Bank Account Details</h2>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
                    >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                    </button>
                ) : (
                    <div className="flex space-x-2">
                        <button
                            onClick={handleSave}
                            className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                            <Save className="w-4 h-4 mr-1" />
                            Save
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex items-center px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editedDetails.holder_name || ''}
                            onChange={(e) => handleChange('holder_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter account holder name"
                        />
                    ) : (
                        <p className="px-3 py-2 bg-gray-50 rounded-md">{header.holder_name || 'Not provided'}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editedDetails.account_number || ''}
                            onChange={(e) => handleChange('account_number', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter account number"
                        />
                    ) : (
                        <p className="px-3 py-2 bg-gray-50 rounded-md">{header.account_number || 'Not provided'}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editedDetails.ifsc_code || ''}
                            onChange={(e) => handleChange('ifsc_code', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter IFSC code"
                        />
                    ) : (
                        <p className="px-3 py-2 bg-gray-50 rounded-md">{header.ifsc_code || 'Not provided'}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editedDetails.bank_name || ''}
                            onChange={(e) => handleChange('bank_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter bank name"
                        />
                    ) : (
                        <p className="px-3 py-2 bg-gray-50 rounded-md">{header.bank_name || 'Not provided'}</p>
                    )}
                </div>
            </div>

            {isEditing && (
                <p className="text-sm text-gray-500 mt-4">
                    Note: These details will be used for Tally export and future reference.
                </p>
            )}
        </div>
    );
};



const ResultsStep = ({
    businessCategory,
    businessSubcategory,
    businessCategories,
    results,
    summary,
    filterType,
    startSaveProcess,
    setFilterType,
    searchTerm,
    setSearchTerm,
    sortConfig,
    setSortConfig,
    editingRow,
    setEditingRow,
    editingCategory,
    setEditingCategory,
    tempCategoryValue,
    setTempCategoryValue,
    dateFilterType,
    setDateFilterType,
    selectedDate,
    setSelectedDate,
    selectedMonth,
    setSelectedMonth,
    dateRangeStart,
    setDateRangeStart,
    dateRangeEnd,
    setDateRangeEnd,
    getAvailableMonths,
    formatMonthDisplay,
    getFilteredResults,
    getFilteredSummary,
    clearDateFilters,
    startRowEdit,
    saveRowChanges,
    cancelRowEdit,
    handleSort,
    getSortIcon,
    getConfidenceColor,
    getClassificationColor,
    getTransactionTypeColor,
    exportToExcel,
    exportToCSV,
    exportToTally,
    getMatchingVendorCount,
    debitClassificationOptions,
    creditClassificationOptions,
    showDetails,
    setShowDetails,
    onAddTransaction,
    header, setHeader
}) => {

    const [isAdding, setIsAdding] = useState(false);
    const [newEntry, setNewEntry] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        debit: '',
        credit: '',
        classification: '',
        vendor: '',
    });

    // Handle input changes for new entry
    const handleNewEntryChange = (field, value) => {
        setNewEntry(prev => ({ ...prev, [field]: value }));
    };

    // Save new entry
    const saveNewEntry = () => {
        const entry = {
            ...newEntry,
            id: `user-added-${Date.now()}`,
            type: newEntry.debit ? 'Debit' : 'Credit',
            confidence: 100,
            category: businessSubcategory,
            balance: 0,
        };
        onAddTransaction(entry);
        setIsAdding(false);
        setNewEntry({
            date: new Date().toISOString().split('T')[0],
            description: '',
            debit: '',
            credit: '',
            classification: '',
            vendor: '',
        });
    };

    // Cancel adding new entry
    const cancelAddEntry = () => {
        setIsAdding(false);
        setNewEntry({
            date: new Date().toISOString().split('T')[0],
            description: '',
            debit: '',
            credit: '',
            classification: '',
            vendor: '',
        });
    };


    const getCategoryColor = (category) => {
        const colors = {
            service: "blue",
            manufacturing: "green",
            trading: "purple",
        };
        return colors[category] || "gray";
    };

    const currentCategory = businessCategories.find(
        (c) => c.value === businessCategory
    );

    return (
        <>
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                                <Info className="w-5 h-5 mr-2" />
                                {businessSubcategory} Analysis Results with Advanced Date Filtering
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
                                <div>
                                    <h4 className="font-semibold mb-2 text-red-800">
                                        EXPENSE Classifications:
                                    </h4>
                                    <div className="space-y-1">
                                        <p>
                                            <span className="inline-block w-4 h-4 bg-blue-500 rounded mr-2"></span>
                                            <strong>Fixed:</strong> Capital goods & assets
                                        </p>
                                        <p>
                                            <span className="inline-block w-4 h-4 bg-green-500 rounded mr-2"></span>
                                            <strong>Trading Variable:</strong> Direct business expenses
                                        </p>
                                        <p>
                                            <span className="inline-block w-4 h-4 bg-purple-500 rounded mr-2"></span>
                                            <strong>Non-Trading Variable:</strong> Support expenses
                                        </p>
                                        <p>
                                            <span className="inline-block w-4 h-4 bg-amber-500 rounded mr-2"></span>
                                            <strong>Cash Withdrawal:</strong> ATM & cash
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2 text-green-800">
                                        INCOME Classifications:
                                    </h4>
                                    <div className="space-y-1">
                                        <p>
                                            <span className="inline-block w-4 h-4 bg-emerald-500 rounded mr-2"></span>
                                            <strong>Direct Income:</strong> Business revenue
                                        </p>
                                        <p>
                                            <span className="inline-block w-4 h-4 bg-teal-500 rounded mr-2"></span>
                                            <strong>Other Income:</strong> Non-business income
                                        </p>
                                        <p>
                                            <span className="inline-block w-4 h-4 bg-amber-500 rounded mr-2"></span>
                                            <strong>Cash Deposit: Cash deposits</strong>
                                        </p>
                                        <p>
                                            <span className="inline-block w-4 h-4 bg-orange-500 rounded mr-2"></span>
                                            <strong>Suspense:</strong> Review needed
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                        >
                            {showDetails ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                            {showDetails ? "Hide" : "Show"} Details
                        </button>
                    </div>
                </div>
                <EditableBankDetails header={header} setHeader={setHeader} />
                <DateFilter
                    result={results}
                    dateFilterType={dateFilterType}
                    setDateFilterType={setDateFilterType}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    dateRangeStart={dateRangeStart}
                    setDateRangeStart={setDateRangeStart}
                    dateRangeEnd={dateRangeEnd}
                    setDateRangeEnd={setDateRangeEnd}
                    clearDateFilters={clearDateFilters}
                    getAvailableMonths={getAvailableMonths}
                    formatMonthDisplay={formatMonthDisplay}
                    getFilteredResults={getFilteredResults}
                />
                <SummaryCards
                    summary={summary}
                    businessSubcategory={businessSubcategory}
                    getFilteredSummary={getFilteredSummary}
                    dateFilterType={dateFilterType}
                    exportToExcel={exportToExcel}
                    exportToCSV={exportToCSV}
                    exportToTally={exportToTally}
                    businessCategory={businessCategory}
                />
                <TransactionTable
                    results={results}
                    filterType={filterType}
                    businessSubcategory={businessSubcategory}
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
                    getFilteredResults={getFilteredResults}
                    startRowEdit={startRowEdit}
                    saveRowChanges={saveRowChanges}
                    cancelRowEdit={cancelRowEdit}
                    handleSort={handleSort}
                    getSortIcon={getSortIcon}
                    startSaveProcess={startSaveProcess}
                    getConfidenceColor={getConfidenceColor}
                    getClassificationColor={getClassificationColor}
                    getTransactionTypeColor={getTransactionTypeColor}
                    getMatchingVendorCount={getMatchingVendorCount}
                    debitClassificationOptions={debitClassificationOptions}
                    creditClassificationOptions={creditClassificationOptions}
                    summary={summary}
                    dateFilterType={dateFilterType}
                    selectedDate={selectedDate}
                    selectedMonth={selectedMonth}
                    dateRangeStart={dateRangeStart}
                    dateRangeEnd={dateRangeEnd}
                    formatMonthDisplay={formatMonthDisplay}
                    isAdding={isAdding}
                    onAddNewEntry={() => setIsAdding(true)}
                    newEntry={newEntry}
                    handleNewEntryChange={handleNewEntryChange}
                    saveNewEntry={saveNewEntry}
                    cancelAddEntry={cancelAddEntry}
                />
            </div>
        </>
    );
};

export default ResultsStep;