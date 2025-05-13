
// "use client"

// import React, { useState, useEffect } from "react";
// import { ChevronLeft, CalendarDays, Building2, Calendar } from "lucide-react";

// /* ------------------------------------------------------------------ */
// /* 1️⃣  pull the whole store from localStorage once on mount          */
// /* ------------------------------------------------------------------ */
// function loadBills() {
//   if (typeof window === "undefined") return {};
//   try {
//     return JSON.parse(localStorage.getItem("BILLS") || "{}");
//   } catch {
//     return {};
//   }
// }

// /* ------------------------------------------------------------------ */
// /*  tiny select helper stays the same                                */
// /* ------------------------------------------------------------------ */
// const SelectInput = ({ icon: Icon, label, value, onChange, options, placeholder }) => (
//   <div className="relative">
//     <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
//     <div className="relative">
//       <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
//       <select
//         value={value}
//         onChange={onChange}
//         className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
//       >
//         <option value="">{placeholder}</option>
//         {options.map((opt) => (
//           <option key={opt} value={opt}>
//             {opt}
//           </option>
//         ))}
//       </select>
//       <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
//         <ChevronLeft className="h-4 w-4 rotate-270" />
//       </div>
//     </div>
//   </div>
// );

// /* ------------------------------------------------------------------ */
// /* 2️⃣  BillManagement component                                      */
// /* ------------------------------------------------------------------ */
// export default function BillManagement() {
//   const [bills, setBills] = useState<Record<string, any>>({});
//   const [selectedFirm, setSelectedFirm] = useState("");
//   const [selectedMonth, setSelectedMonth] = useState("");
//   const [selectedDate, setSelectedDate] = useState("");

//   /* load once (and whenever the tab regains focus, optional) */
//   useEffect(() => {
//     const refresh = () => setBills(loadBills());
//     refresh();
//     window.addEventListener("focus", refresh);
//     return () => window.removeEventListener("focus", refresh);
//   }, []);

//   /* ----- derive selections ----- */
//   const firmCalendar = bills[selectedFirm] || {};
//   const months       = Object.keys(firmCalendar);
//   const dates        = selectedMonth ? Object.keys(firmCalendar[selectedMonth] || {}) : [];
//   const billImages   =
//     selectedMonth && selectedDate
//       ? firmCalendar[selectedMonth]?.[selectedDate] || []
//       : [];

//   /* ----- handlers ----- */
//   const handleFirmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedFirm(e.target.value);
//     setSelectedMonth("");
//     setSelectedDate("");
//   };

//   const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedMonth(e.target.value);
//     setSelectedDate("");
//   };

//   /* ----- UI ----- */
//   return (
//     <div className="min-h-screen text-black bg-gradient-to-br from-blue-50 to-indigo-50">
//       <div className="max-w-6xl mx-auto p-6">
//         <div className="mb-8">
//           <button
//             onClick={() => window.history.back()}
//             className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
//           >
//             <ChevronLeft className="h-4 w-4 mr-1" />
//             Back
//           </button>
//         </div>

//         <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">Bill Management</h1>
//           <p className="text-gray-500 mb-8">
//             Select firm, month, and date to view corresponding bills
//           </p>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//             <SelectInput
//               icon={Building2}
//               label="Select Firm"
//               value={selectedFirm}
//               onChange={handleFirmChange}
//               options={Object.keys(bills)}
//               placeholder="Choose a firm"
//             />

//             {selectedFirm && (
//               <SelectInput
//                 icon={Calendar}
//                 label="Select Month"
//                 value={selectedMonth}
//                 onChange={handleMonthChange}
//                 options={months}
//                 placeholder="Choose a month"
//               />
//             )}

//             {selectedMonth && (
//               <SelectInput
//                 icon={CalendarDays}
//                 label="Select Date"
//                 value={selectedDate}
//                 onChange={(e) => setSelectedDate(e.target.value)}
//                 options={dates}
//                 placeholder="Choose a date"
//               />
//             )}
//           </div>

//           {selectedMonth && selectedDate && (
//             <div className="bg-gray-50 rounded-xl p-6">
//               {billImages.length > 0 ? (
//                 <>
//                   <h2 className="text-xl font-semibold text-gray-900 mb-6">
//                     Bills for {selectedFirm} – {selectedMonth} {selectedDate}
//                   </h2>
//                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//                     {billImages.map((bill: any, idx: number) => (
//                       <div
//                         key={idx}
//                         className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
//                       >
//                         <div className="aspect-square relative">
//                           <img
//                             src={bill.imageUrl}
//                             alt={`Bill ${idx + 1}`}
//                             className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
//                           />
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </>
//               ) : (
//                 <div className="text-center py-12">
//                   <p className="text-gray-500">No bills found for this date</p>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }



"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  CalendarDays,
  Building2,
  Calendar,
  Download as DownloadIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* 1️⃣  pull the whole store from localStorage once on mount          */
/* ------------------------------------------------------------------ */
function loadBills() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("BILLS") || "{}");
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------------ */
/*  tiny select helper                                                */
/* ------------------------------------------------------------------ */
const SelectInput = ({
  icon: Icon,
  label,
  value,
  onChange,
  options,
  placeholder,
}) => (
  <div className="relative">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <select
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <ChevronLeft className="h-4 w-4 rotate-270" />
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* 2️⃣  BillManagement component                                      */
/* ------------------------------------------------------------------ */
export default function BillManagement() {
  const [bills, setBills] = useState<Record<string, any>>({});
  const [selectedFirm, setSelectedFirm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  /* load once (and whenever the tab regains focus, optional) */
  useEffect(() => {
    const refresh = () => setBills(loadBills());
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  /* ----- derive selections ----- */
  const firmCalendar = bills[selectedFirm] || {};
  const months = Object.keys(firmCalendar);
  const dates = selectedMonth
    ? Object.keys(firmCalendar[selectedMonth] || {})
    : [];
  const billImages =
    selectedMonth && selectedDate
      ? firmCalendar[selectedMonth]?.[selectedDate] || []
      : [];

  /* ----- handlers ----- */
  const handleFirmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFirm(e.target.value);
    setSelectedMonth("");
    setSelectedDate("");
  };
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value);
    setSelectedDate("");
  };

  /* ----- UI ----- */
  return (
    <div className="min-h-screen text-black bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* back button */}
        <div className="mb-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </button>
        </div>

        {/* card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bill Management
          </h1>
          <p className="text-gray-500 mb-8">
            Select firm, month, and date to view corresponding bills
          </p>

          {/* selects */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SelectInput
              icon={Building2}
              label="Select Firm"
              value={selectedFirm}
              onChange={handleFirmChange}
              options={Object.keys(bills)}
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

          {/* gallery */}
          {selectedMonth && selectedDate && (
            <div className="bg-gray-50 rounded-xl p-6">
              {billImages.length > 0 ? (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Bills for {selectedFirm} – {selectedMonth} {selectedDate}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {billImages.map((bill: any, idx: number) => (
                      <div
                        key={idx}
                        className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-all overflow-hidden"
                      >
                        {/* image */}
                        <div className="aspect-square relative">
                          <img
                            src={bill.imageUrl}
                            alt={`Bill ${idx + 1}`}
                            className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
                          />

                          {/* download btn */}
                          <a
                            href={bill.imageUrl}
                            download={`bill-${selectedFirm}-${selectedMonth}-${selectedDate}-${idx + 1}.jpg`}
                            title="Download"
                            className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white opacity-0
                                       group-hover:opacity-100 transition-opacity backdrop-blur hover:bg-black"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DownloadIcon className="w-4 h-4" />
                          </a>
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
