"use client"
import React, { useState } from "react";
import Link from "next/link";
import {
  FiSettings,
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiBarChart2,
  FiChevronRight,
  FiClock,
  FiShield
} from "react-icons/fi";

declare global {
  interface Window {
    electron: {
      createItem: (name: string, description: string, quantity: number, code: number, taxRate: number) => Promise<any>;
      createIgstLedger: (name: string) => Promise<any>;
      createCgstLedger: (name: string) => Promise<any>;
      createPurchaseEntry: (
        voucherNumber: number,
        date: string,
        partyName: string,
        type: string,
        items: { name: string, quantity: number, price: number }[],
        includeGst: boolean,
        taxRate: number,
        discount: number,
        roundOff: number
      ) => Promise<any>;
      exportLedger: (name: string) => Promise<{ success: boolean }>;
      exportItem: (name: string) => Promise<any>;
      exportUnit: (unit: { Name: string, conversionRate: number }) => Promise<any>;
    };
  }
}

export default function IndexPage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Keep existing electron functions
  const handleCreateItem = async () => {
    // await window.electron.createItem('item3', "test", 3, 112233, 14);

    await window.electron.createPurchaseEntry("123456", "02-11-2024", "Priyanshu", "Purchase", [
      {
        name: "KEYA ALPURPOSE SEAS BOTTLE",
        quantity: 3,
        price: 103.44,
        sgst: 6,
        cgst: 6,
        igst: 0
      },
      {
        name: "KEYA GARLIC POWDER BOTTLE",
        quantity: 4,
        price: 88.55,
        sgst: 6,
        cgst: 6,
        igst: 0
      },
      {
        name: "KEYA INSPASTA MACNCHESE AMERIC",
        quantity: 3,
        price: 82.5,
        sgst: 0,
        cgst: 0,
        igst: 0
      },
      {
        name: "KEYA LEMON JUICE 250ML",
        quantity: 6,
        price: 29.6,
        sgst: 6,
        cgst: 6,
        igst: 0
      },
      {
        name: "KEYA OREGANO BOTTLE",
        quantity: 5,
        price: 70.72,
        sgst: 6,
        cgst: 6,
        igst: 0
      },
      {
        name: "KEYA RED CHILI FLAKES BOTTLE",
        quantity: 3,
        price: 90.84,
        sgst: 0,
        cgst: 0,
        igst: 0
      },
      {
        name: "KEYA SACHET PIZZA OREGANO",
        quantity: 3,
        price: 78.58,
        sgst: 2.5,
        cgst: 2.5,
        igst: 0
      },
      {
        name: "KEYA SAUCE DARK SOYA",
        quantity: 40,
        price: 7.59,
        sgst: 6,
        cgst: 6,
        igst: 0
      }
    ], false);
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
    await window.electron.createPurchaseEntry(123456, "02-11-2024", "Priyanshu", "Purchase", [
      { name: "Item", quantity: 2, price: 100 }
    ], true, 14, 0, 0);
  }

  const handleCheckLedger = async () => {
    const response = await window.electron.exportLedger('igstcreating');
    alert(response.success);
  }

  const handleExportItems = async () => {

    const items = [
      {
        Product: "VEBA DIP SALSA",
        HSN: "21039030",
        symbol: "GM",
        decimal: 3,
        SGST: 6,
        CGST: 6
      },
      {
        Product: "VEBA BLISS CRAMEL",
        HSN: "21039030",
        symbol: "GM",
        decimal: 3,
        SGST: 6,
        CGST: 6
      },
      {
        Product: "VEBA MAYONNAISE MINT",
        HSN: "21039030",
        symbol: "GM",
        decimal: 3,
        SGST: 6,
        CGST: 6
      },
      {
        Product: "VEBA WHOLE GRAIN MUSTRD",
        HSN: "21039090",
        symbol: "GM",
        decimal: 3,
        SGST: 6,
        CGST: 6
      },
      {
        Product: "VEBA SWEET SAUCES OINION",
        HSN: "21039020",
        symbol: "GM",
        decimal: 3,
        SGST: 6,
        CGST: 6
      },
      {
        Product: "VEBA MAYONNAISE TANDOORI",
        HSN: "21039090",
        symbol: "GM",
        decimal: 3,
        SGST: 6,
        CGST: 6
      },
      {
        Product: "VEBA MAYONNAISE OLIVE OIL",
        HSN: "21039090",
        symbol: "GM",
        decimal: 3,
        SGST: 6,
        CGST: 6
      },
      {
        Product: "VEBA PSTAN PIZZA HRBY TOMATO",
        HSN: "21039090",
        symbol: "GM",
        decimal: 3,
        SGST: 6,
        CGST: 6
      },
      {
        Product: "VEBA THAI-STYLE SWEET CHILLI",
        HSN: "21032000",
        symbol: "KG",
        decimal: 3,
        SGST: 6,
        CGST: 6
      },
      {
        Product: "VEBA PSTA N PIZZA HRBY TOMATO2",
        HSN: "21032000",
        symbol: "GM",
        decimal: 3,
        SGST: 6,
        CGST: 6
      },
      {
        Product: "VEBA PSTA N PIZZA HRBY TOMATO23",
        HSN: "21039090",
        symbol: "GM",
        decimal: 3,
        SGST: 6,
        CGST: 6
      },
      {
        Product: "VEBA SNDWCH SPRD CRT N CUCMBR",
        HSN: "21039030",
        symbol: "GM",
        decimal: 3,
        SGST: 6,
        CGST: 6
      },
      {
        Product: "VESA KETCHUP TOMATO NONGARLIC",
        HSN: "21032000",
        symbol: "KG",
        decimal: 3,
        SGST: 6,
        CGST: 6
      },
      {
        Product: "VEBA KETCHUP TOMATO CHEFS SPL",
        HSN: "21032000",
        symbol: "G",
        decimal: 3,
        SGST: 6,
        CGST: 6
      },
      {
        Product: "VEBA PSTA CHESSY SAUCES ALFRDO",
        HSN: "21032000",
        symbol: "G",
        decimal: 3,
        SGST: 6,
        CGST: 6
      },
      {
        Product: "VEBA HOT SAUCES SRIRCHA CHILLI2",
        HSN: "21039090",
        symbol: "GM",
        decimal: 3,
        SGST: 6,
        CGST: 6
      },
      {
        Product: "VEBA KETCHUP TOMATO NO AD SUGR",
        HSN: "21039030",
        symbol: "GM",
        decimal: 3,
        SGST: 6,
        CGST: 6
      }
    ]
    const response = await window.electron.exportItem(items);
    console.log(response);
  };

  const handleCheckUnit = async () => {

    const units = [
      {
        Name: "GM",
        conversionRate: 3
      },
      {
        Name: "GM",
        conversionRate: 3
      },
      {
        Name: "GM",
        conversionRate: 3
      },
      {
        Name: "GM",
        conversionRate: 3
      },
      {
        Name: "GM",
        conversionRate: 3
      },
      {
        Name: "GM",
        conversionRate: 3
      },
      {
        Name: "G",
        conversionRate: 3
      },
      {
        Name: "GM",
        conversionRate: 3
      },
      {
        Name: "GM",
        conversionRate: 3
      },
      {
        Name: "GM",
        conversionRate: 3
      },
      {
        Name: "GM",
        conversionRate: 3
      },
      {
        Name: "KG",
        conversionRate: 3
      },
      {
        Name: "KG",
        conversionRate: 3
      },
      {
        Name: "G",
        conversionRate: 3
      },
      {
        Name: "GM",
        conversionRate: 3
      },
      {
        Name: "GM",
        conversionRate: 3
      },
      {
        Name: "GM",
        conversionRate: 3
      }
    ]
    const response = await window.electron.exportUnit(units);
    console.log(response, "here is ");
  };

  const handlePurchaseEntry = async () => {
    await window.electron.createPurchaseEntry("123456", "02-11-2024", "Priyanshu", "Purchase",
      [
        // {
        //   name: "VEBA DIP SALSA",
        //   unit: "PCS",
        //   price: 77.9,
        //   quantity: 3
        // },
        {
          name: "VEBA BLISS CRAMEL",
          unit: "GM",
          price: 135,
          quantity: 0
        },
        {
          name: "VEBA MAYONNAISE MINT",
          unit: "PCS",
          price: 156.45,
          quantity: 2
        },
        // {
        //   name: "VEBA WHOLE GRAIN MUSTRD",
        //   unit: "PCS",
        //   price: 142.15,
        //   quantity: 3
        // },
        // {
        //   name: "VEBA SWEET SAUCES OINION",
        //   unit: "PCS",
        //   price: 90.82,
        //   quantity: 3
        // },
        // {
        //   name: "VEBA MAYONNAISE TANDOORI",
        //   unit: "PCS",
        //   price: 135,
        //   quantity: 3
        // },
        // {
        //   name: "VEBA MAYONNAISE OLIVE OIL",
        //   unit: "GM",
        //   price: 32.15,
        //   quantity: 12
        // },
        // {
        //   name: "VEBA SALAD SAUCE TOKYO STYL",
        //   unit: "L",
        //   price: 0,
        //   quantity: 0
        // },
        // {
        //   name: "VEBA PSTAN PIZZA HRBY TOMATO",
        //   unit: "PCS",
        //   price: 120.75,
        //   quantity: 3
        // },
        // {
        //   name: "VEBA PSTA N PIZZA HRBY TOMATO2",
        //   unit: "PCS",
        //   price: 70.75,
        //   quantity: 3
        // },
        // {
        //   name: "VEBA PSTA N PIZZA HRBY TOMATO23",
        //   unit: "PCS",
        //   price: 9215,
        //   quantity: 3
        // },
        // {
        //   name: "VEBA SNDWCH SPRD CRT N CUCMBR",
        //   unit: "PCS",
        //   price: 125,
        //   quantity: 2
        // },
        // {
        //   name: "VESA KETCHUP TOMATO NONGARLIC",
        //   unit: "PCS",
        //   price: 120.75,
        //   quantity: 3
        // },
        // {
        //   name: "VEBA KETCHUP TOMATO CHEFS SPL",
        //   unit: "L",
        //   price: 135,
        //   quantity: 2
        // },
        // {
        //   name: "VEBA PSTA CHESSY SAUCES ALFRDO",
        //   unit: "PCS",
        //   price: 117.15,
        //   quantity: 2
        // },
        // {
        //   name: "VEBA HOT SAUCES SRIRCHA CHILLI",
        //   unit: "PCS",
        //   price: 120.75,
        //   quantity: 3
        // },
        // {
        //   name: "VEBA KETCHUP TOMATO NO AD SUGR",
        //   unit: "PCS",
        //   price: 77.9,
        //   quantity: 3
        // },
        // {
        //   name: "VEBA THAI-STYLE SWEET CHILLI IKG",
        //   unit: "KG",
        //   price: 92.86,
        //   quantity: 3
        // }
      ]
      , false);
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Subtle professional background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>

      {/* Subtle gradient accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-10 -left-10 w-56 h-56 bg-blue-400 rounded-full opacity-[0.07] blur-3xl"></div>
        <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-indigo-400 rounded-full opacity-[0.07] blur-3xl"></div>
      </div>

      {/* Professional Navigation Bar */}
      <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Company logo/name */}
            <div className="flex items-center">
              <span className="text-xl font-semibold text-gray-900">
                <span className="text-blue-600">Finetic</span>AI
              </span>
            </div>

            {/* Professional user menu */}
            <div className="relative flex items-center space-x-4">
              {/* <button 
                className="hidden md:flex items-center text-sm text-gray-700 py-1.5 px-3 rounded-md hover:bg-gray-100 transition-colors duration-150"
              >
                <FiClock className="w-4 h-4 mr-1.5 text-gray-500" />
                <span>Activity</span>
              </button> */}

              {/* <button 
                className="hidden md:flex items-center text-sm text-gray-700 py-1.5 px-3 rounded-md hover:bg-gray-100 transition-colors duration-150"
              >
                <FiShield className="w-4 h-4 mr-1.5 text-gray-500" />
                <span>Support</span>
              </button> */}

              <div className="h-5 w-px bg-gray-300 hidden md:block"></div>

              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-gray-100 transition-all duration-150"
                aria-label="User menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                  U
                </div>
                <svg
                  className="w-5 h-5 text-gray-500 hidden md:block"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden z-10">
                  <div className="p-3 border-b border-gray-100">
                    <div className="font-medium text-gray-900">User Account</div>
                    <div className="text-xs text-gray-500">user@company.com</div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {/* Profile */}
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-150"
                    >
                      <FiUsers className="w-4 h-4 mr-3 text-gray-500" />
                      Profile
                    </Link>

                    {/* Settings */}
                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-150"
                    >
                      <FiSettings className="w-4 h-4 mr-3 text-gray-500" />
                      Settings
                    </Link>

                    {/* Billing */}
                    <Link
                      href="/billing"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-150"
                    >
                      <FiDollarSign className="w-4 h-4 mr-3 text-gray-500" />
                      Billing
                    </Link>

                    {/* Logout */}
                    <button
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-150"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Welcome back</h1>
          <p className="text-gray-600 mt-1">Select an option to get started</p>
        </div>

        {/* Action Cards Grid - Professional Version */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* AI Workflow Card */}
          <Link
            href="/ai-bill"
            className="group flex bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            <div className="w-3 bg-blue-600 hidden sm:block"></div>
            <div className="flex-1 p-6 sm:p-8">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FiTrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h2 className="text-lg font-medium text-gray-900">
                      AI Workflow
                    </h2>
                    <FiChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                  <p className="text-gray-600">
                    Automated bill processing powered by AI
                  </p>
                  <div className="mt-4 flex items-center text-xs text-blue-600">
                    <span className="font-medium">Get started</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Management Card */}
          <Link
            href="/bill-management"
            className="group flex bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            <div className="w-3 bg-indigo-600 hidden sm:block"></div>
            <div className="flex-1 p-6 sm:p-8">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <FiBarChart2 className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h2 className="text-lg font-medium text-gray-900">
                      Management
                    </h2>
                    <FiChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                  <p className="text-gray-600">
                    Advanced bill tracking and analytics
                  </p>
                  <div className="mt-4 flex items-center text-xs text-indigo-600">
                    <span className="font-medium">Get started</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Activity summary - a professional touch */}
        {/* <div className="mt-10 max-w-5xl mx-auto bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-sm font-medium text-gray-900">Recent Activity</h2>
            <button className="text-xs text-blue-600 font-medium">View all</button>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="ml-3 text-sm text-gray-700">Bill processed successfully</span>
              </div>
              <span className="text-xs text-gray-500">Just now</span>
            </div>
          </div>
        </div> */}
      </div>

      {/* <div> */}
      {/* <button className="text-black bg-blue-400 p-4" onClick={handlePurchaseEntry}>Create item</button> */}
      <button className="text-black bg-blue-400 p-4" onClick={handleCheckUnit}>Create unit</button>
      <button className="text-black bg-blue-400 p-4" onClick={handleExportItems}>Create item</button>
      <button className="text-black bg-blue-400 p-4" onClick={handlePurchaseEntry}>Create purchase</button>

      {/* </div> */}

      {/* Footer - professional touch */}
      <footer className="bg-white absolute bottom-0 left-0 w-full border-t border-gray-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <div>&copy; 2025 FineticAI. All rights reserved.</div>
            <div className="flex space-x-4 mt-3 md:mt-0">
              <a href="#" className="hover:text-gray-700">Terms</a>
              <a href="#" className="hover:text-gray-700">Privacy</a>
              <a href="#" className="hover:text-gray-700">Help</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* Add this to your global CSS
.bg-grid-pattern {
  background-image: 
    linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
  background-size: 24px 24px;
}
*/