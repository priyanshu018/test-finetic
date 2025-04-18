"use client"
import React, { useEffect, useState } from "react";
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
import { useRouter } from "next/navigation";

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
  const [email, setEmail] = useState("")
  const router = useRouter()
  // Keep existing electron functions

  const ledgerXmlData = `
  <ENVELOPE>
<HEADER>
  <VERSION>1</VERSION>
  <TALLYREQUEST>Export</TALLYREQUEST>
  <TYPE>Collection</TYPE>
  <ID>Ledgers</ID>
</HEADER>
<BODY>
  <DESC>
    <STATICVARIABLES>
      <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      <SVCURRENTCOMPANY>PrimeDepth Labs</SVCURRENTCOMPANY>
    </STATICVARIABLES>
    <TDL>
      <TDLMESSAGE>
        <COLLECTION ISMODIFY="No" ISFIXED="No" ISINITIALIZE="No" ISOPTION="No" ISINTERNAL="No" NAME="Ledgers">
          <TYPE>Ledger</TYPE>
          <NATIVEMETHOD>Address</NATIVEMETHOD>
          <NATIVEMETHOD>Masterid</NATIVEMETHOD>
          <NATIVEMETHOD>*</NATIVEMETHOD>
        </COLLECTION>
      </TDLMESSAGE>
    </TDL>
  </DESC>
</BODY>
</ENVELOPE>
  `

  const handleCreatePartyLedger = async () => {
    // const purchaserLedgerResponse = await window.electron.exportAndCreatePartyNameEntry("EVERYDAY STORE-WAVE", "03AALFE5567F1ZF")
    // console.log(purchaserLedgerResponse, "purchaserLedgerResponse")


    const response = await window.electron.createPartyName(ledgerXmlData, "code test1", {
      name: "code test1",
      parent: "Sundry Creditors",
      address: "",
      country: "",
      state: "",
      mobile: "",
      gstin: "",
    })
      .then((result) => {
        if (result.success) {
          console.log('Response from Tally:', result.data);
          return result
        } else {
          console.error('Error sending XML to Tally:', result.error);
        }
      });


    console.log(response, "taxLedgerData")
  }

  useEffect(() => {
    const email = localStorage.getItem("email")
    setEmail(email)
  }, [])

  const handleCreatePurchaseLedger = async () => {
    const purchaserLedgerResponse = await window.electron.createPurchaserLedger(ledgerXmlData, "Purchaser")
    console.log(purchaserLedgerResponse, "purchaserLedgerResponse")

  }


  const handleCreateCgstIgstSgstLedger = async () => {



    const response = await window.electron.getTaxLedgerData(ledgerXmlData)
      .then((result) => {
        if (result.success) {
          // console.log('Response from Tally:', result.data);
          return result
        } else {
          console.error('Error sending XML to Tally:', result.error);
        }
      });


    console.log(response, "taxLedgerData")
    // const ledgerNames = [ 
    //   'Cgst0%', 'Cgst2.5%', 'Cgst6%', 'Cgst9%', 'Cgst14%',
    //   'Igst0%', 'Igst5%', 'Igst12%', 'Igst18%', 'Igst28%',
    //   'Ut/Sgst0%', 'Ut/Sgst2.5%', 'Ut/Sgst6%', 'Ut/Sgst9%', 'Ut/Sgst14%'
    // ];

    // const allLedgerResponse = await window.electron.exportAndCreateLedger(ledgerNames, "ledger")

    // console.log(allLedgerResponse)
  }

  const handleExportItems = async () => {

    const items = [
      {
        Product: "CRAMEL 230GM",
        HSN: "21069040",
        SGST: 9,
        CGST: 9,
        gst: 18,
        symbol: "GM"
      },
      {
        Product: "VEBA BLISS VEBA MAYONNAISE MINT",
        HSN: "21039030",
        SGST: 6,
        CGST: 6,
        gst: 12,
        symbol: "GM"
      },
      {
        Product: "MAYONNAISE OLIVE OIL",
        HSN: "21039030",
        SGST: 6,
        CGST: 6,
        gst: 12,
        symbol: "GM"
      },
      {
        Product: "VEBA PSTA N PIZZA HRDY TOMATO",
        HSN: "21039090",
        SGST: 6,
        CGST: 6,
        gst: 12,
        symbol: "GM"
      },
      {
        Product: "VEBA RSTA N PIZZA HRBY TOMATO",
        HSN: "21032000",
        SGST: 6,
        CGST: 6,
        gst: 12,
        symbol: "GM"
      },
      {
        Product: "VEBA VEBAIPSTA N PIZZA HRBY TOMATO",
        HSN: "21039090",
        SGST: 6,
        CGST: 6,
        gst: 12,
        symbol: "GM"
      },
      {
        Product: "PSTA CHESSY SAUCES ALFRDO",
        HSN: "21039090",
        SGST: 6,
        CGST: 6,
        gst: 12,
        symbol: "GM"
      },
      {
        Product: "VEBA DIP SALSA",
        HSN: "21032000",
        SGST: 6,
        CGST: 6,
        gst: 12,
        symbol: "PCS"
      },
      {
        Product: "VEBA SNDWCH SPRD CRT CUCMBR",
        HSN: "21039030",
        SGST: 6,
        CGST: 6,
        gst: 12,
        symbol: "GM"
      },
      {
        Product: "VEBA VEBA HOT SAUCES SRIRCHA CHILLI",
        HSN: "21039030",
        SGST: 6,
        CGST: 6,
        gst: 12,
        symbol: "GM"
      },
      {
        Product: "SWEET SAUCES OINION",
        HSN: "21039090",
        SGST: 6,
        CGST: 6,
        gst: 12,
        symbol: "M"
      },
      {
        Product: "VEBA VEBATHAI-STYLESWEET CHILLI",
        HSN: "21039020",
        SGST: 6,
        CGST: 6,
        gst: 12,
        symbol: "GM"
      },
      {
        Product: "VEBA KETCHUPTOMATO NONGARLIC",
        HSN: "21032000",
        SGST: 6,
        CGST: 6,
        gst: 12,
        symbol: "KG"
      },
      {
        Product: "VEBA KETCHUPTOMATO CHERS SPL",
        HSN: "21032000",
        SGST: 6,
        CGST: 6,
        gst: 12,
        symbol: "KG"
      },
      {
        Product: "VEBA KETCHUP TOMATO NO AD SUGI",
        HSN: "21032000",
        SGST: 6,
        CGST: 6,
        gst: 12,
        symbol: "G"
      },
      {
        Product: "VEBA HAYONNAISETANDOORI",
        HSN: "21039030",
        SGST: 6,
        CGST: 6,
        gst: 12,
        symbol: "GM"
      },
      {
        Product: "VEBA WHOLE GRAIN MUSTRD",
        HSN: "21039090",
        SGST: 6,
        CGST: 6,
        gst: 12,
        symbol: "GM"
      },
      {
        Product: "VEBA SALAD SAUCE TOKYO STYL",
        HSN: "21039090",
        SGST: 6,
        CGST: 6,
        gst: 12,
        symbol: "GM"
      }
    ]
    const response = await window.electron.exportItem(items);
    console.log(response);
  };

  const handleCheckUnit = async () => {

    const units = [
      {
        name: "GM",
        decimal: 3
      },
      {
        name: "PCS",
        decimal: 3
      },
      {
        name: "M",
        decimal: 3
      },
      {
        name: "KG",
        decimal: 3
      },
      {
        name: "G",
        decimal: 3
      }
    ] 
    const response = await window.electron.exportUnit(units);
    console.log(response, "here is ");
  };

  const handlePurchaseEntry = async () => {
    const payload = {
      invoiceNumber: "A006784",
      invoiceData: "01-04-2025",
      partyName: "EVERYDAY STORE-WAVE",
      purchaseLedger: "Purchase",
      items: [
        { name: "CRAMEL 230GM", price: 71.2, quantity: 3, unit: "PCS" },
        { name: "VEBA BLISS VEBA MAYONNAISE MINT", price: 105, quantity: 1, unit: "PCS" },
        { name: "MAYONNAISE OLIVE OIL", price: 156.45, quantity: 1, unit: "PCS" },
        // ...other items
      ],
      sgst: "10%",
      cgst: "10%",
      igst: "10%",
      isWithinState: true,
    };

    // await window.electron.createPurchaseEntry("A006784", "01-04-2025", "EVERYDAY STORE-WAVE", "Purchase",
    // [
    //   {
    //     name: "CRAMEL 230GM",
    //     price: 71.2,
    //     quantity: 3,
    //     unit: "PCS"
    //   },
    //   {
    //     name: "VEBA BLISS VEBA MAYONNAISE MINT",
    //     price: 105,
    //     quantity: 1,
    //     unit: "PCS"
    //   },
    //   {
    //     name: "MAYONNAISE OLIVE OIL",
    //     price: 156.45,
    //     quantity: 1,
    //     unit: "PCS"
    //   },
    //   {
    //     name: "VEBA PSTA N PIZZA HRDY TOMATO",
    //     price: 32.15,
    //     quantity: 12,
    //     unit: "PCS"
    //   },
    //   {
    //     name: "VEBA RSTA N PIZZA HRBY TOMATO",
    //     price: 70.75,
    //     quantity: 3,
    //     unit: "PCS"
    //   },
    //   {
    //     name: "VEBA VEBAIPSTA N PIZZA HRBY TOMATO",
    //     price: 120.75,
    //     quantity: 3,
    //     unit: "PCS"
    //   },
    //   {
    //     name: "PSTA CHESSY SAUCES ALFRDO",
    //     price: 2.15,
    //     quantity: 3,
    //     unit: "PCS"
    //   },
    //   {
    //     name: "VEBA DIP SALSA",
    //     price: 117.15,
    //     quantity: 2,
    //     unit: "PCS"
    //   },
    //   {
    //     name: "VEBA SNDWCH SPRD CRT CUCMBR",
    //     price: 77.9,
    //     quantity: 3,
    //     unit: "PCS"
    //   },
    //   {
    //     name: "VEBA VEBA HOT SAUCES SRIRCHA CHILLI",
    //     price: 125,
    //     quantity: 2,
    //     unit: "PCS"
    //   },
    //   {
    //     name: "SWEET SAUCES OINION",
    //     price: 120.75,
    //     quantity: 3,
    //     unit: "PCS"
    //   },
    //   {
    //     name: "VEBA VEBATHAI-STYLESWEET CHILLI",
    //     price: 90.52,
    //     quantity: 3,
    //     unit: "PCS"
    //   },
    //   {
    //     name: "VEBA KETCHUPTOMATO NONGARLIC",
    //     price: 2.86,
    //     quantity: 3,
    //     unit: "PCS"
    //   },
    //   {
    //     name: "VEBA KETCHUPTOMATO CHERS SPL",
    //     price: 120.75,
    //     quantity: 3,
    //     unit: "PCS"
    //   },
    //   {
    //     name: "VEBA KETCHUP TOMATO NO AD SUGI",
    //     price: 135,
    //     quantity: 2,
    //     unit: "PCS"
    //   },
    //   {
    //     name: "VEBA HAYONNAISETANDOORI",
    //     price: 77.9,
    //     quantity: 3,
    //     unit: "PCS"
    //   },
    //   {
    //     name: "VEBA WHOLE GRAIN MUSTRD",
    //     price: 135,
    //     quantity: 3,
    //     unit: "PCS"
    //   },
    //   {
    //     name: "VEBA SALAD SAUCE TOKYO STYL",
    //     price: 142.15,
    //     quantity: 3,
    //     unit: "PCS"
    //   }
    // ]
    //   , false);

    window.electron.createPurchaseEntry(
      {
        "invoiceNumber": "A006784",
        "invoiceData": "01-04-2025",
        "partyName": "EVERYDAY STORE-WAVE",
        "purchaseLedger": "Purchase",
        "items": [
          {
            "name": "CRAMEL 230GM",
            "price": 71.2,
            "quantity": 3,
            "unit": "PCS"
          },
          {
            "name": "VEBA BLISS VEBA MAYONNAISE MINT",
            "price": 105,
            "quantity": 1,
            "unit": "PCS"
          },
          {
            "name": "MAYONNAISE OLIVE OIL",
            "price": 156.45,
            "quantity": 1,
            "unit": "PCS"
          },
          {
            "name": "VEBA PSTA N PIZZA HRDY TOMATO",
            "price": 32.15,
            "quantity": 12,
            "unit": "PCS"
          },
          {
            "name": "VEBA RSTA N PIZZA HRBY TOMATO",
            "price": 70.75,
            "quantity": 3,
            "unit": "PCS"
          },
          {
            "name": "VEBA VEBAIPSTA N PIZZA HRBY TOMATO",
            "price": 120.75,
            "quantity": 3,
            "unit": "PCS"
          },
          {
            "name": "PSTA CHESSY SAUCES ALFRDO",
            "price": 2.15,
            "quantity": 3,
            "unit": "PCS"
          },
          {
            "name": "VEBA DIP SALSA",
            "price": 117.15,
            "quantity": 2,
            "unit": "PCS"
          },
          {
            "name": "VEBA SNDWCH SPRD CRT CUCMBR",
            "price": 77.9,
            "quantity": 3,
            "unit": "PCS"
          },
          {
            "name": "VEBA VEBA HOT SAUCES SRIRCHA CHILLI",
            "price": 125,
            "quantity": 2,
            "unit": "PCS"
          },
          {
            "name": "SWEET SAUCES OINION",
            "price": 120.75,
            "quantity": 3,
            "unit": "PCS"
          },
          {
            "name": "VEBA VEBATHAI-STYLESWEET CHILLI",
            "price": 90.52,
            "quantity": 3,
            "unit": "PCS"
          },
          {
            "name": "VEBA KETCHUPTOMATO NONGARLIC",
            "price": 2.86,
            "quantity": 3,
            "unit": "PCS"
          },
          {
            "name": "VEBA KETCHUPTOMATO CHERS SPL",
            "price": 120.75,
            "quantity": 3,
            "unit": "PCS"
          },
          {
            "name": "VEBA KETCHUP TOMATO NO AD SUGI",
            "price": 135,
            "quantity": 2,
            "unit": "PCS"
          },
          {
            "name": "VEBA HAYONNAISETANDOORI",
            "price": 77.9,
            "quantity": 3,
            "unit": "PCS"
          },
          {
            "name": "VEBA WHOLE GRAIN MUSTRD",
            "price": 135,
            "quantity": 3,
            "unit": "PCS"
          },
          {
            "name": "VEBA SALAD SAUCE TOKYO STYL",
            "price": 142.15,
            "quantity": 3,
            "unit": "PCS"
          }
        ],
        "sgst": "9%",
        "cgst": "9%",
        "igst": "18%",
        "isWithinState": true
      }

    ).then(response => {
      if (response.success) {
        console.log("Voucher XML:", response.voucherXml);
      } else {
        console.error("Error:", response.error);
      }
    });
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
                    <div className="text-xs text-gray-500">{email}</div>
                  </div>
                  <div className="divide-y divide-gray-100">
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
                      onClick={() => { localStorage.clear(); window.location.href = '/home'; }}
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

      <div>
        <button className="text-black bg-blue-400 p-4" onClick={handleCreatePartyLedger}>Create party name ledger</button>
        <button className="text-black bg-blue-400 p-4" onClick={handleCreatePurchaseLedger}>Create purchase ledger</button>
        <button className="text-black bg-blue-400 p-4" onClick={handleCreateCgstIgstSgstLedger}>Create IGST/CGST/SGST ledger</button>
        <button className="text-black bg-blue-400 p-4" onClick={handleCheckUnit}>Create unit</button>
        <button className="text-black bg-blue-400 p-4" onClick={handleExportItems}>Create item</button>
        <button className="text-black bg-blue-400 p-4" onClick={handlePurchaseEntry}>Create purchase</button>
      </div>

      {/* Footer - professional touch */}
      <footer className="bg-white absolute bottom-0 left-0 w-full border-t border-gray-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <div>&copy; 2025 FineticAI. All rights reserved.</div>
            <div className="flex space-x-4 mt-3 md:mt-0">
              {/* <a href="#" className="hover:text-gray-700">Terms</a>
              <a href="#" className="hover:text-gray-700">Privacy</a>
              <a href="#" className="hover:text-gray-700">Help</a> */}
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