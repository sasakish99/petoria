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
    
    const { data: dashboardData, error, mutate } = useSWR('/api/dashboard', () =>
        axios.get('/api/dashboard').then(res => res.data)
    );

    if (!user || !dashboardData) {
        return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
    }

    const hasPets = dashboardData.pets && dashboardData.pets.length > 0;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
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

            <main className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                        <div className="space-y-8">
                            {dashboardData.pets.map((pet: any) => (
                                <div key={pet.id} className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-gray-900">{pet.name} の健康状態</h2>
                                        <div className="flex space-x-2">
                                            <button 
                                                onClick={() => setSelectedPetForLog(pet)}
                                                className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center"
                                            >
                                                <PlusCircle className="h-4 w-4 mr-1 text-indigo-600" />
                                                記録を追加
                                            </button>
                                            <Link 
                                                href={`/pets/${pet.id}/ai-diagnose`}
                                                className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                                            >
                                                AI診断
                                            </Link>
                                            <Link 
                                                href={`/pets/${pet.id}/history`}
                                                className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                            >
                                                履歴
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* 体重グラフ */}
                                        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                                <Activity className="h-5 w-5 mr-2 text-indigo-500" />
                                                体重推移 (kg)
                                            </h3>
                                            <div className="h-64 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={[...pet.health_logs].filter(log => log.weight).reverse()}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                        <XAxis 
                                                            dataKey="logged_at" 
                                                            tickFormatter={(str) => format(new Date(str), 'MM/dd')}
                                                        />
                                                        <YAxis domain={['auto', 'auto']} />
                                                        <Tooltip 
                                                            labelFormatter={(label) => format(new Date(label), 'yyyy/MM/dd')}
                                                            formatter={(value) => [`${value} kg`, '体重']}
                                                        />
                                                        <Line 
                                                            type="monotone" 
                                                            dataKey="weight" 
                                                            stroke="#4f46e5" 
                                                            strokeWidth={3}
                                                            dot={{ r: 4, fill: '#4f46e5' }}
                                                            activeDot={{ r: 6 }}
                                                            connectNulls
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* お知らせ・リマインダー */}
                                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                                <Bell className="h-5 w-5 mr-2 text-amber-500" />
                                                重要なお知らせ
                                            </h3>
                                            <div className="space-y-4">
                                                {pet.medical_events.length > 0 ? (
                                                    pet.medical_events.map((event: any) => (
                                                        <div key={event.id} className="flex items-start p-3 bg-amber-50 rounded-lg border border-amber-100">
                                                            <Calendar className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm font-bold text-amber-900">{event.title}</p>
                                                                <p className="text-xs text-amber-700">予定日: {format(new Date(event.event_date), 'yyyy/MM/dd')}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-gray-500 text-center py-4">予定されているイベントはありません。</p>
                                                )}
                                            </div>

                                            {/* AI診断要約の追加 */}
                                            {pet.ai_diagnoses && pet.ai_diagnoses.length > 0 && (
                                                <div className="mt-8">
                                                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                                                        <HeartPulse className="h-5 w-5 mr-2 text-rose-500" />
                                                        最新のAI診断
                                                    </h3>
                                                    <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                                                        <div className="flex items-center text-xs text-rose-600 mb-2">
                                                            <Calendar className="h-3 w-3 mr-1" />
                                                            {format(new Date(pet.ai_diagnoses[0].created_at), 'yyyy/MM/dd HH:mm')}
                                                        </div>
                                                        <p className="text-sm text-gray-800 line-clamp-3 leading-relaxed">
                                                            {pet.ai_diagnoses[0].result_text.replace(/#|【|】/g, '').split('\n').filter((l: string) => l.trim().length > 0).join(' ')}
                                                        </p>
                                                        <Link 
                                                            href={`/pets/${pet.id}/history`}
                                                            className="mt-3 text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center justify-end"
                                                        >
                                                            詳細を見る →
                                                        </Link>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* 最近の健康記録 */}
                                        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-lg font-semibold flex items-center">
                                                    <ClipboardList className="h-5 w-5 mr-2 text-indigo-500" />
                                                    最近の健康記録
                                                </h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                                {pet.health_logs && pet.health_logs.length > 0 ? (
                                                    pet.health_logs.map((log: any) => (
                                                        <div key={log.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors">
                                                            <div className="text-xs font-bold text-gray-400 mb-3 border-b border-gray-200 pb-2">
                                                            {format(new Date(log.logged_at), 'yyyy/MM/dd')}
                                                            </div>
                                                            <div className="space-y-2">
                                                                {log.meal_amount && (
                                                                    <div className="flex items-center text-sm">
                                                                        <Utensils className="h-3.5 w-3.5 mr-2 text-orange-400" />
                                                                        <span className="text-gray-600 truncate">{log.meal_amount}g</span>
                                                                    </div>
                                                                )}
                                                                {log.weight && (
                                                                    <div className="flex items-center text-sm">
                                                                        <Scale className="h-3.5 w-3.5 mr-2 text-blue-400" />
                                                                        <span className="text-gray-600 truncate">{log.weight}kg</span>
                                                                    </div>
                                                                )}
                                                                {log.exercise_duration && (
                                                                    <div className="flex items-center text-sm">
                                                                        <Activity className="h-3.5 w-3.5 mr-2 text-green-400" />
                                                                        <span className="text-gray-600">{log.exercise_duration}分</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex gap-2 mt-2">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.stool_status === '普通' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                        便:{log.stool_status}
                                                                    </span>
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.urine_status === '普通' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                        尿:{log.urine_status}
                                                                    </span>
                                                                </div>
                                                                {log.memo && (
                                                                    <p className="text-xs text-gray-500 line-clamp-2 mt-2 pt-2 border-t border-gray-100 italic">
                                                                        {log.memo}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="col-span-full py-8 text-center text-gray-400 text-sm">
                                                        健康記録がまだありません。「記録を追加」から日々の様子を記録しましょう。
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

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
