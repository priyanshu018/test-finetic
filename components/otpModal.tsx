import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation'

export function EmailOtpModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);
    const [resendLoading, setResendLoading] = useState(false);
    const { push } = useRouter()
    const otpRefs = useRef([]);

    // Countdown timer effect
    useEffect(() => {
        let interval;
        if (resendCountdown > 0) {
            interval = setInterval(() => {
                setResendCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendCountdown]);

    // Focus first OTP input when OTP is sent
    useEffect(() => {
        if (otpSent && otpRefs.current[0]) {
            setTimeout(() => {
                otpRefs.current[0]?.focus();
            }, 100);
        }
    }, [otpSent]);

    const handleOtpChange = (index, value) => {
        // Handle multi-character input (like when pasting)
        if (value.length > 1) {
            const digits = value.replace(/\D/g, '');
            if (digits.length > 0) {
                const newOtp = [...otp];
                const availableSlots = 6 - index;
                const digitsToFill = Math.min(digits.length, availableSlots);
                
                for (let i = 0; i < digitsToFill; i++) {
                    newOtp[index + i] = digits[i];
                }
                
                setOtp(newOtp);
                
                // Focus next available input or last filled input
                const nextFocusIndex = Math.min(index + digitsToFill, 5);
                setTimeout(() => {
                    otpRefs.current[nextFocusIndex]?.focus();
                }, 50);
            }
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
        
        // Allow arrow key navigation
        if (e.key === 'ArrowLeft' && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e, targetIndex) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '');
        
        if (pastedData.length >= 6) {
            // Take exactly 6 digits
            const digits = pastedData.slice(0, 6).split('');
            setOtp(digits);
            
            // Focus the last input after pasting
            setTimeout(() => {
                otpRefs.current[5]?.focus();
            }, 50);
            
            // Clear any existing errors
            setError('');
        } else if (pastedData.length > 0) {
            // Handle partial paste - fill from current position
            const newOtp = [...otp];
            const availableSlots = 6 - targetIndex;
            const digitsToFill = Math.min(pastedData.length, availableSlots);
            
            for (let i = 0; i < digitsToFill; i++) {
                newOtp[targetIndex + i] = pastedData[i];
            }
            
            setOtp(newOtp);
            
            // Focus next available input or last filled input
            const nextFocusIndex = Math.min(targetIndex + digitsToFill, 5);
            setTimeout(() => {
                otpRefs.current[nextFocusIndex]?.focus();
            }, 50);
        }
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (error) throw error;
            setOtpSent(true);
            setResendCountdown(60); // Start 60 second countdown
            setSuccess('Verification code sent to your email!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setResendLoading(true);
        setError('');
        setSuccess('');
        setOtp(['', '', '', '', '', '']); // Clear existing OTP

        try {
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (error) throw error;
            setResendCountdown(60); // Restart countdown
            setSuccess('New verification code sent to your email!');
            
            // Focus first OTP input
            setTimeout(() => {
                otpRefs.current[0]?.focus();
            }, 100);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to resend verification code');
        } finally {
            setResendLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const otpString = otp.join('');
            // @ts-ignore
            const { data, error } = await supabase.auth.verifyOtp({ 
                email: email ?? "", 
                token: otpString, 
                type: "email" 
            });
            if (error) throw error;
            setSuccess('Successfully verified!');
            localStorage.setItem("email", email)
            localStorage.setItem("userData", JSON.stringify(data?.user))
            setTimeout(() => {
                // push('/next')
                setIsOpen(false)
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    const resetModal = () => {
        setIsOpen(false);
        setOtpSent(false);
        setEmail('');
        setOtp(['', '', '', '', '', '']);
        setError('');
        setSuccess('');
        setResendCountdown(0);
        setResendLoading(false);
    };

    const handleChangeEmail = () => {
        setOtpSent(false);
        setSuccess('');
        setError('');
        setOtp(['', '', '', '', '', '']);
        setResendCountdown(0);
        setResendLoading(false);
    };

    const isOtpComplete = otp.every(digit => digit !== '');

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-gradient-to-r from-[#09357E] to-[#0F4DB3] text-white px-5 py-2 rounded-xl font-semibold hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl"
            >
                Sign In
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full relative border border-gray-200 animate-in fade-in duration-300 shadow-xl">
                        <button
                            onClick={resetModal}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                                    Email Verification
                                </h2>
                                {email && otpSent && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <p className="text-sm text-blue-600 font-medium">Code sent to:</p>
                                        <p className="text-blue-800 font-semibold">{email}</p>
                                    </div>
                                )}
                                <p className="text-slate-500 mt-3 text-sm leading-relaxed">
                                    {otpSent
                                        ? 'Enter the 6-digit code sent to your email. You can paste the entire code at once.'
                                        : 'Enter your email address to receive a verification code'}
                                </p>
                            </div>

                            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-6">
                                {!otpSent ? (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pl-12"
                                                placeholder="your@email.com"
                                            />
                                            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                            </svg>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-gray-700 text-center">
                                            Verification Code
                                        </label>
                                        <div className="flex gap-3 justify-center">
                                            {otp.map((digit, index) => (
                                                <input
                                                    key={index}
                                                    ref={el => otpRefs.current[index] = el}
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={digit}
                                                    onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                                    onPaste={(e) => handlePaste(e, index)}
                                                    className={`w-12 h-12 text-center bg-gray-50 border rounded-xl text-gray-900 text-xl font-semibold focus:outline-none transition-all duration-200 ${
                                                        digit 
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                                            : 'border-gray-300 focus:border-blue-500 focus:bg-blue-50'
                                                    }`}
                                                    maxLength={1}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-blue-600 text-center mt-2 font-medium">
                                            💡 Paste your 6-digit code on any input field
                                        </p>
                                    </div>
                                )}

                                {error && (
                                    <div className="text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="text-green-600 text-sm p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        {success}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || (otpSent && !isOtpComplete)}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Processing...
                                        </div>
                                    ) : otpSent ? (
                                        'Verify Code'
                                    ) : (
                                        'Send Verification Code'
                                    )}
                                </button>
                            </form>

                            {otpSent && (
                                <div className="space-y-3 pt-4 border-t border-gray-100">
                                    {/* Resend OTP Button */}
                                    <div className="text-center">
                                        {resendCountdown > 0 ? (
                                            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Resend available in {resendCountdown}s
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleResendOtp}
                                                disabled={resendLoading}
                                                className="text-blue-600 text-sm hover:text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold underline-offset-2 hover:underline"
                                            >
                                                {resendLoading ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                        Sending...
                                                    </span>
                                                ) : (
                                                    'Resend Code'
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {/* Change Email Button */}
                                    <button
                                        onClick={handleChangeEmail}
                                        className="w-full text-blue-600 text-sm hover:text-blue-700 transition-colors py-2 rounded-lg hover:bg-blue-50 font-medium"
                                    >
                                        Use Different Email Address
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}