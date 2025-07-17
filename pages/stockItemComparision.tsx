import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, FileText, Database } from "lucide-react";

// Sample data for testing
const sampleBillData = [
  {
    "Product": "Apples",
    "QTY": 24,
    "FREE": 0,
    "HSN": "01050000",
    "MRP": 0,
    "RATE": 100,
    "DIS": 0,
    "GST": "12",
    "G AMT": 2688,
    "SGST": "0.00",
    "CGST": "0.00",
    "IGST": "12.00",
    "NET AMT": 2400,
    "UNIT": "Piece"
  },
  {
    "Product": "Coffee",
    "QTY": 5,
    "FREE": 0,
    "HSN": "84190000",
    "MRP": 0,
    "RATE": 150,
    "DIS": 0,
    "GST": "28",
    "G AMT": 960,
    "SGST": "0.00",
    "CGST": "0.00",
    "IGST": "28.00",
    "NET AMT": 750,
    "UNIT": "Piece"
  },
  {
    "Product": "Dried grapes (Raisins)",
    "QTY": 10,
    "FREE": 0,
    "HSN": "05062010",
    "MRP": 0,
    "RATE": 300,
    "DIS": 0,
    "GST": "5",
    "G AMT": 3150,
    "SGST": "0.00",
    "CGST": "0.00",
    "IGST": "5.00",
    "NET AMT": 3000,
    "UNIT": "Piece"
  },
  {
    "Product": "Vanilla Powder",
    "QTY": 20,
    "FREE": 0,
    "HSN": "02050020",
    "MRP": 0,
    "RATE": 300,
    "DIS": 0,
    "GST": "5",
    "G AMT": 6300,
    "SGST": "0.00",
    "CGST": "0.00",
    "IGST": "5.00",
    "NET AMT": 6000,
    "UNIT": "Piece"
  }
];

const sampleTallyData = [
  {
    "itemName": "Apples",
    "gstRate": "0 %",
    "hsnCode": "0"
  },
  {
    "itemName": "Coffee",
    "gstRate": "15 %",
    "hsnCode": "01050000"
  },
  {
    "itemName": "Dried grapes (Raisins)",
    "gstRate": "0 %",
    "hsnCode": "0"
  },
  {
    "itemName": "Vanilla Powder",
    "gstRate": "0 %",
    "hsnCode": "84190000"
  }
];

const StockItemComparison = ({ billData = sampleBillData, tallyData = sampleTallyData }) => {
  const [comparisonResult, setComparisonResult] = useState([]);
  const [stats, setStats] = useState({
    totalBillItems: 0,
    matchedItems: 0,
    mismatchedItems: 0,
    unmatchedTallyItems: 0
  });

  useEffect(() => {
    const compareStockItems = () => {
      // Helper function to normalize GST values
      const normalizeGST = (gstValue) => {
        if (typeof gstValue === 'string') {
          return gstValue.replace(/[%\s]/g, '');
        }
        return String(gstValue);
      };

      // Helper function to normalize HSN codes
      const normalizeHSN = (hsnCode) => {
        if (!hsnCode || hsnCode === '0' || hsnCode === 0) return null;
        return String(hsnCode);
      };

      const result = billData.map((billItem) => {
        const matchingItem = tallyData.find(
          (tallyItem) => tallyItem.itemName === billItem.Product
        );

        if (matchingItem) {
          // Compare GST and HSN codes with proper normalization
          const billGST = normalizeGST(billItem.GST);
          const tallyGST = normalizeGST(matchingItem.gstRate);
          const billHSN = normalizeHSN(billItem.HSN);
          const tallyHSN = normalizeHSN(matchingItem.hsnCode);

          const gstRateMatch = billGST === tallyGST;
          const hsnCodeMatch = billHSN === tallyHSN;

          return {
            ...billItem,
            tallyItemName: matchingItem.itemName,
            gstRateMatch,
            hsnCodeMatch,
            gstRate: matchingItem.gstRate,
            hsnCode: matchingItem.hsnCode,
            matched: gstRateMatch && hsnCodeMatch,
            source: "Extracted Bill Data",
          };
        } else {
          return {
            ...billItem,
            tallyItemName: "No Match",
            matched: false,
            source: "Extracted Bill Data",
          };
        }
      });

      // Add Tally Data that don't have matches in bill data
      const tallyResult = tallyData.map((tallyItem) => {
        const matchingBill = billData.find(
          (billItem) => billItem.Product === tallyItem.itemName
        );

        if (!matchingBill) {
          return {
            ...tallyItem,
            source: "Tally Data",
            matched: false,
          };
        }

        return null;
      }).filter(item => item !== null);

      const finalResult = [...result, ...tallyResult];
      setComparisonResult(finalResult);

      // Calculate statistics
      const matchedItems = result.filter(item => item.matched).length;
      const mismatchedItems = result.filter(item => !item.matched && item.tallyItemName !== 'No Match').length;
      const unmatchedTallyItems = tallyResult.length;
      
      setStats({
        totalBillItems: result.length,
        matchedItems,
        mismatchedItems,
        unmatchedTallyItems
      });
    };

    compareStockItems();
  }, [billData, tallyData]);

  const StatusBadge = ({ matched, gstMatch, hsnMatch }) => {
    if (matched) {
      return (
        <div className="flex items-center gap-1 text-green-700">
          <CheckCircle size={16} />
          <span className="text-sm font-medium">Matched</span>
        </div>
      );
    }
    
    if (gstMatch === false || hsnMatch === false) {
      return (
        <div className="flex items-center gap-1 text-yellow-700">
          <AlertCircle size={16} />
          <span className="text-sm font-medium">Partial</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-1 text-red-700">
        <XCircle size={16} />
        <span className="text-sm font-medium">No Match</span>
      </div>
    );
  };

  const MatchIndicator = ({ isMatch }) => (
    <div className={`flex items-center justify-center ${isMatch ? 'text-green-600' : 'text-red-600'}`}>
      {isMatch ? <CheckCircle size={18} /> : <XCircle size={18} />}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Item Comparison</h1>
          <p className="text-gray-600">Compare extracted bill data with Tally inventory records</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBillItems}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Perfect Matches</p>
                <p className="text-2xl font-bold text-green-600">{stats.matchedItems}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mismatched Items</p>
                <p className="text-2xl font-bold text-red-600">{stats.mismatchedItems}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tally Only Items</p>
                <p className="text-2xl font-bold text-orange-600">{stats.unmatchedTallyItems}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </div>
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
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" colSpan="3">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">GST</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comparisonResult
                    .filter(item => item.source === "Extracted Bill Data")
                    .map((item, index) => {
                      const matchingTallyItem = tallyData.find(tally => tally.itemName === item.Product);
                      return (
                        <tr key={index} className={`${item.matched ? 'bg-green-50' : 'bg-red-50'} hover:bg-opacity-80 transition-colors`}>
                          {/* Bill Data Columns */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.Product}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.HSN}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                            <div className="text-sm text-gray-900">{item.GST}%</div>
                          </td>
                          
                          {/* Tally Data Columns */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {matchingTallyItem ? matchingTallyItem.itemName : 'No Match'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {matchingTallyItem ? matchingTallyItem.hsnCode : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {matchingTallyItem ? matchingTallyItem.gstRate : '-'}
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