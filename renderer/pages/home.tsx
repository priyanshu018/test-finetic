// @ts-nocheck
import { useState, useEffect } from "react";
import { EmailOtpModal } from "../components/otpModal";
import { supabase } from "../lib/supabase";
import BillManagement from "./bill-management";
import AiBill from "./ai-bill";
import Next from "./next";
import { ArrowRight, BarChart2, CalendarCheck, CheckCircle2, Clock, CreditCard, FileText, Receipt, Upload } from "lucide-react";

export default function HeroSection({ setIsAuth }) {
  const [currentPage, setCurrentPage] = useState<"home" | "bill-management" | "ai-bill" | "next">("next");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Uncomment when ready to implement auth redirection
    supabase.auth.onAuthStateChange((e, session) => {
      console.log(session?.user)
      if (session?.user) {
        setCurrentPage("next"); // Default redirect inside the app
      }else{
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

  // Render the selected component
  const renderPage = () => {
    if (isLoading) {
      return <LoadingScreen />;
    }

    switch (currentPage) {
      case "bill-management":
        return <BillManagement onBack={() => handleNavigation("home")} />;
      case "ai-bill":
        return <AiBill onBack={() => handleNavigation("home")} />;
      case "next":
        return <Next onBack={() => handleNavigation("home")} />;
      default:
        return (
          <section className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            
            {/* Accent line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-400" />

            {/* Main Content */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
              <div className="flex flex-col lg:flex-row items-center gap-12">
                {/* Hero Text Content */}
                <div className="flex-1 text-center lg:text-left space-y-6">
                  {/* Logo */}
                  <div className="flex items-center justify-center lg:justify-start mb-4">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-px rounded-lg inline-block">
                      <div className="bg-slate-950 px-3 py-1 rounded-lg">
                        <span className="text-white font-bold">Finetic.AI</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Heading */}
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                    Automate Your <br className="hidden md:block" />
                    <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                      Bill Management
                    </span>
                  </h1>
                  
                  {/* Subheading */}
                  <p className="text-xl text-slate-300 max-w-xl mx-auto lg:mx-0">
                    Stop manually entering bills into your accounting software. 
                    Let Finetic.AI handle it for you.
                  </p>
                  
                  {/* Feature bullets */}
                  <div className="space-y-3">
                    <FeatureBullet 
                      icon={<Upload className="w-5 h-5 text-blue-400" />}
                      text="Upload bills in any format - PDF, image, email or text"
                    />
                    <FeatureBullet 
                      icon={<CreditCard className="w-5 h-5 text-blue-400" />}
                      text="AI automatically extracts and categorizes bill information"
                    />
                    <FeatureBullet 
                      icon={<FileText className="w-5 h-5 text-blue-400" />}
                      text="Seamless integration with Tally and many more coming soon"
                    />
                  </div>
                  
                  {/* CTA buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-8">
                    <EmailOtpModal />
                    {/* <button 
                      onClick={() => handleNavigation("bill-management")}
                      className="group px-6 py-3 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <span>See How It Works</span>
                      <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </button> */}
                  </div>
                  
                  {/* Integration logos */}
                  <div className="mt-8">
                    <p className="text-sm text-slate-400 mb-4">Integrates With:</p>
                    <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6">
                      <div className="h-8 w-20 bg-slate-800 rounded-md flex items-center justify-center text-xs text-slate-400">Tally</div>
                      <div className="h-8 w-40 bg-slate-800 rounded-md flex items-center justify-center text-xs text-slate-400">More Coming soon</div>
                      {/* <div className="h-8 w-24 bg-slate-800 rounded-md flex items-center justify-center text-xs text-slate-400">FreshBooks</div>
                      <div className="h-8 w-20 bg-slate-800 rounded-md flex items-center justify-center text-xs text-slate-400">MYOB</div> */}
                    </div>
                  </div>
                </div>

                {/* Bill Management Visual */}
                <div style={{opacity:0.7}} className="flex-1 w-full max-w-md mx-auto lg:max-w-none mt-12 lg:mt-0">
                  <div className="relative">
                    {/* Bill Upload Section */}
                    <div className="mb-6 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
                      <div className="bg-slate-900 px-5 py-3 border-b border-slate-700 flex items-center">
                        <Upload className="w-4 h-4 text-blue-400 mr-2" />
                        <span className="text-sm text-white">Bill Upload</span>
                      </div>
                      <div className="p-6 text-center">
                        <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 mb-4 flex flex-col items-center justify-center">
                          <FileText className="w-12 h-12 text-slate-500 mb-3" />
                          <p className="text-sm text-slate-400 mb-2">Drag and drop bills here</p>
                          <p className="text-xs text-slate-500">Supports PDF, JPG, PNG, and email forwards</p>
                          <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">
                            Select Files
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bill Processing Preview */}
                    <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
                      <div className="bg-slate-900 px-5 py-3 border-b border-slate-700 flex items-center">
                        <Receipt className="w-4 h-4 text-blue-400 mr-2" />
                        <span className="text-sm text-white">AI Processing</span>
                        <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                          Live Demo
                        </span>
                      </div>
                      
                      <div className="p-6">
                        {/* Bill Item */}
                        <BillItem
                          vendor="AT&T"
                          amount="$89.99"
                          date="Mar 15, 2025"
                          category="Utilities"
                          status="processed"
                        />
                        
                        {/* Bill Item */}
                        <BillItem
                          vendor="Adobe Creative Cloud"
                          amount="$54.99"
                          date="Mar 18, 2025"
                          category="Software"
                          status="processing"
                        />
                        
                        {/* Bill Item */}
                        <BillItem
                          vendor="Office Supply Co."
                          amount="$127.86"
                          date="Mar 22, 2025"
                          category="Office Expenses"
                          status="waiting"
                        />
                        
                        <div className="mt-4 text-center">
                          <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-300">
                            View All Bills →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* How It Works Section */}
              <div className="mt-24">
                <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-12">
                  How <span className="text-blue-400">It Works</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
                  <StepCard 
                    number="1"
                    title="Upload Your Bills"
                    description="Upload PDFs or images of your bills, or simply forward them via email to our system."
                    icon={<Upload className="w-6 h-6" />}
                  />
                  
                  <StepCard 
                    number="2"
                    title="AI Does the Heavy Lifting"
                    description="Our AI extracts vendor, amount, due date, and other important details automatically."
                    icon={<CreditCard className="w-6 h-6" />}
                  />
                  
                  <StepCard 
                    number="3"
                    title="Sync with Accounting"
                    description="Automatically send the processed bills to your accounting software with proper categorization."
                    icon={<CheckCircle2 className="w-6 h-6" />}
                  />
                </div>
              </div>
              
              {/* Key Features Section */}
              <div className="mt-24">
                <div className="text-center mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    Why Choose <span className="text-blue-400">Finetic.AI</span>
                  </h2>
                  <p className="text-slate-400 max-w-2xl mx-auto">
                    Our bill management solution saves you time and reduces errors 
                    by automating your accounts payable process
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FeatureCard 
                    icon={<Clock className="w-5 h-5 text-blue-400" />}
                    title="Save 5+ Hours Weekly"
                    description="Eliminate manual data entry and free up your time for more important tasks."
                  />
                  
                  <FeatureCard 
                    icon={<Receipt className="w-5 h-5 text-blue-400" />}
                    title="99.8% Accuracy"
                    description="Our AI accurately extracts data from bills with industry-leading precision."
                  />
                  
                  <FeatureCard 
                    icon={<CalendarCheck className="w-5 h-5 text-blue-400" />}
                    title="Never Miss a Payment"
                    description="Smart reminders ensure you never miss due dates or incur late fees."
                  />
                  
                  <FeatureCard 
                    icon={<BarChart2 className="w-5 h-5 text-blue-400" />}
                    title="Spending Insights"
                    description="Get valuable insights into your spending patterns and vendor relationships."
                  />
                  
                  <FeatureCard 
                    icon={<FileText className="w-5 h-5 text-blue-400" />}
                    title="Accounting Integration"
                    description="Seamlessly sync with popular accounting software platforms."
                  />
                  
                  <FeatureCard 
                    icon={<CheckCircle2 className="w-5 h-5 text-blue-400" />}
                    title="Approval Workflows"
                    description="Customize approval flows to match your company's process."
                  />
                </div>
              </div>
              
              {/* CTA Section */}
              <div className="mt-24">
                <div className="bg-gradient-to-r from-blue-900/30 to-slate-900 rounded-2xl p-8 md:p-12 text-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    Ready to Automate Your Bill Management?
                  </h2>
                  <p className="text-slate-300 max-w-2xl mx-auto mb-8">
                    Join thousands of businesses that have simplified their accounts payable process with Finetic.AI
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <EmailOtpModal />
                    <button 
                      onClick={() => window.open('#', '_blank')}
                      className="px-6 py-3 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-all duration-300"
                    >
                      Schedule Demo
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="mt-24 py-6 border-t border-slate-800">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="flex items-center space-x-4 mb-4 md:mb-0">
                    <div className="text-xs text-slate-500">
                      © 2025 Finetic.AI Technologies, Inc.
                    </div>
                  </div>
                  <div className="flex space-x-6">
                    {/* <div className="text-xs text-slate-500">Terms</div>
                    <div className="text-xs text-slate-500">Privacy</div>
                    <div className="text-xs text-slate-500">Contact</div> */}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
    }
  };

  return <>{renderPage()}</>;
}

// Feature Bullet Component
function FeatureBullet({ icon, text }) {
  return (
    <div className="flex items-start">
      <div className="mt-1 mr-3">{icon}</div>
      <p className="text-slate-300">{text}</p>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-500/30 transition-all duration-300">
      <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}

// Step Card Component
function StepCard({ number, title, description, icon }) {
  return (
    <div className="relative">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-500/30 transition-all duration-300 h-full">
        <div className="absolute -top-5 -left-2 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
          {number}
        </div>
        <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center mb-4 mt-2 text-blue-400">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      {number !== "3" && (
        <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2">
          <ArrowRight className="w-4 h-4 text-blue-400" />
        </div>
      )}
    </div>
  );
}

// Bill Item Component
function BillItem({ vendor, amount, date, category, status }) {
  return (
    <div className="bg-slate-900 rounded-lg p-3 mb-3 border border-slate-800">
      <div className="flex justify-between items-start mb-2">
        <div className="font-medium text-white">{vendor}</div>
        <div className="font-bold text-white">{amount}</div>
      </div>
      <div className="flex justify-between text-xs">
        <div className="text-slate-400">Due: {date}</div>
        <div className="text-slate-400">Category: {category}</div>
      </div>
      <div className="mt-2 flex justify-between items-center">
        <div className="h-1 bg-slate-800 rounded-full flex-grow mr-3">
          <div 
            className={`h-full rounded-full ${
              status === 'processed' ? 'bg-green-500 w-full' : 
              status === 'processing' ? 'bg-blue-500 w-2/3' :
              'bg-slate-600 w-1/3'
            }`}
          ></div>
        </div>
        <div className="text-xs whitespace-nowrap">
          {status === 'processed' ? (
            <span className="text-green-500">Processed</span>
          ) : status === 'processing' ? (
            <span className="text-blue-500">Processing...</span>
          ) : (
            <span className="text-slate-400">Waiting</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading Screen
function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950 z-50">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
        <div className="mt-4 text-sm text-slate-400">Loading...</div>
      </div>
    </div>
  );
}

// CSS Additions
/* 
.bg-grid-pattern {
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
}
*/