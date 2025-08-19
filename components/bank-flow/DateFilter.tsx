"use client"
import { Calendar, CalendarDays, Filter, X } from "lucide-react";
import React from "react";

const DateFilter = ({
  result,
  dateFilterType,
  setDateFilterType,
  selectedDate,
  setSelectedDate,
  selectedMonth,
  setSelectedMonth,
  dateRangeStart,
  setDateRangeStart,
  dateRangeEnd,
  setDateRangeEnd,
  clearDateFilters,
  getAvailableMonths,
  formatMonthDisplay,
  getFilteredResults,
}) => {
  // Helper function to extract and format date from result
  const extractDateDetails = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate(); // Get Day
    const month = date.getMonth() + 1; // Get Month (0-based index, so adding 1)
    const year = date.getFullYear(); // Get Year
    return { day, month, year, formattedDate: `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}` };
  };

  // Extract the date from the first result, or default to a placeholder if empty
  const { formattedDate } = extractDateDetails(result[0]?.date || "2025-01-01");

  // Set default values for date range based on result data (first transaction's date)
  const { formattedDate: startDate } = extractDateDetails(result[0]?.date || "2025-01-01");
  const { formattedDate: endDate } = extractDateDetails(result[result.length - 1]?.date || "2025-01-01");

  // Use these default values in the Date Range fields
  React.useEffect(() => {
    setDateRangeStart(startDate);
    setDateRangeEnd(endDate);
  }, [startDate, endDate]);

  // Update selected date based on result data
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className="w-6 h-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Date & Time Filter</h3>
        </div>
        {dateFilterType !== "all" && (
          <button
            onClick={clearDateFilters}
            className="text-red-600 hover:text-red-800 flex items-center text-sm"
          >
            <X className="w-4 h-4 mr-1" />
            Clear Filters
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => setDateFilterType("all")}
          className={`p-4 rounded-lg border-2 transition-all ${dateFilterType === "all"
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 text-gray-400 hover:border-gray-300"
            }`}
        >
          <CalendarDays className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm font-medium">All Dates</p>
          <p className="text-xs text-gray-500">Show everything</p>
        </button>
        <button
          onClick={() => setDateFilterType("specific-date")}
          className={`p-4 rounded-lg border-2 transition-all ${dateFilterType === "specific-date"
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 text-gray-400 hover:border-gray-300"
            }`}
        >
          <Calendar className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm font-medium">Specific Date</p>
          <p className="text-xs text-gray-500">Single day</p>
        </button>
        <button
          onClick={() => setDateFilterType("specific-month")}
          className={`p-4 rounded-lg border-2 transition-all ${dateFilterType === "specific-month"
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 text-gray-400 hover:border-gray-300"
            }`}
        >
          <CalendarDays className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm font-medium">Specific Month</p>
          <p className="text-xs text-gray-500">Full month</p>
        </button>
        <button
          onClick={() => setDateFilterType("date-range")}
          className={`p-4 rounded-lg border-2 transition-all ${dateFilterType === "date-range"
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 text-gray-400 hover:border-gray-300"
            }`}
        >
          <Filter className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm font-medium">Date Range</p>
          <p className="text-xs text-gray-500">Custom range</p>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dateFilterType === "specific-date" && (
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate || formattedDate} // Set default value from result if not selected
              onChange={handleDateChange}
              className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
        {dateFilterType === "specific-month" && (
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a month...</option>
              {getAvailableMonths().map((month) => (
                <option key={month} value={month}>
                  {formatMonthDisplay(month)}
                </option>
              ))}
            </select>
          </div>
        )}
        {dateFilterType === "date-range" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        )}
      </div>
      {dateFilterType !== "all" && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">
                Filter Active:
                {dateFilterType === "specific-date" && selectedDate && ` ${selectedDate}`}
                {dateFilterType === "specific-month" && selectedMonth && ` ${formatMonthDisplay(selectedMonth)}`}
                {dateFilterType === "date-range" && dateRangeStart && dateRangeEnd && ` ${dateRangeStart} to ${dateRangeEnd}`}
              </span>
            </div>
            <span className="text-sm text-blue-600">
              {getFilteredResults().length} transactions
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateFilter;
