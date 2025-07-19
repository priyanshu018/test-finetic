import React from "react";
import { FileText, Database } from "lucide-react";

// Stock Item Comparison Component
const StockItemComparison = ({ billData, tallyData }: any) => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Item Comparison</h1>
          <p className="text-gray-600">Compare extracted bill data with Tally inventory records</p>
        </div>

        {/* Side-by-Side Comparison Table */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Data Comparison</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="3">
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Extracted Bill Data
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="3">
                      <div className="flex items-center justify-center gap-2">
                        <Database className="h-4 w-4 text-orange-600" />
                        Tally Data
                      </div>
                    </th>
                  </tr>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Displaying Bill Data */}
                  {(billData ?? []).map((billItem, index) => {
                    return (
                      <tr key={index} className="hover:bg-opacity-80 transition-colors">
                        {/* Bill Data Columns */}
                        <td className="px-6 py-4 whitespace-nowrap bg-blue-50 border-r border-gray-200">
                          <div className="text-sm font-medium text-gray-900">{billItem.Product}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap bg-blue-50 border-r border-gray-200">
                          <div className="text-sm text-gray-900">{billItem.HSN}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap bg-blue-50 border-r border-gray-200">
                          <div className="text-sm text-gray-900">{billItem.GST}%</div>
                        </td>

                        {/* Tally Data Columns */}
                        <td className="px-6 py-4 whitespace-nowrap bg-orange-50 border-r border-gray-200">
                          <div className="text-sm text-gray-900">
                            {tallyData[index] ? tallyData[index].itemName : 'No Match'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap bg-orange-50 border-r border-gray-200">
                          <div className="text-sm text-gray-900">
                            {tallyData[index] ? tallyData[index].hsnCode : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap bg-orange-50">
                          <div className="text-sm text-gray-900">
                            {tallyData[index] ? tallyData[index].gstRate : '-'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockItemComparison;
