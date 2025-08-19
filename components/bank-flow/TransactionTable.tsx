// import {
//     Edit3, Save, X, CheckCircle,
//     ArrowDownCircle, ArrowUpCircle, Banknote,
//     AlertCircle, FileSpreadsheet, RefreshCw,
//     PlusCircle
// } from "lucide-react";

// const TransactionTable = ({
//     results,
//     filterType,
//     setFilterType,
//     searchTerm,
//     setSearchTerm,
//     sortConfig,
//     setSortConfig,
//     editingRow,
//     setEditingRow,
//     editingCategory,
//     startSaveProcess,
//     summary,
//     setEditingCategory,
//     tempCategoryValue,
//     setTempCategoryValue,
//     getFilteredResults,
//     startRowEdit,
//     saveRowChanges,
//     cancelRowEdit,
//     handleSort,
//     getSortIcon,
//     businessSubcategory,
//     getConfidenceColor,
//     getClassificationColor,
//     getTransactionTypeColor,
//     getMatchingVendorCount,
//     debitClassificationOptions,
//     creditClassificationOptions,
//     filteredSummary,
//     dateFilterType,
//     selectedDate,
//     selectedMonth,
//     dateRangeStart,
//     dateRangeEnd,
//     formatMonthDisplay,
//     clearDateFilters,
//     isAdding,
//     onAddNewEntry,
//     newEntry,
//     handleNewEntryChange,
//     saveNewEntry,
//     cancelAddEntry,

// }) => {
//     const filteredResults = getFilteredResults();

//     const getFilterDescription = () => {
//         if (dateFilterType === "specific-date" && selectedDate) return `Date: ${selectedDate}`;
//         if (dateFilterType === "specific-month" && selectedMonth) return `Month: ${formatMonthDisplay(selectedMonth)}`;
//         if (dateFilterType === "date-range" && dateRangeStart && dateRangeEnd) return `Range: ${dateRangeStart} to ${dateRangeEnd}`;
//         if (filterType !== "all") return `Type: ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`;
//         return "Custom Filter";
//     };

//     return (
//         <div className="bg-white rounded-xl shadow-sm overflow-hidden">
//             <div className="p-6 border-b border-gray-200">
//                 <div className="flex justify-between items-center mb-4">
//                     <div>
//                         <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
//                         <p className="text-sm text-gray-600 mt-1">
//                             All transactions classified for {businessSubcategory}
//                             {dateFilterType !== "all" && " (Filtered by date)"}
//                         </p>
//                     </div>

//                     <button
//                         onClick={onAddNewEntry}
//                         className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
//                     >
//                         <PlusCircle size={18} />
//                         Add New Entry
//                     </button>
//                 </div>

//                 <div className="mb-4">
//                     <div className="relative">
//                         <input
//                             type="text"
//                             placeholder="Search transactions by vendor, description, amount, or date..."
//                             value={searchTerm}
//                             onChange={(e) => setSearchTerm(e.target.value)}
//                             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                         />
//                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                             <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                             </svg>
//                         </div>
//                         {searchTerm && (
//                             <button
//                                 onClick={() => setSearchTerm("")}
//                                 className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
//                             >
//                                 <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                                 </svg>
//                             </button>
//                         )}
//                     </div>
//                 </div>

//                 {searchTerm && (
//                     <div className="mb-4 text-sm text-gray-600">
//                         Showing {filteredResults.length} of {results.length} transactions
//                         {searchTerm && ` matching "${searchTerm}"`}
//                     </div>
//                 )}

//                 <div className="flex flex-wrap gap-3">
//                     <button
//                         onClick={() => setFilterType("all")}
//                         className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${filterType === "all"
//                             ? "bg-blue-100 text-blue-700 border border-blue-300"
//                             : "bg-gray-100 text-gray-600 border border-gray-300"
//                             }`}
//                     >
//                         <FileSpreadsheet className="w-4 h-4 mr-2" />
//                         All ({filteredResults.length})
//                     </button>

//                     <button
//                         onClick={() => setFilterType("debit")}
//                         className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${filterType === "debit"
//                             ? "bg-red-100 text-red-700 border border-red-300"
//                             : "bg-gray-100 text-gray-600 border border-gray-300"
//                             }`}
//                     >
//                         <ArrowDownCircle className="w-4 h-4 mr-2" />
//                         Debits ({filteredResults.filter(item => item.transaction_type === "DEBIT").length})
//                     </button>

