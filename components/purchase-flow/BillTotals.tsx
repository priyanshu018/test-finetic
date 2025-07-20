import React from "react";

const BillTotals = ({ gstTotals, netAmountTotal, isWithinState }) => {
  const gstTotalAmount = Object.values(gstTotals).reduce(
    (sum, amount) => sum + amount,
    0
  );
  
  return (
    <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Bill Totals
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-3">
            GST Breakup
          </h4>

          {Object.keys(gstTotals).length === 0 ? (
            <p className="text-gray-500 text-sm">No GST data available</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(gstTotals).map(([rate, amount]) => (
                <div
                  key={rate}
                  className="flex justify-between items-center text-sm"
                >
                  <div className="flex items-center">
                    <span className="font-medium">{rate} GST</span>
                    <span className="text-gray-500 ml-2">
                      {isWithinState ?
                        `CGST: ${parseFloat(rate) / 2}%, SGST: ${parseFloat(rate) / 2}%` :
                        `IGST: ${rate}%`
                      }
                    </span>
                  </div>
                  <span className="font-medium text-black">
                    ₹{amount.toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center">
                <span className="font-medium text-black">
                  Total GST Amount
                </span>
                <span className="font-bold text-black">
                  ₹{gstTotalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-3">
            Bill Summary
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">Taxable Amount</span>
              <span className="font-medium text-black">
                ₹{netAmountTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">Total GST</span>
              <span className="font-medium text-black">
                ₹{gstTotalAmount.toFixed(2)}
              </span>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center">
              <span className="font-medium text-black">Gross Amount Total</span>
              <span className="text-xl font-bold text-blue-700">
                ₹{(netAmountTotal + gstTotalAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillTotals;