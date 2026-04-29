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
  Legend,
  BarChart,
  Bar,
  Cell,
  ReferenceLine
} from 'recharts';
import { Calendar, Bell, PlusCircle, Activity, ClipboardList, HeartPulse, Utensils, Scale, CloudSun } from 'lucide-react';
import { format, differenceInYears, differenceInMonths, subDays, isSameDay, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import HealthLogModal from '@/components/HealthLogModal';

const Dashboard = () => {
    const { user, logout } = useAuth({ middleware: 'auth' });
    const [selectedPetForLog, setSelectedPetForLog] = useState<any>(null);
    const [activePetId, setActivePetId] = useState<number | null>(null);

    // マウント時にlocalStorageから最後に選択したペットIDを復元
    useEffect(() => {
        const savedPetId = localStorage.getItem('lastActivePetId');
        if (savedPetId) {
            setActivePetId(parseInt(savedPetId, 10));
        }
    }, []);

    // activePetIdが変わるたびにlocalStorageに保存
    useEffect(() => {
        if (activePetId) {
            localStorage.setItem('lastActivePetId', activePetId.toString());
        }
    }, [activePetId]);

    const calculateAge = (birthday: string) => {
        if (!birthday) return '';
        const birthDate = new Date(birthday);
        const today = new Date();
        
        const years = differenceInYears(today, birthDate);
        const months = differenceInMonths(today, birthDate) % 12;
        
        if (years === 0) {
            return `${months}ヶ月`;
        }
        return `${years}歳${months}ヶ月`;
    };

    const getWeeklyExerciseData = (healthLogs: any[]) => {
        const today = new Date();
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = subDays(today, i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const log = healthLogs.find(l => isSameDay(new Date(l.logged_at), date));
            
            data.push({
                date: dateStr,
                displayDate: format(date, 'MM/dd(E)', { locale: ja }),
                exercise_duration: log?.exercise_duration || 0,
            });
        }
        
        return data;
    };
    
    const { data: dashboardData, error, mutate } = useSWR('/api/dashboard', () =>
        axios.get('/api/dashboard').then(res => res.data),
        {
            onSuccess: (data) => {
                // localStorageに保存されているIDが取得したペットリストに含まれているか確認
                const savedPetId = localStorage.getItem('lastActivePetId');
                const isValidId = savedPetId && data.pets.some((p: any) => p.id === parseInt(savedPetId, 10));

                if (!isValidId && data.pets && data.pets.length > 0) {
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

    const getWeatherAdvice = (code: number, tempMax: number) => {
        // WMO Weather interpretation codes (WW)
        if (code >= 95) return { text: '雷雨の予報です。お散歩は控えましょう。', color: 'text-red-600' };
        if (code >= 61) return { text: '雨が降る予報です。レインコートの準備を。', color: 'text-blue-600' };
        if (code >= 51) return { text: '小雨の予報です。足元に注意してください。', color: 'text-blue-500' };
        if (tempMax >= 30) return { text: '気温が高いです。涼しい時間帯を選びましょう。', color: 'text-orange-600' };
        if (tempMax <= 5) return { text: '寒いので防寒対策をしっかりして出かけましょう。', color: 'text-blue-700' };
        return { text: 'お散歩日和です！', color: 'text-green-600' };
    };

    const getWeatherIcon = (code: number) => {
        if (code <= 1) return '☀️';
        if (code <= 3) return '☁️';
        if (code <= 48) return '🌫️';
        if (code <= 55) return '🌦️';
        if (code <= 67) return '🌧️';
        if (code <= 77) return '❄️';
        if (code <= 82) return '🌧️';
        if (code <= 86) return '❄️';
        return '⛈️';
    };

    const theme = getThemeColors(activePet?.theme_color || 'indigo');

    const getLatestWeight = (healthLogs: any[]) => {
        const sortedLogs = [...healthLogs]
            .filter(log => log.weight)
            .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
        return sortedLogs.length > 0 ? sortedLogs[0].weight : null;
    };

    const latestWeight = activePet ? getLatestWeight(activePet.health_logs) : null;
    const weightDiff = (latestWeight && activePet?.target_weight) 
        ? latestWeight - activePet.target_weight 
        : null;

    return (
        <div className="h-[calc(100vh-64px)] bg-gray-50 flex flex-col overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
                {/* サイドバー - ペットセレクター */}
                {hasPets && (
                    <aside className="w-20 md:w-64 bg-white border-r border-gray-200 hidden sm:block flex-shrink-0 pt-4">
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
                                        <div className={`h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold overflow-hidden ${petTheme.bg}`}>
                                            {pet.image_path ? (
                                                <img 
                                                    src={pet.image_path.startsWith('http') ? pet.image_path : `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${pet.image_path}`} 
                                                    alt={pet.name} 
                                                    className="h-full w-full object-cover" 
                                                />
                                            ) : (
                                                pet.name.substring(0, 1)
                                            )}
                                        </div>
                                        <div className="ml-3 text-left hidden md:block">
                                            <div className="text-sm font-bold truncate">{pet.name}</div>
                                            <div className="text-xs opacity-70">
                                                {pet.breed?.name ?? ''}
                                                {pet.birthday && ` (${calculateAge(pet.birthday)})`}
                                            </div>
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

                <main className="flex-1 overflow-y-auto pt-4 pb-2">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* モバイル用ペットセレクター */}
                        {hasPets && (
                            <div className="flex sm:hidden overflow-x-auto pb-2 space-x-3 scrollbar-hide">
                                {dashboardData.pets.map((pet: any) => {
                                    const petTheme = getThemeColors(pet.theme_color || 'indigo');
                                    return (
                                        <button
                                            key={pet.id}
                                            onClick={() => setActivePetId(pet.id)}
                                            className={`flex-shrink-0 flex flex-col items-center space-y-1 ${activePetId === pet.id ? petTheme.text : 'text-gray-400'}`}
                                        >
                                            <div className={`h-14 w-14 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm overflow-hidden ${petTheme.bg} ${activePetId === pet.id ? 'ring-4 ring-white' : 'opacity-60'}`}>
                                                {pet.image_path ? (
                                                    <img 
                                                        src={pet.image_path.startsWith('http') ? pet.image_path : `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${pet.image_path}`} 
                                                        alt={pet.name} 
                                                        className="h-full w-full object-cover" 
                                                    />
                                                ) : (
                                                    pet.name.substring(0, 1)
                                                )}
                                            </div>
                                            <span className="text-xs font-bold">{pet.name}</span>
                                            {pet.birthday && (
                                                <span className="text-[10px] opacity-70 whitespace-nowrap">
                                                    {calculateAge(pet.birthday)}
                                                </span>
                                            )}
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
                            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                                <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                                    <PlusCircle className="h-6 w-6 text-indigo-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">ペットが登録されていません</h3>
                                <p className="text-gray-500 mb-4 text-sm">まずは大切なペットのプロフィールを作成しましょう。</p>
                                <Link href="/pets/create" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-bold">
                                    ペットを登録する
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-xl font-extrabold text-gray-900 leading-tight">{activePet.name}</h2>
                                        <p className="text-xs text-gray-500">
                                            {activePet.breed?.name ?? ''}
                                            {activePet.birthday && ` • ${calculateAge(activePet.birthday)}`}
                                        </p>
                                        {latestWeight && (
                                            <div className="flex items-center ml-2 bg-white px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">
                                                <span className="text-xs font-bold text-gray-700">{latestWeight}kg</span>
                                                {weightDiff !== null && (
                                                    <span className={`text-[10px] font-black ml-1.5 ${weightDiff > 0 ? 'text-rose-500' : weightDiff < 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                                                        {weightDiff > 0 ? `+${weightDiff.toFixed(2)}` : weightDiff.toFixed(2)}
                                                        <span className="ml-0.5 opacity-70">目標比</span>
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex space-x-2">
                                        <Link 
                                            href={`/pets/${activePet.id}/edit`}
                                            className="px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-all text-gray-600 font-bold flex items-center"
                                        >
                                            プロフィール編集
                                        </Link>
                                        <button 
                                            onClick={() => setSelectedPetForLog(activePet)}
                                            className={`px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-all flex items-center font-bold ${theme.text}`}
                                        >
                                            <PlusCircle className="h-4 w-4 mr-1.5" />
                                            記録
                                        </button>
                                        <Link 
                                            href={`/pets/${activePet.id}/ai-diagnose`}
                                            className={`px-3.5 py-2 text-xs text-white rounded-lg shadow-md transition-all font-bold flex items-center ${theme.bg} ${theme.hover}`}
                                        >
                                            AI健康診断
                                        </Link>
                                        <Link 
                                            href={`/pets/${activePet.id}/history`}
                                            className="px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-all text-gray-600 font-bold flex items-center"
                                        >
                                            履歴
                                        </Link>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    {/* 天気予報セクション */}
                                    {dashboardData.weather && (
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-bold flex items-center text-gray-800">
                                                    <CloudSun className="h-4 w-4 mr-1.5 text-blue-500" />
                                                    お散歩のお天気（{dashboardData.weather.location}）
                                                </h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {dashboardData.weather.forecast.map((f: any, i: number) => {
                                                    const advice = getWeatherAdvice(f.weather_code, f.temp_max);
                                                    const date = parseISO(f.date);
                                                    return (
                                                        <div key={f.date} className={`p-3 rounded-lg border bg-gray-50 border-gray-100 ${i === 0 ? 'col-span-2' : 'col-span-2 sm:col-span-1'}`}>
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                                                                <span className="text-xs font-bold text-gray-500">
                                                                    {i === 0 ? '今日' : i === 1 ? '明日' : '明後日'}
                                                                    <span className="ml-1 md:inline hidden">{format(date, 'MM/dd(E)', { locale: ja })}</span>
                                                                </span>
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-xs leading-tight font-medium text-gray-500 sm:block hidden">
                                                                        {advice.text}
                                                                    </span>
                                                                    <span className="text-3xl">{getWeatherIcon(f.weather_code)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-baseline space-x-1.5 mb-1.5">
                                                                <span className="text-lg font-bold text-gray-800">{f.temp_max}°</span>
                                                                <span className="text-xs text-gray-400">{f.temp_min}°</span>
                                                                <span className="text-xs text-blue-500 ml-auto">{f.precipitation_probability}%</span>
                                                            </div>
                                                            
                                                            {/* 今日の時間別予報 */}
                                                            {i === 0 && f.hourly && (
                                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-[10px] font-bold text-gray-500 flex items-center">
                                                                            <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                                                                            お散歩最適ゾーン（気温25℃以下・雨なし）
                                                                        </span>
                                                                    </div>
                                                                    <div className="overflow-x-auto scrollbar-hide">
                                                                        <div className="flex pb-1 gap-0">
                                                                            {f.hourly.map((h: any, idx: number) => {
                                                                                const isOptimal = h.temp <= 25 && h.weather_code <= 3;
                                                                                const prevOptimal = idx > 0 && f.hourly[idx - 1].temp <= 25 && f.hourly[idx - 1].weather_code <= 3;
                                                                                const nextOptimal = idx < f.hourly.length - 1 && f.hourly[idx + 1].temp <= 25 && f.hourly[idx + 1].weather_code <= 3;

                                                                                return (
                                                                                    <div 
                                                                                        key={h.time} 
                                                                                        className={`flex flex-col items-center space-y-0.5 px-0.5 py-1 transition-all flex-1 min-w-[1.4rem] ${
                                                                                            isOptimal 
                                                                                                ? 'bg-green-50 border-y-2 border-green-500 shadow-sm relative z-10' 
                                                                                                : 'opacity-70'
                                                                                        } ${
                                                                                            isOptimal && !prevOptimal ? 'border-l-2 rounded-l-md' : ''
                                                                                        } ${
                                                                                            isOptimal && !nextOptimal ? 'border-r-2 rounded-r-md' : ''
                                                                                        } ${
                                                                                            isOptimal && prevOptimal ? '-ml-[2px]' : ''
                                                                                        }`}
                                                                                    >
                                                                                        <span className="text-[11px] text-gray-400 font-bold">
                                                                                           {format(parseISO(h.time), 'H')}
                                                                                        </span>
                                                                                        <span className="text-lg leading-none">
                                                                                           {getWeatherIcon(h.weather_code)}
                                                                                        </span>
                                                                                        <span className={`text-[11px] font-black leading-none ${h.temp > 25 ? 'text-orange-500' : 'text-gray-700'}`}>
                                                                                           {Math.round(h.temp)}°
                                                                                        </span>
                                                                                        <span className={`text-[9px] font-black leading-none ${h.precipitation_probability > 30 ? 'text-blue-500' : 'text-blue-300'}`}>
                                                                                           {h.precipitation_probability}%
                                                                                        </span>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <p className={`text-xs leading-tight font-medium ${advice.color} sm:hidden block mt-1`}>
                                                                {advice.text}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* 体重グラフ */}
                                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="text-xs font-bold mb-2 flex items-center text-gray-800">
                                            <Activity className={`h-3.5 w-3.5 mr-1.5 ${theme.text}`} />
                                            体重推移 (kg)
                                        </h3>
                                        <div className="h-44 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart 
                                                    data={[...activePet.health_logs].filter(log => log.weight).reverse()}
                                                    margin={{ left: 0, right: 60, top: 5, bottom: 5 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                    <XAxis 
                                                        dataKey="logged_at" 
                                                        tickFormatter={(str) => format(new Date(str), 'MM/dd(E)', { locale: ja })}
                                                        tick={{ fontSize: 9, fill: '#9ca3af' }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <YAxis 
                                                        domain={['auto', 'auto']} 
                                                        tick={{ fontSize: 9, fill: '#9ca3af' }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        width={35}
                                                    />
                                                    <Tooltip 
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 4px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                                                        labelFormatter={(label) => format(new Date(label), 'yyyy/MM/dd(E)', { locale: ja })}
                                                        formatter={(value: number) => {
                                                            const labels = [`${value} kg`, '体重'];
                                                            if (activePet.target_weight) {
                                                                const diff = value - activePet.target_weight;
                                                                const diffStr = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
                                                                labels[0] = `${value} kg (目標比: ${diffStr} kg)`;
                                                            }
                                                            return labels;
                                                        }}
                                                    />
                                                    {activePet.target_weight && (
                                                        <ReferenceLine 
                                                            y={activePet.target_weight} 
                                                            stroke="#ef4444" 
                                                            strokeDasharray="3 3"
                                                            label={{ 
                                                                value: `目標: ${activePet.target_weight}kg`, 
                                                                position: 'right', 
                                                                fill: '#ef4444',
                                                                fontSize: 8,
                                                                fontWeight: 'bold'
                                                            }} 
                                                        />
                                                    )}
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="weight" 
                                                        stroke={theme.dot} 
                                                        strokeWidth={2.5}
                                                        dot={{ r: 3, fill: theme.dot, strokeWidth: 1.5, stroke: '#fff' }}
                                                        activeDot={{ r: 5, strokeWidth: 0 }}
                                                        connectNulls
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* 散歩時間グラフ */}
                                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xs font-bold flex items-center text-gray-800">
                                                <Activity className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                                                1週間の散歩 (分)
                                            </h3>
                                            <div className="text-right flex items-baseline space-x-3">
                                                <div>
                                                    <span className="text-base font-black text-gray-900">
                                                        {getWeeklyExerciseData(activePet.health_logs).reduce((acc, curr) => acc + (curr.exercise_duration || 0), 0)}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-gray-400 ml-0.5">分/週</span>
                                                </div>
                                                <div className="border-l border-gray-200 pl-3">
                                                    <span className="text-base font-black text-gray-900">
                                                        {Math.round(getWeeklyExerciseData(activePet.health_logs).reduce((acc, curr) => acc + (curr.exercise_duration || 0), 0) / 7)}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-gray-400 ml-0.5">分/日</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-44 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart 
                                                    data={getWeeklyExerciseData(activePet.health_logs)}
                                                    margin={{ left: 0, right: 30, top: 5, bottom: 5 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                    <XAxis 
                                                        dataKey="displayDate" 
                                                        tick={{ fontSize: 9, fill: '#9ca3af' }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <YAxis 
                                                        tick={{ fontSize: 9, fill: '#9ca3af' }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        width={30}
                                                    />
                                                    <Tooltip 
                                                        cursor={{ fill: '#f9fafb' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 4px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                                                        labelFormatter={(value, props) => {
                                                            const entry = props && props.length > 0 ? props[0].payload : null;
                                                            if (entry) {
                                                                return `${entry.date.replace(/-/g, '/')} (${format(new Date(entry.date), 'E', { locale: ja })})`;
                                                            }
                                                            return value;
                                                        }}
                                                        formatter={(value) => [`${value} 分`, '散歩時間']}
                                                    />
                                                    <Bar dataKey="exercise_duration" radius={[2, 2, 0, 0]}>
                                                        {getWeeklyExerciseData(activePet.health_logs).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.exercise_duration > 0 ? '#10b981' : '#e5e7eb'} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    {/* 重要なお知らせ */}
                                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                                        <h3 className="text-xs font-bold mb-2 flex items-center text-gray-800">
                                            <Bell className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                                            重要なお知らせ
                                        </h3>
                                        <div className="space-y-2 flex-1">
                                            {(activePet.medical_events.length > 0 || (activePet.generated_announcements && activePet.generated_announcements.length > 0)) ? (
                                                <>
                                                    {activePet.medical_events.map((event: any) => (
                                                        <div key={event.id} className="flex items-start p-2 bg-amber-50 rounded-lg border border-amber-100">
                                                            <Calendar className="h-3 w-3 text-amber-600 mr-2 mt-0.5" />
                                                            <div>
                                                                <p className="text-[11px] font-bold text-amber-900 leading-tight">{event.title}</p>
                                                                <p className="text-[9px] text-amber-700 font-medium">予定日: {format(new Date(event.event_date), 'yyyy/MM/dd')}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {activePet.generated_announcements && activePet.generated_announcements.map((announcement: any) => (
                                                        <div key={announcement.id} className="flex items-start p-2 bg-blue-50 rounded-lg border border-blue-100">
                                                            <Bell className="h-3 w-3 text-blue-600 mr-2 mt-0.5" />
                                                            <div>
                                                                <p className="text-[11px] font-bold text-blue-900 leading-tight">{announcement.title}</p>
                                                                <p className="text-[9px] text-blue-700 font-medium">推奨時期: {format(new Date(announcement.event_date), 'yyyy/MM/dd')}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </>
                                            ) : (
                                                <p className="text-[10px] text-gray-400 text-center py-2 italic">予定はありません</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* AI診断要約 */}
                                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                                        <h3 className="text-xs font-bold mb-2 flex items-center text-gray-800">
                                            <HeartPulse className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
                                            最新のAI診断
                                        </h3>
                                        <div className="flex-1 flex flex-col">
                                            {activePet.ai_diagnoses && activePet.ai_diagnoses.length > 0 ? (
                                                <div className="p-2 bg-rose-50 rounded-lg border border-rose-100 flex-1 flex flex-col">
                                                    <div className="flex items-center text-[9px] font-bold text-rose-400 uppercase tracking-wider mb-1">
                                                        <Calendar className="h-2 w-2 mr-1" />
                                                        {format(new Date(activePet.ai_diagnoses[0].created_at), 'yyyy/MM/dd')}
                                                    </div>
                                                    <p className="text-[10px] text-gray-700 line-clamp-3 leading-tight font-medium flex-1">
                                                        {activePet.ai_diagnoses[0].result_text.replace(/#|【|】/g, '').split('\n').filter((l: string) => l.trim().length > 0).join(' ')}
                                                    </p>
                                                    <Link 
                                                        href={`/pets/${activePet.id}/history`}
                                                        className="mt-1 text-[9px] font-bold text-rose-600 hover:text-rose-700 flex items-center justify-end"
                                                    >
                                                        履歴を表示 →
                                                    </Link>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center py-2">
                                                    <p className="text-[10px] text-gray-400 italic mb-1.5">まだ診断記録がありません</p>
                                                    <Link 
                                                        href={`/pets/${activePet.id}/ai-diagnose`}
                                                        className={`px-2 py-1 text-[9px] text-white rounded-lg font-bold transition-all ${theme.bg} ${theme.hover}`}
                                                    >
                                                        AI診断を試す
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 最近の健康記録 */}
                                <div className="lg:col-span-2">
                                    <div className="flex items-center justify-between mb-2 mt-1">
                                        <h3 className="text-xs font-bold flex items-center text-gray-800">
                                            <ClipboardList className={`h-3.5 w-3.5 mr-1.5 ${theme.text}`} />
                                            最近の健康記録
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                            {activePet.health_logs && activePet.health_logs.length > 0 ? (
                                                activePet.health_logs.slice(0, 5).map((log: any) => (
                                                    <div key={log.id} className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all">
                                                        <div className="text-[9px] font-extrabold text-gray-400 mb-2 border-b border-gray-50 pb-1.5 uppercase tracking-tighter">
                                                            {format(new Date(log.logged_at), 'yyyy/MM/dd')}
                                                        </div>
                                                        <div className="space-y-2">
                                                            {log.meal_amount && (
                                                                <div className="flex items-center text-[11px] font-bold text-gray-600">
                                                                    <Utensils className="h-3 w-3 mr-1.5 text-orange-400" />
                                                                    {log.meal_amount}g
                                                                </div>
                                                            )}
                                                            {log.weight && (
                                                                <div className="flex items-center text-[11px] font-bold text-gray-600">
                                                                    <Scale className="h-3 w-3 mr-1.5 text-blue-400" />
                                                                    {log.weight}kg
                                                                </div>
                                                            )}
                                                            {log.exercise_duration && (
                                                                <div className="flex items-center text-[11px] font-bold text-gray-600">
                                                                    <Activity className="h-3 w-3 mr-1.5 text-green-400" />
                                                                    {log.exercise_duration}分
                                                                </div>
                                                            )}
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${log.stool_status === '普通' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                    便:{log.stool_status}
                                                                </span>
                                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${log.urine_status === '普通' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                    尿:{log.urine_status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-full py-8 bg-white rounded-xl border border-dashed border-gray-200 text-center text-gray-400 text-xs font-medium">
                                                    健康記録がまだありません
                                                </div>
                                            )}
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