//                     <button
//                         onClick={() => setFilterType("credit")}
//                         className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${filterType === "credit"
//                             ? "bg-green-100 text-green-700 border border-green-300"
//                             : "bg-gray-100 text-gray-600 border border-gray-300"
//                             }`}
//                     >
//                         <ArrowUpCircle className="w-4 h-4 mr-2" />
//                         Credits ({filteredResults.filter(item => item.transaction_type === "CREDIT").length})
//                     </button>

//                     <button
//                         onClick={() => setFilterType("cash")}
//                         className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${filterType === "cash"
//                             ? "bg-amber-100 text-amber-700 border border-amber-300"
//                             : "bg-gray-100 text-gray-600 border border-gray-300"
//                             }`}
//                     >
//                         <Banknote className="w-4 h-4 mr-2" />
//                         Cash ({filteredResults.filter(item =>
//                             item.classification?.includes("Cash") ||
//                             item.classification?.includes("Withdrawal") ||
//                             item.classification?.includes("Deposit")
//                         ).length})
//                     </button>

//                     <button
//                         onClick={() => setFilterType("suspense")}
//                         className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${filterType === "suspense"
//                             ? "bg-orange-100 text-orange-700 border border-orange-300"
//                             : "bg-gray-100 text-gray-600 border border-gray-300"
//                             }`}
//                     >
//                         <AlertCircle className="w-4 h-4 mr-2" />
//                         Suspense ({filteredResults.filter(item => item.classification === "SUSPENSE").length})
//                     </button>
//                 </div>
//             </div>

//             <div className="overflow-x-auto">
//                 <table className="w-full">
//                     <thead className="bg-gray-50">
//                         <tr>
//                             <th
//                                 className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
//                                 onClick={() => handleSort("date")}
//                             >
//                                 <div className="flex items-center">
//                                     Date {getSortIcon("date")}
//                                 </div>
//                             </th>
//                             <th
//                                 className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
//                                 onClick={() => handleSort("vendor")}
//                             >
//                                 <div className="flex items-center">
//                                     Vendor/Description {getSortIcon("vendor")}
//                                 </div>
//                             </th>
//                             <th
//                                 className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
//                                 onClick={() => handleSort("amount")}
//                             >
//                                 <div className="flex items-center">
//                                     Amount {getSortIcon("amount")}
//                                 </div>
//                             </th>
//                             <th
//                                 className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
//                                 onClick={() => handleSort("balance_change")}
//                             >
//                                 <div className="flex items-center">
//                                     Balance Change {getSortIcon("balance_change")}
//                                 </div>
//                             </th>
//                             <th
//                                 className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
//                                 onClick={() => handleSort("running_balance")}
//                             >
//                                 <div className="flex items-center">
//                                     Running Balance {getSortIcon("running_balance")}
//                                 </div>
//                             </th>
//                             <th
//                                 className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
//                                 onClick={() => handleSort("transaction_type")}
//                             >
//                                 <div className="flex items-center">
//                                     Type {getSortIcon("transaction_type")}
//                                 </div>
//                             </th>
//                             <th
//                                 className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
//                                 onClick={() => handleSort("classification")}
//                             >
//                                 <div className="flex items-center">
//                                     Classification {getSortIcon("classification")}
//                                 </div>
//                             </th>
//                             <th
//                                 className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
//                                 onClick={() => handleSort("category")}
//                             >
//                                 <div className="flex items-center">
//                                     Category {getSortIcon("category")}
//                                 </div>
//                             </th>
//                             <th
//                                 className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
//                                 onClick={() => handleSort("confidence")}
//                             >
//                                 <div className="flex items-center">
//                                     Status {getSortIcon("confidence")}
//                                 </div>
//                             </th>
//                             <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-200">

