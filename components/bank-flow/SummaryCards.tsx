import {
  Download, BookMarked, ArrowDownCircle,
  ArrowUpCircle, DollarSign, FileSpreadsheet,
  TrendingUp, Banknote, AlertCircle,
  Calendar,
  Wallet
} from "lucide-react";

const SummaryCards = ({
  summary,
  businessSubcategory,
  getFilteredSummary,
  dateFilterType,
  exportToExcel,
  exportToCSV,
  exportToTally,
  businessCategory
}) => {
  const displaySummary = dateFilterType !== "all" ? getFilteredSummary() : summary;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Transaction Analysis
            {dateFilterType !== "all" && (
              <span className="text-lg text-blue-600 ml-2">(Filtered)</span>
            )}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Bank statements processed for {businessSubcategory}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center font-medium"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </button>
          <button
            onClick={exportToCSV}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={exportToTally}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center font-medium"
          >
            <BookMarked className="w-4 h-4 mr-2" />
            Export To Tally
          </button>

        </div>
      </div>

      {
        !displaySummary || displaySummary.total_items === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No Data Found
            </h3>
            <p className="text-gray-600 mb-4">
              No transactions available for the selected criteria
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <Wallet className="w-5 h-5 text-purple-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    ₹{displaySummary.opening_balance?.toLocaleString("en-IN") || 0}
                  </span>
                </div>
                <p className="text-purple-600 font-medium text-sm">Opening Balance</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <FileSpreadsheet className="w-5 h-5 text-slate-600" />
                  <span className="text-2xl font-bold text-gray-900">{displaySummary.total_items}</span>
                </div>
                <p className="text-slate-600 font-medium text-sm">Total Items</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <ArrowDownCircle className="w-5 h-5 text-red-600" />
                  <span className="text-2xl font-bold text-gray-900">{displaySummary.debit_transactions}</span>
                </div>
                <p className="text-red-600 font-medium text-sm">Debits</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <ArrowUpCircle className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold text-gray-900">{displaySummary.credit_transactions}</span>
                </div>
                <p className="text-green-600 font-medium text-sm">Credits</p>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <Banknote className="w-5 h-5 text-amber-600" />
                  <span className="text-2xl font-bold text-gray-900">{displaySummary.cash_transactions || 0}</span>
                </div>
                <p className="text-amber-600 font-medium text-sm">Cash</p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span className="text-2xl font-bold text-gray-900">{displaySummary.suspense_items}</span>
                </div>
                <p className="text-orange-600 font-medium text-sm">Suspense</p>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span className="text-2xl font-bold text-gray-900">{displaySummary.high_confidence}</span>
                </div>
                <p className="text-emerald-600 font-medium text-sm">High Confidence</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ArrowDownCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="font-medium text-red-700">Total Debits:</span>
                  </div>
                  <span className="text-xl font-bold text-red-900">
                    ₹{displaySummary.total_debit_amount?.toLocaleString("en-IN") || 0}
                  </span>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ArrowUpCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-700">Total Credits:</span>
                  </div>
                  <span className="text-xl font-bold text-green-900">
                    ₹{displaySummary.total_credit_amount?.toLocaleString("en-IN") || 0}
                  </span>
                </div>
              </div>


              <div className={`p-4 rounded-lg border ${(displaySummary.net_balance || 0) >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className={`w-5 h-5 mr-2 ${(displaySummary.net_balance || 0) >= 0 ? "text-blue-600" : "text-orange-600"}`} />
                    <span className={`font-medium ${(displaySummary.net_balance || 0) >= 0 ? "text-blue-700" : "text-orange-700"}`}>
                      Net Balance:
                    </span>
                  </div>
                  <span className={`text-xl font-bold ${(displaySummary.net_balance_change + displaySummary.opening_balance || 0) >= 0 ? "text-blue-900" : "text-orange-900"}`}>
                    {(displaySummary.net_balance_change + displaySummary.opening_balance || 0) >= 0 ? "+" : "-"}
                    ₹{Math.abs(displaySummary.net_balance_change + displaySummary.opening_balance || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </>
        )
      }
    </div >
  );
};

export default SummaryCards;