'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/auth';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Login = () => {
    const router = useRouter();
    const { login } = useAuth({
        middleware: 'guest',
        redirectIfAuthenticated: '/dashboard',
    });

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<any>([]);
    const [status, setStatus] = useState(null);

    const submitForm = async (event: any) => {
        event.preventDefault();
        login({ email, password, setErrors, setStatus });
    };

    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-100">
            <div className="w-full sm:max-w-md mt-6 px-6 py-4 bg-white shadow-md overflow-hidden sm:rounded-lg">
                <div className="flex flex-col items-center mb-6">
                    <img src="/logo.png" alt="Petoria Logo" className="h-20 w-auto mb-4" />
                    <h2 className="text-2xl font-bold text-center text-gray-800">Petoria ログイン</h2>
                </div>
                
                {status && (
                    <div className="mb-4 font-medium text-sm text-green-600">
                        {status}
                    </div>
                )}

                <form onSubmit={submitForm}>
                    {/* Email Address */}
                    <div>
                        <label className="block font-medium text-sm text-gray-700" htmlFor="email">
                            メールアドレス
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            className="block mt-1 w-full rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            onChange={event => setEmail(event.target.value)}
                            required
                            autoFocus
                        />
                        {errors && (errors as any).email && (
                            <p className="text-red-500 text-xs mt-1">{(errors as any).email}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="mt-4">
                        <label className="block font-medium text-sm text-gray-700" htmlFor="password">
                            パスワード
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            className="block mt-1 w-full rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            onChange={event => setPassword(event.target.value)}
                            required
                            autoComplete="current-password"
                        />
                        {errors && (errors as any).password && (
                            <p className="text-red-500 text-xs mt-1">{(errors as any).password}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-end mt-4">
                        <Link
                            href="/register"
                            className="underline text-sm text-gray-600 hover:text-gray-900"
                        >
                            新規登録はこちら
                        </Link>

                        <button
                            type="submit"
                            className="ml-4 inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150"
                        >
                            ログイン
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