//                         {isAdding && (
//                             <tr className="bg-blue-50 border-l-4 border-blue-400">
//                                 <td className="px-6 py-4">
//                                     <input
//                                         type="date"
//                                         value={newEntry.date}
//                                         onChange={(e) => handleNewEntryChange('date', e.target.value)}
//                                         className="border rounded px-2 py-1 w-full text-sm text-black"
//                                     />
//                                 </td>
//                                 <td className="px-6 py-4">
//                                     <input
//                                         type="text"
//                                         value={newEntry.vendor}
//                                         onChange={(e) => handleNewEntryChange('vendor', e.target.value)}
//                                         placeholder="Vendor"
//                                         className="border rounded px-2 py-1 w-full mb-1 text-sm text-black"
//                                     />
//                                     <input
//                                         type="text"
//                                         value={newEntry.description}
//                                         onChange={(e) => handleNewEntryChange('description', e.target.value)}
//                                         placeholder="Description"
//                                         className="border rounded px-2 py-1 w-full text-sm text-black"
//                                     />
//                                 </td>
//                                 <td className="px-6 py-4">
//                                     <div className="flex flex-col gap-2">
//                                         <input
//                                             type="number"
//                                             value={newEntry.debit}
//                                             onChange={(e) => {
//                                                 handleNewEntryChange('debit', e.target.value);
//                                                 if (e.target.value !== '') {
//                                                     handleNewEntryChange('credit', '');
//                                                 }
//                                             }}
//                                             placeholder="Debit"
//                                             className="border rounded px-2 py-1 w-full text-sm text-black"
//                                         />
//                                         <input
//                                             type="number"
//                                             value={newEntry.credit}
//                                             onChange={(e) => {
//                                                 handleNewEntryChange('credit', e.target.value);
//                                                 if (e.target.value !== '') {
//                                                     handleNewEntryChange('debit', '');
//                                                 }
//                                             }}
//                                             placeholder="Credit"
//                                             className="border rounded px-2 py-1 w-full text-sm text-black"
//                                         />
//                                     </div>
//                                 </td>
//                                 <td className="px-6 py-4 text-sm font-medium">
//                                     {newEntry.debit ? (
//                                         <span className="text-red-900">-₹{(newEntry.debit || 0).toLocaleString("en-IN")}</span>
//                                     ) : newEntry.credit ? (
//                                         <span className="text-green-900">+₹{(newEntry.credit || 0).toLocaleString("en-IN")}</span>
//                                     ) : ''}
//                                 </td>
//                                 <td className="px-6 py-4 text-sm font-medium text-gray-400">
//                                     N/A
//                                 </td>
//                                 <td className="px-6 py-4">
//                                     <span className="mt-3 flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
//                                         {newEntry.debit ? 'DEBIT' : newEntry.credit ? 'CREDIT' : 'SELECT'}
//                                     </span>
//                                 </td>
//                                 <td className="px-6 py-4">
//                                     <select
//                                         value={newEntry.classification}
//                                         onChange={(e) => handleNewEntryChange('classification', e.target.value)}
//                                         className="border rounded px-2 py-1 w-full text-sm text-black"
//                                     >
//                                         <option value="">Select classification</option>
//                                         {debitClassificationOptions.map(option => (
//                                             <option key={option} value={option}>{option}</option>
//                                         ))}
//                                         {creditClassificationOptions.map(option => (
//                                             <option key={option} value={option}>{option}</option>
//                                         ))}
//                                     </select>
//                                 </td>
//                                 <td className="px-6 py-4 text-sm text-gray-600">
//                                     {businessSubcategory}
//                                 </td>
//                                 <td className="px-6 py-4">
//                                     <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
//                                         100%
//                                     </span>
//                                 </td>
//                                 <td className="px-6 py-4 flex flex-col gap-2">
//                                     <button
//                                         onClick={saveNewEntry}
//                                         className="text-green-600 hover:text-green-800 font-medium"
//                                     >
//                                         Save
//                                     </button>
//                                     <button
//                                         onClick={cancelAddEntry}
//                                         className="text-red-600 hover:text-red-800 font-medium"
//                                     >
//                                         Cancel
//                                     </button>
//                                 </td>
//                             </tr>
//                         )}


