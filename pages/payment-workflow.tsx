// ExpenseClassifier.jsx - Complete Business Classifier with Category & Subcategory Selection
"use client"
import React, { useEffect, useState } from 'react';
import {
    Upload,
    Building2,
    ChevronRight,
    CheckCircle,
    Edit3,
    Download,
    Loader2,
    FileText,
    ArrowLeft,
    Save,
    AlertCircle,
    TrendingUp,
    DollarSign,
    FileSpreadsheet,
    Eye,
    EyeOff,
    RefreshCw,
    Info,
    CreditCard,
    ArrowUpCircle,
    ArrowDownCircle,
    Banknote,
    Factory,
    Briefcase,
    ShoppingCart,
    X
} from 'lucide-react';
import { useRouter } from 'next/router';
import * as XLSX from 'xlsx';
import { BackendLink } from '../service/api';
import { extractLedgerCategories, fetchLedgerList, generatePaymentVoucherXMLFromPayload, generateTallyLedgerXML } from '../service/TALLY/payment-flow';

const ExpenseClassifier = () => {
    // State management
    const [currentStep, setCurrentStep] = useState(1);
    const [businessCategory, setBusinessCategory] = useState('');
    const [businessSubcategory, setBusinessSubcategory] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState(null);
    const [summary, setSummary] = useState(null);
    const [editingRow, setEditingRow] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [tempCategoryValue, setTempCategoryValue] = useState(''); // NEW: Temporary value for category editing
    const [filterType, setFilterType] = useState('all'); // 'all', 'debit', 'credit', 'suspense', 'cash'
    const [showDetails, setShowDetails] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const yourTransactionsArray = [
        {
            vendor: "SELF",
            amount: 15000,
            date: "2024-08-20",
            description: "CASH DEPOSIT SELF",
            transaction_type: "CREDIT",
            classification: "Cash Deposit",
            confidence: 95,
            category: "Cash Deposit",
            id: "78337c54-202f-49a2-a573-b1469496c09a",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056467",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: 15000,
            running_balance: 15000,
            transaction_impact: "positive"
        },
        {
            vendor: "ICI NEXT 57 CO",
            amount: 5074,
            date: "2024-09-09",
            description: "Chq No. 786048 ICI NEXT 57 CO 786048",
            transaction_type: "DEBIT",
            classification: "Trading Variable (Direct Business)",
            confidence: 85,
            category: "Software Subscription",
            id: "817a1f3e-c639-433c-83c5-55fba8425c95",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056518",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: -5074,
            running_balance: 9926,
            transaction_impact: "negative"
        },
        {
            vendor: "SELF",
            amount: 15000,
            date: "2024-10-04",
            description: "CASH DEPOSIT SELF",
            transaction_type: "CREDIT",
            classification: "Cash Deposit",
            confidence: 95,
            category: "Cash Deposit",
            id: "1dd81488-93e4-4f4d-8f6c-6ba116887b10",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056539",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: 15000,
            running_balance: 24926,
            transaction_impact: "positive"
        },
        {
            vendor: "ICI NEXT 57",
            amount: 5074,
            date: "2024-10-10",
            description: "Chq No. 786049 ICI NEXT 57 786049",
            transaction_type: "DEBIT",
            classification: "Trading Variable (Direct Business)",
            confidence: 85,
            category: "Software Subscription",
            id: "03df8036-aca8-4a94-84ea-638cd7960ce8",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056558",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: -5074,
            running_balance: 19852,
            transaction_impact: "negative"
        },
        {
            vendor: "Mrs. GURDEV KAUR",
            amount: 11900,
            date: "2024-10-16",
            description: "CHEQUE TRANSFER TO 786050 0030904374591 OF Mrs. GURDEV KAUR",
            transaction_type: "DEBIT",
            classification: "Non-Trading Variable (Indirect Business)",
            confidence: 80,
            category: "Consultant Payment",
            id: "54b48806-b3f0-411f-a091-e459b29eb30b",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056576",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: -11900,
            running_balance: 7952,
            transaction_impact: "negative"
        },
        {
            vendor: "SELF",
            amount: 25000,
            date: "2024-10-19",
            description: "CASH DEPOSIT SELF",
            transaction_type: "CREDIT",
            classification: "Cash Deposit",
            confidence: 95,
            category: "Cash Deposit",
            id: "637753c7-dd49-4bdf-871d-4ac592605568",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056594",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: 25000,
            running_balance: 32952,
            transaction_impact: "positive"
        },
        {
            vendor: "Mrs. Vibha Pundir",
            amount: 9000,
            date: "2024-10-30",
            description: "CHEQUE TRANSFER TO 786051 0039550763614 OF Mrs. Vibha Pundir",
            transaction_type: "DEBIT",
            classification: "Non-Trading Variable (Indirect Business)",
            confidence: 80,
            category: "Consultant Payment",
            id: "90fb62b5-09a7-4f33-b0b0-fa82c0f4aa9d",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056610",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: -9000,
            running_balance: 23952,
            transaction_impact: "negative"
        },
        {
            vendor: "SELF",
            amount: 10000,
            date: "2024-11-06",
            description: "CASH DEPOSIT SELF",
            transaction_type: "CREDIT",
            classification: "Cash Deposit",
            confidence: 95,
            category: "Cash Deposit",
            id: "0cb1659b-7aeb-4356-818a-72c804b9b9a1",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056628",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: 10000,
            running_balance: 33952,
            transaction_impact: "positive"
        },
        {
            vendor: "ICI NEXT 57",
            amount: 5074,
            date: "2024-11-22",
            description: "Chq No. 786052 ICI NEXT 57 786052",
            transaction_type: "DEBIT",
            classification: "Trading Variable (Direct Business)",
            confidence: 85,
            category: "Software Subscription",
            id: "35c54378-18cd-4c98-8da5-e8a30228447b",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056645",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: -5074,
            running_balance: 28878,
            transaction_impact: "negative"
        },
        {
            vendor: "Amritsar Lounge",
            amount: 2,
            date: "2024-11-22",
            description: "OTHPOS432715338196Amritsar Lounge AMRITSAR",
            transaction_type: "DEBIT",
            classification: "Non-Trading Variable (Indirect Business)",
            confidence: 75,
            category: "Miscellaneous Expense",
            id: "8111c3de-d3ea-4443-a560-9b4508577539",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056662",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: -2,
            running_balance: 28876,
            transaction_impact: "negative"
        },
        {
            vendor: "Amritsar Lounge",
            amount: 2,
            date: "2024-11-23",
            description: "OTHPOS432717501469Amritsar Lounge AMRITSAR",
            transaction_type: "DEBIT",
            classification: "Non-Trading Variable (Indirect Business)",
            confidence: 75,
            category: "Miscellaneous Expense",
            id: "ce30c39c-7919-4b30-a0ea-83afa19b1853",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056678",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: -2,
            running_balance: 28874,
            transaction_impact: "negative"
        },
        {
            vendor: "UNKNOWN VENDOR",
            amount: 9000,
            date: "2024-12-11",
            description: "CSH DEP (CDM) 9800000000",
            transaction_type: "CREDIT",
            classification: "Cash Deposit",
            confidence: 90,
            category: "Cash Deposit",
            id: "317c786b-4084-4899-bc2d-ac27672403f9",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056695",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: 9000,
            running_balance: 37874,
            transaction_impact: "positive"
        },
        {
            vendor: "ICI NEXT 57",
            amount: 5074,
            date: "2024-12-16",
            description: "Chq No. 786053 ICI NEXT 57 786053",
            transaction_type: "DEBIT",
            classification: "Trading Variable (Direct Business)",
            confidence: 85,
            category: "Software Subscription",
            id: "8349c767-82af-43f9-a814-55d441ea91eb",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056712",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: -5074,
            running_balance: 32800,
            transaction_impact: "negative"
        },
        {
            vendor: "CHINMAY GUPTA",
            amount: 6000,
            date: "2025-01-01",
            description: "Chq No. 786054 CHINMAY GUPTA 786054",
            transaction_type: "DEBIT",
            classification: "Non-Trading Variable (Indirect Business)",
            confidence: 80,
            category: "Consultant Payment",
            id: "5a0e5463-1f4d-4928-98db-a06d7a881401",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056728",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: -6000,
            running_balance: 26800,
            transaction_impact: "negative"
        },
        {
            vendor: "SELF",
            amount: 35000,
            date: "2025-01-02",
            description: "CASH DEPOSIT SELF",
            transaction_type: "CREDIT",
            classification: "Cash Deposit",
            confidence: 95,
            category: "Cash Deposit",
            id: "bbe68347-abbe-4a84-b547-4438828ca073",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056744",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: 35000,
            running_balance: 61800,
            transaction_impact: "positive"
        },
        {
            vendor: "AMAZON PAY INDIA",
            amount: 928,
            date: "2025-01-02",
            description: "OTHPG 500215296318AMAZON PAY INDIA PRIVA124662480",
            transaction_type: "DEBIT",
            classification: "Trading Variable (Direct Business)",
            confidence: 85,
            category: "Software/Service Purchase",
            id: "36730ee2-7ed5-4e8a-b3e0-67b69bed6013",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056761",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: -928,
            running_balance: 60872,
            transaction_impact: "negative"
        },
        {
            vendor: "ATM CASH 1712 AERO ARCADE",
            amount: 10000,
            date: "2025-01-07",
            description: "ATM WDL ATM CASH 1712 AERO ARCADE",
            transaction_type: "DEBIT",
            classification: "Cash Withdrawal",
            confidence: 95,
            category: "Cash Withdrawal",
            id: "006e6e10-6422-4caf-8b67-6ecee8edd68e",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056777",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: -10000,
            running_balance: 50872,
            transaction_impact: "negative"
        },
        {
            vendor: "ICI ENLIGHT INFOTECH",
            amount: 3540,
            date: "2025-01-28",
            description: "Chq No. 786056 ICI ENLIGHT INFOTECH 786056",
            transaction_type: "DEBIT",
            classification: "Trading Variable (Direct Business)",
            confidence: 85,
            category: "Software Subscription",
            id: "7395f2ac-6ec6-4f34-8114-ee40424496e9",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056793",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: -3540,
            running_balance: 47332,
            transaction_impact: "negative"
        },
        {
            vendor: "RAZ*apnaco Mumbai",
            amount: 707,
            date: "2025-01-29",
            description: "OTHPG 502908670535RAZ*apnaco Mumbai",
            transaction_type: "DEBIT",
            classification: "Non-Trading Variable (Indirect Business)",
            confidence: 80,
            category: "Miscellaneous Expense",
            id: "5615c3dc-5cf0-466c-88bb-f6b4f39812d8",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056810",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: -707,
            running_balance: 46625,
            transaction_impact: "negative"
        },
        {
            vendor: "ICI ENLIGHT INFOTECH",
            amount: 3540,
            date: "2025-02-11",
            description: "Chq No. 786057 ICI ENLIGHT INFOTECH 786057",
            transaction_type: "DEBIT",
            classification: "Trading Variable (Direct Business)",
            confidence: 85,
            category: "Software Subscription",
            id: "6027f48b-a7d3-4c75-8836-19cd4d1a14b0",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056826",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: -3540,
            running_balance: 43085,
            transaction_impact: "negative"
        },
        {
            vendor: "ICI NEXT 57",
            amount: 5074,
            date: "2025-02-15",
            description: "Chq No. 786058 ICI NEXT 57 786058",
            transaction_type: "DEBIT",
            classification: "Trading Variable (Direct Business)",
            confidence: 85,
            category: "Software Subscription",
            id: "12d10924-f596-4295-959b-107da59e0566",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056843",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: -5074,
            running_balance: 38011,
            transaction_impact: "negative"
        },
        {
            vendor: "STATE BANK OF INDIA",
            amount: 394.51,
            date: "2025-03-12",
            description: "AC KEEPING FEES",
            transaction_type: "DEBIT",
            classification: "Non-Trading Variable (Indirect Business)",
            confidence: 90,
            category: "Bank Charges",
            id: "5a07c6c0-925b-4d86-943f-bad06fed2277",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056859",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: -394.51,
            running_balance: 37616.49,
            transaction_impact: "negative"
        },
        {
            vendor: "Mrs. Vibha Pundir",
            amount: 14000,
            date: "2025-03-15",
            description: "CHEQUE TRANSFER TO 786062 0039550763614 OF Mrs. Vibha Pundir",
            transaction_type: "DEBIT",
            classification: "Non-Trading Variable (Indirect Business)",
            confidence: 80,
            category: "Consultant Payment",
            id: "ea899ef3-e15c-4285-ab15-08c9d10211af",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056876",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: -14000,
            running_balance: 23616.489999999998,
            transaction_impact: "negative"
        },
        {
            vendor: "ICI ENLIGHT INFOTECH",
            amount: 3540,
            date: "2025-03-17",
            description: "Chq No. 786060 ICI ENLIGHT INFOTECH 786060",
            transaction_type: "DEBIT",
            classification: "Trading Variable (Direct Business)",
            confidence: 85,
            category: "Software Subscription",
            id: "6af93d1d-1eb8-498e-97d6-5c443786348b",
            source_file: "DOLLARDUCKS.pdf",
            timestamp: "2025-06-12T14:01:44.056894",
            extraction_confidence: 87.96445880452342,
            ai_model: "deepseek-chat",
            business_category: "service",
            business_subcategory: "IT Services",
            file_type: ".pdf",
            balance_change: -3540,
            running_balance: 20076.489999999998,
            transaction_impact: "negative"
        }
    ]

    useEffect(() => {
        // const getLedgerData = async () => {
        //     try {
        //         const response = await fetchLedgerList();

        //     } catch (error) {
        //         console.error("Error fetching ledger list:", error);
        //     }
        // };

        //   getLedgerData();

        // const xml = generateTallyLedgerXML([
        //     { ledgerName: "Software Subscription", type: "Indirect Expenses" },
        //     { ledgerName: "Direct Subscription", type: "Direct Expenses" }
        // ]);

        // console.log(xml)

        // const payload = [
        //     {
        //         account: "Dollar Ducks TEST",
        //         category: "Software Subscription",
        //         amount: 15555000
        //     }
        // ];

        // const xml2 = generatePaymentVoucherXMLFromPayload(payload);
        // console.log(xml2);



        (async () => {
            const categoriesToCreate = await extractLedgerCategories(yourTransactionsArray);
            console.log("Missing ledgers:", categoriesToCreate);
        })();

    }, []);

    // Main business categories
    const businessCategories = [
        {
            value: 'service',
            label: 'Service Business',
            desc: 'Professional services, consulting, expertise-based businesses',
            icon: <Briefcase className="w-8 h-8" />,
            color: 'blue',
            bgGradient: 'from-blue-50 to-blue-100',
            borderColor: 'border-blue-200'
        },
        {
            value: 'manufacturing',
            label: 'Manufacturing Business',
            desc: 'Production, processing, assembly, industrial operations',
            icon: <Factory className="w-8 h-8" />,
            color: 'green',
            bgGradient: 'from-green-50 to-green-100',
            borderColor: 'border-green-200'
        },
        {
            value: 'trading',
            label: 'Trading Business',
            desc: 'Buying, selling, import/export, distribution operations',
            icon: <ShoppingCart className="w-8 h-8" />,
            color: 'purple',
            bgGradient: 'from-purple-50 to-purple-100',
            borderColor: 'border-purple-200'
        }
    ];

    // Subcategories for each main category
    const businessSubcategories = {
        service: [
            { value: 'IT Services', desc: 'Software development, tech consulting, IT support' },
            { value: 'Consulting', desc: 'Business advisory, management consulting' },
            { value: 'Healthcare', desc: 'Medical services, clinics, healthcare providers' },
            { value: 'Legal Services', desc: 'Law firms, legal advisory services' },
            { value: 'Financial Services', desc: 'Accounting, financial advisory, banking' },
            { value: 'Education', desc: 'Training institutes, educational services' }
        ],
        manufacturing: [
            { value: 'Textile Manufacturing', desc: 'Garment production, fabric manufacturing' },
            { value: 'Food Processing', desc: 'Food production, packaging, processing' },
            { value: 'Electronics Manufacturing', desc: 'Electronics assembly, component production' },
            { value: 'Chemical Production', desc: 'Chemical manufacturing, processing' },
            { value: 'Automotive Parts', desc: 'Auto component manufacturing' },
            { value: 'Pharmaceuticals', desc: 'Drug manufacturing, pharmaceutical production' }
        ],
        trading: [
            { value: 'Import/Export', desc: 'International trade, import-export business' },
            { value: 'Wholesale Distribution', desc: 'Bulk trading, distribution business' },
            { value: 'Retail Operations', desc: 'Retail stores, consumer sales' },
            { value: 'E-commerce', desc: 'Online retail, digital marketplace' },
            { value: 'FMCG Trading', desc: 'Fast-moving consumer goods trading' },
            { value: 'Electronics Trading', desc: 'Electronics and technology products trading' }
        ]
    };

    // Classification options for debits
    const debitClassificationOptions = [
        'Fixed (Capital Good)',
        'Trading Variable (Direct Business)',
        'Non-Trading Variable (Indirect Business)',
        'Cash Withdrawal',
        'SUSPENSE'
    ];

    // Classification options for credits
    const creditClassificationOptions = [
        'Direct Income',
        'Other Income',
        'Cash Deposit',
        'SUSPENSE'
    ];

    // Process documents - FIXED: Now sends both category and subcategory
    const processDocuments = async () => {
        setProcessing(true);
        setError(null);
        setProcessingProgress(0);

        try {
            const formData = new FormData();
            // IMPORTANT: Send both business_category and business_subcategory
            formData.append('business_category', businessCategory);
            formData.append('business_subcategory', businessSubcategory);

            uploadedFiles.forEach((file) => {
                formData.append('files', file);
            });

            const progressInterval = setInterval(() => {
                setProcessingProgress(prev => Math.min(prev + 10, 90));
            }, 500);

            console.log('Sending request with:', {
                business_category: businessCategory,
                business_subcategory: businessSubcategory,
                files: uploadedFiles.length
            });

            const response = await fetch(`${BackendLink}/paymentflow/process`, {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);
            setProcessingProgress(100);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Processing failed');
            }

            const data = await response.json();

            if (data.success) {
                setResults(data.results);
                setSummary(data.summary);
                setCurrentStep(4);

                if (data.processing_errors && data.processing_errors.length > 0) {
                    console.warn('Processing warnings:', data.processing_errors);
                }
            } else {
                throw new Error('Processing failed - no results returned');
            }

        } catch (error) {
            console.error('Processing error:', error);
            setError(error.message);
        } finally {
            setProcessing(false);
            setProcessingProgress(0);
        }
    };

    // Handle file upload
    const handleFileUpload = (event) => {
        const files = Array.from(event.target.files);
        const validFiles = [];
        const errors = [];

        files.forEach(file => {
            if (file.size > 20 * 1024 * 1024) {
                errors.push(`${file.name}: File too large (max 20MB)`);
                return;
            }

            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            if (!['.pdf', '.xls', '.xlsx'].includes(fileExtension)) {
                errors.push(`${file.name}: Only PDF and Excel files (.xls, .xlsx) are supported`);
                return;
            }

            validFiles.push(file);
        });

        if (errors.length > 0) {
            alert('File validation errors:\n' + errors.join('\n'));
        }

        setUploadedFiles(validFiles);
    };

    // Start editing both classification and category - UPDATED
    const startRowEdit = (id, currentClassification, currentCategory) => {
        setEditingRow(id);
        setEditingCategory(id);
        setTempCategoryValue(currentCategory || '');
    };

    // Helper function to count matching vendor transactions - NEW
    const getMatchingVendorCount = (currentId, vendorName) => {
        if (!vendorName || !results) return 0;

        const vendorPrefix = vendorName.trim().toUpperCase().substring(0, 6);
        if (vendorPrefix.length < 6) return 0;

        return results.filter(item => {
            const itemVendorPrefix = (item.vendor || '').trim().toUpperCase().substring(0, 6);
            return item.id !== currentId && itemVendorPrefix === vendorPrefix;
        }).length;
    };

    // Save both classification and category changes - UPDATED with vendor matching
    const saveRowChanges = (id) => {
        // Get current classification value from the select element
        const selectElement = document.querySelector(`select[data-item-id="${id}"]`);
        const newClassification = selectElement ? selectElement.value : null;

        // Find the current item to get its vendor name
        const currentItem = results.find(item => item.id === id);
        if (!currentItem) return;

        // Get the first 6 characters of the vendor name (trimmed and uppercase for comparison)
        const vendorPrefix = (currentItem.vendor || '').trim().toUpperCase().substring(0, 6);

        // Update the results with both classification and category
        setResults(results.map(item => {
            // Check if this item's vendor starts with the same 6 characters
            const itemVendorPrefix = (item.vendor || '').trim().toUpperCase().substring(0, 6);
            const shouldUpdate = item.id === id || (vendorPrefix.length >= 6 && itemVendorPrefix === vendorPrefix);

            if (shouldUpdate) {
                const updates = {};
                if (newClassification) updates.classification = newClassification;
                if (tempCategoryValue !== undefined) updates.category = tempCategoryValue;
                return { ...item, ...updates };
            }
            return item;
        }));

        // Reset editing states
        setEditingRow(null);
        setEditingCategory(null);
        setTempCategoryValue('');
    };

    // Cancel editing both fields - UPDATED
    const cancelRowEdit = () => {
        setEditingRow(null);
        setEditingCategory(null);
        setTempCategoryValue('');
    };

    // Handle table sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Get file icon with Excel support
    const getFileIcon = (filename) => {
        const extension = filename?.split('.').pop().toLowerCase();
        switch (extension) {
            case 'pdf': return '📄';
            case 'xls':
            case 'xlsx': return '📊';
            default: return '📎';
        }
    };

    // Get sort icon
    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <span className="text-gray-400">↕️</span>;
        }
        return sortConfig.direction === 'asc' ? <span className="text-blue-600">↑</span> : <span className="text-blue-600">↓</span>;
    };

    // Color functions
    const getConfidenceColor = (confidence, classification) => {
        if (classification === 'SUSPENSE') {
            return 'text-orange-600 bg-orange-50 border border-orange-200';
        }
        if (confidence >= 95) return 'text-green-600 bg-green-50';
        if (confidence >= 85) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const getClassificationColor = (classification) => {
        if (classification === 'SUSPENSE') {
            return 'text-orange-700 bg-orange-100 border border-orange-300';
        }
        if (classification?.includes('Fixed')) {
            return 'text-blue-700 bg-blue-100';
        }
        if (classification?.includes('Trading Variable')) {
            return 'text-green-700 bg-green-100';
        }
        if (classification?.includes('Non-Trading Variable')) {
            return 'text-purple-700 bg-purple-100';
        }
        if (classification?.includes('Direct Income')) {
            return 'text-emerald-700 bg-emerald-100';
        }
        if (classification?.includes('Other Income')) {
            return 'text-teal-700 bg-teal-100';
        }
        if (classification?.includes('Cash')) {
            return 'text-amber-700 bg-amber-100';
        }
        return 'text-gray-700 bg-gray-100';
    };

    const getTransactionTypeColor = (transactionType) => {
        if (transactionType === 'DEBIT') {
            return 'text-red-700 bg-red-100 border border-red-200';
        }
        if (transactionType === 'CREDIT') {
            return 'text-green-700 bg-green-100 border border-green-200';
        }
        return 'text-gray-700 bg-gray-100';
    };

    const getCategoryColor = (category) => {
        const colors = {
            service: 'blue',
            manufacturing: 'green',
            trading: 'purple'
        };
        return colors[category] || 'gray';
    };

    // Export to CSV
    const exportToCSV = () => {
        try {
            const headers = [
                'Date', 'Vendor', 'Amount', 'Transaction Type', 'Balance Change', 'Running Balance',
                'Classification', 'Category', 'Confidence', 'Source File', 'Description',
                'Business Category', 'Business Subcategory'
            ];

            const csvRows = [
                headers.join(','),
                ...results.map(item => [
                    item.date || new Date().toISOString().split('T')[0],
                    `"${item.vendor || 'Unknown'}"`,
                    item.amount || 0,
                    item.transaction_type || 'DEBIT',
                    item.balance_change || 0,
                    item.running_balance || 0,
                    `"${item.classification}"`,
                    `"${item.category || 'Uncategorized'}"`,
                    item.classification === 'SUSPENSE' ? 'REVIEW' : item.confidence,
                    `"${item.source_file || 'Unknown'}"`,
                    `"${item.description || ''}"`,
                    `"${businessCategory.toUpperCase()}"`,
                    `"${businessSubcategory}"`
                ].join(','))
            ];

            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${businessCategory}_${businessSubcategory.replace(/[^a-zA-Z0-9]/g, '_')}_analysis_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            alert('Export failed: ' + error.message);
        }
    };

    // Export to Excel
    const exportToExcel = () => {
        try {
            const workbook = XLSX.utils.book_new();

            // Prepare data for Excel
            const excelData = results.map(item => ({
                'Date': item.date || new Date().toISOString().split('T')[0],
                'Vendor': item.vendor || 'Unknown',
                'Amount': item.amount || 0,
                'Transaction Type': item.transaction_type || 'DEBIT',
                'Balance Change': item.balance_change || 0,
                'Running Balance': item.running_balance || 0,
                'Classification': item.classification,
                'Category': item.category || 'Uncategorized',
                'Confidence': item.classification === 'SUSPENSE' ? 'REVIEW' : `${item.confidence}%`,
                'Source File': item.source_file || 'Unknown',
                'Description': item.description || '',
                'Business Category': businessCategory.toUpperCase(),
                'Business Subcategory': businessSubcategory
            }));

            // Create worksheet
            const worksheet = XLSX.utils.json_to_sheet(excelData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

            // Create summary sheet
            const summaryData = [
                { 'Metric': 'Business Category', 'Value': businessCategory.toUpperCase(), 'Amount': '' },
                { 'Metric': 'Business Subcategory', 'Value': businessSubcategory, 'Amount': '' },
                { 'Metric': 'Total Transactions', 'Value': summary?.total_items || 0, 'Amount': '' },
                { 'Metric': 'Debit Transactions', 'Value': summary?.debit_transactions || 0, 'Amount': `₹${summary?.total_debit_amount?.toLocaleString('en-IN') || 0}` },
                { 'Metric': 'Credit Transactions', 'Value': summary?.credit_transactions || 0, 'Amount': `₹${summary?.total_credit_amount?.toLocaleString('en-IN') || 0}` },
                { 'Metric': 'Final Balance', 'Value': summary?.final_balance > 0 ? 'Positive' : 'Negative', 'Amount': `₹${summary?.final_balance?.toLocaleString('en-IN') || 0}` },
                { 'Metric': 'Net Balance Change', 'Value': '', 'Amount': `₹${summary?.net_balance_change?.toLocaleString('en-IN') || 0}` },
                { 'Metric': 'Largest Credit', 'Value': '', 'Amount': `₹${summary?.largest_credit?.toLocaleString('en-IN') || 0}` },
                { 'Metric': 'Largest Debit', 'Value': '', 'Amount': `₹${summary?.largest_debit?.toLocaleString('en-IN') || 0}` },
                { 'Metric': 'Suspense Items', 'Value': summary?.suspense_items || 0, 'Amount': `₹${summary?.suspense_amount?.toLocaleString('en-IN') || 0}` },
                { 'Metric': 'High Confidence', 'Value': summary?.high_confidence || 0, 'Amount': '' },
                { 'Metric': 'Average Confidence', 'Value': `${summary?.average_confidence?.toFixed(1) || 0}%`, 'Amount': '' }
            ];

            const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

            // Write file
            XLSX.writeFile(workbook, `${businessCategory}_${businessSubcategory.replace(/[^a-zA-Z0-9]/g, '_')}_analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            alert('Excel export failed: ' + error.message);
        }
    };

    // Filter results based on type and search term
    const getFilteredResults = () => {
        if (!results) return [];

        let filtered = results;

        // Apply type filter
        switch (filterType) {
            case 'debit':
                filtered = results.filter(item => item.transaction_type === 'DEBIT');
                break;
            case 'credit':
                filtered = results.filter(item => item.transaction_type === 'CREDIT');
                break;
            case 'suspense':
                filtered = results.filter(item => item.classification === 'SUSPENSE');
                break;
            case 'cash':
                filtered = results.filter(item =>
                    item.classification?.includes('Cash') ||
                    item.classification?.includes('Withdrawal') ||
                    item.classification?.includes('Deposit')
                );
                break;
            default:
                filtered = results;
        }

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(item =>
                (item.vendor?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.classification?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.category?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.date?.includes(searchTerm)) ||
                (item.amount?.toString().includes(searchTerm))
            );
        }

        // Apply sorting
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle different data types
                if (sortConfig.key === 'amount' || sortConfig.key === 'balance_change' || sortConfig.key === 'running_balance') {
                    aValue = Number(aValue) || 0;
                    bValue = Number(bValue) || 0;
                } else if (sortConfig.key === 'date') {
                    aValue = new Date(aValue || '1900-01-01');
                    bValue = new Date(bValue || '1900-01-01');
                } else {
                    aValue = String(aValue || '').toLowerCase();
                    bValue = String(bValue || '').toLowerCase();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return filtered;
    };

    // Reset form
    const resetForm = () => {
        setCurrentStep(1);
        setBusinessCategory('');
        setBusinessSubcategory('');
        setUploadedFiles([]);
        setResults(null);
        setSummary(null);
        setError(null);
        setFilterType('all');
    };

    const { push } = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    if (currentStep === 1) {
                                        push("/")
                                    } else {
                                        setCurrentStep(currentStep - 1)
                                    }
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Go back"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    <span className="text-blue-600">AI</span> Business Statement Analyzer
                                </h1>
                                <p className="text-gray-600">
                                    Smart classification with Excel support, search, and sorting features
                                </p>
                            </div>
                        </div>

                        {/* Progress indicator */}
                        <div className="flex items-center space-x-2">
                            {[1, 2, 3, 4].map((step) => (
                                <div
                                    key={step}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step <= currentStep
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-200 text-gray-600'
                                        }`}
                                >
                                    {step < currentStep ? (
                                        <CheckCircle className="w-5 h-5" />
                                    ) : (
                                        step
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto px-6 py-8">
                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                            <div>
                                <h3 className="text-red-800 font-medium">Processing Error</h3>
                                <p className="text-red-700 text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 1: Business Category Selection */}
                {currentStep === 1 && (
                    <div className="space-y-8">
                        <div className="bg-white rounded-xl shadow-sm p-8">
                            <div className="text-center mb-8">
                                <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                                <h2 className="text-3xl font-bold text-gray-900">Select Business Category</h2>
                                <p className="text-gray-600 mt-2 text-lg">
                                    Choose your primary business category for accurate classification
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {businessCategories.map((category) => (
                                    <button
                                        key={category.value}
                                        onClick={() => setBusinessCategory(category.value)}
                                        className={`p-8 rounded-xl border-2 transition-all text-left hover:shadow-lg group ${businessCategory === category.value
                                            ? `border-${category.color}-500 bg-gradient-to-br ${category.bgGradient} shadow-lg`
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className={`text-${category.color}-600 mb-4 group-hover:scale-110 transition-transform`}>
                                            {category.icon}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3">{category.label}</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">{category.desc}</p>
                                    </button>
                                ))}
                            </div>

                            {businessCategory && (
                                <div className="animate-fadeIn">
                                    <div className="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <div>
                                            <p className="text-green-800 font-medium">Business Category Selected</p>
                                            <p className="text-green-600 text-sm">
                                                {businessCategories.find(c => c.value === businessCategory)?.label}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setCurrentStep(2)}
                                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium"
                                        >
                                            Continue to Subcategory
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Business Subcategory Selection */}
                {currentStep === 2 && (
                    <div className="space-y-8">
                        <div className="bg-white rounded-xl shadow-sm p-8">
                            <div className="text-center mb-8">
                                {businessCategories.find(c => c.value === businessCategory)?.icon}
                                <h2 className="text-3xl font-bold text-gray-900 mt-4">Select Business Subcategory</h2>
                                <p className="text-gray-600 mt-2 text-lg">
                                    Choose your specific business type within {businessCategories.find(c => c.value === businessCategory)?.label}
                                </p>
                            </div>

                            {/* Selected Category Summary */}
                            <div className={`bg-gradient-to-r ${businessCategories.find(c => c.value === businessCategory)?.bgGradient} ${businessCategories.find(c => c.value === businessCategory)?.borderColor} border rounded-lg p-4 mb-8`}>
                                <div className="flex items-center justify-center">
                                    <div className={`text-${getCategoryColor(businessCategory)}-600 mr-4`}>
                                        {businessCategories.find(c => c.value === businessCategory)?.icon}
                                    </div>
                                    <div>
                                        <h3 className={`text-${getCategoryColor(businessCategory)}-800 font-bold text-lg`}>
                                            {businessCategories.find(c => c.value === businessCategory)?.label}
                                        </h3>
                                        <p className={`text-${getCategoryColor(businessCategory)}-700 text-sm`}>
                                            {businessCategories.find(c => c.value === businessCategory)?.desc}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Subcategory Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                {businessSubcategories[businessCategory]?.map((subcategory) => (
                                    <button
                                        key={subcategory.value}
                                        onClick={() => setBusinessSubcategory(subcategory.value)}
                                        className={`p-6 rounded-lg border transition-all text-left hover:shadow-md ${businessSubcategory === subcategory.value
                                            ? `border-${getCategoryColor(businessCategory)}-500 bg-${getCategoryColor(businessCategory)}-50 shadow-md`
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <h4 className="font-semibold text-gray-900 mb-2">{subcategory.value}</h4>
                                        <p className="text-gray-600 text-sm">{subcategory.desc}</p>
                                    </button>
                                ))}
                            </div>

                            {businessSubcategory && (
                                <div className="animate-fadeIn">
                                    <div className="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <div>
                                            <p className="text-green-800 font-medium">Business Subcategory Selected</p>
                                            <p className="text-green-600 text-sm">
                                                {businessSubcategory} in {businessCategories.find(c => c.value === businessCategory)?.label}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setCurrentStep(3)}
                                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium"
                                        >
                                            Continue to Upload
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: File Upload */}
                {currentStep === 3 && (
                    <div className="bg-white rounded-xl shadow-sm p-8">
                        <div className="text-center mb-8">
                            <CreditCard className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                            <h2 className="text-3xl font-bold text-gray-900">Upload Bank Statements</h2>
                            <p className="text-gray-600 mt-2 text-lg">
                                Upload PDF or Excel bank statements for {businessSubcategory} analysis
                            </p>
                        </div>

                        {/* Business Context Summary */}
                        <div className={`bg-gradient-to-r ${businessCategories.find(c => c.value === businessCategory)?.bgGradient} ${businessCategories.find(c => c.value === businessCategory)?.borderColor} border rounded-lg p-6 mb-8`}>
                            <div className="flex items-center justify-center mb-4">
                                <div className={`text-${getCategoryColor(businessCategory)}-600 mr-4`}>
                                    {businessCategories.find(c => c.value === businessCategory)?.icon}
                                </div>
                                <div className="text-center">
                                    <h3 className={`text-${getCategoryColor(businessCategory)}-800 font-bold text-xl`}>
                                        {businessSubcategory}
                                    </h3>
                                    <p className={`text-${getCategoryColor(businessCategory)}-700 text-sm`}>
                                        {businessCategories.find(c => c.value === businessCategory)?.label} • AI will classify with {businessSubcategory} context
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Feature Highlights */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
                                <div className="flex items-center mb-4">
                                    <ArrowDownCircle className="w-8 h-8 text-red-600 mr-3" />
                                    <h3 className="text-lg font-semibold text-red-900">Expense Analysis</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-red-800">
                                    <li>• Fixed Assets & Capital Goods</li>
                                    <li>• Direct Business Expenses</li>
                                    <li>• Administrative Expenses</li>
                                    <li>• Cash Withdrawals & ATM</li>
                                </ul>
                            </div>

                            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                                <div className="flex items-center mb-4">
                                    <ArrowUpCircle className="w-8 h-8 text-green-600 mr-3" />
                                    <h3 className="text-lg font-semibold text-green-900">Income Analysis</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-green-800">
                                    <li>• Primary Business Revenue</li>
                                    <li>• Secondary Income Sources</li>
                                    <li>• Cash Deposits</li>
                                    <li>• Interest & Other Income</li>
                                </ul>
                            </div>
                        </div>

                        {/* File Upload Area */}
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <div className="mb-4">
                                <label className="cursor-pointer">
                                    <span className="text-blue-600 hover:text-blue-700 font-medium text-lg">
                                        Click to upload bank statement files
                                    </span>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.xls,.xlsx"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </label>
                                <span className="text-gray-600"> or drag and drop</span>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Requirements:</p>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p>📁 <strong>Format:</strong> PDF or Excel files (.xls, .xlsx)</p>
                                    <p>📏 <strong>Size limit:</strong> 20MB per file</p>
                                    <p>📄 <strong>Content:</strong> Bank statements with transaction details</p>
                                    <p>🤖 <strong>AI:</strong> DeepSeek with {businessSubcategory} context</p>
                                </div>
                            </div>

                            {uploadedFiles.length > 0 && (
                                <div className="mt-8 text-left">
                                    <h4 className="font-medium text-gray-900 mb-4 text-center">
                                        📁 Uploaded Files ({uploadedFiles.length})
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {uploadedFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                                            >
                                                <div className="flex items-center">
                                                    <span className="text-lg mr-3">📄</span>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 truncate max-w-48">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {(file.size / 1024 / 1024).toFixed(1)} MB
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setUploadedFiles(files => files.filter((_, i) => i !== index))}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                    title="Remove file"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {uploadedFiles.length > 0 && (
                            <div className="mt-8 flex justify-between items-center">
                                <button
                                    onClick={resetForm}
                                    className="text-gray-600 hover:text-gray-800 flex items-center"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Start Over
                                </button>
                                <button
                                    onClick={processDocuments}
                                    disabled={processing}
                                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium disabled:opacity-50"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Analyze Bank Statements
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Processing State */}
                {processing && (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <div className="relative w-24 h-24 mx-auto mb-6">
                            <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                {businessCategories.find(c => c.value === businessCategory)?.icon}
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Processing {businessSubcategory} Statements
                        </h2>
                        <p className="text-gray-600 mb-6">
                            DeepSeek AI is analyzing your bank statements (PDF/Excel) with {businessSubcategory} business context...
                        </p>
                        <div className="max-w-md mx-auto">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>Progress</span>
                                <span>{processingProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${processingProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Results */}
                {currentStep === 4 && results && summary && (
                    <div className="space-y-6">
                        {/* Classification Guide */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                                        <Info className="w-5 h-5 mr-2" />
                                        {businessSubcategory} Analysis Results
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
                                        <div>
                                            <h4 className="font-semibold mb-2 text-red-800">EXPENSE Classifications:</h4>
                                            <div className="space-y-1">
                                                <p><span className="inline-block w-4 h-4 bg-blue-500 rounded mr-2"></span><strong>Fixed:</strong> Capital goods & assets</p>
                                                <p><span className="inline-block w-4 h-4 bg-green-500 rounded mr-2"></span><strong>Trading Variable:</strong> Direct business expenses</p>
                                                <p><span className="inline-block w-4 h-4 bg-purple-500 rounded mr-2"></span><strong>Non-Trading Variable:</strong> Support expenses</p>
                                                <p><span className="inline-block w-4 h-4 bg-amber-500 rounded mr-2"></span><strong>Cash Withdrawal:</strong> ATM & cash</p>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2 text-green-800">INCOME Classifications:</h4>
                                            <div className="space-y-1">
                                                <p><span className="inline-block w-4 h-4 bg-emerald-500 rounded mr-2"></span><strong>Direct Income:</strong> Business revenue</p>
                                                <p><span className="inline-block w-4 h-4 bg-teal-500 rounded mr-2"></span><strong>Other Income:</strong> Non-business income</p>
                                                <p><span className="inline-block w-4 h-4 bg-amber-500 rounded mr-2"></span><strong>Cash Deposit:</strong> Cash deposits</p>
                                                <p><span className="inline-block w-4 h-4 bg-orange-500 rounded mr-2"></span><strong>Suspense:</strong> Review needed</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                                >
                                    {showDetails ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                                    {showDetails ? 'Hide' : 'Show'} Details
                                </button>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Transaction Analysis</h2>
                                    <p className="text-gray-600 text-sm mt-1">
                                        Bank statements processed for {businessSubcategory} ({businessCategories.find(c => c.value === businessCategory)?.label})
                                    </p>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={exportToExcel}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center font-medium"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Export Excel
                                    </button>
                                    <button
                                        onClick={exportToCSV}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Export CSV
                                    </button>
                                    <button
                                        onClick={resetForm}
                                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center font-medium"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        New Analysis
                                    </button>
                                </div>
                            </div>

                            {/* Enhanced Summary Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
                                <div className="bg-slate-50 p-4 rounded-lg border">
                                    <div className="flex items-center justify-between mb-2">
                                        <FileSpreadsheet className="w-5 h-5 text-slate-600" />
                                        <span className="text-2xl font-bold text-gray-900">{summary.total_items}</span>
                                    </div>
                                    <p className="text-slate-600 font-medium text-sm">Total Items</p>
                                </div>

                                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <ArrowDownCircle className="w-5 h-5 text-red-600" />
                                        <span className="text-2xl font-bold text-gray-900">{summary.debit_transactions}</span>
                                    </div>
                                    <p className="text-red-600 font-medium text-sm">Debits</p>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <ArrowUpCircle className="w-5 h-5 text-green-600" />
                                        <span className="text-2xl font-bold text-gray-900">{summary.credit_transactions}</span>
                                    </div>
                                    <p className="text-green-600 font-medium text-sm">Credits</p>
                                </div>

                                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <Banknote className="w-5 h-5 text-amber-600" />
                                        <span className="text-2xl font-bold text-gray-900">
                                            {(summary.debit_classification_breakdown?.cash_withdrawal || 0) +
                                                (summary.credit_classification_breakdown?.cash_deposit || 0)}
                                        </span>
                                    </div>
                                    <p className="text-amber-600 font-medium text-sm">Cash</p>
                                </div>

                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <AlertCircle className="w-5 h-5 text-orange-600" />
                                        <span className="text-2xl font-bold text-gray-900">{summary.suspense_items}</span>
                                    </div>
                                    <p className="text-orange-600 font-medium text-sm">Suspense</p>
                                </div>

                                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                                        <span className="text-2xl font-bold text-gray-900">{summary.high_confidence}</span>
                                    </div>
                                    <p className="text-emerald-600 font-medium text-sm">High Confidence</p>
                                </div>
                            </div>

                            {/* Amount and Balance Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <ArrowDownCircle className="w-5 h-5 text-red-600 mr-2" />
                                            <span className="font-medium text-red-700">Total Debits:</span>
                                        </div>
                                        <span className="text-xl font-bold text-red-900">
                                            ₹{summary.total_debit_amount?.toLocaleString('en-IN') || 0}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <ArrowUpCircle className="w-5 h-5 text-green-600 mr-2" />
                                            <span className="font-medium text-green-700">Total Credits:</span>
                                        </div>
                                        <span className="text-xl font-bold text-green-900">
                                            ₹{summary.total_credit_amount?.toLocaleString('en-IN') || 0}
                                        </span>
                                    </div>
                                </div>
                                <div className={`p-4 rounded-lg border ${(summary.final_balance || 0) >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <DollarSign className={`w-5 h-5 mr-2 ${(summary.final_balance || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                                            <span className={`font-medium ${(summary.final_balance || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net Balance:</span>
                                        </div>
                                        <span className={`text-xl font-bold ${(summary.final_balance || 0) >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                                            {(summary.final_balance || 0) >= 0 ? '+' : ''}₹{(summary.final_balance || 0).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filter Buttons and Results Table */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            All transactions classified for {businessSubcategory}
                                        </p>
                                    </div>
                                </div>

                                {/* Search Input */}
                                <div className="mb-4">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search transactions by vendor, description, amount, or date..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Search Results Indicator */}
                                {searchTerm && (
                                    <div className="mb-4 text-sm text-gray-600">
                                        Showing {getFilteredResults().length} of {summary.total_items} transactions
                                        {searchTerm && ` matching "${searchTerm}"`}
                                    </div>
                                )}

                                {/* Filter Buttons */}
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => setFilterType('all')}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${filterType === 'all'
                                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                                            }`}
                                    >
                                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                                        All ({summary.total_items})
                                    </button>
                                    <button
                                        onClick={() => setFilterType('debit')}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${filterType === 'debit'
                                            ? 'bg-red-100 text-red-700 border border-red-300'
                                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                                            }`}
                                    >
                                        <ArrowDownCircle className="w-4 h-4 mr-2" />
                                        Debits ({summary.debit_transactions})
                                    </button>
                                    <button
                                        onClick={() => setFilterType('credit')}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${filterType === 'credit'
                                            ? 'bg-green-100 text-green-700 border border-green-300'
                                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                                            }`}
                                    >
                                        <ArrowUpCircle className="w-4 h-4 mr-2" />
                                        Credits ({summary.credit_transactions})
                                    </button>
                                    <button
                                        onClick={() => setFilterType('cash')}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${filterType === 'cash'
                                            ? 'bg-amber-100 text-amber-700 border border-amber-300'
                                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                                            }`}
                                    >
                                        <Banknote className="w-4 h-4 mr-2" />
                                        Cash ({(summary.debit_classification_breakdown?.cash_withdrawal || 0) +
                                            (summary.credit_classification_breakdown?.cash_deposit || 0)})
                                    </button>
                                    <button
                                        onClick={() => setFilterType('suspense')}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${filterType === 'suspense'
                                            ? 'bg-orange-100 text-orange-700 border border-orange-300'
                                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                                            }`}
                                    >
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        Suspense ({summary.suspense_items})
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th
                                                className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('date')}
                                            >
                                                <div className="flex items-center">
                                                    Date {getSortIcon('date')}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('vendor')}
                                            >
                                                <div className="flex items-center">
                                                    Vendor/Description {getSortIcon('vendor')}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('amount')}
                                            >
                                                <div className="flex items-center">
                                                    Amount {getSortIcon('amount')}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('balance_change')}
                                            >
                                                <div className="flex items-center">
                                                    Balance Change {getSortIcon('balance_change')}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('running_balance')}
                                            >
                                                <div className="flex items-center">
                                                    Running Balance {getSortIcon('running_balance')}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('transaction_type')}
                                            >
                                                <div className="flex items-center">
                                                    Type {getSortIcon('transaction_type')}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('classification')}
                                            >
                                                <div className="flex items-center">
                                                    Classification {getSortIcon('classification')}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('category')}
                                            >
                                                <div className="flex items-center">
                                                    Category {getSortIcon('category')}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('confidence')}
                                            >
                                                <div className="flex items-center">
                                                    Status {getSortIcon('confidence')}
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {getFilteredResults().map((item) => (
                                            <tr
                                                key={item.id}
                                                className={`hover:bg-gray-50 transition-colors ${item.classification === 'SUSPENSE'
                                                    ? 'bg-orange-25 border-l-4 border-orange-300'
                                                    : ''
                                                    }`}
                                            >
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {item.date || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {item.vendor || 'Unknown Vendor'}
                                                    </div>
                                                    {item.description && (
                                                        <div className="text-xs text-gray-500 mt-1 truncate max-w-48">
                                                            {item.description}
                                                        </div>
                                                    )}
                                                    {item.classification === 'SUSPENSE' && (
                                                        <div className="text-xs text-orange-600 font-medium mt-1">
                                                            ⚠️ Needs Review
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    <span className={`${item.transaction_type === 'DEBIT' ? 'text-red-900' : 'text-green-900'}`}>
                                                        {item.transaction_type === 'DEBIT' ? '-' : '+'}₹{(item.amount || 0).toLocaleString('en-IN')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    <span className={`${(item.balance_change || 0) >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                                                        {(item.balance_change || 0) >= 0 ? '+' : ''}₹{(item.balance_change || 0).toLocaleString('en-IN')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${(item.running_balance || 0) >= 0 ? 'text-blue-700 bg-blue-100' : 'text-orange-700 bg-orange-100'}`}>
                                                        ₹{(item.running_balance || 0).toLocaleString('en-IN')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(item.transaction_type)}`}>
                                                        {item.transaction_type === 'DEBIT' ? (
                                                            <>
                                                                <ArrowDownCircle className="w-3 h-3 inline mr-1" />
                                                                DEBIT
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ArrowUpCircle className="w-3 h-3 inline mr-1" />
                                                                CREDIT
                                                            </>
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {editingRow === item.id ? (
                                                        <select
                                                            data-item-id={item.id}
                                                            defaultValue={item.classification}
                                                            className="border text-black border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        >
                                                            {(item.transaction_type === 'DEBIT' ? debitClassificationOptions : creditClassificationOptions).map(option => (
                                                                <option key={option} value={option}>{option}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getClassificationColor(item.classification)}`}>
                                                            {item.classification}
                                                            {item.classification === 'SUSPENSE' && (
                                                                <span className="ml-1">⚠️</span>
                                                            )}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {editingCategory === item.id ? (
                                                        <input
                                                            type="text"
                                                            value={tempCategoryValue}
                                                            onChange={(e) => setTempCategoryValue(e.target.value)}
                                                            className="border text-black border-gray-300 rounded px-2 py-1 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Enter category..."
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-600 px-2 py-1 rounded">
                                                            {item.category || 'Not set'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(item.confidence, item.classification)}`}>
                                                        {item.classification === 'SUSPENSE' ? 'REVIEW' : `${item.confidence}%`}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {editingRow === item.id ? (
                                                        <div className="flex flex-col space-y-2">
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => saveRowChanges(item.id)}
                                                                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center"
                                                                    title="Save changes"
                                                                >
                                                                    <Save className="w-3 h-3 mr-1" />
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={cancelRowEdit}
                                                                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center"
                                                                    title="Cancel editing"
                                                                >
                                                                    <X className="w-3 h-3 mr-1" />
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                            {(() => {
                                                                const matchingCount = getMatchingVendorCount(item.id, item.vendor);
                                                                return matchingCount > 0 ? (
                                                                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border">
                                                                        💡 Will update {matchingCount + 1} similar transactions
                                                                    </div>
                                                                ) : null;
                                                            })()}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => startRowEdit(item.id, item.classification, item.category)}
                                                            className={`bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center ${item.classification === 'SUSPENSE'
                                                                ? 'bg-orange-600 hover:bg-orange-700'
                                                                : ''
                                                                }`}
                                                            title="Edit classification and category"
                                                        >
                                                            <Edit3 className="w-3 h-3 mr-1" />
                                                            Edit
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Empty state for filtered view */}
                            {getFilteredResults().length === 0 && (
                                <div className="text-center py-12">
                                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        No {filterType === 'all' ? 'transactions' : filterType} found!
                                    </h3>
                                    <p className="text-gray-600">
                                        {filterType === 'suspense' && 'All transactions were classified with confidence.'}
                                        {filterType === 'cash' && 'No cash transactions found in the statements.'}
                                        {filterType === 'debit' && 'No debit transactions found.'}
                                        {filterType === 'credit' && 'No credit transactions found.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpenseClassifier;