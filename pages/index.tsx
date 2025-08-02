// @ts-nocheck
import { useState, useEffect } from "react";
import { EmailOtpModal } from "../components/otpModal";
import { supabase } from "../lib/supabase";
import BillManagement from "./bill-management";
import AiBill from "./ai-bill";
import Next from "./next";
import { ArrowRight, BarChart3, Calendar, CheckCircle, Clock, CreditCard, FileText, Receipt, Upload, Shield, Users, Zap, TrendingUp, Building2, DollarSign } from "lucide-react";

export default function HeroSection({ setIsAuth }) {
  const [currentPage, setCurrentPage] = useState<"home" | "bill-management" | "ai-bill" | "next">("next");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    supabase.auth.onAuthStateChange((e, session) => {
      if (session?.user) {
        setCurrentPage("next");
      } else {
        setCurrentPage("home")
      }
    });
  }, []);

  const handleNavigation = (page: "home" | "bill-management" | "ai-bill" | "next") => {
    setIsLoading(true);
    setTimeout(() => {
      setCurrentPage(page);
      setIsLoading(false);
    }, 600);
  };

  const renderPage = () => {
    if (isLoading) {
      return <LoadingScreen />;
    }

    switch (currentPage) {
      case "next":
        return <Next onBack={() => handleNavigation("home")} />;
      default:
        return (
          <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="border-b border-gray-200 bg-white">
              <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">Finetic.AI</div>
                      <div className="text-xs text-gray-500">Enterprise Bill Management</div>
                    </div>
                  </div>
                  <nav className="hidden md:flex items-center space-x-8">
                    <a href="#solution" className="text-gray-600 hover:text-gray-900 font-medium">Solution</a>
                    <a href="#enterprise" className="text-gray-600 hover:text-gray-900 font-medium">Enterprise</a>
                    <a href="#security" className="text-gray-600 hover:text-gray-900 font-medium">Security</a>
                    <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium">Pricing</a>
                  </nav>
                    <EmailOtpModal />
                </div>
              </div>
            </header>

            {/* Hero Section */}
            <section className="pt-16 pb-20 bg-gradient-to-b from-gray-50 to-white">
              <div className="max-w-7xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-8">
                    <div className="space-y-6">
                      <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                        <Shield className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-900">Enterprise-Grade Security & Compliance</span>
                      </div>
                      
                      <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                        Automate Your
                        <span className="block text-blue-600">Accounts Payable</span>
                      </h1>
                      
                      <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                        Reduce processing time by 90% and eliminate manual errors with our AI-powered bill management platform trusted by Fortune 500 companies.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <EnterpriseFeature 
                        icon={<TrendingUp className="w-5 h-5 text-green-600" />}
                        text="Average 40% cost reduction in AP operations"
                      />
                      <EnterpriseFeature 
                        icon={<Clock className="w-5 h-5 text-blue-600" />}
                        text="3-minute average processing time per invoice"
                      />
                      <EnterpriseFeature 
                        icon={<CheckCircle className="w-5 h-5 text-green-600" />}
                        text="99.97% accuracy with intelligent validation"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <EmailOtpModal />
                      <button className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                        Schedule Enterprise Demo
                      </button>
                    </div>

                    <div className="pt-6">
                      <p className="text-sm text-gray-500 mb-4">Trusted by leading Indian enterprises 🇮🇳</p>
                      <div className="flex items-center space-x-8">
                        <div className="h-8 px-4 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">Indian SMEs</span>
                        </div>
                        <div className="h-8 px-4 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">GST Ready</span>
                        </div>
                        <div className="h-8 px-4 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">Make In India</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:pl-8">
                    <EnterpriseDemo />
                  </div>
                </div>
              </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-white border-t border-gray-200">
              <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                  <StatCard number="500+" label="Enterprise Clients" />
                  <StatCard number="50M+" label="Bills Processed" />
                  <StatCard number="90%" label="Time Reduction" />
                  <StatCard number="99.97%" label="Accuracy Rate" />
                </div>
              </div>
            </section>

            {/* Solution Overview */}
            <section id="solution" className="py-20 bg-gray-50">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Complete Accounts Payable Solution for India 🇮🇳
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Streamline your entire AP workflow with intelligent automation, 
                    from invoice capture to payment processing and GST-compliant financial reporting.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <ProcessStep
                    number="01"
                    title="Intelligent Capture"
                    description="Multi-channel invoice ingestion with AI-powered data extraction. Supports email, EDI, API, and manual upload with 99.97% accuracy."
                    icon={<Upload className="w-6 h-6" />}
                  />
                  
                  <ProcessStep
                    number="02"
                    title="Smart Processing"
                    description="Automated validation, coding, and routing with customizable approval workflows. Intelligent matching with POs and contracts."
                    icon={<Zap className="w-6 h-6" />}
                  />
                  
                  <ProcessStep
                    number="03"
                    title="Seamless Integration"
                    description="Direct integration with leading Indian ERP systems including Tally, Zoho Books, SAP, and Oracle. GST-compliant with real-time synchronization and reporting 🇮🇳"
                    icon={<Building2 className="w-6 h-6" />}
                  />
                </div>
              </div>
            </section>

            {/* Enterprise Features */}
            <section id="enterprise" className="py-20 bg-white">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Built for Indian Enterprise Scale 🇮🇳
                  </h2>
                  <p className="text-xl text-gray-600">
                    Enterprise-grade capabilities designed for Indian businesses that grow with your success
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <EnterpriseFeatureCard
                    icon={<Shield className="w-6 h-6 text-blue-600" />}
                    title="Security & GST Compliance 🇮🇳"
                    description="GST-ready, RBI guidelines compliant, bank-grade encryption, and comprehensive audit trails for Indian regulatory requirements."
                  />
                  
                  <EnterpriseFeatureCard
                    icon={<Users className="w-6 h-6 text-blue-600" />}
                    title="Advanced Workflows"
                    description="Multi-level approval routing, delegation management, and customizable business rules to match your organizational structure."
                  />
                  
                  <EnterpriseFeatureCard
                    icon={<BarChart3 className="w-6 h-6 text-blue-600" />}
                    title="Analytics & Reporting"
                    description="Real-time dashboards, spend analytics, vendor performance metrics, and customizable reports for strategic insights."
                  />
                  
                  <EnterpriseFeatureCard
                    icon={<DollarSign className="w-6 h-6 text-blue-600" />}
                    title="Cost Optimization 💰"
                    description="Early payment discounts, duplicate detection, GST input credit optimization, and budget variance alerts for maximum savings."
                  />
                  
                  <EnterpriseFeatureCard
                    icon={<Building2 className="w-6 h-6 text-blue-600" />}
                    title="Multi-Entity Support 🏢"
                    description="Centralized processing for multiple Indian subsidiaries, support for INR and international currencies, GST compliance across entities."
                  />
                  
                  <EnterpriseFeatureCard
                    icon={<Clock className="w-6 h-6 text-blue-600" />}
                    title="24/7 Support"
                    description="Dedicated customer success manager, priority support, and comprehensive training programs for your team."
                  />
                </div>
              </div>
            </section>

            {/* ROI Calculator Preview */}
            <section className="py-20 bg-blue-600">
              <div className="max-w-7xl mx-auto px-6 text-center">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-4xl font-bold text-white mb-6">
                    Calculate Your ROI 🇮🇳
                  </h2>
                  <p className="text-xl text-blue-100 mb-12">
                    See how much your Indian business could save with automated accounts payable processing
                  </p>
                  
                  <div className="bg-white rounded-2xl p-8 shadow-xl">
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                      <div>
                        <div className="text-3xl font-bold text-gray-900 mb-2">₹1.5Cr</div>
                        <div className="text-gray-600">Average Annual Savings 💰</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-gray-900 mb-2">4 Months</div>
                        <div className="text-gray-600">Typical Payback Period</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-gray-900 mb-2">280%</div>
                        <div className="text-gray-600">Average 3-Year ROI 🇮🇳</div>
                      </div>
                    </div>
                    <button className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                      Get Your Custom ROI Analysis 📊
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gray-900">
              <div className="max-w-4xl mx-auto px-6 text-center">
                <h2 className="text-4xl font-bold text-white mb-6">
                  Ready to Transform Your AP Process? 🇮🇳
                </h2>
                <p className="text-xl text-gray-300 mb-12">
                  Join thousands of Indian SMEs and enterprises that have automated their accounts payable with Finetic.AI
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <EmailOtpModal />
                  <button className="px-8 py-4 border border-gray-600 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
                    Schedule Free Demo 📞
                  </button>
                </div>
                
                <div className="mt-12 pt-8 border-t border-gray-800">
                  <p className="text-sm text-gray-400">
                    © 2025 Finetic.AI Technologies, Inc. • Made in India 🇮🇳 • GST Compliant • Data Secure
                  </p>
                </div>
              </div>
            </section>
          </div>
        );
    }
  };

  return <>{renderPage()}</>;
}

// Enterprise Feature Component
function EnterpriseFeature({ icon, text }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex-shrink-0">{icon}</div>
      <p className="text-gray-700 font-medium">{text}</p>
    </div>
  );
}

// Enterprise Demo Component
function EnterpriseDemo() {
  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <div className="text-sm font-medium text-gray-600">Finetic.AI Dashboard</div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
            <span className="text-sm text-gray-500">Live Demo</span>
          </div>
          
          <div className="space-y-3">
            <InvoiceItem
              vendor="Tata Motors Ltd"
              amount="₹9,45,000"
              status="approved"
              dueDate="Mar 30, 2025"
            />
            <InvoiceItem
              vendor="Reliance Industries"
              amount="₹2,48,500"
              status="processing"
              dueDate="Apr 05, 2025"
            />
            <InvoiceItem
              vendor="Infosys Technologies"
              amount="₹6,75,000"
              status="pending"
              dueDate="Apr 12, 2025"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <MetricCard label="This Month" value="₹2.1Cr" change="+12%" />
          <MetricCard label="Processing" value="47" change="-8%" />
        </div>
      </div>
    </div>
  );
}

// Invoice Item Component
function InvoiceItem({ vendor, amount, status, dueDate }) {
  const statusConfig = {
    approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
    processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processing' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' }
  };
  
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <div className="font-medium text-gray-900">{vendor}</div>
        <div className="text-sm text-gray-600">Due: {dueDate}</div>
      </div>
      <div className="text-right">
        <div className="font-semibold text-gray-900">{amount}</div>
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusConfig[status].bg} ${statusConfig[status].text}`}>
          {statusConfig[status].label}
        </span>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ label, value, change }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-green-600">{change}</div>
    </div>
  );
}

// Stat Card Component
function StatCard({ number, label }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-gray-900 mb-2">{number}</div>
      <div className="text-gray-600 font-medium">{label}</div>
    </div>
  );
}

// Process Step Component
function ProcessStep({ number, title, description, icon }) {
  return (
    <div className="relative bg-white rounded-xl p-8 shadow-lg border border-gray-200">
      <div className="absolute -top-4 left-8 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
        {number}
      </div>
      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6 mt-4 text-blue-600">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

// Enterprise Feature Card Component
function EnterpriseFeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

// Loading Screen
function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="mt-4 text-sm text-gray-600">Loading...</div>
      </div>
    </div>
  );
}