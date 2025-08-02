// @ts-nocheck
import React, { useState, useEffect } from "react";
import { EmailOtpModal } from "../components/otpModal";
import { supabase } from "../lib/supabase";
import BillManagement from "./bill-management";
import AiBill from "./ai-bill";
import Next from "./next";
import { ArrowRight, BarChart3, Calendar, CheckCircle, Clock, CreditCard, FileText, Receipt, Upload, Shield, Users, Zap, TrendingUp, Building2, DollarSign, ChevronRight, Package, Target, Settings, Star, ChevronLeft, Menu, X } from "lucide-react";

export default function HeroSection({ setIsAuth }) {
  const [currentPage, setCurrentPage] = useState<"home" | "bill-management" | "ai-bill" | "next">("next");
  const [isLoading, setIsLoading] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.onAuthStateChange((e, session) => {
      console.log(session?.user)
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

  const testimonials = [
    {
      name: "John Clayton",
      text: "This platform helped me finally understand where my money goes every month. The budgeting tools and spending insights are spot on!",
      date: "August 29, 2024",
      rating: 5
    },
    {
      name: "John Clayton",
      text: "This platform helped me finally understand where my money goes every month. The budgeting tools and spending insights are spot on!",
      date: "August 29, 2024",
      rating: 5
    },
    {
      name: "John Clayton",
      text: "This platform helped me finally understand where my money goes every month. The budgeting tools and spending insights are spot on!",
      date: "August 29, 2024",
      rating: 5
    }
  ];

  const companies = ['Tally', 'Busy', 'Xero', 'Tally', 'Busy', 'Xero', 'Tally', 'Busy'];

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
          <div className="min-h-screen text-black bg-gray-50">
            {/* Header */}
            <div style={{
              backgroundImage: "url(https://ygmjdexujknxnpyqxjzi.supabase.co/storage/v1/object/public/assets//bgimage.png)",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundSize: "cover", // This makes it cover the full container
              width: "100vw", // Ensures the div itself is full viewport width
              minHeight: "100vh"
            }}>
              < header className="bg-gray-50 w-[90vw] mx-auto rounded-full px-5 py-2  border-b sticky top-5 z-50" >
                <div className="container mx-auto px-4">
                  <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                      <img className="h-10 " src="https://i.ibb.co/MkHkJWfh/svgviewer-png-output-4.png" />
                    </div>

                    <nav className="hidden md:flex items-center space-x-8">
                      <a href="#solution" className="text-gray-700 hover:text-blue-600">Solution</a>
                      <a href="#enterprise" className="text-gray-700 hover:text-blue-600">Enterprise</a>
                      <a href="#security" className="text-gray-700 hover:text-blue-600">Security</a>
                      <a href="#pricing" className="text-gray-700 hover:text-blue-600">Pricing</a>
                      <EmailOtpModal />
                    </nav>

                    <button
                      className="md:hidden"
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                      {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                  </div>
                </div>
              </header>

              {/* Hero Section */}
              <section className="relative overflow-hidden py-20 pb-[400px]">
                <div className="container mx-auto px-4">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
                      <Shield className="w-4 h-4 mr-2" />
                      Enterprise-Grade Security & Compliance
                    </div>

                    <h1 className="text-5xl text-black font-bold mb-6">
                      Automate Your Accounts Payable<br />
                      with <span className="bg-blue-600 text-white px-4 py-1 rounded-lg inline-block">Finetic AI</span>
                    </h1>

                    <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                      Reduce processing time by 90% and eliminate manual errors with our AI-powered bill
                      management platform trusted by 500+ companies.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                        Schedule Enterprise Demo
                      </button>
                      <EmailOtpModal />
                    </div>
                  </div>

                  {/* Dashboard Preview */}

                </div>
              </section>
            </div >

            {/* Trusted By Section */}
            < section className="py-12 bg-white" >
              <div className="container mx-auto px-4">
                <h2 className="text-center text-2xl font-semibold mb-8">
                  Trusted by leading Indian enterprises 🇮🇳
                </h2>
                <div className="flex flex-wrap justify-center items-center gap-8">
                  <img src="https://ygmjdexujknxnpyqxjzi.supabase.co/storage/v1/object/public/assets//new-image.png" />
                </div>
              </div>
            </section >

            {/* Stats Section */}
            < section className="py-20 bg-gray-50" >
              <div className="container mx-auto px-4">
                <h2 className="text-4xl font-bold text-center mb-4">
                  Unlock the Power of Your<br />Business Data
                </h2>

                <div className="grid md:grid-cols-4 gap-8 mt-12 max-w-4xl mx-auto">
                  <StatCard icon={<Users />} number="500+" label="Enterprise Clients" />
                  <StatCard icon={<FileText />} number="50M+" label="Bills Processed" />
                  <StatCard icon={<Clock />} number="90%" label="Time Reduction" />
                  <StatCard icon={<Target />} number="99.97%" label="Accuracy Rate" />
                </div>
              </div>
            </section >

            {/* Complete Solution Section */}
            < section id="solution" className="py-20 bg-white" >
              <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center text-blue-600 mb-4">
                    <Package className="w-5 h-5 mr-2" />
                    Our Entire Workflow
                  </div>
                  <h2 className="text-4xl font-bold mb-4">
                    Complete Accounts Payable Solution<br />
                    for India 🇮🇳
                  </h2>
                  <p className="text-gray-600 max-w-3xl mx-auto">
                    Streamline your entire AP workflow with intelligent automation, from invoice capture to payment processing
                    and GST-compliant financial reporting.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  <div className="bg-gray-50 p-8 rounded-2xl">
                    <h3 className="text-2xl font-bold mb-4">Intelligent Capture</h3>
                    <p className="text-gray-600 mb-4">
                      Multi-channel invoice ingestion with AI-powered data extraction. Supports email, EDI, API, and manual upload with 99.97% accuracy.
                    </p>
                    <div className="flex items-center justify-center h-40">
                      <div className="relative">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                          <FileText className="w-12 h-12 text-blue-600 mx-auto" />
                        </div>
                        <div className="absolute -top-4 -right-4 bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs">
                          Email
                        </div>
                        <div className="absolute -bottom-4 -left-4 bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs">
                          API
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-8 rounded-2xl">
                    <h3 className="text-2xl font-bold mb-4">Smart Processing</h3>
                    <p className="text-gray-600 mb-4">
                      Automated validation, coding, and routing with customizable approval workflows. Intelligent matching with POs and contracts.
                    </p>
                    <div className="flex items-center justify-center h-40">
                      <div className="bg-white p-6 rounded-lg shadow-md">
                        <Settings className="w-12 h-12 text-blue-600 animate-spin" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-8 rounded-2xl md:col-span-2">
                    <h3 className="text-2xl font-bold mb-4">Seamless Integration</h3>
                    <p className="text-gray-600 mb-4">
                      Direct integration with leading Indian ERP systems including Tally, Zoho Books, SAP, and Oracle. GST-compliant with real-time synchronization and reporting 😊
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-6 mt-6">
                      <div className="bg-white px-4 py-2 rounded shadow">Tally</div>
                      <div className="bg-white px-4 py-2 rounded shadow">Zoho Books</div>
                      <div className="bg-white px-4 py-2 rounded shadow">SAP</div>
                      <div className="bg-white px-4 py-2 rounded shadow">Oracle</div>
                    </div>
                  </div>
                </div>
              </div>
            </section >

            {/* Enterprise Features */}
            < section id="enterprise" className="py-20 bg-gray-50" >
              <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center text-blue-600 mb-4">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Grow With Success
                  </div>
                  <h2 className="text-4xl font-bold mb-4">
                    Built for Indian Enterprise Scale 🇮🇳
                  </h2>
                  <p className="text-gray-600">
                    Enterprise-grade capabilities designed for Indian businesses that grow with your success
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  <EnterpriseFeatureCard
                    icon={<Shield className="w-10 h-10 text-blue-600" />}
                    title="Security & GST Compliance 🔒"
                    description="GST-ready, RBI guidelines compliant, bank-grade encryption, and comprehensive audit trails for Indian regulatory requirements."
                  />
                  <EnterpriseFeatureCard
                    icon={<Package className="w-10 h-10 text-blue-600" />}
                    title="Advanced Workflows"
                    description="Multi-level approval routing, delegation management, and customizable business rules to match your organizational structure."
                  />
                  <EnterpriseFeatureCard
                    icon={<BarChart3 className="w-10 h-10 text-blue-600" />}
                    title="Analytics & Reporting"
                    description="Real-time dashboards, spend analytics, vendor performance metrics, and customizable reports for strategic insights."
                  />
                  <EnterpriseFeatureCard
                    icon={<DollarSign className="w-10 h-10 text-blue-600" />}
                    title="Cost Optimization"
                    description="Early payment discounts, duplicate detection, GST input credit optimization, and budget variance alerts for maximum savings."
                  />
                  <EnterpriseFeatureCard
                    icon={<Settings className="w-10 h-10 text-blue-600" />}
                    title="Multi-Entity Support"
                    description="Centralized processing for multiple Indian subsidiaries, support for INR and international currencies, GST compliance across entities."
                  />
                  <EnterpriseFeatureCard
                    icon={<Users className="w-10 h-10 text-blue-600" />}
                    title="24/7 Support"
                    description="Dedicated customer success manager, priority support, and comprehensive training programs for your team."
                  />
                </div>
              </div>
            </section >

            {/* Services Section */}
            < section className="py-20 bg-white" >
              <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center text-blue-600 mb-4">
                    <Settings className="w-5 h-5 mr-2" />
                    Services Offered
                  </div>
                  <h2 className="text-4xl font-bold mb-4">
                    Innovative Financial Solutions For<br />
                    Digital India 🇮🇳
                  </h2>
                  <p className="text-gray-600 max-w-3xl mx-auto">
                    At Finetics, we deliver cutting-edge financial solutions designed to streamline operations, enhance security,
                    and drive smarter decision-making.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  {/* Purchase Workflow */}
                  <div className="bg-gray-50 p-8 rounded-2xl">
                    <div className="flex items-center mb-4">
                      <Receipt className="w-6 h-6 text-blue-600 mr-3" />
                      <h3 className="text-2xl font-bold">Purchase Workflow</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Multi-channel invoice ingestion with AI-powered data
                      extraction. Supports email, EDI, API, and manual upload
                      with 99.97% accuracy.
                    </p>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                            <span className="text-sm text-gray-600">Step {i}</span>
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-600">{i}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bill Management */}
                  <div className="bg-gray-50 p-8 rounded-2xl">
                    <div className="flex items-center mb-4">
                      <FileText className="w-6 h-6 text-blue-600 mr-3" />
                      <h3 className="text-2xl font-bold">Bill Management</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Automated validation, coding, and routing with
                      customizable approval workflows. Intelligent matching
                      with POs and contracts.
                    </p>
                    <button
                      onClick={() => handleNavigation("bill-management")}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Explore Bill Management
                    </button>
                  </div>

                  {/* Bank Workflow */}
                  <div className="bg-gray-50 p-8 rounded-2xl md:col-span-2">
                    <div className="flex items-center mb-4">
                      <Building2 className="w-6 h-6 text-blue-600 mr-3" />
                      <h3 className="text-2xl font-bold">Bank Workflow</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Direct integration with leading Indian ERP systems
                      including Tally, Zoho Books, SAP, and Oracle. GST-
                      compliant with real-time synchronization and reporting
                      🇮🇳
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg text-center">
                        <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm font-medium">Trading Business</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg text-center">
                        <CreditCard className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm font-medium">Service Business</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg text-center">
                        <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm font-medium">Manufacturing Business</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-8">
                  <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                    Schedule Enterprise Demo
                  </button>
                </div>
              </div>
            </section >

            {/* Pricing Section */}
            < section id="pricing" className="py-20 bg-gray-50" >
              <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center text-blue-600 mb-4">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Pricing Overview
                  </div>
                  <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Choose a plan that fits your business needs and budget. No hidden fees, no surprises—just
                    straightforward pricing for powerful financial management.
                  </p>
                </div>

                <div className="max-w-4xl mx-auto">
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-blue-600 text-white">
                        <tr>
                          <th className="px-6 py-4 text-left">Sr. No.</th>
                          <th className="px-6 py-4 text-left">Service Tier</th>
                          <th className="px-6 py-4 text-left">Page Volume</th>
                          <th className="px-6 py-4 text-left">Price (INR / Page)</th>
                          <th className="px-6 py-4 text-left">Banks Supported</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="px-6 py-4">1.</td>
                          <td className="px-6 py-4">Basic</td>
                          <td className="px-6 py-4">0 - 999</td>
                          <td className="px-6 py-4 font-bold">₹4.00</td>
                          <td className="px-6 py-4">All</td>
                        </tr>
                        <tr className="border-b bg-gray-50">
                          <td className="px-6 py-4">2.</td>
                          <td className="px-6 py-4">Growth</td>
                          <td className="px-6 py-4">999 - 10,999</td>
                          <td className="px-6 py-4 font-bold">₹3.50</td>
                          <td className="px-6 py-4">All</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4">3.</td>
                          <td className="px-6 py-4">Enterprise</td>
                          <td className="px-6 py-4">10,000+</td>
                          <td className="px-6 py-4 font-bold">₹4.00</td>
                          <td className="px-6 py-4">All</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section >

            {/* Testimonials Section */}
            < section className="py-20 bg-white" >
              <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center text-blue-600 mb-4">
                    <Users className="w-5 h-5 mr-2" />
                    User Satisfaction
                  </div>
                  <h2 className="text-4xl font-bold mb-2">Most Used Financial Platform</h2>
                  <h3 className="text-2xl text-gray-600 mb-8">Used by Millions of Happy Users</h3>
                  <p className="text-gray-600 max-w-3xl mx-auto">
                    Trusted by millions worldwide, our financial platform is the go-to choice for
                    seamless money management. From secure transactions and smart budgeting
                    tools to investment tracking and instant payments, we empower users to take
                    full control of their finances with confidence. Simple, reliable, and packed with
                    powerful features it's no wonder we're the most used financial platform by
                    millions of happy users.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
                  <div className="text-center">
                    <div className="text-blue-600 mb-2">
                      <Users className="w-8 h-8 mx-auto" />
                    </div>
                    <h4 className="text-sm text-gray-600">Average</h4>
                    <p className="text-2xl font-bold">40%</p>
                    <p className="text-sm text-gray-600">Cost Reduction in AP Operations</p>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-600 mb-2">
                      <Clock className="w-8 h-8 mx-auto" />
                    </div>
                    <h4 className="text-sm text-gray-600">Average</h4>
                    <p className="text-2xl font-bold">3-Min</p>
                    <p className="text-sm text-gray-600">Processing Time Per Invoice</p>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-600 mb-2">
                      <Target className="w-8 h-8 mx-auto" />
                    </div>
                    <h4 className="text-sm text-gray-600">Accuracy</h4>
                    <p className="text-2xl font-bold">99.97%</p>
                    <p className="text-sm text-gray-600">With Intelligent Validation</p>
                  </div>
                </div>

                {/* Testimonial Carousel */}
                <div className="max-w-4xl mx-auto">
                  <div className="flex overflow-x-auto space-x-6 pb-4">
                    {testimonials.map((testimonial, idx) => (
                      <div key={idx} className="bg-white p-6 rounded-lg shadow-md flex-shrink-0 w-80 border">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-gray-300 rounded-full mr-3"></div>
                          <div>
                            <h4 className="font-semibold">{testimonial.name}</h4>
                            <div className="flex">
                              {[...Array(testimonial.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-4">{testimonial.text}</p>
                        <p className="text-sm text-gray-500">{testimonial.date}</p>
                      </div>
                    ))}
                  </div>

                  {/* Carousel Indicators */}
                  <div className="flex justify-center mt-6 space-x-2">
                    {[0, 1, 2, 3, 4].map((idx) => (
                      <button
                        key={idx}
                        className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-blue-600 w-8' : 'bg-gray-300'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section >

            {/* ROI Calculator Section */}
            < section className="py-20 bg-gray-50" >
              <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center text-blue-600 mb-4">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Your ROI
                  </div>
                  <h2 className="text-4xl font-bold mb-4">Calculate Your ROI 🇮🇳</h2>
                  <p className="text-gray-600">
                    See how much your Indian business could save with automated accounts payable processing
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
                  <div className="bg-white p-6 rounded-lg text-center shadow-sm border">
                    <h3 className="text-3xl font-bold mb-2">₹1.5Cr</h3>
                    <p className="text-gray-600">Average Annual Savings</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg text-center shadow-sm border">
                    <h3 className="text-3xl font-bold mb-2">4 Months</h3>
                    <p className="text-gray-600">Typical Payback Period</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg text-center shadow-sm border">
                    <h3 className="text-3xl font-bold mb-2">280%</h3>
                    <p className="text-gray-600">Average 3-Year ROI 🚀</p>
                  </div>
                </div>

                <div className="text-center">
                  <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700">
                    Get Your Custom ROI Analysis
                  </button>
                </div>
              </div>
            </section >

            {/* CTA Section */}
            < section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50" >
              <div className="container mx-auto px-4 text-center">
                <div className="inline-flex items-center text-blue-600 mb-4">
                  <Shield className="w-5 h-5 mr-2" />
                  Ready To Transform
                </div>
                <h2 className="text-4xl font-bold mb-4">
                  Ready to Transform Your AP Process?
                </h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                  Join thousands of Indian SMEs and enterprises that have automated their
                  accounts payable with Finetic.AI
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700">
                    Schedule Enterprise Demo
                  </button>
                  <EmailOtpModal />
                </div>
              </div>
            </section >

            {/* Footer */}
            < footer className="bg-gray-900 text-gray-400 py-12" >
              <div className="container mx-auto px-4 text-center">
                <p>© 2025 Finetic.AI Technologies, Inc. • Made in India 🇮🇳 • GST Compliant • Data Secure</p>
              </div>
            </footer >
          </div >
        );
    }
  };

  return <>{renderPage()}</>;
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

// Stat Card Component with Icon
function StatCard({ icon, number, label }) {
  return (
    <div className="text-center">
      <div className="text-blue-600 mb-4">{React.cloneElement(icon, { className: "w-10 h-10 mx-auto" })}</div>
      <div className="text-3xl font-bold text-gray-900 mb-2">{number}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
}

// Enterprise Feature Card Component
function EnterpriseFeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
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