//                         {filteredResults.map((item) => (
//                             <tr
//                                 key={item.id}
//                                 className={`hover:bg-gray-50 transition-colors ${item.classification === "SUSPENSE"
//                                     ? "bg-orange-25 border-l-4 border-orange-300"
//                                     : ""
//                                     }`}
//                             >
//                                 <td className="px-6 py-4 text-sm text-gray-600">
//                                     {item.date || "N/A"}
//                                 </td>
//                                 <td className="px-6 py-4">
//                                     <div className="text-sm font-medium text-gray-900">
//                                         {item.vendor || "Unknown Vendor"}
//                                     </div>
//                                     {item.description && (
//                                         <div className="text-xs text-gray-500 mt-1 truncate max-w-48">
//                                             {item.description}
//                                         </div>
//                                     )}
//                                     {item.classification === "SUSPENSE" && (
//                                         <div className="text-xs text-orange-600 font-medium mt-1">
//                                             ⚠️ Needs Review
//                                         </div>
//                                     )}
//                                 </td>
//                                 <td className="px-6 py-4 text-sm font-medium">
//                                     <span className={`${item.transaction_type === "DEBIT" ? "text-red-900" : "text-green-900"}`}>
//                                         {item.transaction_type === "DEBIT" ? "-" : "+"}₹{(item.amount || 0).toLocaleString("en-IN")}
//                                     </span>
//                                 </td>
//                                 <td className="px-6 py-4 text-sm font-medium">
//                                     <span className={`${(item.balance_change || 0) >= 0 ? "text-green-900" : "text-red-900"}`}>
//                                         {(item.balance_change || 0) >= 0 ? "+" : ""}₹{(item.balance_change || 0).toLocaleString("en-IN")}
//                                     </span>
//                                 </td>
//                                 <td className="px-6 py-4 text-sm font-medium">
//                                     <div className={`px-3 py-1 rounded-full text-xs font-medium ${(item.running_balance || 0) >= 0
//                                         ? "text-blue-700 bg-blue-100"
//                                         : "text-orange-700 bg-orange-100"
//                                         }`}>
//                                         ₹{(item.running_balance || 0).toLocaleString("en-IN")}
//                                     </div>
//                                 </td>
//                                 <td className="flex justify-center px-6 py-4">
//                                     <span className={`mt-3 flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(item.transaction_type)
//                                         }`}>
//                                         {item.transaction_type === "DEBIT" ? (
//                                             <>
//                                                 <ArrowDownCircle className="w-3 h-3 inline mr-1" />
//                                                 DEBIT
//                                             </>
//                                         ) : (
//                                             <>
//                                                 <ArrowUpCircle className="w-3 h-3 inline mr-1" />
//                                                 CREDIT
//                                             </>
//                                         )}
//                                     </span>
//                                 </td>
//                                 <td className="px-6 py-4">
//                                     {editingRow === item.id ? (
//                                         <select
//                                             data-item-id={item.id}
//                                             defaultValue={item.classification}
//                                             className="border text-black border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                                         >
//                                             {(item.transaction_type === "DEBIT" ? debitClassificationOptions : creditClassificationOptions).map(option => (
//                                                 <option key={option} value={option}>{option}</option>
//                                             ))}
//                                         </select>
//                                     ) : (
//                                         <span className={`px-3 py-1 rounded-full text-xs font-medium ${getClassificationColor(item.classification)
//                                             }`}>
//                                             {item.classification}
//                                             {item.classification === "SUSPENSE" && (
//                                                 <span className="ml-1">⚠️</span>
//                                             )}
//                                         </span>
//                                     )}
//                                 </td>
//                                 <td className="px-6 py-4">
//                                     {editingCategory === item.id ? (
//                                         <input
//                                             type="text"
//                                             value={tempCategoryValue}
//                                             onChange={(e) => setTempCategoryValue(e.target.value)}
//                                             className="border text-black border-gray-300 rounded px-2 py-1 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                                             placeholder="Enter category..."
//                                         />
//                                     ) : (
//                                         <span className="text-sm text-gray-600 px-2 py-1 rounded">
//                                             {item.category || "Not set"}
//                                         </span>
//                                     )}
//                                 </td>
//                                 <td className="px-6 py-4">
//                                     <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(item.confidence, item.classification)
//                                         }`}>
//                                         {item.classification === "SUSPENSE" ? "REVIEW" : `${item.confidence}%`}
//                                     </span>
//                                 </td>
//                                 {/* <td className="px-6 py-4">
//                                     {editingRow === item.id ? (
//                                         <div className="flex flex-col space-y-2">
//                                             <div className="flex space-x-2">
//                                                 <button
//                                                     onClick={() => saveRowChanges(item.id)}
//                                                     className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center"
//                                                     title="Save changes"
//                                                 >
//                                                     <Save className="w-3 h-3 mr-1" />
//                                                     Save
//                                                 </button>
//                                                 <button
//                                                     onClick={cancelRowEdit}
//                                                     className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center"
//                                                     title="Cancel editing"
//                                                 >
//                                                     <X className="w-3 h-3 mr-1" />
//                                                     Cancel
//                                                 </button>
//                                             </div>
//                                             {(() => {
//                                                 const matchingCount = getMatchingVendorCount(item.id, item.vendor);
//                                                 return matchingCount > 0 ? (
//                                                     <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border">
//                                                         💡 Will update {matchingCount + 1} similar transactions
//                                                     </div>
//                                                 ) : null;
//                                             })()}
//                                         </div>
//                                     ) : (
//                                         <button
//                                             onClick={() => startRowEdit(item.id, item.classification, item.category)}
//                                             className={`bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center ${item.classification === "SUSPENSE" ? "bg-orange-600 hover:bg-orange-700" : ""
//                                                 }`}
//                                             title="Edit classification and category"
//                                         >
//                                             <Edit3 className="w-3 h-3 mr-1" />
//                                             Edit
//                                         </button>
//                                     )}
//                                 </td> */}

