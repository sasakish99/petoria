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
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-slate-50">
            <div 
                className="w-full sm:max-w-md mt-6 px-8 py-10 bg-white/70 backdrop-blur-lg shadow-xl shadow-slate-200/50 overflow-hidden sm:rounded-[2.5rem] border border-white"
            >
                <div className="flex flex-col items-center mb-10">
                    <img 
                        src="/logo.png" 
                        alt="Petoria Logo" 
                        className="h-48 w-auto mb-6 drop-shadow-md" 
                    />
                    <h1 className="text-3xl font-black bg-gradient-to-r from-slate-800 to-slate-500 bg-clip-text text-transparent tracking-tight mb-2">
                        Petoria
                    </h1>
                    <p className="text-slate-500 font-medium">おかえりなさい、飼い主さん</p>
                </div>

                {/* Validation Errors */}
                {errors && Object.keys(errors).length > 0 && (
                    <div 
                        className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 font-medium text-sm text-rose-600 overflow-hidden"
                    >
                        {Object.keys(errors).map((key) => (
                            <p key={key}>{errors[key]}</p>
                        ))}
                    </div>
                )}
                
                {status && (
                    <div 
                        className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 font-medium text-sm text-emerald-600 overflow-hidden"
                    >
                        {status}
                    </div>
                )}

                <form onSubmit={submitForm} className="space-y-6">
                    {/* Email Address */}
                    <div>
                        <label className="block font-bold text-sm text-slate-700 mb-2 ml-1" htmlFor="email">
                            メールアドレス
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            placeholder="mail@example.com"
                            className="block w-full px-4 py-3 rounded-2xl bg-slate-50/50 border-slate-200 shadow-sm focus:border-slate-400 focus:ring focus:ring-slate-200/50 transition-all"
                            onChange={event => setEmail(event.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block font-bold text-sm text-slate-700 mb-2 ml-1" htmlFor="password">
                            パスワード
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            placeholder="••••••••"
                            className="block w-full px-4 py-3 rounded-2xl bg-slate-50/50 border-slate-200 shadow-sm focus:border-slate-400 focus:ring focus:ring-slate-200/50 transition-all"
                            onChange={event => setPassword(event.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full inline-flex items-center justify-center px-6 py-4 bg-slate-800 border border-transparent rounded-2xl font-bold text-sm text-white uppercase tracking-widest hover:bg-slate-700 active:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200 transition-all duration-200 shadow-lg shadow-slate-200"
                        >
                            ログイン
                        </button>
                    </div>

                    <div className="flex items-center justify-center mt-6">
                        <Link
                            href="/register"
                            className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            はじめての方は <span className="text-slate-800 underline underline-offset-4 decoration-2">新規登録</span>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
