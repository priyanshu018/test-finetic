"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiDollarSign,
  FiTrendingUp,
  FiBarChart2,
  FiChevronRight,
} from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function IndexPage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [email, setEmail] = useState("");
  const router = useRouter();
  // Keep existing electron functions
  useEffect(() => {
    const email = localStorage.getItem("email");
    setEmail(email);
  }, []);

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
                    <div className="font-medium text-gray-900">
                      User Account
                    </div>
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
                      onClick={() => {
                        localStorage.clear();
                        window.location.href = "/";
                      }}
                    >
                      <svg
                        className="w-4 h-4 mr-3 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
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
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            Welcome back
          </h1>
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
                      Purchase Workflow
                    </h2>
                    <FiChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                  <p className="text-gray-600">
                    Automated purchse bill processing powered by AI
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
                      Bill Management
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
          <Link
            href="/payment-workflow"
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
                      Bank Workflow
                    </h2>
                    <FiChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                  <p className="text-gray-600">
                    Export Bank Data intelligently into accounting software using AI
                  </p>
                  <div className="mt-4 flex items-center text-xs text-indigo-600">
                    <span className="font-medium">Get started</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
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