//                                 <td className="px-6 py-4">
//                                     {editingRow === item.id ? (
//                                         <div className="flex flex-col space-y-2">
//                                             <div className="flex space-x-2">
//                                                 <button
//                                                     onClick={() => startSaveProcess(item.id)} // Changed to startSaveProcess
//                                                     className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center"
//                                                     title="Save changes"
//                                                 >
//                                                     <Save className="w-3 h-3 mr-1" />
//                                                     Save
//                                                 </button>
//                                                 <button
//                                                     onClick={cancelRowEdit}
//                                                     className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center"
//                                                     title="Cancel editing"
//                                                 >
//                                                     <X className="w-3 h-3 mr-1" />
//                                                     Cancel
//                                                 </button>
//                                             </div>
//                                             {(() => {
//                                                 const matchingCount = getMatchingVendorCount(item.id, item.vendor);
//                                                 const filteredResults = getFilteredResults();
//                                                 const filteredMatchingCount = filteredResults.filter(i =>
//                                                     i.id !== item.id &&
//                                                     (i.vendor || "").trim().toUpperCase().substring(0, 6) ===
//                                                     (item.vendor || "").trim().toUpperCase().substring(0, 6)
//                                                 ).length;

//                                                 return matchingCount > 0 ? (
//                                                     <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border">
//                                                         💡 Found {matchingCount} similar transactions in all data
//                                                         {filteredMatchingCount > 0 && (
//                                                             <span>, {filteredMatchingCount} in current filter</span>
//                                                         )}
//                                                     </div>
//                                                 ) : null;
//                                             })()}
//                                         </div>
//                                     ) : (
//                                         <button
//                                             onClick={() => startRowEdit(item.id, item.classification, item.category)}
//                                             className={`bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center ${item.classification === "SUSPENSE" ? "bg-orange-600 hover:bg-orange-700" : ""}`}
//                                             title="Edit classification and category"
//                                         >
//                                             <Edit3 className="w-3 h-3 mr-1" />
//                                             Edit
//                                         </button>
//                                     )}
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>

//             {filteredResults.length === 0 && (
//                 <div className="text-center py-12">
//                     <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
//                     <h3 className="text-lg font-medium text-gray-900 mb-2">
//                         No {filterType === "all" ? "transactions" : filterType} found!
//                     </h3>
//                     <p className="text-gray-600">
//                         {filterType === "suspense" && "All transactions were classified with confidence."}
//                         {filterType === "cash" && "No cash transactions found in the statements."}
//                         {filterType === "debit" && "No debit transactions found."}
//                         {filterType === "credit" && "No credit transactions found."}
//                         {dateFilterType !== "all" && (
//                             <span> for the filter: <strong>{getFilterDescription()}</strong></span>
//                         )}
//                     </p>
//                     {(dateFilterType !== "all" || filterType !== "all") && (
//                         <button
//                             onClick={() => {
//                                 setFilterType("all");
//                                 clearDateFilters();
//                             }}
//                             className="text-blue-600 hover:text-blue-800 font-medium mt-4 flex items-center"
//                         >
//                             <RefreshCw className="w-4 h-4 mr-1" />
//                             Clear all filters
//                         </button>
//                     )}
//                 </div>
//             )}
//         </div>
//     );
// };

// export default TransactionTable;


