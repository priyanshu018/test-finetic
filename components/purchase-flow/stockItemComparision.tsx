// import React from "react";
// import { FileText, Database } from "lucide-react";

// // Stock Item Comparison Component
// const StockItemComparison = ({ billData, tallyData }: any) => {
//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Item Comparison</h1>
//           <p className="text-gray-600">Compare extracted bill data with Tally inventory records</p>
//         </div>

//         {/* Side-by-Side Comparison Table */}
//         <div className="mb-8">
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//             <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
//               <h2 className="text-xl font-semibold text-gray-900">Data Comparison</h2>
//             </div>

//             <div className="overflow-x-auto">
//               <table className="w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       <div className="flex items-center justify-center gap-2">
//                         <FileText className="h-4 w-4 text-blue-600" />
//                         Extracted Bill Data
//                       </div>
//                     </th>
//                     <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       <div className="flex items-center justify-center gap-2">
//                         <Database className="h-4 w-4 text-orange-600" />
//                         Tally Data
//                       </div>
//                     </th>
//                   </tr>
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {/* Displaying Bill Data */}
//                   {(billData ?? []).map((billItem, index) => {
//                     return (
//                       <tr key={index} className="hover:bg-opacity-80 transition-colors">
//                         {/* Bill Data Columns */}
//                         <td className="px-6 py-4 whitespace-nowrap bg-blue-50 border-r border-gray-200">
//                           <div className="text-sm font-medium text-gray-900">{billItem.Product}</div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap bg-blue-50 border-r border-gray-200">
//                           <div className="text-sm text-gray-900">{billItem.HSN}</div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap bg-blue-50 border-r border-gray-200">
//                           <div className="text-sm text-gray-900">{billItem.GST}%</div>
//                         </td>

//                         {/* Tally Data Columns */}
//                         <td className="px-6 py-4 whitespace-nowrap bg-orange-50 border-r border-gray-200">
//                           <div className="text-sm text-gray-900">
//                             {tallyData[index] ? tallyData[index].itemName : 'No Match'}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap bg-orange-50 border-r border-gray-200">
//                           <div className="text-sm text-gray-900">
//                             {tallyData[index] ? tallyData[index].hsnCode : '-'}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap bg-orange-50">
//                           <div className="text-sm text-gray-900">
//                             {tallyData[index] ? tallyData[index].gstRate : '-'}
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default StockItemComparison;


import React, { useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";

const StockItemComparison = ({ billData, tallyData }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Find matching items
  const matchedItems = billData.map(billItem => {
    const tallyItem = tallyData.find(
      t => t?.name?.toLowerCase() === billItem?.Product?.toLowerCase()
    );
    
    return {
      billItem,
      tallyItem,
      isMatch: !!tallyItem,
      isExactMatch: tallyItem && 
        tallyItem.rate == billItem.RATE &&
        tallyItem.unit === billItem.UNIT
    };
  });

  const matchedCount = matchedItems.filter(i => i.isMatch).length;
  const exactMatchCount = matchedItems.filter(i => i.isExactMatch).length;
  
  return (
    <div className="border border-gray-200 rounded-lg mb-6 overflow-hidden">
      <div 
        className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            matchedCount === billData.length ? "bg-green-100" : "bg-yellow-100"
          }`}>
            {matchedCount === billData.length ? (
              <CheckCircle className="text-green-600 w-5 h-5" />
            ) : (
              <AlertCircle className="text-yellow-600 w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-800">Stock Item Matching</h3>
            <p className="text-sm text-gray-500">
              {matchedCount} of {billData.length} items matched in Tally
              {matchedCount > 0 && ` (${exactMatchCount} exact matches)`}
            </p>
          </div>
        </div>
        <div className={`transform transition-transform ${expanded ? "rotate-180" : ""}`}>
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {expanded && (
        <div className="p-4 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Rate</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tally Rate</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {matchedItems.map((item, index) => (
                  <tr key={index} className={item.isMatch ? "bg-green-50" : "bg-yellow-50"}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.billItem.Product}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {item.billItem.RATE} ({item.billItem.UNIT})
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {item.tallyItem ? `${item.tallyItem.rate} (${item.tallyItem.unit})` : "Not found"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {item.isMatch ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.isExactMatch 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {item.isExactMatch ? "Exact match" : "Partial match"}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Not matched
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockItemComparison;