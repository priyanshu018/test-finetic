import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from 'xlsx';

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
/* 2️⃣  Helper function to convert month number to name               */
/* ------------------------------------------------------------------ */
const getMonthName = (monthNumber) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[parseInt(monthNumber) - 1] || `Month ${monthNumber}`;
};

/* ------------------------------------------------------------------ */
/* 3️⃣  Filter select component                                       */
/* ------------------------------------------------------------------ */
const FilterSelect = ({ placeholder, value, onChange, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
    {value && (
      <button
        onClick={() => onChange("")}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
        title="Clear filter"
      >
        ×
      </button>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/* 4️⃣  Search Input Component                                        */
/* ------------------------------------------------------------------ */
const SearchInput = ({ value, onChange, placeholder }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
    {value && (
      <button
        onClick={() => onChange("")}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
        title="Clear search"
      >
        ×
      </button>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/* 5️⃣  Excel Export Function                                         */
/* ------------------------------------------------------------------ */
const exportToExcel = (data) => {
  const excelData = [];

  data.forEach(row => {
    row.bills.forEach((bill, idx) => {
      excelData.push({
        'Company': row.company,
        'Date': row.fullDate,
        'Year': row.year,
        'Month': row.month,
        'Day': row.day,
        'Bill Number': idx + 1,
        'Invoice No': bill.invoiceNo || '',
        'Invoice Value': bill.invoiceValue || '',
        'GST': bill.gst || '',
        'Sender Name': bill.senderDetails?.name || '',
        'Sender Address': bill.senderDetails?.address || '',
        'Sender GST': bill.senderDetails?.gst || '',
        'Sender Contact': bill.senderDetails?.contact || '',
        'Receiver Name': bill.receiverDetails?.name || '',
        'Receiver Address': bill.receiverDetails?.address || '',
        'Receiver GST': bill.receiverDetails?.gst || '',
        'Receiver Contact': bill.receiverDetails?.contact || '',
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Bills Data");

  // Auto-size columns
  const maxWidth = excelData.reduce((w, r) => Math.max(w, r.Company?.length || 0), 10);
  worksheet['!cols'] = [
    { wch: maxWidth },
    { wch: 12 },
    { wch: 8 },
    { wch: 12 },
    { wch: 8 },
    { wch: 8 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 25 },
    { wch: 35 },
    { wch: 20 },
    { wch: 15 },
    { wch: 25 },
    { wch: 35 },
    { wch: 20 },
    { wch: 15 },
  ];

  const fileName = `Bills_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/* ------------------------------------------------------------------ */
/* 6️⃣  Bill Management component with table and filters              */
/* ------------------------------------------------------------------ */
export default function BillManagement() {
  const [bills, setBills] = useState({});
  const [firmFilter, setFirmFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomSrc, setZoomSrc] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  /* load once (and whenever the tab regains focus, optional) */
  useEffect(() => {
    const refresh = () => setBills(loadBills());
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  /* ----- flatten bills data for table display ----- */
  const tableData = useMemo(() => {
    const rows = [];

    // Structure: Company -> Year -> Day -> Month -> Bills
    Object.entries(bills).forEach(([company, yearData]) => {
      Object.entries(yearData).forEach(([year, dayData]) => {
        Object.entries(dayData).forEach(([day, monthData]) => {
          Object.entries(monthData).forEach(([month, billsArray]) => {
            const monthName = getMonthName(month);

            rows.push({
              company,
              year,
              day,
              month: monthName,
              monthNumber: month,
              billCount: billsArray.length,
              bills: billsArray,
              id: `${company}-${year}-${day}-${month}`,
              fullDate: `${day}/${month}/${year}`,
            });
          });
        });
      });
    });

    return rows.sort((a, b) => {
      // Sort by year desc, then month desc, then day desc
      if (a.year !== b.year) return b.year - a.year;
      if (a.monthNumber !== b.monthNumber) return b.monthNumber - a.monthNumber;
      return b.day - a.day;
    });
  }, [bills]);

  /* ----- get unique values for filter options ----- */
  const filterOptions = useMemo(() => {
    return {
      companies: [...new Set(tableData.map(row => row.company))],
      years: [...new Set(tableData.map(row => row.year))].sort((a, b) => b - a),
      months: [...new Set(tableData.map(row => row.month))],
      days: [...new Set(tableData.map(row => row.day))].sort((a, b) => parseInt(b) - parseInt(a)),
    };
  }, [tableData]);

  /* ----- filtered and searched data ----- */
  const filteredData = useMemo(() => {
    return tableData.filter(row => {
      // Filter by dropdowns
      const companyMatch = !firmFilter || row.company.toLowerCase().includes(firmFilter.toLowerCase());
      const yearMatch = !yearFilter || row.year.toString().includes(yearFilter);
      const monthMatch = !monthFilter || row.month.toLowerCase().includes(monthFilter.toLowerCase());
      const dayMatch = !dayFilter || row.day.toString().includes(dayFilter);

      // Search functionality
      let searchMatch = true;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        searchMatch = (
          row.company.toLowerCase().includes(query) ||
          row.fullDate.includes(query) ||
          row.bills.some(bill =>
            (bill.invoiceNo && bill.invoiceNo.toLowerCase().includes(query)) ||
            (bill.invoiceValue && bill.invoiceValue.toString().includes(query)) ||
            (bill.gst && bill.gst.toLowerCase().includes(query)) ||
            (bill.senderDetails?.name && bill.senderDetails.name.toLowerCase().includes(query)) ||
            (bill.senderDetails?.address && bill.senderDetails.address.toLowerCase().includes(query)) ||
            (bill.senderDetails?.gst && bill.senderDetails.gst.toLowerCase().includes(query)) ||
            (bill.senderDetails?.contact && bill.senderDetails.contact.toLowerCase().includes(query)) ||
            (bill.receiverDetails?.name && bill.receiverDetails.name.toLowerCase().includes(query)) ||
            (bill.receiverDetails?.address && bill.receiverDetails.address.toLowerCase().includes(query)) ||
            (bill.receiverDetails?.gst && bill.receiverDetails.gst.toLowerCase().includes(query)) ||
            (bill.receiverDetails?.contact && bill.receiverDetails.contact.toLowerCase().includes(query))
          )
        );
      }

      return companyMatch && yearMatch && monthMatch && dayMatch && searchMatch;
    });
  }, [tableData, firmFilter, yearFilter, monthFilter, dayFilter, searchQuery]);

  /* ----- handlers ----- */
  const toggleRowExpansion = (rowId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const clearAllFilters = () => {
    setFirmFilter("");
    setYearFilter("");
    setMonthFilter("");
    setDayFilter("");
    setSearchQuery("");
  };

  const hasActiveFilters = firmFilter || yearFilter || monthFilter || dayFilter || searchQuery;

  /* ----- UI ----- */
  return (
    <div className="min-h-screen text-black bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-full mx-auto p-6">
        {/* back button */}
        <div className="mb-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back
          </button>
        </div>

        {/* main card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Bill Management
              </h1>
              <p className="text-gray-500">
                View and manage all bills across companies, years, months, and dates
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                {filteredData.length} of {tableData.length} records
              </div>
              <button
                onClick={() => exportToExcel(filteredData)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium text-sm"
                disabled={filteredData.length === 0}
              >
                📊 Export to Excel
              </button>
            </div>
          </div>

          {/* search and filters */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-semibold text-gray-900">🔍 Search & Filters</span>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="mb-4">
              <SearchInput
                placeholder="Search bills, invoice numbers, GST, sender/receiver details..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FilterSelect
                placeholder="Filter by Company"
                value={firmFilter}
                onChange={setFirmFilter}
                options={filterOptions.companies}
              />
              <FilterSelect
                placeholder="Filter by Year"
                value={yearFilter}
                onChange={setYearFilter}
                options={filterOptions.years}
              />
              <FilterSelect
                placeholder="Filter by Month"
                value={monthFilter}
                onChange={setMonthFilter}
                options={filterOptions.months}
              />
              <FilterSelect
                placeholder="Filter by Day"
                value={dayFilter}
                onChange={setDayFilter}
                options={filterOptions.days}
              />
            </div>
          </div>

          {/* table */}
          <div className="overflow-hidden border border-gray-200 rounded-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      🏢 Company
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      📅 Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      📊 Bills
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      📤 Sender
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      📥 Receiver
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      💰 Invoice Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      📋 Invoice No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ⚡ Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.length > 0 ? (
                    filteredData.map((row) => (
                      <React.Fragment key={row.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{row.company}</div>
                            <div className="text-xs text-gray-500">{row.year}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{row.fullDate}</div>
                            <div className="text-xs text-gray-500">
                              {row.month} {row.day}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {row.billCount} {row.billCount === 1 ? 'bill' : 'bills'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm max-w-xs">
                              {row.bills.map((bill, idx) => (
                                <div key={idx} className="mb-3 last:mb-0 p-2 bg-gray-50 rounded">
                                  <div className="font-medium text-gray-900 text-xs mb-1">
                                    {bill.senderDetails?.name || 'N/A'}
                                  </div>
                                  <div className="text-xs text-gray-600 mb-1 break-words">
                                    {bill.senderDetails?.address || 'N/A'}
                                  </div>
                                  <div className="text-xs text-blue-600 font-medium mb-1">
                                    GST: {bill.senderDetails?.gst || 'N/A'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    📞 {bill.senderDetails?.contact || 'N/A'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm max-w-xs">
                              {row.bills.map((bill, idx) => (
                                <div key={idx} className="mb-3 last:mb-0 p-2 bg-gray-50 rounded">
                                  <div className="font-medium text-gray-900 text-xs mb-1">
                                    {bill.receiverDetails?.name || 'N/A'}
                                  </div>
                                  <div className="text-xs text-gray-600 mb-1 break-words">
                                    {bill.receiverDetails?.address || 'N/A'}
                                  </div>
                                  <div className="text-xs text-blue-600 font-medium mb-1">
                                    GST: {bill.receiverDetails?.gst || 'N/A'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    📞 {bill.receiverDetails?.contact || 'N/A'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              {row.bills.map((bill, idx) => (
                                <div key={idx} className="mb-1 last:mb-0">
                                  <span className="font-medium text-green-600 text-sm">
                                    ₹{bill.invoiceValue?.toLocaleString() || 'N/A'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              {row.bills.map((bill, idx) => (
                                <div key={idx} className="mb-1 last:mb-0">
                                  <span className="text-sm text-gray-900 font-medium">
                                    {bill.invoiceNo || 'N/A'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => toggleRowExpansion(row.id)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              {expandedRows.has(row.id) ? 'Hide' : 'View'} Images
                            </button>
                          </td>
                        </tr>

                        {expandedRows.has(row.id) && (
                          <tr>
                            <td colSpan={8} className="px-6 py-4 bg-gray-50">
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                  📷 Bill Images for {row.company} - {row.fullDate}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {row.bills.map((bill, idx) => (
                                    <div
                                      key={idx}
                                      className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-all overflow-hidden"
                                    >
                                      <div
                                        className="aspect-square relative cursor-zoom-in"
                                        onClick={() => setZoomSrc(bill.imageUrl)}
                                      >
                                        <img
                                          src={bill.imageUrl}
                                          alt={`Bill ${idx + 1}`}
                                          className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
                                        />
                                        <a
                                          href={bill.imageUrl}
                                          download={`bill-${row.company}-${row.fullDate}-${idx + 1}.jpg`}
                                          title="Download"
                                          className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur hover:bg-black"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          ⬇️
                                        </a>
                                      </div>
                                      <div className="p-3">
                                        <div className="text-xs text-gray-600 mb-1">
                                          Invoice: {bill.invoiceNo} | ₹{bill.invoiceValue?.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-blue-600">
                                          GST: {bill.gst || 'N/A'}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          {hasActiveFilters
                            ? 'No bills match your current search/filters'
                            : 'No bills found'}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* zoom modal */}
      {zoomSrc && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
          onClick={() => setZoomSrc(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={zoomSrc}
              alt="Zoomed bill"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setZoomSrc(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}