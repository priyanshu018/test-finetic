// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { createGlobalStyle } from 'styled-components';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  User,
  LogOut,
  CreditCard,
  DollarSign,
  Zap,
  FileText,
  Bell,
  Settings,
  Download,
  ChevronRight,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  Info,
  IndianRupee,
  ArrowLeft
} from 'lucide-react';
import { useAuthenticatedLayout } from '../lib/authhook';
import { supabase } from '../lib/supabase';
import { RazorpayOrderOptions, useRazorpay } from 'react-razorpay';
import { toast } from 'sonner';

// Global styles for animations
const GlobalStyle = createGlobalStyle`
  @keyframes progressAnimation {
    0% { width: 5%; }
    50% { width: 70%; }
    100% { width: 95%; }
  }
  .animate-progressBar {
    animation: progressAnimation 2s ease-in-out infinite;
  }
  
  .bg-grid-pattern {
    background-image: radial-gradient(circle, #e5e7eb 1px, transparent 1px);
    background-size: 20px 20px;
  }
`;

const Dashboard = () => {
  // Ensure the user is authenticated
  const loading = useAuthenticatedLayout();
  const { Razorpay } = useRazorpay();

  // Local state
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [credits, setCredits] = useState(0);
  const [billsProcessed, setBillsProcessed] = useState(0);
  const [usedThisMonth, setUsedThisMonth] = useState(0);
  const [monthlyUsage, setMonthlyUsage] = useState([]);
  const [weeklyUsage, setWeeklyUsage] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartType, setChartType] = useState('weekly');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Top-up modal state
  const [topUpAmount, setTopUpAmount] = useState('');
  const [estimatedBills, setEstimatedBills] = useState(0);
  const [pricePerBill, setPricePerBill] = useState(3); // Default price per bill in INR

  // Quick select options for top-up (in INR)
  const quickSelectOptions = [1000, 2000, 5000, 10000];

  // Calculate estimated bills based on top-up amount
  useEffect(() => {
    if (topUpAmount) {
      const numericAmount = parseFloat(topUpAmount);
      if (!isNaN(numericAmount)) {
        setEstimatedBills(Math.floor(numericAmount / pricePerBill));
      } else {
        setEstimatedBills(0);
      }
    } else {
      setEstimatedBills(0);
    }
  }, [topUpAmount, pricePerBill]);

  // Handle quick select option click
  const handleQuickSelectClick = (amount) => {
    setTopUpAmount(amount.toString());
  };

  // Handle top-up amount input change
  const handleTopUpAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setTopUpAmount(value);
    }
  };

  const fetchData = async () => {
    // 1) Get current session
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error fetching session:', sessionError);
      return;
    }
    if (!session || !session.user) return;

    const email = session.user.email;
    setUserEmail(email);

    // 2) Fetch the user record from 'users' table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError) {
      console.error('Error fetching user record:', userError);
      return;
    }
    const userId = userData.id ?? "";

    // 3) Sum all recharge amounts for this user
    const { data: rechargeData, error: rechargeError } = await supabase
      .from('recharge')
      .select('*')
      .eq("user_id", userId);

    if (rechargeError) {
      console.error('Error fetching recharge data:', rechargeError);
      return;
    }
    const userRecharges = rechargeData.filter(r => r.user_id === userId);
    const totalRecharges = userRecharges.reduce((acc, curr) => parseInt(acc) + parseInt(curr.amount), 0);

    // 4) Sum all usage counts for this user
    const { data: usageData, error: usageError } = await supabase
      .from('usage_count')
      .select('*')
      .eq('user_id', userId);

    if (usageError) {
      console.error('Error fetching usage data:', usageError);
      return;
    }
    const totalUsage = usageData.reduce((acc, curr) => acc + 1, 0);

    // 5) Calculate credits and other stats
    const userCredits = totalRecharges - (totalUsage * 3);
    setCredits(userCredits);
    setBillsProcessed(totalUsage);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyUsageCount = usageData
      .filter((u) => new Date(u.created_at) >= startOfMonth)
      .reduce((acc, curr) => acc + curr.count, 0);
    setUsedThisMonth(monthlyUsageCount);

    // 6) Build monthly usage data for the chart
    const usageByMonthMap = {};
    usageData.forEach((u) => {
      const date = new Date(u.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      usageByMonthMap[monthKey] = (usageByMonthMap[monthKey] || 0) + u.count;
    });

    // 7) Build weekly usage data for the chart
    const usageByWeekMap = {};
    usageData.forEach((u) => {
      const date = new Date(u.created_at);
      // Get the start of the week (Sunday as start)
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0]; // e.g., "2025-03-16"
      usageByWeekMap[weekKey] = (usageByWeekMap[weekKey] || 0) + 1;
    });

    const weeklyUsageArray = Object.entries(usageByWeekMap)
      .map(([weekKey, count]) => {
        const weekStartDate = new Date(weekKey);
        return {
          name: `Week of ${weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          usage: count
        };
      })
      .sort((a, b) => new Date(a.name) - new Date(b.name));
    setWeeklyUsage(weeklyUsageArray);
  };

  // Fetch data from Supabase
  useEffect(() => {
    fetchData();
  }, [loading]);

  // Helper function for month names
  const getMonthName = (month) => {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return monthNames[month - 1] || '';
  };

  // Handler for completing purchase using react-razorpay
  const handleCompletePurchase = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Create an order via the backend API
    const res = await fetch('/api/razorpay/create_order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency: 'INR' }),
    });
    const orderData = await res.json();
    if (orderData.error) {
      alert(`Order creation failed: ${orderData.error}`);
      return;
    }

    // Prepare options for Razorpay Checkout
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Finetic AI',
      description: 'Top Up Credits',
      order_id: orderData.id,
      handler: async (response) => {
        setShowTopUpModal(false);
        toast.success(`Credit recharge for ${orderData.amount / 100} successfull`);
        fetchData();
        // Optionally, call an API to update your backend with the payment details
      },
      prefill: {
        name: userEmail.split('@')[0],
        email: userEmail,
      },
      theme: {
        color: '#2563eb',
      },
    };

    // Use react-razorpay to open the checkout modal
    const rzp = new Razorpay(options);
    rzp.open();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8 rounded-xl bg-white shadow-lg shadow-blue-100/50 max-w-md mx-auto">
          <div className="relative h-20 w-20 mx-auto mb-6">
            {/* Outer spinning circle */}
            <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
            {/* Inner pulsing circle */}
            <div className="absolute inset-3 rounded-full bg-blue-50 flex items-center justify-center animate-pulse">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Preparing Your Dashboard</h3>
          <p className="text-gray-500 mb-4">Fetching your latest data and insights...</p>
          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full animate-progressBar"></div>
          </div>
          <p className="text-xs text-gray-400">This may take a few moments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <GlobalStyle />
      
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
            {/* Back button and company logo/name */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-150 p-2 rounded-md hover:bg-gray-100"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
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
                  {userEmail.charAt(0).toUpperCase()}
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
                    <div className="text-xs text-gray-500">{userEmail}</div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {/* Billing */}
                    <button
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-150"
                      onClick={() => setShowTopUpModal(true)}
                    >
                      <DollarSign className="w-4 h-4 mr-3 text-gray-500" />
                      Billing
                    </button>

                    {/* Logout */}
                    <button
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-150"
                      onClick={async () => await supabase.auth.signOut()}
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
      <div className="pt-24 pb-16">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
              <div className="flex items-center mt-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500 ml-2">
                  {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowTopUpModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ₹ Top Up Credits
            </button>
          </div>

          {/* Key Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Credits Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-full bg-blue-500/10 text-blue-600">₹</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available Credits</p>
                  <p className="text-2xl font-bold text-gray-900">₹{credits.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500"></p>
                <div className="flex items-center text-blue-600 text-sm font-medium">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                </div>
              </div>
            </div>

            {/* Bills Processed Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-600">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bills Processed</p>
                  <p className="text-2xl font-bold text-gray-900">{billsProcessed}</p>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">This month</span>
                </div>
                <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: billsProcessed > 0 ? `${(usedThisMonth / billsProcessed) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Time Saved Card */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-full bg-purple-500/10 text-purple-600">
                  <Zap className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Time Saved</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round((billsProcessed * 6) / 60)} hours</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 flex items-center">
                <span className="inline-block w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                6 minutes saved per bill on average
              </p>
            </div>
          </div>

          {/* Usage Graph */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Processing Activity</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setChartType('weekly')}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${chartType === 'weekly' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  Weekly
                </button>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartType === 'monthly' ? monthlyUsage : weeklyUsage}>
                  <defs>
                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }} />
                  <Area type="monotone" dataKey="usage" stroke="#2563eb" fillOpacity={1} fill="url(#colorUsage)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Top Up Credits</h2>
            <p className="text-gray-600 mb-6">
              Enter the amount you want to recharge or select from the options below.
            </p>

            {/* Amount Input Field */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IndianRupee className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={topUpAmount}
                onChange={handleTopUpAmountChange}
                placeholder="Enter amount"
                className="block w-full pl-10 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-lg font-medium"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">INR</span>
              </div>
            </div>

            {/* Quick Select Bubbles */}
            <div className="flex flex-wrap gap-3 mb-6">
              {quickSelectOptions.map((amount, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSelectClick(amount)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${topUpAmount === amount.toString()
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                    : 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200'
                    }`}
                >
                  ₹{amount.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            {/* Bill Estimation Card */}
            {topUpAmount && estimatedBills > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">Estimated Bills</p>
                    <div className="flex items-center mt-1">
                      <FileText className="h-4 w-4 text-gray-500 mr-1" />
                      <p className="text-sm text-gray-600">
                        Process approximately {estimatedBills.toLocaleString()} bills
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">₹{pricePerBill.toFixed(2)}/bill</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowTopUpModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCompletePurchase}
                disabled={!topUpAmount || parseFloat(topUpAmount) <= 0}
                className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center ${!topUpAmount || parseFloat(topUpAmount) <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                <span>Complete Purchase</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;