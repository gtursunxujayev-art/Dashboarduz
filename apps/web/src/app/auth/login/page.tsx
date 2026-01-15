'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/auth-context';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'phone' | 'google' | 'telegram'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const { login } = useAuth();
  
  const requestOtp = trpc.auth.requestOtp.useMutation();
  const verifyOtp = trpc.auth.verifyOtp.useMutation();
  const telegramLogin = trpc.auth.telegramLogin.useMutation();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!otpSent) {
        await requestOtp.mutateAsync({ phone });
        setOtpSent(true);
      } else {
        const result = await verifyOtp.mutateAsync({ phone, code: otp });
        if (result.success && result.token && result.user) {
          login(result.token, result.user);
        } else {
          setError('Invalid OTP code');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth redirect
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
  };

  const handleTelegramLogin = async (userData: any) => {
    try {
      const result = await telegramLogin.mutateAsync(userData);
      if (result.success && result.token && result.user) {
        login(result.token, result.user);
      }
    } catch (err: any) {
      setError(err.message || 'Telegram login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Dashboarduz
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Multi-tenant CRM integrator platform
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('phone')}
              className={`flex-1 py-2 text-sm font-medium ${
                activeTab === 'phone'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Phone OTP
            </button>
            <button
              onClick={() => setActiveTab('google')}
              className={`flex-1 py-2 text-sm font-medium ${
                activeTab === 'google'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Google
            </button>
            <button
              onClick={() => setActiveTab('telegram')}
              className={`flex-1 py-2 text-sm font-medium ${
                activeTab === 'telegram'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Telegram
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Phone OTP Form */}
          {activeTab === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="+1234567890"
                  disabled={otpSent || isLoading}
                />
              </div>

              {otpSent && (
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                    OTP Code
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    OTP sent to {phone}. Didn't receive it?{' '}
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-blue-600 hover:text-blue-500"
                    >
                      Resend
                    </button>
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : otpSent ? (
                  'Verify OTP'
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>
          )}

          {/* Google Login */}
          {activeTab === 'google' && (
            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
              <p className="text-xs text-gray-500 text-center">
                You'll be redirected to Google for authentication
              </p>
            </div>
          )}

          {/* Telegram Login */}
          {activeTab === 'telegram' && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Use Telegram Login Widget to authenticate
                </p>
                {/* Telegram Login Widget will be injected here */}
                <div id="telegram-login" className="min-h-[40px] flex items-center justify-center border border-gray-300 rounded-md p-4">
                  <p className="text-sm text-gray-500">
                    Telegram widget will appear here when configured
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Requires Telegram app installed on your device
              </p>
            </div>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to Dashboarduz?</span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/auth/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Create a new tenant account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
