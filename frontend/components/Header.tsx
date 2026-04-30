'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/auth';

const Header = () => {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex-shrink-0">
                        <Link href="/dashboard" className="flex items-center group transition-transform hover:scale-[1.02]">
                            <img src="/logo.png" alt="Petoria Logo" className="h-10 sm:h-12 w-auto mr-2 drop-shadow-sm" />
                            <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-slate-800 to-slate-500 bg-clip-text text-transparent tracking-tight">
                                Petoria
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <Link 
                            href="/profile"
                            className="flex items-center px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
                        >
                            <span className="truncate max-w-[80px] sm:max-w-none">{user.name}</span>
                            <span className="ml-1 hidden sm:inline text-slate-400 font-normal">さん</span>
                        </Link>
                        <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
                        <button
                            onClick={logout}
                            className="px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
                        >
                            ログアウト
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;
