import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export interface CaptchaProps {
    /**
     * Called when the captcha has been successfully verified by the user.
     */
    onSuccess: () => void;
    /**
     * Override the default backend API base url (e.g. "http://localhost:8080")
     */
    apiBaseUrl?: string;
    /**
     * Customize styling class
     */
    className?: string;
}

export function Captcha({ onSuccess, apiBaseUrl = 'http://localhost:8080', className = '' }: CaptchaProps) {
    const [captchaImage, setCaptchaImage] = useState<string>('');
    const [captchaToken, setCaptchaToken] = useState<string>('');
    const [inputText, setInputText] = useState<string>('');

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isVerifying, setIsVerifying] = useState<boolean>(false);
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const generateCaptcha = async () => {
        setIsLoading(true);
        setVerificationStatus('idle');
        setErrorMessage('');
        setInputText('');

        try {
            const response = await fetch(`${apiBaseUrl}/api/captcha/generate`);
            if (!response.ok) throw new Error('Failed to generate captcha');

            const data = await response.json();
            setCaptchaImage(data.image);
            setCaptchaToken(data.token);
        } catch (err) {
            console.error(err);
            setErrorMessage('Could not load captcha. Server may be down.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        generateCaptcha();
    }, []);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || verificationStatus === 'success') return;

        setIsVerifying(true);
        setErrorMessage('');

        try {
            const response = await fetch(`${apiBaseUrl}/api/captcha/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: captchaToken,
                    text: inputText
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setVerificationStatus('success');
                onSuccess();
            } else {
                setVerificationStatus('error');
                setErrorMessage(data.message || 'Invalid captcha. Please try again.');
                // Optionally refresh automatically on error:
                // generateCaptcha();
            }
        } catch (err) {
            console.error(err);
            setVerificationStatus('error');
            setErrorMessage('Network error during verification.');
        } finally {
            setIsVerifying(false);
        }
    };

    // If verified successfully, we can optionally hide the input or show a lock
    if (verificationStatus === 'success') {
        return (
            <div className={`p-4 rounded-xl border border-green-200 bg-green-50/50 flex flex-col items-center justify-center space-y-2 shadow-sm ${className}`}>
                <CheckCircle className="w-8 h-8 text-green-500" />
                <span className="text-sm font-medium text-green-700">Captcha Verified Successfully</span>
            </div>
        );
    }

    return (
        <div className={`p-5 rounded-xl border border-gray-100 bg-white/50 backdrop-blur-sm shadow-xl shadow-gray-200/40 w-full max-w-sm transition-all ${className}`}>
            <div className="flex flex-col space-y-4">

                <div className="flex justify-between items-center group">
                    <span className="text-sm font-medium text-gray-700 select-none">Security Check</span>
                    <button
                        type="button"
                        onClick={generateCaptcha}
                        disabled={isLoading || isVerifying}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors group-hover:block focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1 disabled:opacity-50"
                        title="Refresh Captcha"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="relative overflow-hidden rounded-lg bg-gray-50 border border-gray-100 min-h-[80px] flex items-center justify-center group">
                    {isLoading ? (
                        <div className="animate-pulse flex items-center space-x-2 text-gray-400">
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span className="text-sm">Loading...</span>
                        </div>
                    ) : captchaImage ? (
                        <img
                            src={captchaImage}
                            alt="captcha"
                            className="w-full object-contain cursor-pointer transition-transform duration-300 hover:scale-105"
                            onClick={generateCaptcha}
                            title="Click to refresh"
                        />
                    ) : (
                        <div className="text-sm text-red-400 flex flex-col items-center">
                            <AlertCircle className="w-6 h-6 mb-1 opacity-75" />
                            Failed to load
                        </div>
                    )}
                </div>

                <div className="flex space-x-2">
                    <input
                        type="text"
                        placeholder="Enter the code"
                        className={`flex-1 min-w-0 px-3 py-2 text-sm text-gray-900 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm
              ${verificationStatus === 'error'
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                : 'border-gray-200 hover:border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20'}`}
                        value={inputText}
                        onChange={(e) => {
                            setInputText(e.target.value);
                            if (verificationStatus === 'error') setVerificationStatus('idle');
                        }}
                        disabled={isLoading || isVerifying || verificationStatus === 'success'}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleVerify(e);
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={handleVerify}
                        disabled={isLoading || isVerifying || !inputText.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm active:scale-95 flex items-center"
                    >
                        {isVerifying ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            'Verify'
                        )}
                    </button>
                </div>

                {verificationStatus === 'error' && errorMessage && (
                    <div className="flex items-start space-x-2 text-red-500 mt-1 animate-in fade-in slide-in-from-top-1">
                        <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span className="text-xs font-medium leading-snug">{errorMessage}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
