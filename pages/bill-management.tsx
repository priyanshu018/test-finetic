"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  Search,
  Building2,
  Calendar,
  CalendarDays,
  Download,
  Eye,
  Filter,
  X,
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
/* 2️⃣  Filter select component                                       */
/* ------------------------------------------------------------------ */
const FilterSelect = ({ icon: Icon, placeholder, value, onChange, options }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-10 pr-8 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
      <ChevronLeft className="h-4 w-4 rotate-270" />
    </div>
    {value && (
      <button
        onClick={() => onChange("")}
        className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded pointer-events-auto"
        title="Clear filter"
      >
        <X className="h-3 w-3 text-gray-400" />
      </button>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/* 3️⃣  Bill Management component with table and filters              */
/* ------------------------------------------------------------------ */
export default function BillManagement() {
  const [bills, setBills] = useState({});
  const [firmFilter, setFirmFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
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
    Object.entries(bills).forEach(([firm, firmData]) => {
      Object.entries(firmData).forEach(([month, monthData]) => {
        Object.entries(monthData).forEach(([date, billImages]) => {
          // Extract day number from date (assuming date format like "2024-01-15" or "15")
          const dayNumber = date.includes('-') ? date.split('-').pop() : date;
          rows.push({
            firm,
            month,
            date,
            day: dayNumber,
            billCount: billImages.length,
            bills: billImages,
            id: `${firm}-${month}-${date}`,
          });
        });
      });
    });
    return rows;
  }, [bills]);

  /* ----- get unique values for filter options ----- */
  const filterOptions = useMemo(() => {
    return {
      firms: [...new Set(tableData.map(row => row.firm))],
      months: [...new Set(tableData.map(row => row.month))],
      days: [...new Set(tableData.map(row => row.day))].sort((a, b) => parseInt(a) - parseInt(b)),
    };
  }, [tableData]);

  /* ----- filtered data ----- */
  const filteredData = useMemo(() => {
    return tableData.filter(row => {
      const firmMatch = !firmFilter || row.firm.toLowerCase().includes(firmFilter.toLowerCase());
      const monthMatch = !monthFilter || row.month.toLowerCase().includes(monthFilter.toLowerCase());
      const dayMatch = !dayFilter || row.day.toString().includes(dayFilter);
      return firmMatch && monthMatch && dayMatch;
    });
  }, [tableData, firmFilter, monthFilter, dayFilter]);

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
    setMonthFilter("");
    setDayFilter("");
  };

  const hasActiveFilters = firmFilter || monthFilter || dayFilter;

  /* ----- UI ----- */
  return (
    <div className="min-h-screen text-black bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
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

        {/* main card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Bill Management
              </h1>
              <p className="text-gray-500">
                View and manage all bills across firms, months, and dates
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {filteredData.length} of {tableData.length} records
            </div>
          </div>

          {/* filters */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FilterSelect
                icon={Building2}
                placeholder="Filter by Firm"
                value={firmFilter}
                onChange={setFirmFilter}
                options={filterOptions.firms}
              />
              <FilterSelect
                icon={Calendar}
                placeholder="Filter by Month"
                value={monthFilter}
                onChange={setMonthFilter}
                options={filterOptions.months}
              />
              <FilterSelect
                icon={CalendarDays}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Firm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Month
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Day
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bills Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.length > 0 ? (
                    filteredData.map((row) => (
                      <React.Fragment key={row.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900">
                                {row.firm}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.month}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.day}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {row.billCount} {row.billCount === 1 ? 'bill' : 'bills'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => toggleRowExpansion(row.id)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {expandedRows.has(row.id) ? 'Hide' : 'View'} Bills
                            </button>
                          </td>
                        </tr>
                        
                        {/* expanded row with bill images */}
                        {expandedRows.has(row.id) && (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 bg-gray-50">
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
                                      
                                      {/* download btn */}
                                      <a
                                        href={bill.imageUrl}
                                        download={`bill-${row.firm}-${row.month}-${row.date}-${idx + 1}.jpg`}
                                        title="Download"
                                        className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur hover:bg-black"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Download className="w-3 h-3" />
                                      </a>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          {hasActiveFilters ? 
                            "No bills match your current filters" : 
                            "No bills found"
                          }
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
          className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center"
          onClick={() => setZoomSrc(null)}
        >
          <img
            src={zoomSrc}
            alt="Zoomed bill"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}