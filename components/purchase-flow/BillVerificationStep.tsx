import React, { useEffect } from "react";
import { FileDigit, Building, Filter, PlusCircle, FileText, Edit, Calendar, ArrowLeft, Trash2, Plus, MoveHorizontal, ChevronRight } from "lucide-react";


import StockItemComparison from "./stockItemComparision";
import BillTotals from "./BillTotals";

const BillVerificationStep = ({
  files,
  billData,
  setBillData,
  currentBillIndex,
  setCurrentBillIndex,
  role,
  isWithinState,
  setIsWithinState,
  netAmountTotal,
  gstTotals,
  setCurrentStep,
  setRowModalIndex,
  setZoomSrc,
  tallyStockItems,
  handleDataChange,
  handleItemChange,
  addItem,
  removeItem,
  handleBillChange,
  handleExportItemsToExcel,
  recalculateBillTotals
}) => {
  // Handle product drag and drop
  const handleProductDragStart = (
    e: React.DragEvent<HTMLTableCellElement>,
    billIndex: number,
    itemIndex: number
  ) => {
    e.dataTransfer.setData("text/plain", itemIndex.toString());
  };

  const handleProductDragOver = (e: React.DragEvent<HTMLTableCellElement>) => {
    e.preventDefault();
  };

  const handleProductDrop = (
    e: React.DragEvent<HTMLTableCellElement>,
    billIndex: number,
    dropIndex: number
  ) => {
    e.preventDefault();
    const draggedIndex = Number(e.dataTransfer.getData("text/plain"));
    if (draggedIndex === dropIndex) return;
    const newData = [...billData];
    const items = newData[billIndex].items;
    const temp = items[draggedIndex].Product;
    items[draggedIndex].Product = items[dropIndex].Product;
    items[dropIndex].Product = temp;
    newData[billIndex].items = items;
    setBillData(newData);
  };

  const currentBill = billData[currentBillIndex] || {};
  
  useEffect(() => {
    if (billData.length > 0 && billData[currentBillIndex]?.items?.length > 0) {
      recalculateBillTotals(currentBillIndex);
      
      const billGstNumber = role === "Purchaser"
        ? billData[currentBillIndex]?.senderDetails?.gst
        : billData[currentBillIndex]?.receiverDetails?.gst;

      setIsWithinState(findIsWithinState("gstNumber", billGstNumber));
    }
  }, [currentBillIndex, billData]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 shadow-lg rounded-xl mb-6">
        <div className="flex gap-6">
          <div className="w-1/2">
            <div className="bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center" style={{ height: "30rem" }}>
              {files[currentBillIndex]?.dataUrl?.includes("image/") ? (
                <div className="w-full h-full">
                  <img 
                    src={files[currentBillIndex].dataUrl} 
                    alt={`Bill ${currentBillIndex + 1}`} 
                    className="w-full h-full object-contain"
                    onClick={() => setZoomSrc(files[currentBillIndex].dataUrl)}
                  />
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4" />
                  <p>PDF Preview Not Available</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => handleBillChange(Math.max(0, currentBillIndex - 1))}
                disabled={currentBillIndex === 0}
                className={`flex items-center justify-center p-2 rounded-full ${
                  currentBillIndex === 0
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                } transition-colors`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                {files.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleBillChange(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      currentBillIndex === idx
                        ? "bg-blue-600 w-6"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Go to bill ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => {
                  if (currentBillIndex === files.length - 1) setCurrentStep(3);
                  else handleBillChange(currentBillIndex + 1);
                }}
                className="flex items-center justify-center p-2 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="w-1/2">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileDigit className="w-5 h-5" />
                Bill Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={currentBill.invoiceNumber || ""}
                    onChange={(e) => handleDataChange("invoiceNumber", e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white hover:bg-gray-50 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Bill Date
                  </label>
                  <input
                    type="text"
                    value={currentBill.billDate || ""}
                    onChange={(e) => handleDataChange("billDate", e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white hover:bg-gray-50 focus:bg-white"
                    placeholder="DD/MM/YYYY"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-6">
                <section>
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                    <Building className="w-5 h-5" />
                    Sender Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Sender Name
                      </label>
                      <input
                        type="text"
                        value={currentBill.senderDetails?.name || ""}
                        onChange={(e) => handleDataChange("senderDetails", {
                          ...currentBill.senderDetails,
                          name: e.target.value,
                        })}
                        className="block w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white hover:bg-gray-50 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Sender GST
                      </label>
                      <input
                        type="text"
                        value={currentBill.senderDetails?.gst || ""}
                        onChange={(e) => handleDataChange("senderDetails", {
                          ...currentBill.senderDetails,
                          gst: e.target.value,
                        })}
                        className="block w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white hover:bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                    <Building className="w-5 h-5" />
                    Receiver Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Receiver Name
                      </label>
                      <input
                        type="text"
                        value={currentBill.receiverDetails?.name || ""}
                        onChange={(e) => handleDataChange("receiverDetails", {
                          ...currentBill.receiverDetails,
                          name: e.target.value,
                        })}
                        className="block w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white hover:bg-gray-50 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Receiver GST
                      </label>
                      <input
                        type="text"
                        value={currentBill.receiverDetails?.gst || ""}
                        onChange={(e) => handleDataChange("receiverDetails", {
                          ...currentBill.receiverDetails,
                          gst: e.target.value,
                        })}
                        className="block w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white hover:bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Item Details
          </h3>

          <div className='flex items-center gap-2'>
            <button
              onClick={() => addItem(currentBillIndex)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Add Item
            </button>
            <button
              onClick={handleExportItemsToExcel}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              <FileText className="w-4 h-4 mr-1.5" />
              Export to Excel
            </button>
          </div>
        </div>

        <StockItemComparison
          billData={billData[currentBillIndex]?.items || []} 
          tallyData={tallyStockItems} 
        />

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Product",
                  "QTY",
                  "HSN",
                  "MRP",
                  "RATE",
                  "DIS",
                  ...(isWithinState ? ["SGST", "CGST"] : ["IGST"]),
                  "G AMT",
                  "Actions",
                ].map((head) => (
                  <th
                    key={head}
                    className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentBill.items?.map((item: any, idx: number) => (
                <React.Fragment key={idx}>
                  <tr className={`transition-colors mt-10 ${item.QTY == 0 || item.RATE == 0 ? "bg-red-300" : ""}`}>
                    <td
                      className="px-3 py-2.5 w-72 relative"
                      draggable
                      onDragStart={(e) => handleProductDragStart(e, currentBillIndex, idx)}
                      onDragOver={handleProductDragOver}
                      onDrop={(e) => handleProductDrop(e, currentBillIndex, idx)}
                    >
                      <div className="flex items-center group">
                        <MoveHorizontal className="w-4 h-4 text-gray-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                        <input
                          type="text"
                          value={item.Product || ""}
                          onChange={(e) => handleItemChange(currentBillIndex, idx, "Product", e.target.value)}
                          className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 w-20">
                      <input
                        type="text"
                        value={item.QTY || ""}
                        onChange={(e) => handleItemChange(currentBillIndex, idx, "QTY", e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2 w-28">
                      <input
                        type="text"
                        value={item.HSN || ""}
                        onChange={(e) => handleItemChange(currentBillIndex, idx, "HSN", e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2 w-28">
                      <input
                        type="number"
                        value={item.MRP || ""}
                        onChange={(e) => handleItemChange(currentBillIndex, idx, "MRP", e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2 w-28">
                      <input
                        type="number"
                        value={item.RATE || ""}
                        onChange={(e) => handleItemChange(currentBillIndex, idx, "RATE", e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2 w-24">
                      <input
                        type="text"
                        value={item.DIS || ""}
                        onChange={(e) => handleItemChange(currentBillIndex, idx, "DIS", e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    {isWithinState ? (
                      <>
                        <td className="px-3 py-2 w-16">
                          <input
                            type="text"
                            value={item.SGST || ""}
                            onChange={(e) => handleItemChange(currentBillIndex, idx, "SGST", e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2 w-16">
                          <input
                            type="text"
                            value={item.CGST || ""}
                            onChange={(e) => handleItemChange(currentBillIndex, idx, "CGST", e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                      </>
                    ) : (
                      <td className="px-3 py-2 w-32">
                        <input
                          type="text"
                          value={item.IGST || ""}
                          onChange={(e) => handleItemChange(currentBillIndex, idx, "IGST", e.target.value)}
                          className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    <td className="px-3 py-2 w-28">
                      <p className="w-full rounded-md p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {item["G AMT"]}
                      </p>
                    </td>
                    <td className="px-3 py-2 w-10">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => removeItem(currentBillIndex, idx)}
                          className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr className="pb-10">
                    <td
                      className={`px-3 py-2.5 text-center border-b-8 border-gray-300 ${item.QTY == 0 || item.RATE == 0 ? "bg-red-300" : ""}`}
                      colSpan={11}
                    >
                      <div className="gap-2 mx-auto w-[fit-content]">
                        {currentBill.invoice_items_cropped_images?.cell_images
                          ?.filter(
                            (_, index) => index === 0 || index === idx + 1 || index === idx + 2
                          )
                          ?.map((row: any, rowIndex: number) => (
                            <div key={rowIndex} className="flex flex-wrap gap-2">
                              {row?.map(
                                (img: string, colIndex: number) =>
                                  img ? (
                                    <img
                                      key={colIndex}
                                      src={img}
                                      alt={`Invoice cell ${rowIndex}-${colIndex}`}
                                      onClick={() => setZoomSrc(img)}
                                      className="w-[90px] h-[30px] object-contain border-2 rounded cursor-zoom-in hover:border-blue-500 transition-colors"
                                    />
                                  ) : (
                                    <div
                                      key={colIndex}
                                      className="w-[100px] h-[100px] border flex items-center justify-center text-xs text-gray-500"
                                    >
                                      No Image
                                    </div>
                                  )
                              )}
                            </div>
                          ))}
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}

              {(!currentBill.items || currentBill.items.length === 0) && (
                <tr>
                  <td colSpan={12} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-12 h-12 text-gray-300 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <p className="mb-2">No items found in this bill</p>
                      <button
                        onClick={() => addItem(currentBillIndex)}
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add an item
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BillTotals
        gstTotals={gstTotals}
        netAmountTotal={netAmountTotal}
        isWithinState={isWithinState}
      />

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Financial Summary
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Total Amount
            </label>
            <input
              type="number"
              value={currentBill.totalAmount || ""}
              onChange={(e) => handleDataChange("totalAmount", e.target.value)}
              className="block w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white hover:bg-gray-50 focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Grand Total
            </label>
            <input
              type="text"
              value={currentBill.grandTotal || ""}
              onChange={(e) => handleDataChange("grandTotal", e.target.value)}
              className="block w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white hover:bg-gray-50 focus:bg-white font-medium"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={() => setCurrentStep(1)}
          className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Files
        </button>

        <button
          onClick={() => {
            if (currentBillIndex === files.length - 1) {
              setCurrentStep(3);
            } else {
              handleBillChange(currentBillIndex + 1);
            }
          }}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md"
        >
          {currentBillIndex === files.length - 1
            ? "Proceed to Confirm"
            : "Next Bill"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Helper function for GST state comparison
const findIsWithinState = (ourGST: string, theirGST: string) => {
  if (!ourGST || !theirGST) return true;
  return ourGST.substring(0, 2) === theirGST.substring(0, 2);
};

export default BillVerificationStep;