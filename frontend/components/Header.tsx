'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/auth';

const Header = () => {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex-shrink-0">
                        <Link href="/dashboard" className="flex items-center">
                            <img src="/logo.png" alt="Petoria Logo" className="h-16 w-auto mr-2" />
                            <span className="text-2xl font-bold text-gray-900">Petoria</span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-6">
                        <Link 
                            href="/profile"
                            className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
                        >
                            {user.name} さん
                        </Link>
                        <button
                            onClick={logout}
                            className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
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
