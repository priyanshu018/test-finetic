import React, { useState } from 'react';
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
    const { push } = useRouter()

    const handleOtpChange = (index, value) => {
        if (value.length > 1) return; // Prevent multi-character input

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput: any = document.querySelector(`input[name="otp-${index + 1}"]`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput: any = document.querySelector(`input[name="otp-${index - 1}"]`);
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

            setSuccess('Verification code sent to your email!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send verification code');
        } finally {
            setLoading(false);
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
            const { data, error } = await supabase.auth.verifyOtp({ email: email ?? "", token: otpString, type: "email" });
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
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-transform duration-300 shadow-lg"
            >
                Sign In with Email
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full relative border border-slate-800 animate-in fade-in duration-300">
                        <button
                            onClick={resetModal}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            ✕
                        </button>

                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                                    Email Verification
                                </h2>
                                <p className="text-slate-400 mt-2">
                                    {otpSent
                                        ? 'Enter the 6-digit code sent to your email'
                                        : 'Enter your email to receive a verification code'}
                                </p>
                            </div>

                            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-6">
                                {!otpSent ? (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
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
                                                    className="w-12 h-12 text-center bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    maxLength={1}
                                                    required
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="text-red-400 text-sm p-3 bg-red-900/30 rounded-lg">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="text-emerald-400 text-sm p-3 bg-emerald-900/30 rounded-lg">
                                        {success}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || (otpSent && otp.some(digit => !digit))}
                                    className="w-full bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                <button
                                    onClick={() => {
                                        setOtpSent(false);
                                        setSuccess('');
                                        setError('');
                                        setOtp(['', '', '', '', '', '']);
                                    }}
                                    className="w-full text-cyan-400 text-sm hover:text-cyan-300 transition-colors"
                                >
                                    Change Email Address
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}