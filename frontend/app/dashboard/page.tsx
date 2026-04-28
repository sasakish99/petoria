'use client';

import { useAuth } from '@/hooks/auth';
import useSWR from 'swr';
import axios from '@/lib/axios';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { Calendar, Bell, PlusCircle, Activity, ClipboardList, HeartPulse, Utensils, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';
import { useState } from 'react';
import HealthLogModal from '@/components/HealthLogModal';

const Dashboard = () => {
    const { user, logout } = useAuth({ middleware: 'auth' });
    const [selectedPetForLog, setSelectedPetForLog] = useState<any>(null);
    const [activePetId, setActivePetId] = useState<number | null>(null);
    
    const { data: dashboardData, error, mutate } = useSWR('/api/dashboard', () =>
        axios.get('/api/dashboard').then(res => res.data),
        {
            onSuccess: (data) => {
                if (!activePetId && data.pets && data.pets.length > 0) {
                    setActivePetId(data.pets[0].id);
                }
            }
        }
    );

    if (!user || !dashboardData) {
        return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
    }

    const hasPets = dashboardData.pets && dashboardData.pets.length > 0;
    const activePet = dashboardData.pets.find((p: any) => p.id === activePetId) || dashboardData.pets[0];

    const getThemeColors = (color: string) => {
        const colors: Record<string, any> = {
            indigo: { bg: 'bg-indigo-600', hover: 'hover:bg-indigo-700', text: 'text-indigo-600', light: 'bg-indigo-50', border: 'border-indigo-100', dot: '#4f46e5' },
            rose: { bg: 'bg-rose-500', hover: 'hover:bg-rose-600', text: 'text-rose-600', light: 'bg-rose-50', border: 'border-rose-100', dot: '#f43f5e' },
            amber: { bg: 'bg-amber-500', hover: 'hover:bg-amber-600', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-100', dot: '#f59e0b' },
            emerald: { bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-100', dot: '#10b981' },
            blue: { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-100', dot: '#3b82f6' },
        };
        return colors[color] || colors.indigo;
    };

    const theme = getThemeColors(activePet?.theme_color || 'indigo');

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/dashboard" className="flex items-center">
                                <img src="/logo.png" alt="Petoria Logo" className="h-10 w-auto mr-2" />
                                <span className="text-xl font-bold text-gray-900">Petoria</span>
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600 hidden md:inline">{user.name} さん</span>
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

            <div className="flex-1 flex overflow-hidden">
                {/* サイドバー - ペットセレクター */}
                {hasPets && (
                    <aside className="w-20 md:w-64 bg-white border-r border-gray-200 overflow-y-auto hidden sm:block">
                        <div className="p-4 space-y-4">
                            <div className="px-2 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:block">
                                ペット
                            </div>
                            {dashboardData.pets.map((pet: any) => {
                                const petTheme = getThemeColors(pet.theme_color || 'indigo');
                                return (
                                    <button
                                        key={pet.id}
                                        onClick={() => setActivePetId(pet.id)}
                                        className={`w-full flex items-center p-2 rounded-xl transition-all ${
                                            activePetId === pet.id 
                                                ? `${petTheme.light} ${petTheme.text} ring-1 ring-inset ${petTheme.border}` 
                                                : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className={`h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold ${petTheme.bg}`}>
                                            {pet.name.substring(0, 1)}
                                        </div>
                                        <div className="ml-3 text-left hidden md:block">
                                            <div className="text-sm font-bold truncate">{pet.name}</div>
                                            <div className="text-xs opacity-70">{pet.breed?.name || pet.species}</div>
                                        </div>
                                    </button>
                                );
                            })}
                            <Link 
                                href="/pets/create"
                                className="w-full flex items-center p-2 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all border border-dashed border-gray-200"
                            >
                                <div className="h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-100">
                                    <PlusCircle className="h-5 w-5" />
                                </div>
                                <div className="ml-3 text-sm font-medium hidden md:block">ペットを追加</div>
                            </Link>
                        </div>
                    </aside>
                )}

                <main className="flex-1 overflow-y-auto py-8">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* モバイル用ペットセレクター */}
                        {hasPets && (
                            <div className="flex sm:hidden overflow-x-auto pb-6 space-x-4 scrollbar-hide">
                                {dashboardData.pets.map((pet: any) => {
                                    const petTheme = getThemeColors(pet.theme_color || 'indigo');
                                    return (
                                        <button
                                            key={pet.id}
                                            onClick={() => setActivePetId(pet.id)}
                                            className={`flex-shrink-0 flex flex-col items-center space-y-1 ${activePetId === pet.id ? petTheme.text : 'text-gray-400'}`}
                                        >
                                            <div className={`h-14 w-14 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm ${petTheme.bg} ${activePetId === pet.id ? 'ring-4 ring-white' : 'opacity-60'}`}>
                                                {pet.name.substring(0, 1)}
                                            </div>
                                            <span className="text-xs font-bold">{pet.name}</span>
                                        </button>
                                    );
                                })}
                                <Link 
                                    href="/pets/create"
                                    className="flex-shrink-0 flex flex-col items-center space-y-1 text-gray-400"
                                >
                                    <div className="h-14 w-14 rounded-full flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300">
                                        <PlusCircle className="h-6 w-6" />
                                    </div>
                                    <span className="text-xs font-bold">追加</span>
                                </Link>
                            </div>
                        )}

                        {!hasPets ? (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                                <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                                    <PlusCircle className="h-8 w-8 text-indigo-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">ペットが登録されていません</h3>
                                <p className="text-gray-500 mb-6">まずは大切なペットのプロフィールを作成しましょう。</p>
                                <Link href="/pets/create" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                    ペットを登録する
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-3xl font-extrabold text-gray-900">{activePet.name}</h2>
                                        <p className="text-gray-500">{activePet.breed?.name || activePet.species}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Link 
                                            href={`/pets/${activePet.id}/edit`}
                                            className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-all text-gray-600 font-bold"
                                        >
                                            編集
                                        </Link>
                                        <button 
                                            onClick={() => setSelectedPetForLog(activePet)}
                                            className={`px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-all flex items-center font-bold ${theme.text}`}
                                        >
                                            <PlusCircle className="h-4 w-4 mr-2" />
                                            記録
                                        </button>
                                        <Link 
                                            href={`/pets/${activePet.id}/ai-diagnose`}
                                            className={`px-4 py-2 text-sm text-white rounded-xl shadow-md transition-all font-bold ${theme.bg} ${theme.hover}`}
                                        >
                                            AI診断
                                        </Link>
                                        <Link 
                                            href={`/pets/${activePet.id}/history`}
                                            className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-all text-gray-600 font-bold"
                                        >
                                            履歴
                                        </Link>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* 体重グラフ */}
                                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold mb-6 flex items-center text-gray-800">
                                            <Activity className={`h-5 w-5 mr-2 ${theme.text}`} />
                                            体重推移 (kg)
                                        </h3>
                                        <div className="h-72 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={[...activePet.health_logs].filter(log => log.weight).reverse()}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                    <XAxis 
                                                        dataKey="logged_at" 
                                                        tickFormatter={(str) => format(new Date(str), 'MM/dd')}
                                                        tick={{ fontSize: 12, fill: '#9ca3af' }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <YAxis 
                                                        domain={['auto', 'auto']} 
                                                        tick={{ fontSize: 12, fill: '#9ca3af' }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <Tooltip 
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                        labelFormatter={(label) => format(new Date(label), 'yyyy/MM/dd')}
                                                        formatter={(value) => [`${value} kg`, '体重']}
                                                    />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="weight" 
                                                        stroke={theme.dot} 
                                                        strokeWidth={4}
                                                        dot={{ r: 6, fill: theme.dot, strokeWidth: 2, stroke: '#fff' }}
                                                        activeDot={{ r: 8, strokeWidth: 0 }}
                                                        connectNulls
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* お知らせ・リマインダー */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold mb-6 flex items-center text-gray-800">
                                            <Bell className="h-5 w-5 mr-2 text-amber-500" />
                                            重要なお知らせ
                                        </h3>
                                        <div className="space-y-4">
                                            {activePet.medical_events.length > 0 ? (
                                                activePet.medical_events.map((event: any) => (
                                                    <div key={event.id} className="flex items-start p-4 bg-amber-50 rounded-xl border border-amber-100">
                                                        <Calendar className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-bold text-amber-900">{event.title}</p>
                                                            <p className="text-xs text-amber-700 font-medium">予定日: {format(new Date(event.event_date), 'yyyy/MM/dd')}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-400 text-center py-6 italic">予定はありません</p>
                                            )}
                                        </div>

                                        {/* AI診断要約 */}
                                        {activePet.ai_diagnoses && activePet.ai_diagnoses.length > 0 && (
                                            <div className="mt-8 pt-8 border-t border-gray-50">
                                                <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                                                    <HeartPulse className="h-5 w-5 mr-2 text-rose-500" />
                                                    最新のAI診断
                                                </h3>
                                                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                                                    <div className="flex items-center text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-2">
                                                        <Calendar className="h-3 w-3 mr-1" />
                                                        {format(new Date(activePet.ai_diagnoses[0].created_at), 'yyyy/MM/dd')}
                                                    </div>
                                                    <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed font-medium">
                                                        {activePet.ai_diagnoses[0].result_text.replace(/#|【|】/g, '').split('\n').filter((l: string) => l.trim().length > 0).join(' ')}
                                                    </p>
                                                    <Link 
                                                        href={`/pets/${activePet.id}/history`}
                                                        className="mt-3 text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center justify-end"
                                                    >
                                                        履歴を表示 →
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 最近の健康記録 */}
                                    <div className="lg:col-span-3">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold flex items-center text-gray-800">
                                                <ClipboardList className={`h-5 w-5 mr-2 ${theme.text}`} />
                                                最近の健康記録
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {activePet.health_logs && activePet.health_logs.length > 0 ? (
                                                activePet.health_logs.slice(0, 5).map((log: any) => (
                                                    <div key={log.id} className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all">
                                                        <div className="text-[10px] font-extrabold text-gray-400 mb-3 border-b border-gray-50 pb-2 uppercase tracking-tighter">
                                                            {format(new Date(log.logged_at), 'yyyy/MM/dd')}
                                                        </div>
                                                        <div className="space-y-3">
                                                            {log.meal_amount && (
                                                                <div className="flex items-center text-xs font-bold text-gray-600">
                                                                    <Utensils className="h-3.5 w-3.5 mr-2 text-orange-400" />
                                                                    {log.meal_amount}g
                                                                </div>
                                                            )}
                                                            {log.weight && (
                                                                <div className="flex items-center text-xs font-bold text-gray-600">
                                                                    <Scale className="h-3.5 w-3.5 mr-2 text-blue-400" />
                                                                    {log.weight}kg
                                                                </div>
                                                            )}
                                                            {log.exercise_duration && (
                                                                <div className="flex items-center text-xs font-bold text-gray-600">
                                                                    <Activity className="h-3.5 w-3.5 mr-2 text-green-400" />
                                                                    {log.exercise_duration}分
                                                                </div>
                                                            )}
                                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${log.stool_status === '普通' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                    便:{log.stool_status}
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${log.urine_status === '普通' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                    尿:{log.urine_status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-full py-12 bg-white rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 text-sm font-medium">
                                                    健康記録がまだありません
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* モーダル */}
            {selectedPetForLog && (
                <HealthLogModal 
                    pet={selectedPetForLog} 
                    onClose={() => setSelectedPetForLog(null)} 
                    onSuccess={() => mutate()}
                />
            )}
        </div>
    );
};

export default Dashboard;
