import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';
import { getCompanyData, getCurrentCompanyData } from '../service/tally';

// Custom CSS for subtle blink
const customStyles = `
  @keyframes subtle-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

export const TallyConnectionOverlay = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [companyList, setCompanyList] = useState([]);
  const [currentCompany, setCurrentCompany] = useState(null);



  const fetchCompanies = async () => {
    setIsLoading(true);

    try {
      const response: any = await getCompanyData();
      if (response.success) {
        setCompanyList(response.data);
        setIsConnected(true);
      } else {
        console.error('Error fetching companies:', response.error);
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentComapny = async () => {

    const response = await getCurrentCompanyData()
    console.log({ response })
    setCurrentCompany(response?.data)
  }

  useEffect(() => {
    fetchCompanies();
    fetchCurrentComapny()
    // Check connection every 30 seconds
    const interval = setInterval(() => {
      fetchCompanies();
      fetchCurrentComapny();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    if (!isConnected) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 4000);
    }
  };

  const handleMouseEnter = () => {
    if (!isConnected) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isConnected) {
      setTimeout(() => setShowTooltip(false), 2000);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className="fixed top-3 left-1/2 transform -translate-x-1/2 z-[100]">
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
            bg-white border-gray-300
            transition-all duration-500 ease-in-out
          `}
            style={!isConnected && !isLoading ? {
              animation: 'subtle-blink 2s ease-in-out infinite'
            } : {}}
          >
            <div className="flex items-center space-x-3">
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              ) : isConnected ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <div className="relative">
                  <WifiOff className="h-5 w-5 text-red-600" />
                </div>
              )}

              <span
                className={`font-semibold text-sm text-center ${isConnected ? 'text-black' : 'text-black animate-pulse'
                  }`}
              >
                {isLoading ? 'Checking...' : isConnected ? 'Tally Connected' : 'Tally Not Connected'}<br />
                {!isLoading && ` Active Company in Tally : ${currentCompany}`}
              </span>
            </div>
          </div>
        </div>

        {/* Tooltip Message */}
        {showTooltip && !isConnected && (
          <div className="absolute top-full right-0 mt-2 w-80 transform transition-all duration-300 ease-out animate-in slide-in-from-top-2 fade-in-0">
            <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4 shadow-2xl">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white text-sm mb-1">
                    Tally Connection Required
                  </h3>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Please open Tally and select a company to connect Finetec AI to Tally.
                  </p>
                  <button
                    onClick={fetchCompanies}
                    className="mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Retry Connection
                  </button>
                </div>
              </div>

              {/* Arrow pointing to button */}
              <div className="absolute -top-2 right-6 w-4 h-4 bg-gray-900/95 border-l border-t border-gray-700/50 transform rotate-45"></div>
            </div>
          </div>
        )}

        {/* Success Animation */}
        {isConnected && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-green-400/10 rounded-xl animate-pulse duration-1000"></div>
          </div>
        )}
      </div>
    </>
  );
};

export default TallyConnectionOverlay;


