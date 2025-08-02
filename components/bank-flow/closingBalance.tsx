import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchProfitAndLossReport } from '../../service/TALLY/payment-flow';

// Custom CSS for subtle blink
const customStyles = `
  @keyframes subtle-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
    50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.6); }
  }
`;

export const ClosingBalanceOverlay = () => {
    const [xmlData, setXmlData] = useState('');
    const [closingBalance, setClosingBalance] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [accountDetails, setAccountDetails] = useState([]);
    const [hasData, setHasData] = useState(false);


    const parseXmlData = async (xmlString) => {
        setIsLoading(true);

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

            const accounts = [];
            const dspAccNames = xmlDoc.getElementsByTagName('DSPACCNAME');
            const plAmts = xmlDoc.getElementsByTagName('PLAMT');

            for (let i = 0; i < dspAccNames.length; i++) {
                const dispName = dspAccNames[i].getElementsByTagName('DSPDISPNAME')[0]?.textContent || '';
                const plSubAmt = plAmts[i]?.getElementsByTagName('PLSUBAMT')[0]?.textContent || '';

                if (dispName) {
                    accounts.push({
                        name: dispName,
                        amount: plSubAmt
                    });
                }
            }

            // Find closing stock amount
            const closingStockItem = accounts.find(item =>
                item.name.toLowerCase().includes('closing stock')
            );

            if (closingStockItem && closingStockItem.amount) {
                setClosingBalance(Math.abs(parseFloat(closingStockItem.amount)).toFixed(2));
                setHasData(true);
            } else {
                setClosingBalance(null);
                setHasData(false);
            }

            setAccountDetails(accounts);
        } catch (error) {
            console.error('Error parsing XML:', error);
            setClosingBalance(null);
            setHasData(false);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchClosingBalance = async () => {
        setIsLoading(true);
        try {
            const accounts = await fetchProfitAndLossReport(); // already returns [{ name, amount }]
            setAccountDetails(accounts);

            const closingStockItem = accounts.find(item =>
                item.name.toLowerCase().includes('closing stock')
            );

            if (closingStockItem && closingStockItem.amount) {
                setClosingBalance(Math.abs(parseFloat(closingStockItem.amount)).toFixed(2));
                setHasData(true);
            } else {
                setClosingBalance(null);
                setHasData(false);
            }
        } catch (err) {
            console.error('Error fetching closing balance:', err);
            setHasData(false);
            setClosingBalance(null);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        fetchClosingBalance()
    }, []);

    const handleClick = () => {
        if (!hasData) {
            setShowTooltip(true);
            setTimeout(() => setShowTooltip(false), 4000);
        }
    };

    const handleMouseEnter = () => {
        if (!hasData) {
            setShowTooltip(true);
        }
    };

    const handleMouseLeave = () => {
        if (!hasData) {
            setTimeout(() => setShowTooltip(false), 2000);
        }
    };

    const handleRefresh = () => {
        fetchClosingBalance();
    };


    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-[100]">
                {/* Main Status Button */}
                <div
                    className="relative cursor-pointer transition-all duration-300 transform hover:scale-105"
                    onClick={handleClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <div
                        className={`
              relative px-4 py-3 rounded-xl border shadow-lg
              ${hasData ? 'bg-white border-green-300' : 'bg-white border-gray-300'}
              transition-all duration-500 ease-in-out
            `}
                        style={!hasData && !isLoading ? {
                            animation: 'subtle-blink 2s ease-in-out infinite'
                        } : hasData ? {
                            animation: 'pulse-glow 3s ease-in-out infinite'
                        } : {}}
                    >
                        <div className="flex items-center space-x-3">
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                            ) : hasData ? (
                                <DollarSign className="h-5 w-5 text-green-600" />
                            ) : (
                                <div className="relative">
                                    <AlertCircle className="h-5 w-5 text-orange-600" />
                                </div>
                            )}

                            <div className="flex flex-col">
                                <span
                                    className={`font-semibold text-sm ${hasData ? 'text-black' : 'text-black animate-pulse'
                                        }`}
                                >
                                    {isLoading ? 'Processing...' : hasData ? 'Closing Balance' : 'No Balance Data'}
                                </span>
                                {hasData && closingBalance && (
                                    <span className="text-green-600 font-bold text-xs">
                                        ₹{closingBalance}
                                    </span>
                                )}
                            </div>

                            {hasData && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRefresh();
                                    }}
                                    className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                                    title="Refresh data"
                                >
                                    <RefreshCw className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tooltip Message */}
                {showTooltip && !hasData && (
                    <div className="absolute top-full right-0 mt-2 w-80 transform transition-all duration-300 ease-out animate-in slide-in-from-top-2 fade-in-0">
                        <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4 shadow-2xl">
                            <div className="flex items-start space-x-3">
                                <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-white text-sm mb-1">
                                        Balance Data Required
                                    </h3>
                                    <p className="text-gray-300 text-xs leading-relaxed">
                                        Please provide valid XML data to display the closing balance information.
                                    </p>
                                    <button
                                        onClick={handleRefresh}
                                        className="mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                                    >
                                        Retry Parse
                                    </button>
                                </div>
                            </div>

                            {/* Arrow pointing to button */}
                            <div className="absolute -top-2 right-6 w-4 h-4 bg-gray-900/95 border-l border-t border-gray-700/50 transform rotate-45"></div>
                        </div>
                    </div>
                )}

                {/* Detailed View Tooltip - Shows on successful data */}
                {showTooltip && hasData && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-96 transition-all duration-300 ease-out animate-in slide-in-from-top-2 fade-in-0">
                        <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl p-4 shadow-2xl">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-800 text-sm flex items-center">
                                    <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                                    Account Summary
                                </h3>
                                <span className="text-green-600 font-bold text-lg">₹{closingBalance}</span>
                            </div>

                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {accountDetails.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-xs">
                                        <span className="text-gray-700 font-medium truncate pr-2">{item.name}</span>
                                        <span className={`font-bold ${item.amount && parseFloat(item.amount) < 0
                                            ? 'text-red-600'
                                            : item.amount
                                                ? 'text-green-600'
                                                : 'text-gray-400'
                                            }`}>
                                            {item.amount ? `₹${Math.abs(parseFloat(item.amount)).toFixed(2)}` : '-'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Arrow pointing to button */}
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white/95 border-l border-t border-gray-200 rotate-45"></div>
                        </div>
                    </div>
                )}

                {/* Success Animation */}
                {hasData && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 bg-green-400/10 rounded-xl animate-pulse duration-1000"></div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ClosingBalanceOverlay;