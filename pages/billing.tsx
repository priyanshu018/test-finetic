import React, { useState } from 'react';
import { ArrowUpRight, Clock, BarChart3, CreditCard, TrendingUp, ChevronRight, Plus, ArrowRight } from 'lucide-react';

const BillingPage = () => {
  const [activeTab, setActiveTab] = useState('usage');
  
  // Mock data
  const billingData = {
    currentBalance: 234.50,
    usageHistory: [
      { month: "Jan", amount: 210 },
      { month: "Feb", amount: 180 },
      { month: "Mar", amount: 240 },
      { month: "Apr", amount: 238 },
    ],
    lastTopUps: [
      { id: 1, date: "Mar 28, 2025", amount: 150.00, description: "Monthly top-up" },
      { id: 2, date: "Mar 15, 2025", amount: 75.00, description: "Additional credit" },
      { id: 3, date: "Feb 28, 2025", amount: 150.00, description: "Monthly top-up" },
    ],
  };

  const handleTopUp = () => {
    // In a real app, this would redirect to your website
    window.open('https://www.fineticai.com/', '_blank');
  };

  const goToHome = () => {
    // Navigate back to home page
    window.location.href = '/next';
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 font-sans">
      {/* App Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={goToHome}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
              <span className="text-sm font-medium text-gray-700">Back</span>
            </button>
            
            <div className="flex items-center">
              <span className="text-xl font-semibold text-gray-900">
                <span className="text-blue-600">Finetic</span>AI
              </span>
            </div>
          </div>
          <button 
            onClick={handleTopUp}
            className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <span>Top Up</span>
            <div className="w-5 h-5 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              <Plus size={12} />
            </div>
          </button>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Balance Section */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Balance Card */}
          <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all">
            <div className="p-8 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full -mt-16 -mr-16 opacity-40 group-hover:opacity-60 transition-opacity"></div>
              
              <h2 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-3">Available Balance</h2>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">₹{billingData.currentBalance}</span>
                <span className="text-sm text-gray-500 ml-2">credits</span>
              </div>
              
              <button 
                onClick={handleTopUp}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-3 rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-500 group-hover:text-white"
              >
                Add More Credits
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
          
          {/* Chart Card */}
          <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="px-8 pt-6 pb-4 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                    <TrendingUp size={18} className="text-blue-600" />
                  </div>
                  <h2 className="text-lg font-medium text-gray-800">Usage Trend</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Last 4 months</span>
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200">
                    <ChevronRight size={14} className="text-gray-600" />
                  </div>
                </div>
              </div>
              
              <div className="flex-grow p-8 pt-6">
                {/* Line Chart */}
                <div className="h-48 lg:h-56 relative">
                  {/* Line Chart Background */}
                  <div className="absolute inset-0 grid grid-cols-1 grid-rows-4">
                    <div className="border-t border-gray-100"></div>
                    <div className="border-t border-gray-100"></div>
                    <div className="border-t border-gray-100"></div>
                    <div className="border-t border-gray-100"></div>
                  </div>
                  
                  {/* Y-axis labels */}
                  <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-xs text-gray-400 py-2">
                    <div>₹300</div>
                    <div>₹200</div>
                    <div>₹100</div>
                    <div>₹0</div>
                  </div>
                  
                  {/* Line Chart */}
                  <div className="absolute inset-0 ml-8 mr-4">
                    <svg className="w-full h-full" viewBox="0 0 300 200" preserveAspectRatio="none">
                      {/* Line */}
                      <path 
                        d={`
                          M 0,${200 - (billingData.usageHistory[0].amount / 300) * 200}
                          L ${300 / 3},${200 - (billingData.usageHistory[1].amount / 300) * 200}
                          L ${300 * 2 / 3},${200 - (billingData.usageHistory[2].amount / 300) * 200}
                          L ${300},${200 - (billingData.usageHistory[3].amount / 300) * 200}
                        `}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3"
                      />
                      
                      {/* Data points */}
                      {billingData.usageHistory.map((point, index) => (
                        <circle 
                          key={index}
                          cx={index * (300 / 3)}
                          cy={200 - (point.amount / 300) * 200}
                          r="6"
                          fill="white"
                          stroke="url(#pointGradient)"
                          strokeWidth="3"
                        />
                      ))}
                      
                      {/* Gradient Area under the line */}
                      <path 
                        d={`
                          M 0,${200 - (billingData.usageHistory[0].amount / 300) * 200}
                          L ${300 / 3},${200 - (billingData.usageHistory[1].amount / 300) * 200}
                          L ${300 * 2 / 3},${200 - (billingData.usageHistory[2].amount / 300) * 200}
                          L ${300},${200 - (billingData.usageHistory[3].amount / 300) * 200}
                          L ${300},200
                          L 0,200
                          Z
                        `}
                        fill="url(#areaGradient)"
                      />
                      
                      {/* Gradients definition */}
                      <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                        <linearGradient id="pointGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  
                  {/* X-axis labels */}
                  <div className="absolute bottom-0 inset-x-0 flex justify-between text-xs text-gray-400 pl-8 pr-4">
                    {billingData.usageHistory.map((item, index) => (
                      <div key={index}>{item.month}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs Section */}
        <div className="mb-6">
          <div className="flex space-x-6">
            <button 
              onClick={() => setActiveTab('usage')}
              className={`py-2 font-medium text-sm relative ${
                activeTab === 'usage' 
                  ? 'text-gray-900' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <BarChart3 size={18} className="mr-2" />
                <span>Usage Analysis</span>
              </div>
              {activeTab === 'usage' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full"></div>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('topups')}
              className={`py-2 font-medium text-sm relative ${
                activeTab === 'topups' 
                  ? 'text-gray-900' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Clock size={18} className="mr-2" />
                <span>Last Top Ups</span>
              </div>
              {activeTab === 'topups' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full"></div>
              )}
            </button>
          </div>
          <div className="h-px bg-gray-200 mt-2"></div>
        </div>
        
        {/* Tab Content */}
        <div className="mt-6">
          {/* Usage Analysis Tab with Line Chart */}
          {activeTab === 'usage' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-100">
                <h3 className="text-lg font-medium text-gray-800">Monthly Usage Trends</h3>
                <p className="text-sm text-gray-500 mt-1">Track your consumption patterns over time</p>
              </div>
              <div className="px-8 py-10">
                {/* Enhanced Line Chart (detailed visualization) */}
                <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 flex flex-col items-center justify-center">
                  <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-md">
                    <div className="flex justify-between items-center mb-6">
                      <div className="text-sm font-medium text-gray-600">Current Month Usage</div>
                      <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-2 py-1 rounded-md text-xs">
                        +4.2%
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-3xl font-bold text-gray-900">₹238</div>
                        <div className="text-xs text-gray-500 mt-1">vs ₹228 last month average</div>
                      </div>
                      <div className="flex space-x-1 items-end">
                        {[30, 45, 25, 60, 75, 45, 65].map((height, i) => (
                          <div 
                            key={i} 
                            className="w-1.5 bg-gray-200 rounded-full"
                            style={{ height: `${height}px` }}
                          ></div>
                        ))}
                        <div className="w-1.5 bg-gradient-to-t from-purple-600 to-blue-500 rounded-full h-16"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 p-6 bg-gray-50">
                <div className="text-sm font-medium text-gray-600">
                  Monthly average: <span className="text-gray-900">₹217</span>
                </div>
                <button 
                  className="px-4 py-2 bg-white shadow-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-1"
                  onClick={handleTopUp}
                >
                  View Details
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
          
          {/* Last Top Ups Tab */}
          {activeTab === 'topups' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-100">
                <h3 className="text-lg font-medium text-gray-800">Last Top Ups</h3>
                <p className="text-sm text-gray-500 mt-1">Your recent balance additions</p>
              </div>
              <div>
                {billingData.lastTopUps.map((topup, index) => (
                  <div 
                    key={topup.id} 
                    className={`flex justify-between items-center p-6 hover:bg-gray-50 transition-colors ${
                      index !== billingData.lastTopUps.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mr-4">
                        <CreditCard size={18} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{topup.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{topup.date}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-semibold text-gray-900">+₹{topup.amount.toFixed(2)}</span>
                      <span className="text-xs text-emerald-500 mt-1">Completed</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 p-6 bg-gray-50">
                <button 
                  className="w-full px-4 py-3 bg-white shadow-sm border border-gray-200 text-gray-800 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center justify-center gap-1"
                  onClick={handleTopUp}
                >
                  View All Transactions
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Notice Box */}
        <div className="mt-8 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-500/10 p-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mt-20 -mr-20 opacity-10"></div>
            
            <div className="flex items-start">
              <div className="rounded-xl bg-white p-2 mr-4 flex-shrink-0 shadow-sm">
                <ArrowUpRight size={20} className="text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Secure Top-Up Process</h4>
                <p className="text-sm text-gray-600">
                  For security reasons, payment processing and top-ups are handled on our secure website. 
                  Click the "Top Up" button to proceed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;