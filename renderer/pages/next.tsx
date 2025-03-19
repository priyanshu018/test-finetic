"use client"
import React, { useState } from "react";
import Link from "next/link";
import {
  FiSettings,
  FiUsers,
  FiDollarSign
} from "react-icons/fi";


declare global {
  interface Window {
    electronAPI: {
      createItem: (ledgerName: string) => Promise<{ success: boolean; ledgerName?: string; error?: string }>;
    };
  }
}

export default function IndexPage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);


  const handleCreateItem = async () => {
    await window.electron.createItem('item', "test", 3, 112233, 14);
  }

  const handleCreateIgst = async () => {
    await window.electron.createIgstLedger("igstcreating");
  }

  const handleCreateCgst = async () => {
    await window.electron.createCgstLedger('cgstcreating');
  }

  const handleCreateUgst = async () => {
    await window.electron.createCgstLedger('ugstcreating');
  }

  const handleCreatePurchase = async () => {
    await window.electron.createPurchaseEntry('purchase', "02-11-2024");
  }

  const handleCheckLedger = async () => {
   const response = await window.electron.exportLedger('igstcreating');
alert(response.success)
   
  }

  const handleCheckItem = async () => {
    await window.electron.exportItem('item');
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      {/* Animated Blob Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-40 h-40 bg-blue-300 rounded-full mix-blend-multiply opacity-50 blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-green-300 rounded-full mix-blend-multiply opacity-50 blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-purple-300 rounded-full mix-blend-multiply opacity-50 blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Glassmorphic Navigation Bar */}
      <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Software Name */}
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              Finetic AI
            </span>

            {/* Dropdown Button + Menu */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-300"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white shadow-2xl rounded-xl border border-gray-200 overflow-hidden animate-fadeIn">
                  <div className="divide-y divide-gray-100">
                    {/* Profile */}
                    <Link
                      href="/profile"
                      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-all duration-300"
                    >
                      <FiUsers className="w-5  pr-2" />
                      Profile
                    </Link>

                    {/* Settings */}
                    <Link
                      href="/settings"
                      className="flex  items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-all duration-300"
                    >
                      <FiSettings className="w-5  pr-2" />
                      Settings
                    </Link>

                    {/* Billing */}
                    <Link
                      href="/billing"
                      className="flex space-x-4 items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-all duration-300"
                    >
                      <FiDollarSign className="w-5 pr-2" />
                      Billing
                    </Link>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 mt-20 text-center space-y-12">
        {/* Animated Header */}
        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl px-4">
          {/* AI Workflow Card */}
          <Link
            href="/ai-bill"
            className="group relative bg-white/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 hover:border-cyan-300 transition-all duration-500 hover:shadow-xl"
          >
            <div className="space-y-4">
              <div className="inline-block p-4 rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100">
                <svg
                  className="w-12 h-12 text-cyan-600 group-hover:scale-110 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">
                AI Workflow
              </h2>
              <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                Automated bill processing powered by AI
              </p>
            </div>
          </Link>

          {/* Management Card */}
          <Link
            href="/bill-management"
            className="group relative bg-white/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 hover:border-purple-300 transition-all duration-500 hover:shadow-xl"
          >
            <div className="space-y-4">
              <div className="inline-block p-4 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100">
                <svg
                  className="w-12 h-12 text-purple-600 group-hover:scale-110 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-6m3 6v-6m3 6v-6M3 12h18"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">
                Management
              </h2>
              <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                Advanced bill tracking and analytics
              </p>
            </div>
          </Link>

        </div>

        <div className="flex gap-4 justify-center">

          <button onClick={handleCreateIgst} className="p-2 px-4 bg-gray-200 text-black rounded-full">
            create Igst
          </button>

          <button onClick={handleCreateCgst} className="p-2 px-4 bg-gray-200 text-black rounded-full">
            create cgst
          </button>

          <button onClick={handleCreateUgst} className="p-2 px-4 bg-gray-200 text-black rounded-full">
            create ugst
          </button>

          <button onClick={handleCreatePurchase} className="p-2 px-4 bg-gray-200 text-black rounded-full">
           create purchase
          </button>

          <button onClick={handleCreateItem} className="p-2 px-4 bg-gray-200 text-black rounded-full">
           create item
          </button>

          <button onClick={handleCheckLedger} className="p-2 px-4 bg-gray-200 text-black rounded-full">
           check ledger exist
          </button>

          <button onClick={handleCheckItem} className="p-2 px-4 bg-gray-200 text-black rounded-full">
            check item exist
          </button>
        </div>
      </div>
    </div>
  );
}
