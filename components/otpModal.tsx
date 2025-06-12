import React, { useState, useEffect } from 'react';
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

    const handleOtpChange = (index, value) => {
        if (value.length > 1) return; // Prevent multi-character input

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.querySelector(`input[name="otp-${index + 1}"]`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.querySelector(`input[name="otp-${index - 1}"]`);
            prevInput?.focus();
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
                const firstInput = document.querySelector(`input[name="otp-0"]`);
                firstInput?.focus();
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

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-transform duration-300 shadow-lg"
            >
                Sign In with Email
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full relative border border-gray-200 animate-in fade-in duration-300 shadow-xl">
                        <button
                            onClick={resetModal}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            ✕
                        </button>

                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                                    Email Verification
                                </h2>
                                {email && otpSent&& (
                                    <h2 className="text-xl font-bold text-black mt-2">
                                        {email?.toUpperCase()}
                                    </h2>
                                )}
                                <p className="text-slate-400 mt-2">
                                    {otpSent
                                        ? 'Enter the 6-digit code sent to your email'
                                        : 'Enter your email to receive a verification code'}
                                </p>
                            </div>

                            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-6">
                                {!otpSent ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Verification Code
                                        </label>
                                        <div className="flex gap-2 justify-center">
                                            {otp.map((digit, index) => (
                                                <input
                                                    key={index}
                                                    type="text"
                                                    inputMode="numeric"
                                                    name={`otp-${index}`}
                                                    value={digit}
                                                    onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                                    className="w-12 h-12 text-center bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    maxLength={1}
                                                    required
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded-lg">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="text-green-600 text-sm p-3 bg-green-50 border border-green-200 rounded-lg">
                                        {success}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || (otpSent && otp.some(digit => !digit))}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                >
                                    {loading ? (
                                        'Processing...'
                                    ) : otpSent ? (
                                        'Verify Code'
                                    ) : (
                                        'Send Code'
                                    )}
                                </button>
                            </form>

                            {otpSent && (
                                <div className="space-y-3">
                                    {/* Resend OTP Button */}
                                    <div className="text-center">
                                        {resendCountdown > 0 ? (
                                            <p className="text-slate-400 text-sm">
                                                Didn't receive the code?{' '}
                                                <span className="text-slate-300">
                                                    Resend in {resendCountdown}s
                                                </span>
                                            </p>
                                        ) : (
                                            <button
                                                onClick={handleResendOtp}
                                                disabled={resendLoading}
                                                className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {resendLoading ? 'Sending...' : 'Didn\'t receive the code? Resend'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Change Email Button */}
                                    <button
                                        onClick={handleChangeEmail}
                                        className="w-full text-cyan-400 text-sm hover:text-cyan-300 transition-colors"
                                    >
                                        Change Email Address
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