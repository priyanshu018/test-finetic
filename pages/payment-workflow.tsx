// ExpenseClassifier.jsx - Complete AI Expense Classifier Component
import React, { useState } from 'react';
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
    Receipt
} from 'lucide-react';
import { useRouter } from 'next/router';

const ExpenseClassifier = () => {
    // State management
    const [currentStep, setCurrentStep] = useState(1);
    const [businessNature, setBusinessNature] = useState('');
    const [specificIndustry, setSpecificIndustry] = useState('');
    const [documentType, setDocumentType] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState(null);
    const [editingRow, setEditingRow] = useState(null);
    const [filterSuspense, setFilterSuspense] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [error, setError] = useState(null);

    // Python API configuration
    const PYTHON_API_BASE = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';

    // Business nature options
    const businessNatures = [
        {
            value: 'goods_trader',
            label: 'Goods Trader',
            desc: 'Buy and sell physical products',
            icon: '📦'
        },
        {
            value: 'service_provider',
            label: 'Service Provider',
            desc: 'Provide professional services',
            icon: '🛠️'
        },
        {
            value: 'manufacturer',
            label: 'Manufacturer',
            desc: 'Produce/manufacture goods',
            icon: '🏭'
        },
        {
            value: 'retailer',
            label: 'Retailer',
            desc: 'Sell directly to consumers',
            icon: '🏪'
        },
        {
            value: 'wholesaler',
            label: 'Wholesaler',
            desc: 'Sell in bulk to retailers',
            icon: '🏬'
        }
    ];

    // Industry options
    const industryOptions = {
        goods_trader: [
            'Electronics', 'Automotive Parts', 'Textiles', 'Food & Beverages',
            'Hardware', 'Pharmaceuticals', 'Chemicals', 'Metals'
        ],
        service_provider: [
            'IT Services', 'Consulting', 'Legal Services', 'Marketing',
            'Healthcare', 'Education', 'Financial Services', 'Real Estate'
        ],
        manufacturer: [
            'Textile Manufacturing', 'Electronics Manufacturing', 'Food Processing',
            'Chemical Manufacturing', 'Automotive', 'Pharmaceuticals', 'Plastics'
        ],
        retailer: [
            'Fashion Retail', 'Electronics Retail', 'Grocery', 'Home & Garden',
            'Pharmacy', 'Sporting Goods', 'Books & Media'
        ],
        wholesaler: [
            'FMCG Distribution', 'Electronics Distribution', 'Textile Wholesale',
            'Industrial Supplies', 'Food Distribution', 'Medical Supplies'
        ]
    };

    // Document type options
    const documentTypes = [
        {
            value: 'bank_statement',
            label: 'Bank Statements',
            description: 'Process your bank statements to extract and classify all expense transactions',
            icon: CreditCard,
            acceptedFiles: '.pdf',
            fileTypes: 'PDF files only',
            features: ['Extract all debit transactions', 'Identify vendors automatically', 'Classify business expenses', 'Handle multiple months'],
            example: 'Upload your monthly bank statement PDF'
        },
        {
            value: 'expense_bills',
            label: 'Expense Bills',
            description: 'Process individual bills, invoices, and receipts for expense classification',
            icon: Receipt,
            acceptedFiles: '.pdf,.jpg,.jpeg,.png',
            fileTypes: 'PDF, JPG, PNG files',
            features: ['OCR text extraction', 'Vendor identification', 'Amount detection', 'Multi-file processing'],
            example: 'Upload photos or PDFs of bills/invoices'
        }
    ];

    // Classification options
    const classificationOptions = [
        'Fixed (Capital Good)',
        'Trading Variable (Direct Business)',
        'Non-Trading Variable (Indirect Business)',
        'SUSPENSE'
    ];

    // Process documents
    const processDocuments = async () => {
        setProcessing(true);
        setError(null);
        setProcessingProgress(0);

        try {
            const formData = new FormData();
            formData.append('business_nature', businessNature);
            formData.append('specific_industry', specificIndustry);
            formData.append('document_type', documentType);

            uploadedFiles.forEach((file) => {
                formData.append('files', file);
            });

            const progressInterval = setInterval(() => {
                setProcessingProgress(prev => Math.min(prev + 10, 90));
            }, 500);

            const response = await fetch(`${PYTHON_API_BASE}/paymentflow/process`, {
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

        const selectedDocType = documentTypes.find(dt => dt.value === documentType);
        const allowedExtensions = selectedDocType.acceptedFiles.split(',');

        files.forEach(file => {
            if (file.size > 20 * 1024 * 1024) {
                errors.push(`${file.name}: File too large (max 20MB)`);
                return;
            }

            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

            if (!allowedExtensions.includes(fileExtension)) {
                errors.push(`${file.name}: Invalid format for ${selectedDocType.label}. Allowed: ${selectedDocType.fileTypes}`);
                return;
            }

            validFiles.push(file);
        });

        if (errors.length > 0) {
            alert('File validation errors:\n' + errors.join('\n'));
        }

        setUploadedFiles(validFiles);
    };

    // Handle classification editing
    const handleEditClassification = (id, newClassification) => {
        setResults(results.map(item =>
            item.id === id ? { ...item, classification: newClassification } : item
        ));
        setEditingRow(null);
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
        return 'text-gray-700 bg-gray-100';
    };

    // Export to CSV
    const exportToCSV = () => {
        try {
            const headers = [
                'Date', 'Vendor', 'Amount', 'Classification', 'Category',
                'Confidence', 'Source File', 'Description'
            ];

            const csvRows = [
                headers.join(','),
                ...results.map(item => [
                    item.date || new Date().toISOString().split('T')[0],
                    `"${item.vendor || 'Unknown'}"`,
                    item.amount || 0,
                    `"${item.classification}"`,
                    `"${item.category || 'Uncategorized'}"`,
                    item.classification === 'SUSPENSE' ? 'REVIEW' : item.confidence,
                    `"${item.source_file || 'Unknown'}"`,
                    `"${item.description || ''}"`
                ].join(','))
            ];

            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `expense_classification_${documentType}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            alert('Export failed: ' + error.message);
        }
    };

    // Get file icon
    const getFileIcon = (filename) => {
        const extension = filename?.split('.').pop().toLowerCase();
        switch (extension) {
            case 'pdf': return '📄';
            case 'jpg':
            case 'jpeg':
            case 'png': return '🖼️';
            default: return '📎';
        }
    };

    // Reset form
    const resetForm = () => {
        setCurrentStep(1);
        setBusinessNature('');
        setSpecificIndustry('');
        setDocumentType('');
        setUploadedFiles([]);
        setResults(null);
        setError(null);
        setFilterSuspense(false);
    };

    const { push } = useRouter()
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-6 py-4">
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
                                    <span className="text-blue-600">AI</span> Expense Classifier
                                </h1>
                                <p className="text-gray-600">
                                    Intelligent classification for bank statements and expense bills
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

            <div className="max-w-6xl mx-auto px-6 py-8">
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

                {/* Step 1: Business Context */}
                {currentStep === 1 && (
                    <div className="space-y-8">
                        <div className="bg-white rounded-xl shadow-sm p-8">
                            <div className="text-center mb-8">
                                <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                                <h2 className="text-3xl font-bold text-gray-900">Business Information</h2>
                                <p className="text-gray-600 mt-2 text-lg">
                                    Help us classify your expenses with industry-specific intelligence
                                </p>
                            </div>

                            <div className="space-y-8">
                                {/* Business Nature Selection */}
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-6">
                                        What's your business nature?
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {businessNatures.map((nature) => (
                                            <button
                                                key={nature.value}
                                                onClick={() => setBusinessNature(nature.value)}
                                                className={`p-6 rounded-xl border-2 transition-all text-left hover:shadow-md ${businessNature === nature.value
                                                        ? 'border-blue-500 bg-blue-50 shadow-md'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="text-2xl mb-3">{nature.icon}</div>
                                                <h4 className="font-semibold text-gray-900 mb-2">{nature.label}</h4>
                                                <p className="text-gray-600 text-sm">{nature.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Industry Selection */}
                                {businessNature && (
                                    <div className="animate-fadeIn">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-6">
                                            Select your specific industry
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {industryOptions[businessNature]?.map((industry) => (
                                                <button
                                                    key={industry}
                                                    onClick={() => setSpecificIndustry(industry)}
                                                    className={`p-4 rounded-lg border transition-all text-center hover:shadow-sm ${specificIndustry === industry
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                                        }`}
                                                >
                                                    {industry}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {businessNature && specificIndustry && (
                                <div className="mt-8 flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div>
                                        <p className="text-green-800 font-medium">Business Context Set</p>
                                        <p className="text-green-600 text-sm">
                                            {businessNatures.find(n => n.value === businessNature)?.label} - {specificIndustry}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setCurrentStep(2)}
                                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium"
                                    >
                                        Continue to Document Type
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Document Type Selection */}
                {currentStep === 2 && (
                    <div className="bg-white rounded-xl shadow-sm p-8">
                        <div className="text-center mb-8">
                            <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                            <h2 className="text-3xl font-bold text-gray-900">Choose Document Type</h2>
                            <p className="text-gray-600 mt-2 text-lg">
                                Select whether you want to process bank statements or expense bills
                            </p>
                        </div>

                        {/* Business Context Summary */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                            <h3 className="text-blue-800 font-medium mb-2">Selected Business Context:</h3>
                            <p className="text-blue-700">
                                <span className="font-medium">
                                    {businessNatures.find(n => n.value === businessNature)?.label}
                                </span>
                                {' in '}
                                <span className="font-medium">{specificIndustry}</span>
                            </p>
                        </div>

                        {/* Document Type Options */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {documentTypes.map((docType) => {
                                const IconComponent = docType.icon;
                                return (
                                    <button
                                        key={docType.value}
                                        onClick={() => setDocumentType(docType.value)}
                                        className={`p-6 rounded-xl border-2 transition-all text-left hover:shadow-md ${documentType === docType.value
                                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center mb-4">
                                            <IconComponent className="w-8 h-8 text-blue-600 mr-3" />
                                            <h3 className="text-xl font-semibold text-gray-900">{docType.label}</h3>
                                        </div>

                                        <p className="text-gray-600 mb-4">{docType.description}</p>

                                        <div className="space-y-3">
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <p className="text-sm font-medium text-gray-700 mb-2">Supported formats:</p>
                                                <p className="text-sm text-gray-600">{docType.fileTypes}</p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-gray-700 mb-2">Features:</p>
                                                <ul className="space-y-1">
                                                    {docType.features.map((feature, index) => (
                                                        <li key={index} className="text-sm text-gray-600 flex items-center">
                                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="bg-blue-50 p-3 rounded-lg">
                                                <p className="text-sm font-medium text-blue-700">Example:</p>
                                                <p className="text-sm text-blue-600">{docType.example}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {documentType && (
                            <div className="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div>
                                    <p className="text-green-800 font-medium">Document Type Selected</p>
                                    <p className="text-green-600 text-sm">
                                        {documentTypes.find(dt => dt.value === documentType)?.label}
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
                        )}
                    </div>
                )}

                {/* Step 3: File Upload */}
                {currentStep === 3 && (
                    <div className="bg-white rounded-xl shadow-sm p-8">
                        <div className="text-center mb-8">
                            <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                            <h2 className="text-3xl font-bold text-gray-900">
                                Upload {documentTypes.find(dt => dt.value === documentType)?.label}
                            </h2>
                            <p className="text-gray-600 mt-2 text-lg">
                                {documentTypes.find(dt => dt.value === documentType)?.description}
                            </p>
                        </div>

                        {/* Context Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="text-blue-800 font-medium mb-1">Business Context:</h3>
                                <p className="text-blue-700 text-sm">
                                    {businessNatures.find(n => n.value === businessNature)?.label} - {specificIndustry}
                                </p>
                            </div>
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <h3 className="text-purple-800 font-medium mb-1">Document Type:</h3>
                                <p className="text-purple-700 text-sm">
                                    {documentTypes.find(dt => dt.value === documentType)?.label}
                                </p>
                            </div>
                        </div>

                        {/* File Upload Area */}
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <div className="mb-4">
                                <label className="cursor-pointer">
                                    <span className="text-blue-600 hover:text-blue-700 font-medium text-lg">
                                        Click to upload {documentTypes.find(dt => dt.value === documentType)?.label.toLowerCase()}
                                    </span>
                                    <input
                                        type="file"
                                        multiple={documentType === 'expense_bills'}
                                        accept={documentTypes.find(dt => dt.value === documentType)?.acceptedFiles}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </label>
                                <span className="text-gray-600"> or drag and drop</span>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                    {documentTypes.find(dt => dt.value === documentType)?.label} Requirements:
                                </p>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p>📁 <strong>Formats:</strong> {documentTypes.find(dt => dt.value === documentType)?.fileTypes}</p>
                                    <p>📏 <strong>Size limit:</strong> 20MB per file</p>
                                    {documentType === 'bank_statement' && (
                                        <p>📄 <strong>Content:</strong> PDF bank statements with transaction details</p>
                                    )}
                                    {documentType === 'expense_bills' && (
                                        <p>🧾 <strong>Content:</strong> Clear images or PDFs of bills/invoices</p>
                                    )}
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
                                                    <span className="text-lg mr-3">{getFileIcon(file.name)}</span>
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
                                            Process {documentTypes.find(dt => dt.value === documentType)?.label}
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
                                {documentType === 'bank_statement' ? (
                                    <CreditCard className="w-8 h-8 text-blue-600" />
                                ) : (
                                    <Receipt className="w-8 h-8 text-blue-600" />
                                )}
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Processing {documentTypes.find(dt => dt.value === documentType)?.label}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            AI is analyzing your {documentType === 'bank_statement' ? 'bank statement' : 'expense bills'} and classifying transactions...
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
                {currentStep === 4 && results && (
                    <div className="space-y-6">
                        {/* Classification Guide */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                                        <Info className="w-5 h-5 mr-2" />
                                        Classification Results for {documentTypes.find(dt => dt.value === documentType)?.label}
                                    </h3>
                                    <div className="space-y-2 text-sm text-blue-800">
                                        <p><span className="inline-block w-4 h-4 bg-blue-500 rounded mr-2"></span><strong>Fixed:</strong> Capital goods & assets (life > 1 year)</p>
                                        <p><span className="inline-block w-4 h-4 bg-green-500 rounded mr-2"></span><strong>Trading Variable:</strong> Direct business revenue-related expenses</p>
                                        <p><span className="inline-block w-4 h-4 bg-purple-500 rounded mr-2"></span><strong>Non-Trading Variable:</strong> Indirect/administrative expenses</p>
                                        <p><span className="inline-block w-4 h-4 bg-orange-500 rounded mr-2"></span><strong>Suspense:</strong> Items needing manual review/clarification</p>
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
                                    <h2 className="text-2xl font-bold text-gray-900">Classification Results</h2>
                                    <p className="text-gray-600 text-sm mt-1">
                                        Processed {documentTypes.find(dt => dt.value === documentType)?.label} for {businessNatures.find(n => n.value === businessNature)?.label} in {specificIndustry}
                                    </p>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={exportToCSV}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center font-medium"
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

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                                <div className="bg-slate-50 p-4 rounded-lg border">
                                    <div className="flex items-center justify-between mb-2">
                                        <FileSpreadsheet className="w-5 h-5 text-slate-600" />
                                        <span className="text-2xl font-bold text-gray-900">{results.length}</span>
                                    </div>
                                    <p className="text-slate-600 font-medium text-sm">Total Items</p>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="w-5 h-5 bg-blue-500 rounded"></div>
                                        <span className="text-2xl font-bold text-gray-900">
                                            {results.filter(r => r.classification?.includes('Fixed')).length}
                                        </span>
                                    </div>
                                    <p className="text-blue-600 font-medium text-sm">Fixed Assets</p>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="w-5 h-5 bg-green-500 rounded"></div>
                                        <span className="text-2xl font-bold text-gray-900">
                                            {results.filter(r => r.classification?.includes('Trading Variable')).length}
                                        </span>
                                    </div>
                                    <p className="text-green-600 font-medium text-sm">Trading Variable</p>
                                </div>

                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="w-5 h-5 bg-purple-500 rounded"></div>
                                        <span className="text-2xl font-bold text-gray-900">
                                            {results.filter(r => r.classification?.includes('Non-Trading Variable')).length}
                                        </span>
                                    </div>
                                    <p className="text-purple-600 font-medium text-sm">Non-Trading Variable</p>
                                </div>

                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <AlertCircle className="w-5 h-5 text-orange-600" />
                                        <span className="text-2xl font-bold text-gray-900">
                                            {results.filter(r => r.classification === 'SUSPENSE').length}
                                        </span>
                                    </div>
                                    <p className="text-orange-600 font-medium text-sm">Suspense Items</p>
                                </div>

                                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                                        <span className="text-2xl font-bold text-gray-900">
                                            {results.filter(r => r.confidence >= 95 && r.classification !== 'SUSPENSE').length}
                                        </span>
                                    </div>
                                    <p className="text-emerald-600 font-medium text-sm">High Confidence</p>
                                </div>
                            </div>

                            {/* Total Amount Summary */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <DollarSign className="w-5 h-5 text-gray-600 mr-2" />
                                        <span className="font-medium text-gray-700">Total Amount Processed:</span>
                                    </div>
                                    <span className="text-xl font-bold text-gray-900">
                                        ₹{results.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Results Table */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {documentType === 'bank_statement' ? 'Bank Statement Transactions' : 'Expense Bill Details'}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {documentType === 'bank_statement'
                                                ? 'All debit transactions extracted and classified'
                                                : 'Individual bills and invoices processed'
                                            }
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <button
                                            onClick={() => setFilterSuspense(!filterSuspense)}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${filterSuspense
                                                    ? 'bg-orange-100 text-orange-700 border border-orange-300'
                                                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                                                }`}
                                        >
                                            <AlertCircle className="w-4 h-4 mr-2" />
                                            {filterSuspense ? 'Show All' : 'Show Suspense Only'}
                                            {filterSuspense && (
                                                <span className="ml-2 bg-orange-200 text-orange-800 px-2 py-1 rounded-full text-xs">
                                                    {results.filter(r => r.classification === 'SUSPENSE').length}
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Vendor</th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Amount</th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                {documentType === 'bank_statement' ? 'Transaction Date' : 'Bill Date'}
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Classification</th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Category</th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Status</th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                                {documentType === 'bank_statement' ? 'Statement' : 'Bill Source'}
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {(filterSuspense
                                            ? results.filter(item => item.classification === 'SUSPENSE')
                                            : results
                                        ).map((item) => (
                                            <tr
                                                key={item.id}
                                                className={`hover:bg-gray-50 transition-colors ${item.classification === 'SUSPENSE'
                                                        ? 'bg-orange-25 border-l-4 border-orange-300'
                                                        : ''
                                                    }`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {item.vendor || 'Unknown Vendor'}
                                                    </div>
                                                    {item.classification === 'SUSPENSE' && (
                                                        <div className="text-xs text-orange-600 font-medium mt-1">
                                                            ⚠️ Needs Review
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                    ₹{(item.amount || 0).toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {item.date || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {editingRow === item.id ? (
                                                        <select
                                                            value={item.classification}
                                                            onChange={(e) => handleEditClassification(item.id, e.target.value)}
                                                            className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        >
                                                            {classificationOptions.map(option => (
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
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {item.category || 'Uncategorized'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(item.confidence, item.classification)}`}>
                                                        {item.classification === 'SUSPENSE' ? 'REVIEW' : `${item.confidence}%`}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    <div className="truncate max-w-32" title={item.source_file}>
                                                        {getFileIcon(item.source_file || '')} {item.source_file || 'Unknown'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {editingRow === item.id ? (
                                                        <button
                                                            onClick={() => setEditingRow(null)}
                                                            className="text-green-600 hover:text-green-700 p-1 rounded"
                                                            title="Save changes"
                                                        >
                                                            <Save className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => setEditingRow(item.id)}
                                                            className={`p-1 rounded transition-colors ${item.classification === 'SUSPENSE'
                                                                    ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                                                                    : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                                                }`}
                                                            title="Edit classification"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Empty state for filtered view */}
                            {filterSuspense && results.filter(item => item.classification === 'SUSPENSE').length === 0 && (
                                <div className="text-center py-12">
                                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Suspense Items Found!</h3>
                                    <p className="text-gray-600 mb-2">
                                        All {documentType === 'bank_statement' ? 'transactions' : 'bills'} were classified with confidence.
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Your {documentTypes.find(dt => dt.value === documentType)?.label.toLowerCase()} processing was successful!
                                    </p>
                                </div>
                            )}

                            {/* Empty state for no results */}
                            {!filterSuspense && results.length === 0 && (
                                <div className="text-center py-12">
                                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
                                    <p className="text-gray-600">
                                        No {documentType === 'bank_statement' ? 'expense transactions' : 'processable bills'} were found in your {documentTypes.find(dt => dt.value === documentType)?.label.toLowerCase()}.
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