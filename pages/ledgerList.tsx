import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, List, X, Package, Receipt, RefreshCw, Loader } from 'lucide-react';
import { getCurrentCompanyData, getGSTData, postXml } from '../service/tally';
import { getLedgerNames, getStockItemNames } from '../service/commonFunction';

const ItemList = ({ ledgerData, stockData, showType, isLoading }) => {
    const currentItems = showType === 'ledger' ? ledgerData : stockData;
    const itemType = showType === 'ledger' ? 'Ledgers' : 'Stock Items';
    const itemIcon = showType === 'ledger' ? Receipt : Package;
    const itemColor = showType === 'ledger' ? 'blue' : 'green';
    const itemLabel = showType === 'ledger' ? 'L' : 'S';

    const IconComponent = itemIcon;

    if (isLoading) {
        return (
            <div className="bg-white rounded border shadow-sm">
                <div className={`px-3 py-2 bg-${itemColor}-50 border-b flex items-center justify-between`}>
                    <div className="flex items-center space-x-2">
                        <Loader className={`w-4 h-4 text-${itemColor}-600 animate-spin`} />
                        <h3 className="text-sm font-semibold text-gray-700">Loading {itemType}...</h3>
                    </div>
                </div>
                <div className="p-8 text-center">
                    <div className="flex items-center justify-center space-x-2 text-gray-500">
                        <Loader className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Fetching data...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentItems || currentItems.length === 0) {
        return (
            <div className="p-3 bg-gray-50 rounded border text-sm">
                <p className="text-gray-500 text-center">No {itemType.toLowerCase()} found in the data</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded border shadow-sm">
            {/* Header */}
            <div className={`px-3 py-2 bg-${itemColor}-50 border-b flex items-center justify-between`}>
                <div className="flex items-center space-x-2">
                    <IconComponent className={`w-4 h-4 text-${itemColor}-600`} />
                    <h3 className="text-sm font-semibold text-gray-700">{itemType}</h3>
                </div>
                <span className={`text-xs text-${itemColor}-600 bg-${itemColor}-100 px-2 py-1 rounded`}>
                    {currentItems.length} items
                </span>
            </div>

            <div className="p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {currentItems.map((itemName, index) => (
                        <div
                            key={`${showType}-${index}`}
                            className={`flex items-center p-2 bg-${itemColor}-50 rounded border border-${itemColor}-200 text-sm hover:shadow-sm transition-shadow`}
                        >
                            <div className={`w-5 h-5 bg-${itemColor}-500 text-white rounded-full flex items-center justify-center text-xs font-medium mr-2`}>
                                {index + 1}
                            </div>
                            <span className="text-gray-800 truncate flex-1" title={itemName}>
                                {itemName}
                            </span>
                            <span className={`ml-auto text-xs text-${itemColor}-600 bg-${itemColor}-100 px-1.5 py-0.5 rounded`}>
                                {itemLabel}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Compact Parent component with toggle functionality
const CompactItemListContainer = () => {
    const [showItemList, setShowItemList] = useState(false);
    const [itemType, setItemType] = useState('ledger'); // 'ledger' or 'stock'
    const [ledgerData, setLedgerData] = useState(null);
    const [stockData, setStockData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasInitialLoad, setHasInitialLoad] = useState(false);
    const [currentCompany, setCurrentCompany] = useState(null)

    const toggleItemList = () => {
        setShowItemList(!showItemList);
    };

    const toggleItemType = () => {
        setItemType(itemType === 'ledger' ? 'stock' : 'ledger');
    };


    const fetchCurrentComapny = async () => {
        const response = await getCurrentCompanyData()
        setCurrentCompany(response.data)
    }

    useEffect(() => {

        fetchCurrentComapny()
        // Check connection every 30 seconds
        const interval = setInterval(() => {

            fetchCurrentComapny();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchGstDetails = async () => {
        const xmlData = `<ENVELOPE>
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
				<SVCURRENTCOMPANY>${currentCompany}</SVCURRENTCOMPANY>
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
</ENVELOPE>`;

        try {
            const data = await postXml(xmlData);
            const response = await getLedgerNames(data);
            setLedgerData(response)
        } catch (error) {
            console.error("Error fetching companies:", error);
        } finally {
            setIsLoading(false);
        }
    };


    const fetchStockItem = async () => {

        try {
            const response = await getStockItemNames();
            setStockData(response)
        } catch (error) {
            console.error("Error fetching companies:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshData = async () => {
        setIsLoading(true);
        if (itemType === 'ledger') {
            await fetchGstDetails();
        } else {
            await fetchStockItem();
        }
    };

    // Parse data to get counts for display
    const { ledgerCount, stockCount } = useMemo(() => {
        return {
            ledgerCount: Array.isArray(ledgerData) ? ledgerData.length : 0,
            stockCount: Array.isArray(stockData) ? stockData.length : 0,
        };
    }, [ledgerData, stockData]);


    useEffect(() => {
        if (!hasInitialLoad) {
            fetchGstDetails();
            fetchStockItem();
            setHasInitialLoad(true);
        }
    }, [hasInitialLoad]);

    // Get current data based on selected type
    const currentXmlData = itemType === 'ledger' ? ledgerData : stockData;

    return (
        <div className="w-full mx-auto">
            {/* Compact Header Section with Toggle Buttons */}
            <div className="bg-white rounded border shadow-sm mb-3">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <List className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-800">
                            Item Management
                        </h2>
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* Refresh Button */}
                        {showItemList && (
                            <button
                                onClick={refreshData}
                                disabled={isLoading}
                                className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                                title="Refresh Data"
                            >
                                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                                <span>Refresh</span>
                            </button>
                        )}

                        {/* Item Type Toggle - Only show when list is visible */}
                        {showItemList && (
                            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setItemType('ledger')}
                                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all ${itemType === 'ledger'
                                        ? 'bg-blue-500 text-white'
                                        : 'text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <Receipt className="w-3 h-3" />
                                    <span>Ledgers ({ledgerCount})</span>
                                </button>
                                <button
                                    onClick={() => setItemType('stock')}
                                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all ${itemType === 'stock'
                                        ? 'bg-green-500 text-white'
                                        : 'text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <Package className="w-3 h-3" />
                                    <span>Stock ({stockCount})</span>
                                </button>
                            </div>
                        )}

                        {/* Status Indicator */}
                        <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${showItemList ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span className="text-xs text-gray-600">
                                {showItemList ? 'Visible' : 'Hidden'}
                            </span>
                        </div>

                        {/* Main Toggle Button */}
                        <button
                            onClick={toggleItemList}
                            className={`flex items-center space-x-2 px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 ${showItemList
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                        >
                            {showItemList ? (
                                <>
                                    <X className="w-3 h-3" />
                                    <span>Hide</span>
                                </>
                            ) : (
                                <>
                                    <List className="w-3 h-3" />
                                    <span>Show Items</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Animated Item List Section */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showItemList
                ? 'max-h-screen opacity-100'
                : 'max-h-0 opacity-0'
                }`}>
                {showItemList && (
                    <div className="animate-fade-in">
                        <ItemList
                            ledgerData={Array.isArray(ledgerData) ? ledgerData : []}
                            stockData={Array.isArray(stockData) ? stockData : []}
                            showType={itemType}
                            isLoading={isLoading}
                        />

                    </div>
                )}
            </div>


        </div>
    );
};

export default CompactItemListContainer;