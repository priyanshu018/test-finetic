import React, { useState } from "react";
import { ChevronLeft, CalendarDays, Building2, Calendar } from "lucide-react";

const FIRMS_BILL_DATA = [
  {
    firmName: "Firm A",
    calendar: {
      January: {
        1: [
          { imageUrl: "https://plus.unsplash.com/premium_photo-1678139620956-cbd87b6ba3d0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YmlsbHxlbnwwfHwwfHx8MA%3D%3D" },
          { imageUrl: "https://plus.unsplash.com/premium_photo-1678139487832-4a3a578574cb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDJ8fHxlbnwwfHx8fHw%3D" },
        ],
        2: [{ imageUrl: "https://plus.unsplash.com/premium_photo-1678139620956-cbd87b6ba3d0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDN8fHxlbnwwfHx8fHw%3D" }],
      },
      February: {
        12: [{ imageUrl: "https://plus.unsplash.com/premium_photo-1678142526549-d9afa163b9d8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDIyfHx8ZW58MHx8fHx8" }],
      },
    },
  },
  {
    firmName: "Firm B",
    calendar: {
      January: {
        10: [{ imageUrl: "https://plus.unsplash.com/premium_photo-1678139620956-cbd87b6ba3d0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YmlsbHxlbnwwfHwwfHx8MA%3D%3D" }],
      },
      March: {
        5: [
          { imageUrl: "https://plus.unsplash.com/premium_photo-1678139487832-4a3a578574cb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDJ8fHxlbnwwfHx8fHw%3D" },
          { imageUrl: "https://plus.unsplash.com/premium_photo-1678139620956-cbd87b6ba3d0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDN8fHxlbnwwfHx8fHw%3D" },
        ],
      },
    },
  },
];

const SelectInput = ({ icon: Icon, label, value, onChange, options, placeholder }) => (
  <div className="relative">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <select
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <ChevronLeft className="h-4 w-4 rotate-270" />
      </div>
    </div>
  </div>
);

export default function BillManagement() {
  const [selectedFirm, setSelectedFirm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const firmObj = FIRMS_BILL_DATA.find(firm => firm.firmName === selectedFirm);
  const months = firmObj ? Object.keys(firmObj.calendar) : [];
  const dates = firmObj && selectedMonth ? Object.keys(firmObj.calendar[selectedMonth] || {}) : [];
  const billImages = firmObj && selectedMonth && selectedDate ? firmObj.calendar[selectedMonth]?.[selectedDate] || [] : [];

  const handleFirmChange = (e) => {
    setSelectedFirm(e.target.value);
    setSelectedMonth("");
    setSelectedDate("");
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    setSelectedDate("");
  };

  return (
    <div className="min-h-screen text-black bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <button onClick={() => window.history.back()} className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bill Management</h1>
          <p className="text-gray-500 mb-8">Select firm, month, and date to view corresponding bills</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SelectInput
              icon={Building2}
              label="Select Firm"
              value={selectedFirm}
              onChange={handleFirmChange}
              options={FIRMS_BILL_DATA.map(firm => firm.firmName)}
              placeholder="Choose a firm"
            />
            
            {selectedFirm && (
              <SelectInput
                icon={Calendar}
                label="Select Month"
                value={selectedMonth}
                onChange={handleMonthChange}
                options={months}
                placeholder="Choose a month"
              />
            )}
            
            {selectedMonth && (
              <SelectInput
                icon={CalendarDays}
                label="Select Date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                options={dates}
                placeholder="Choose a date"
              />
            )}
          </div>

          {selectedMonth && selectedDate && (
            <div className="bg-gray-50 rounded-xl p-6">
              {billImages.length > 0 ? (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Bills for {selectedFirm} - {selectedMonth} {selectedDate}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {billImages.map((bill, idx) => (
                      <div
                        key={idx}
                        className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
                      >
                        <div className="aspect-square relative">
                          <img
                            src={bill.imageUrl}
                            alt={`Bill ${idx + 1}`}
                            className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No bills found for this date</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}