'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/auth';
import { User, LogOut } from 'lucide-react';

const Header = () => {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center justify-between">
                    <div className="flex-shrink-0">
                        <Link href="/dashboard" className="flex items-center group transition-transform duration-200 hover:scale-[1.02]">
                            <div className="flex items-center">
                                <img src="/logo.png" alt="Petoria Logo" className="h-11 sm:h-12 w-auto mr-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]" />
                                <span className="text-2xl sm:text-3xl font-black bg-gradient-to-br from-indigo-600 via-slate-800 to-slate-500 bg-clip-text text-transparent tracking-tight">
                                    Petoria
                                </span>
                            </div>
                        </Link>
                    </div>
                    
                    <div className="flex items-center space-x-1 sm:space-x-2">
                        <Link 
                            href="/profile"
                            className="flex items-center px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:-translate-y-0.5 transition-all active:scale-95 group min-w-0"
                        >
                            <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-indigo-100 flex-shrink-0 flex items-center justify-center mr-1.5 sm:mr-2 transition-colors">
                                <User className="h-4 w-4" />
                            </div>
                            <span className="truncate max-w-[60px] xs:max-w-[80px] sm:max-w-none">{user.name}</span>
                            <span className="ml-1 hidden sm:inline opacity-60 font-medium text-[10px] uppercase tracking-wider">Member</span>
                        </Link>

                        <div className="h-4 w-px bg-slate-200 mx-0.5 sm:mx-1 hidden xs:block"></div>

                        <button
                            onClick={logout}
                            className="flex items-center px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:-translate-y-0.5 transition-all active:scale-95 group flex-shrink-0"
                        >
                            <div className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-rose-100 flex items-center justify-center mr-0 sm:mr-2 transition-colors">
                                <LogOut className="h-4 w-4 text-slate-400 group-hover:text-rose-500" />
                            </div>
                            <span className="hidden sm:inline">ログアウト</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;