import {
    Edit3, Save, X, CheckCircle,
    ArrowDownCircle, ArrowUpCircle, Banknote,
    AlertCircle, FileSpreadsheet, RefreshCw,
    PlusCircle
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import Pagination from "../pagination";


const TransactionTable = ({
    results,
    filterType,
    setFilterType,
    searchTerm,
    setSearchTerm,
    sortConfig,
    setSortConfig,
    editingRow,
    setEditingRow,
    editingCategory,
    startSaveProcess,
    summary,
    setEditingCategory,
    tempCategoryValue,
    setTempCategoryValue,
    getFilteredResults,
    startRowEdit,
    saveRowChanges,
    cancelRowEdit,
    handleSort,
    getSortIcon,
    businessSubcategory,
    getConfidenceColor,
    getClassificationColor,
    getTransactionTypeColor,
    getMatchingVendorCount,
    debitClassificationOptions,
    creditClassificationOptions,
    filteredSummary,
    dateFilterType,
    selectedDate,
    selectedMonth,
    dateRangeStart,
    dateRangeEnd,
    formatMonthDisplay,
    clearDateFilters,
    isAdding,
    onAddNewEntry,
    newEntry,
    handleNewEntryChange,
    saveNewEntry,
    cancelAddEntry,
}) => {
    // ----------------------
    // Pagination state
    // ----------------------
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25); // tweak default if you like

    const filteredResults = getFilteredResults();

    const totalPages = Math.max(1, Math.ceil(filteredResults.length / pageSize));

    // Keep page in range when filters/search/date change
    useEffect(() => {
        setCurrentPage(1);
    }, [
        searchTerm,
        filterType,
        dateFilterType,
        selectedDate,
        selectedMonth,
        dateRangeStart,
        dateRangeEnd,
        results, // if the source changes, reset page
    ]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    // Page slice
    const pagedResults = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredResults.slice(start, start + pageSize);
    }, [filteredResults, currentPage, pageSize]);

    const getFilterDescription = () => {
        if (dateFilterType === "specific-date" && selectedDate) return `Date: ${selectedDate}`;
        if (dateFilterType === "specific-month" && selectedMonth) return `Month: ${formatMonthDisplay(selectedMonth)}`;
        if (dateFilterType === "date-range" && dateRangeStart && dateRangeEnd) return `Range: ${dateRangeStart} to ${dateRangeEnd}`;
        if (filterType !== "all") return `Type: ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`;
        return "Custom Filter";
    };

    // For "X–Y of Z" text
    const startIndex = filteredResults.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(filteredResults.length, currentPage * pageSize);

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            All transactions classified for {businessSubcategory}
                            {dateFilterType !== "all" && " (Filtered by date)"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Showing <strong>{startIndex || 0}-{endIndex || 0}</strong> of <strong>{filteredResults.length}</strong> results
                            {searchTerm ? <> matching "<strong>{searchTerm}</strong>"</> : null}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Page size selector */}
                        <label className="text-sm text-gray-600">
                            Rows per page:&nbsp;
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="border border-gray-300 rounded px-2 py-1 text-sm text-black"
                            >
                                {[10, 25, 50, 100].map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </label>

                        <button
                            onClick={onAddNewEntry}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                        >
                            <PlusCircle size={18} />
                            Add New Entry
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search transactions by vendor, description, amount, or date..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {searchTerm && (
                    <div className="mb-4 text-sm text-gray-600">
                        Showing {filteredResults.length} of {results.length} transactions
                        {searchTerm && ` matching "${searchTerm}"`}
                    </div>
                )}

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setFilterType("all")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${filterType === "all"
                            ? "bg-blue-100 text-blue-700 border border-blue-300"
                            : "bg-gray-100 text-gray-600 border border-gray-300"
                            }`}
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        All ({filteredResults.length})
                    </button>

                    <button
                        onClick={() => setFilterType("debit")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${filterType === "debit"
                            ? "bg-red-100 text-red-700 border border-red-300"
                            : "bg-gray-100 text-gray-600 border border-gray-300"
                            }`}
                    >
                        <ArrowDownCircle className="w-4 h-4 mr-2" />
                        Debits ({filteredResults.filter(item => item.transaction_type === "DEBIT").length})
                    </button>

                    <button
                        onClick={() => setFilterType("credit")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${filterType === "credit"
                            ? "bg-green-100 text-green-700 border border-green-300"
                            : "bg-gray-100 text-gray-600 border border-gray-300"
                            }`}
                    >
                        <ArrowUpCircle className="w-4 h-4 mr-2" />
                        Credits ({filteredResults.filter(item => item.transaction_type === "CREDIT").length})
                    </button>

                    <button
                        onClick={() => setFilterType("cash")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${filterType === "cash"
                            ? "bg-amber-100 text-amber-700 border border-amber-300"
                            : "bg-gray-100 text-gray-600 border border-gray-300"
                            }`}
                    >
                        <Banknote className="w-4 h-4 mr-2" />
                        Cash ({filteredResults.filter(item =>
                            item.classification?.includes("Cash") ||
                            item.classification?.includes("Withdrawal") ||
                            item.classification?.includes("Deposit")
                        ).length})
                    </button>

                    <button
                        onClick={() => setFilterType("suspense")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${filterType === "suspense"
                            ? "bg-orange-100 text-orange-700 border border-orange-300"
                            : "bg-gray-100 text-gray-600 border border-gray-300"
                            }`}
                    >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Suspense ({filteredResults.filter(item => item.classification === "SUSPENSE").length})
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("date")}>
                                <div className="flex items-center">Date {getSortIcon("date")}</div>
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("vendor")}>
                                <div className="flex items-center">Vendor/Description {getSortIcon("vendor")}</div>
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("amount")}>
                                <div className="flex items-center">Amount {getSortIcon("amount")}</div>
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("balance_change")}>
                                <div className="flex items-center">Balance Change {getSortIcon("balance_change")}</div>
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("running_balance")}>
                                <div className="flex items-center">Running Balance {getSortIcon("running_balance")}</div>
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("transaction_type")}>
                                <div className="flex items-center">Type {getSortIcon("transaction_type")}</div>
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("classification")}>
                                <div className="flex items-center">Classification {getSortIcon("classification")}</div>
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("category")}>
                                <div className="flex items-center">Category {getSortIcon("category")}</div>
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("confidence")}>
                                <div className="flex items-center">Status {getSortIcon("confidence")}</div>
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                        {isAdding && (
                            <tr className="bg-blue-50 border-l-4 border-blue-400">
                                <td className="px-6 py-4">
                                    <input
                                        type="date"
                                        value={newEntry.date}
                                        onChange={(e) => handleNewEntryChange('date', e.target.value)}
                                        className="border rounded px-2 py-1 w-full text-sm text-black"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="text"
                                        value={newEntry.vendor}
                                        onChange={(e) => handleNewEntryChange('vendor', e.target.value)}
                                        placeholder="Vendor"
                                        className="border rounded px-2 py-1 w-full mb-1 text-sm text-black"
                                    />
                                    <input
                                        type="text"
                                        value={newEntry.description}
                                        onChange={(e) => handleNewEntryChange('description', e.target.value)}
                                        placeholder="Description"
                                        className="border rounded px-2 py-1 w-full text-sm text-black"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="number"
                                            value={newEntry.debit}
                                            onChange={(e) => {
                                                handleNewEntryChange('debit', e.target.value);
                                                if (e.target.value !== '') handleNewEntryChange('credit', '');
                                            }}
                                            placeholder="Debit"
                                            className="border rounded px-2 py-1 w-full text-sm text-black"
                                        />
                                        <input
                                            type="number"
                                            value={newEntry.credit}
                                            onChange={(e) => {
                                                handleNewEntryChange('credit', e.target.value);
                                                if (e.target.value !== '') handleNewEntryChange('debit', '');
                                            }}
                                            placeholder="Credit"
                                            className="border rounded px-2 py-1 w-full text-sm text-black"
                                        />
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium">
                                    {newEntry.debit ? (
                                        <span className="text-red-900">-₹{(newEntry.debit || 0).toLocaleString("en-IN")}</span>
                                    ) : newEntry.credit ? (
                                        <span className="text-green-900">+₹{(newEntry.credit || 0).toLocaleString("en-IN")}</span>
                                    ) : ''}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-400">N/A</td>
                                <td className="px-6 py-4">
                                    <span className="mt-3 flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                        {newEntry.debit ? 'DEBIT' : newEntry.credit ? 'CREDIT' : 'SELECT'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        value={newEntry.classification}
                                        onChange={(e) => handleNewEntryChange('classification', e.target.value)}
                                        className="border rounded px-2 py-1 w-full text-sm text-black"
                                    >
                                        <option value="">Select classification</option>
                                        {debitClassificationOptions.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                        {creditClassificationOptions.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{businessSubcategory}</td>
                                <td className="px-6 py-4">
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">100%</span>
                                </td>
                                <td className="px-6 py-4 flex flex-col gap-2">
                                    <button onClick={saveNewEntry} className="text-green-600 hover:text-green-800 font-medium">Save</button>
                                    <button onClick={cancelAddEntry} className="text-red-600 hover:text-red-800 font-medium">Cancel</button>
                                </td>
                            </tr>
                        )}

                        {pagedResults.map((item) => (
                            <tr
                                key={item.id}
                                className={`hover:bg-gray-50 transition-colors ${item.classification === "SUSPENSE" ? "bg-orange-25 border-l-4 border-orange-300" : ""}`}
                            >
                                <td className="px-6 py-4 text-sm text-gray-600">{item.date || "N/A"}</td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{item.vendor || "Unknown Vendor"}</div>
                                    {item.description && (
                                        <div className="text-xs text-gray-500 mt-1 truncate max-w-48">{item.description}</div>
                                    )}
                                    {item.classification === "SUSPENSE" && (
                                        <div className="text-xs text-orange-600 font-medium mt-1">⚠️ Needs Review</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium">
                                    <span className={`${item.transaction_type === "DEBIT" ? "text-red-900" : "text-green-900"}`}>
                                        {item.transaction_type === "DEBIT" ? "-" : "+"}₹{(item.amount || 0).toLocaleString("en-IN")}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium">
                                    <span className={`${(item.balance_change || 0) >= 0 ? "text-green-900" : "text-red-900"}`}>
                                        {(item.balance_change || 0) >= 0 ? "+" : ""}₹{(item.balance_change || 0).toLocaleString("en-IN")}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium">
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${(item.running_balance || 0) >= 0 ? "text-blue-700 bg-blue-100" : "text-orange-700 bg-orange-100"}`}>
                                        ₹{(item.running_balance || 0).toLocaleString("en-IN")}
                                    </div>
                                </td>
                                <td className="flex justify-center px-6 py-4">
                                    <span className={`mt-3 flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(item.transaction_type)}`}>
                                        {item.transaction_type === "DEBIT" ? (
                                            <>
                                                <ArrowDownCircle className="w-3 h-3 inline mr-1" />
                                                DEBIT
                                            </>
                                        ) : (
                                            <>
                                                <ArrowUpCircle className="w-3 h-3 inline mr-1" />
                                                CREDIT
                                            </>
                                        )}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {editingRow === item.id ? (
                                        <select
                                            data-item-id={item.id}
                                            defaultValue={item.classification}
                                            className="border text-black border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {(item.transaction_type === "DEBIT" ? debitClassificationOptions : creditClassificationOptions).map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getClassificationColor(item.classification)}`}>
                                            {item.classification}
                                            {item.classification === "SUSPENSE" && <span className="ml-1">⚠️</span>}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {editingCategory === item.id ? (
                                        <input
                                            type="text"
                                            value={tempCategoryValue}
                                            onChange={(e) => setTempCategoryValue(e.target.value)}
                                            className="border text-black border-gray-300 rounded px-2 py-1 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter category..."
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-600 px-2 py-1 rounded">
                                            {item.category || "Not set"}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(item.confidence, item.classification)}`}>
                                        {item.classification === "SUSPENSE" ? "REVIEW" : `${item.confidence}%`}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {editingRow === item.id ? (
                                        <div className="flex flex-col space-y-2">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => startSaveProcess(item.id)}
                                                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center"
                                                    title="Save changes"
                                                >
                                                    <Save className="w-3 h-3 mr-1" />
                                                    Save
                                                </button>
                                                <button
                                                    onClick={cancelRowEdit}
                                                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center"
                                                    title="Cancel editing"
                                                >
                                                    <X className="w-3 h-3 mr-1" />
                                                    Cancel
                                                </button>
                                            </div>
                                            {(() => {
                                                const matchingCount = getMatchingVendorCount(item.id, item.vendor);
                                                const filtered = getFilteredResults();
                                                const filteredMatchingCount = filtered.filter(i =>
                                                    i.id !== item.id &&
                                                    (i.vendor || "").trim().toUpperCase().substring(0, 6) ===
                                                    (item.vendor || "").trim().toUpperCase().substring(0, 6)
                                                ).length;

                                                return matchingCount > 0 ? (
                                                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border">
                                                        💡 Found {matchingCount} similar transactions in all data
                                                        {filteredMatchingCount > 0 && <span>, {filteredMatchingCount} in current filter</span>}
                                                    </div>
                                                ) : null;
                                            })()}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => startRowEdit(item.id, item.classification, item.category)}
                                            className={`bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center ${item.classification === "SUSPENSE" ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                                            title="Edit classification and category"
                                        >
                                            <Edit3 className="w-3 h-3 mr-1" />
                                            Edit
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Empty state */}
            {filteredResults.length === 0 && (
                <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No {filterType === "all" ? "transactions" : filterType} found!
                    </h3>
                    <p className="text-gray-600">
                        {filterType === "suspense" && "All transactions were classified with confidence."}
                        {filterType === "cash" && "No cash transactions found in the statements."}
                        {filterType === "debit" && "No debit transactions found."}
                        {filterType === "credit" && "No credit transactions found."}
                        {dateFilterType !== "all" && (
                            <span> for the filter: <strong>{getFilterDescription()}</strong></span>
                        )}
                    </p>
                    {(dateFilterType !== "all" || filterType !== "all") && (
                        <button
                            onClick={() => {
                                setFilterType("all");
                                clearDateFilters();
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium mt-4 flex items-center"
                        >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Clear all filters
                        </button>
                    )}
                </div>
            )}

            {/* Footer pagination */}
            {filteredResults.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-gray-600">
                        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        className="flex flex-wrap"
                        showFirstLast
                        showPreviousNext
                        maxVisiblePages={7}
                    />
                </div>
            )}
        </div>
    );
};

export default TransactionTable;