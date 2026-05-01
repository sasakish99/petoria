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
import { 
    Calendar, 
    Bell, 
    PlusCircle, 
    Activity, 
    ClipboardList, 
    HeartPulse, 
    Utensils, 
    Scale, 
    CloudSun,
    MapPin,
    Navigation,
    Star,
    ChevronDown,
    ChevronUp,
    Phone,
    Clock,
    ExternalLink,
    Loader2,
    X,
    CheckCircle2,
    Receipt,
    Smile,
    Frown,
    Meh,
    Laugh,
    Angry
} from 'lucide-react';
import { format, differenceInYears, differenceInMonths, subDays, isSameDay, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import HealthLogModal from '@/components/HealthLogModal';
import ExerciseLogModal from '@/components/ExerciseLogModal';
import VaccinationCertificateModal from '@/components/VaccinationCertificateModal';
import MedicalReceiptUploadModal from '@/components/MedicalReceiptUploadModal';
import HealthCheckupResultUploadModal from '@/components/HealthCheckupResultUploadModal';

const conditions = [
    { value: 1, label: '最悪', icon: Angry, color: 'text-rose-500', bg: 'bg-rose-50', active: 'bg-rose-500 text-white' },
    { value: 2, label: '悪い', icon: Frown, color: 'text-orange-500', bg: 'bg-orange-50', active: 'bg-orange-500 text-white' },
    { value: 3, label: '普通', icon: Meh, color: 'text-amber-500', bg: 'bg-amber-50', active: 'bg-amber-500 text-white' },
    { value: 4, label: '良い', icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-50', active: 'bg-emerald-500 text-white' },
    { value: 5, label: '最高', icon: Laugh, color: 'text-sky-500', bg: 'bg-sky-50', active: 'bg-sky-500 text-white' },
];

const Dashboard = () => {
    const { user, logout } = useAuth({ middleware: 'auth' });
    const [selectedPetForLog, setSelectedPetForLog] = useState<any>(null);
    const [selectedPetForExercise, setSelectedPetForExercise] = useState<any>(null);
    const [selectedPetForCertificate, setSelectedPetForCertificate] = useState<any>(null);
    const [selectedPetForReceipt, setSelectedPetForReceipt] = useState<any>(null);
    const [selectedPetForHealthCheckup, setSelectedPetForHealthCheckup] = useState<any>(null);
    const [viewingCertificate, setViewingCertificate] = useState<any>(null);
    const [editingLog, setEditingLog] = useState<any>(null);
    const [editingExerciseLog, setEditingExerciseLog] = useState<any>(null);
    const [activePetId, setActivePetId] = useState<number | null>(null);
    const [isHospitalsExpanded, setIsHospitalsExpanded] = useState(false);
    const [isWeatherExpanded, setIsWeatherExpanded] = useState(false);
    const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isRequestingLocation, setIsRequestingLocation] = useState(false);
    const [isLocationCardDismissed, setIsLocationCardDismissed] = useState(false);

    // マウント時にlocalStorageから位置情報カードの非表示状態を復元
    useEffect(() => {
        const dismissed = localStorage.getItem('isLocationCardDismissed');
        if (dismissed === 'true') {
            setIsLocationCardDismissed(true);
        }
    }, []);

    // 位置情報カードを閉じる
    const handleDismissLocationCard = () => {
        setIsLocationCardDismissed(true);
        localStorage.setItem('isLocationCardDismissed', 'true');
    };

    // ブラウザから位置情報を取得する関数
    const handleRequestLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('お使いのブラウザは位置情報に対応していません。');
            return;
        }

        setIsRequestingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const newLocation = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                setLocation(newLocation);
                setIsRequestingLocation(false);

                // サーバーに位置情報を保存（オプション）
                try {
                    await axios.put('/api/user', {
                        latitude: newLocation.lat,
                        longitude: newLocation.lon
                    });
                    // 位置情報を保存できたらユーザー情報を再取得するか、
                    // ローカルのlocationステートで十分なはず
                } catch (e: any) {
                    console.error('Failed to save location to profile:', e.response?.data || e.message);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                setIsRequestingLocation(false);
                if (error.code === error.PERMISSION_DENIED) {
                    setLocationError('位置情報の利用が許可されませんでした。');
                } else {
                    setLocationError('位置情報の取得に失敗しました。');
                }
            }
        );
    };

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

    const getWeeklyExerciseData = (exerciseLogs: any[]) => {
        const today = new Date();
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = subDays(today, i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const log = exerciseLogs.find(l => isSameDay(parseISO(l.logged_at), date));
            
            data.push({
                date: dateStr,
                displayDate: format(date, 'MM/dd(E)', { locale: ja }),
                duration_minutes: log?.duration_minutes || 0,
            });
        }
        
        return data;
    };
    
    const { data: dashboardData, error, mutate } = useSWR(
        ['/api/dashboard', location],
        () => {
            const params = location ? `?lat=${location.lat}&lon=${location.lon}` : '';
            return axios.get(`/api/dashboard${params}`).then(res => res.data);
        },
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
            indigo: { bg: 'bg-indigo-600', hover: 'hover:bg-indigo-700', text: 'text-indigo-600', light: 'bg-indigo-50/50', border: 'border-indigo-100/50', ring: 'ring-indigo-100', dot: '#4f46e5' },
            rose: { bg: 'bg-rose-500', hover: 'hover:bg-rose-600', text: 'text-rose-600', light: 'bg-rose-50/50', border: 'border-rose-100/50', ring: 'ring-rose-100', dot: '#f43f5e' },
            amber: { bg: 'bg-amber-500', hover: 'hover:bg-amber-600', text: 'text-amber-600', light: 'bg-amber-50/50', border: 'border-amber-100/50', ring: 'ring-amber-100', dot: '#f59e0b' },
            emerald: { bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', text: 'text-emerald-600', light: 'bg-emerald-50/50', border: 'border-emerald-100/50', ring: 'ring-emerald-100', dot: '#10b981' },
            blue: { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50/50', border: 'border-blue-100/50', ring: 'ring-blue-100', dot: '#3b82f6' },
            slate: { bg: 'bg-slate-700', hover: 'hover:bg-slate-800', text: 'text-slate-700', light: 'bg-slate-100/50', border: 'border-slate-200/50', ring: 'ring-slate-200', dot: '#334155' },
        };
        return colors[color] || colors.slate;
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

    const theme = getThemeColors(activePet?.theme_color || 'slate');

    const getLatestWeight = (healthLogs: any[]) => {
        const sortedLogs = [...healthLogs]
            .filter(log => log.weight)
            .sort((a, b) => parseISO(b.logged_at).getTime() - parseISO(a.logged_at).getTime());
        return sortedLogs.length > 0 ? sortedLogs[0].weight : null;
    };

    const latestWeight = activePet ? getLatestWeight(activePet.health_logs) : null;
    const weightDiff = (latestWeight && activePet?.target_weight) 
        ? latestWeight - activePet.target_weight 
        : null;

    return (
        <div className="h-[calc(100vh-80px)] bg-slate-50 flex flex-col overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
                {/* サイドバー - ペットセレクター */}
                {hasPets && (
                    <aside className="w-20 md:w-64 bg-white/50 backdrop-blur-md border-r border-slate-200/50 hidden sm:block flex-shrink-0 pt-4">
                        <div className="p-4 space-y-4">
                            <div className="px-3 pb-2 text-[11px] font-black text-slate-400 uppercase tracking-widest hidden md:block">
                                うちの子
                            </div>
                            {dashboardData.pets.map((pet: any, index: number) => {
                                const petTheme = getThemeColors(pet.theme_color || 'slate');
                                return (
                                    <button
                                        key={pet.id}
                                        onClick={() => setActivePetId(pet.id)}
                                        className={`w-full flex items-center p-2 rounded-2xl transition-all duration-300 group active:scale-[0.98] ${
                                            activePetId === pet.id 
                                                ? `${petTheme.light} ${petTheme.text} shadow-[0_4px_12px_rgba(0,0,0,0.05)] ring-1 ring-inset ${petTheme.border}` 
                                                : 'text-slate-500 hover:bg-white/60 hover:text-slate-800 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className={`h-10 w-10 rounded-[14px] flex-shrink-0 flex items-center justify-center text-white font-bold overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-105 ${petTheme.bg} ${activePetId === pet.id ? 'ring-2 ring-white ring-offset-2 ' + petTheme.ring : ''}`}>
                                            {pet.image_path ? (
                                                <img 
                                                    src={pet.image_path.startsWith('http') ? pet.image_path : `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${pet.image_path}`} 
                                                    alt={pet.name} 
                                                    className="h-full w-full object-cover" 
                                                />
                                            ) : (
                                                <span className="text-lg">{pet.name.substring(0, 1)}</span>
                                            )}
                                        </div>
                                        <div className="ml-3 text-left hidden md:block overflow-hidden">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <div className="text-sm font-black truncate tracking-tight">{pet.name}</div>
                                                {pet.gender && (
                                                    <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${
                                                        pet.gender === 'male' ? 'bg-blue-400' : 
                                                        pet.gender === 'female' ? 'bg-rose-400' : 
                                                        'bg-slate-300'
                                                    }`} />
                                                )}
                                            </div>
                                            <div className="text-[10px] font-bold opacity-50 truncate tracking-wide flex items-center">
                                                <span className="truncate">{pet.breed?.name ?? '品種不明'}</span>
                                                {pet.birthday && (
                                                    <>
                                                        <span className="mx-1 opacity-30">•</span>
                                                        <span className="shrink-0">{calculateAge(pet.birthday)}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                            <Link 
                                href="/pets/create"
                                className="w-full flex items-center p-2 rounded-2xl text-slate-400 hover:bg-white/60 hover:text-slate-600 transition-all border-2 border-dashed border-slate-200/60 group active:scale-[0.98]"
                            >
                                <div className="h-10 w-10 rounded-[14px] flex-shrink-0 flex items-center justify-center bg-slate-50/50 border border-slate-100 transition-colors group-hover:bg-white group-hover:border-slate-200">
                                    <PlusCircle className="h-5 w-5 transition-transform group-hover:rotate-90 duration-300" />
                                </div>
                                <div className="ml-3 text-sm font-black hidden md:block">追加する</div>
                            </Link>
                        </div>
                    </aside>
                )}

                <main className="flex-1 overflow-y-auto pt-4 pb-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* モバイル用ペットセレクター */}
                        {hasPets && (
                            <div className="flex sm:hidden overflow-x-auto pb-4 pt-2 space-x-4 scrollbar-hide px-4 -mx-4">
                                {dashboardData.pets.map((pet: any, index: number) => {
                                    const petTheme = getThemeColors(pet.theme_color || 'indigo');
                                    const isActive = activePetId === pet.id;
                                    return (
                                        <button
                                            key={pet.id}
                                            onClick={() => setActivePetId(pet.id)}
                                            className={`flex-shrink-0 flex flex-col items-center space-y-2 transition-all duration-300 active:scale-90 ${isActive ? 'scale-105' : 'opacity-70'}`}
                                        >
                                            <div className={`h-12 w-12 rounded-[14px] flex items-center justify-center text-white text-lg font-black shadow-md overflow-hidden transition-all duration-300 ${petTheme.bg} ${isActive ? 'ring-4 ring-white shadow-indigo-200/50' : ''}`}>
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
                                            <div className="flex flex-col items-center min-h-[1.5rem] justify-center">
                                                <span className={`text-[11px] font-black truncate max-w-[72px] text-center tracking-tight leading-tight ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                                                    {pet.name}
                                                </span>
                                                {isActive && (
                                                    <div className={`h-1 w-1 rounded-full mt-0.5 ${petTheme.bg}`} />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                                <Link 
                                    href="/pets/create"
                                    className="flex-shrink-0 flex flex-col items-center space-y-2 text-slate-400 active:scale-90"
                                >
                                    <div className="h-12 w-12 rounded-[14px] flex items-center justify-center bg-white border-2 border-dashed border-slate-200 shadow-sm">
                                        <PlusCircle className="h-6 w-6" />
                                    </div>
                                    <div className="flex flex-col items-center min-h-[1.5rem] justify-center">
                                        <span className="text-[10px] font-bold">追加</span>
                                    </div>
                                </Link>
                            </div>
                        )}

                        {!hasPets ? (
                            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl shadow-slate-200/50 p-12 text-center border border-white">
                                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                                    <PlusCircle className="h-8 w-8 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">うちの子が登録されていません</h3>
                                <p className="text-slate-500 mb-8 font-medium">まずは大切なうちの子のプロフィールを作成しましょう。</p>
                                <Link href="/pets/create" className="inline-flex items-center px-8 py-4 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all text-sm font-bold shadow-lg shadow-slate-200">
                                    うちの子を登録する
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {/* 位置情報リクエストカード */}
                                {!location && !user.latitude && !user.longitude && !isLocationCardDismissed && (
                                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] p-6 shadow-xl shadow-blue-200 text-white overflow-hidden relative group">
                                        <button 
                                            onClick={handleDismissLocationCard}
                                            className="absolute top-4 right-4 z-20 p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                            aria-label="閉じる"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                            <MapPin className="w-32 h-32" />
                                        </div>
                                        <div className="relative z-10">
                                            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                                                <MapPin className="w-6 h-6" />
                                                位置情報の利用について
                                            </h3>
                                            <p className="text-blue-50/90 text-sm font-medium mb-6 leading-relaxed max-w-none">
                                                お住まいの地域の天気予報や、近くの動物病院を自動で表示するために位置情報を使用します。<br/>
                                                設定はいつでもプロフィール画面から変更できます。
                                            </p>
                                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                                <button
                                                    onClick={handleRequestLocation}
                                                    disabled={isRequestingLocation}
                                                    className="w-full sm:w-auto px-8 py-3.5 bg-white text-blue-600 rounded-2xl font-black text-sm shadow-lg shadow-blue-700/20 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                                                >
                                                    {isRequestingLocation ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Navigation className="w-4 h-4" />
                                                    )}
                                                    現在地を取得して利用する
                                                </button>
                                                {locationError && (
                                                    <span className="text-[11px] font-bold text-blue-100 bg-blue-700/30 px-3 py-2 rounded-xl">
                                                        {locationError}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-baseline gap-3 min-w-0">
                                        <h2 className="text-2xl font-black bg-gradient-to-r from-slate-800 to-slate-500 bg-clip-text text-transparent tracking-tight leading-tight truncate">{activePet.name}</h2>
                                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                            {activePet.gender && (
                                                <span className={`flex-shrink-0 text-[11px] font-black px-2 py-0.5 rounded-lg shadow-sm ${
                                                    activePet.gender === 'male' ? 'bg-blue-50 text-blue-600' : 
                                                    activePet.gender === 'female' ? 'bg-rose-50 text-rose-600' : 
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {activePet.gender === 'male' ? 'オス' : activePet.gender === 'female' ? 'メス' : '不明'}
                                                </span>
                                            )}
                                            <p className="text-sm font-medium text-slate-500 truncate flex items-center gap-1.5">
                                                <span>
                                                    {activePet.breed?.name ?? ''}
                                                    {activePet.birthday && ` • ${calculateAge(activePet.birthday)}`}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-end gap-2.5">
                                        <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                                            <Link 
                                                href={`/pets/${activePet.id}/edit`}
                                                className="flex-shrink-0 px-4 py-2 text-xs bg-white/70 backdrop-blur-sm border border-slate-200 rounded-xl shadow-sm hover:bg-white hover:-translate-y-0.5 hover:shadow-md transition-all text-slate-600 font-bold flex items-center"
                                            >
                                                編集
                                            </Link>
                                            <Link 
                                                href={`/pets/${activePet.id}/ai-diagnose`}
                                                className={`flex-shrink-0 px-4 py-2 text-xs text-white rounded-xl shadow-lg shadow-slate-200 hover:-translate-y-0.5 hover:shadow-xl transition-all font-bold flex items-center ${theme.bg} ${theme.hover}`}
                                            >
                                                AI健康診断
                                            </Link>
                                            <Link 
                                                href={`/pets/${activePet.id}/history`}
                                                className="flex-shrink-0 px-4 py-2 text-xs bg-white/70 backdrop-blur-sm border border-slate-200 rounded-xl shadow-sm hover:bg-white hover:-translate-y-0.5 hover:shadow-md transition-all text-slate-600 font-bold flex items-center"
                                            >
                                                履歴
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* 体重グラフ */}
                                    <div className="bg-white/70 backdrop-blur-lg p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-white">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-sm font-black flex items-center text-slate-800 tracking-tight">
                                                <Activity className={`h-4 w-4 mr-2 ${theme.text}`} />
                                                体重推移 (kg)
                                            </h3>
                                            <button
                                                onClick={() => setSelectedPetForLog(activePet)}
                                                className={`px-3 py-1 ${theme.light} ${theme.text} rounded-lg text-[10px] font-black hover:opacity-80 transition-all border ${theme.border} shadow-sm flex items-center gap-1.5`}
                                            >
                                                <PlusCircle className="h-3 w-3" />
                                                記録する
                                            </button>
                                        </div>
                                        <div className="h-44 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart 
                                                    data={[...activePet.health_logs].filter(log => log.weight).reverse()}
                                                    margin={{ left: 0, right: 60, top: 5, bottom: 5 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                    <XAxis 
                                                        dataKey="logged_at" 
                                                        tickFormatter={(str) => format(parseISO(str), 'MM/dd(E)', { locale: ja })}
                                                        tick={{ fontSize: 9, fill: '#9ca3af' }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <YAxis 
                                                        domain={[
                                                            (dataMin: number) => {
                                                                const min = activePet.target_weight ? Math.min(dataMin, activePet.target_weight) : dataMin;
                                                                return Math.floor(min * 0.95 * 10) / 10;
                                                            },
                                                            (dataMax: number) => {
                                                                const max = activePet.target_weight ? Math.max(dataMax, activePet.target_weight) : dataMax;
                                                                return Math.ceil(max * 1.05 * 10) / 10;
                                                            }
                                                        ]} 
                                                        tick={{ fontSize: 9, fill: '#9ca3af' }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        width={35}
                                                    />
                                                    <Tooltip 
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 4px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                                                        labelFormatter={(label) => format(parseISO(label), 'yyyy/MM/dd(E)', { locale: ja })}
                                                        formatter={(value: any) => {
                                                            const numericValue = Number(value);
                                                            const labels = [`${numericValue} kg`, '体重'];
                                                            if (activePet.target_weight) {
                                                                const diff = numericValue - activePet.target_weight;
                                                                const diffStr = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
                                                                labels[0] = `${numericValue} kg (目標比: ${diffStr} kg)`;
                                                            }
                                                            return labels;
                                                        }}
                                                    />
                                                    {activePet.target_weight && (
                                                        <ReferenceLine 
                                                            y={activePet.target_weight} 
                                                            stroke="#ef4444" 
                                                            strokeDasharray="4 4"
                                                            strokeWidth={1.5}
                                                            label={{ 
                                                                value: `目標: ${activePet.target_weight}kg`, 
                                                                position: 'insideBottomRight', 
                                                                fill: '#ef4444',
                                                                fontSize: 10,
                                                                fontWeight: 'black',
                                                                offset: 10
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
                                    <div className="bg-white/70 backdrop-blur-lg p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-white">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-black flex items-center text-slate-800 tracking-tight">
                                                <Activity className="h-4 w-4 mr-2 text-emerald-500" />
                                                1週間の散歩 (分)
                                            </h3>
                                            <button
                                                onClick={() => setSelectedPetForExercise(activePet)}
                                                className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black hover:bg-emerald-100 transition-colors border border-emerald-100/50 flex items-center gap-1.5"
                                            >
                                                <PlusCircle className="h-3 w-3" />
                                                運動を記録
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-end gap-6 mb-6 border-b border-slate-50 pb-4">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">合計</span>
                                                <div>
                                                    <span className="text-xl font-black text-slate-800 tracking-tighter">
                                                        {getWeeklyExerciseData(activePet.exercise_logs).reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0)}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-500 ml-1">分</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end border-l border-slate-100 pl-6">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">1日平均</span>
                                                <div>
                                                    <span className="text-xl font-black text-slate-800 tracking-tighter">
                                                        {Math.round(getWeeklyExerciseData(activePet.exercise_logs).reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) / 7)}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-500 ml-1">分</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-44 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart 
                                                    data={getWeeklyExerciseData(activePet.exercise_logs)}
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
                                                        formatter={(value) => [`${value} 分`, '運動時間']}
                                                    />
                                                    <Bar dataKey="duration_minutes" radius={[2, 2, 0, 0]}>
                                                        {getWeeklyExerciseData(activePet.exercise_logs).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.duration_minutes > 0 ? '#10b981' : '#e5e7eb'} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* 重要なお知らせ */}
                                    <div className="bg-white/70 backdrop-blur-lg p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-white flex flex-col">
                                        <h3 className="text-sm font-black mb-4 flex items-center text-slate-800 tracking-tight">
                                            <Bell className="h-4 w-4 mr-2 text-amber-500" />
                                            重要なお知らせ
                                        </h3>
                                        <div className="space-y-3 flex-1">
                                            {(activePet.medical_events.length > 0) ? (
                                                <>
                                                    {activePet.medical_events.map((event: any) => {
                                                        const isVaccine = !!event.vaccine_type;
                                                        const eventDate = new Date(event.event_date);
                                                        const nextDate = event.next_event_date ? new Date(event.next_event_date) : null;
                                                        const displayDate = (!event.is_completed || isVaccine) && nextDate ? nextDate : eventDate;
                                                        const isUpcoming = displayDate > new Date();

                                                        if (!isUpcoming && event.is_completed) return null;

                                                        return (
                                                            <div key={event.id} className={`flex items-start p-3 rounded-2xl border shadow-sm backdrop-blur-sm ${isVaccine ? 'bg-indigo-50/50 border-indigo-100/50' : 'bg-amber-50/50 border-amber-100/50'}`}>
                                                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center mr-3 flex-shrink-0 ${isVaccine ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                                                                    {isVaccine ? <CheckCircle2 className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                                                                </div>
                                                                <div>
                                                                    <p className={`text-xs font-black leading-tight ${isVaccine ? 'text-indigo-900' : 'text-amber-900'}`}>
                                                                        {isVaccine ? `${event.title} (次回)` : event.title}
                                                                    </p>
                                                                    <p className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${isVaccine ? 'text-indigo-700' : 'text-amber-700'}`}>
                                                                        予定日: {format(displayDate, 'yyyy/MM/dd')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center py-6">
                                                    <p className="text-xs text-slate-400 font-medium italic">予定はありません</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                            {/* AI診断要約 */}
                                            <div className="bg-white/70 backdrop-blur-lg p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-white flex flex-col">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-sm font-black flex items-center text-slate-800 tracking-tight">
                                                        <Activity className="h-4 w-4 mr-2 text-indigo-500" />
                                                        ワクチンの管理
                                                    </h3>
                                                    <button
                                                        onClick={() => setSelectedPetForCertificate(activePet)}
                                                        className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black hover:bg-indigo-100 transition-colors border border-indigo-100/50 flex items-center gap-1.5"
                                                    >
                                                        <PlusCircle className="h-3 w-3" />
                                                        証明書を取り込む
                                                    </button>
                                                </div>
                                                <div className="flex-1">
                                                    {activePet.medical_events && activePet.medical_events.filter((e: any) => e.vaccine_type).length > 0 ? (
                                                        <div className="space-y-3">
                                                            {activePet.medical_events.filter((e: any) => e.vaccine_type).slice(0, 2).map((event: any) => (
                                                                <div 
                                                                    key={event.id} 
                                                                    className={`p-3 bg-slate-50/50 border border-slate-100/50 rounded-2xl flex items-center justify-between transition-all ${event.certificate_path ? 'cursor-pointer hover:bg-white hover:shadow-md hover:-translate-y-0.5' : ''}`}
                                                                    onClick={() => event.certificate_path && setViewingCertificate(event)}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`h-8 w-8 rounded-xl flex items-center justify-center shadow-sm ${event.vaccine_type === 'rabies' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                                                            <CheckCircle2 className="h-4 w-4" />
                                                                        </div>
                                                                        <div>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <p className="text-[11px] font-black text-slate-800">{event.title}</p>
                                                                                {event.certificate_path && (
                                                                                    <div className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black border border-emerald-100/50 flex items-center gap-0.5">
                                                                                        <Activity className="h-2 w-2" />
                                                                                        証明書あり
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-[9px] text-slate-400 font-bold">{format(new Date(event.event_date), 'yyyy/MM/dd')} 接種</p>
                                                                        </div>
                                                                    </div>
                                                                    {event.next_event_date && (
                                                                        <div className="text-right">
                                                                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">次回予定</p>
                                                                            <p className="text-[10px] font-black text-indigo-600">{format(new Date(event.next_event_date), 'yyyy/MM/dd')}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="h-full flex flex-col items-center justify-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/50">
                                                            <p className="text-xs text-slate-400 font-medium italic mb-3 tracking-tight">ワクチン記録がありません</p>
                                                            <button 
                                                                onClick={() => setSelectedPetForCertificate(activePet)}
                                                                className="px-4 py-2 text-[11px] bg-white text-indigo-600 rounded-xl font-black transition-all shadow-sm border border-indigo-100 hover:shadow-md hover:-translate-y-0.5"
                                                            >
                                                                AIで取り込む
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* AI診断要約 */}
                                            <div className="bg-white/70 backdrop-blur-lg p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-white flex flex-col">
                                        <h3 className="text-sm font-black mb-4 flex items-center text-slate-800 tracking-tight">
                                            <HeartPulse className="h-4 w-4 mr-2 text-rose-500" />
                                            最新のAI診断
                                        </h3>
                                        <div className="flex-1 flex flex-col">
                                            {activePet.ai_diagnoses && activePet.ai_diagnoses.length > 0 ? (
                                                <div className="p-4 bg-rose-50/50 backdrop-blur-sm rounded-2xl border border-rose-100/50 flex-1 flex flex-col shadow-sm">
                                                    <div className="flex items-center text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">
                                                        <Calendar className="h-3 w-3 mr-1.5" />
                                                        {format(new Date(activePet.ai_diagnoses[0].created_at), 'yyyy/MM/dd')}
                                                    </div>
                                                    <p className="text-[11px] text-slate-700 line-clamp-3 leading-relaxed font-bold flex-1">
                                                        {activePet.ai_diagnoses[0].result_text.replace(/#|【|】/g, '').split('\n').filter((l: string) => l.trim().length > 0).join(' ')}
                                                    </p>
                                                    <Link 
                                                        href={`/pets/${activePet.id}/history`}
                                                        className="mt-3 text-[10px] font-black text-rose-600 hover:text-rose-700 flex items-center justify-end group transition-all"
                                                    >
                                                        履歴を表示 <span className="ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
                                                    </Link>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center py-6 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                                    <p className="text-xs text-slate-400 font-medium italic mb-4 tracking-tight">まだ診断記録がありません</p>
                                                    <Link 
                                                        href={`/pets/${activePet.id}/ai-diagnose`}
                                                        className={`px-4 py-2 text-[11px] text-white rounded-xl font-black transition-all shadow-md shadow-slate-200 ${theme.bg} ${theme.hover}`}
                                                    >
                                                        AI診断を試す
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white/70 backdrop-blur-lg p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-white flex flex-col">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-black flex items-center text-slate-800 tracking-tight">
                                                <Receipt className="h-4 w-4 mr-2 text-indigo-500" />
                                                最新の診療明細
                                            </h3>
                                            <button
                                                onClick={() => setSelectedPetForReceipt(activePet)}
                                                className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black hover:bg-indigo-100 transition-colors border border-indigo-100/50 flex items-center gap-1.5"
                                            >
                                                <PlusCircle className="h-3 w-3" />
                                                明細を取り込む
                                            </button>
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            {activePet.medical_receipts && activePet.medical_receipts.length > 0 ? (
                                                <div className="p-4 bg-indigo-50/50 backdrop-blur-sm rounded-2xl border border-indigo-100/50 flex-1 flex flex-col shadow-sm">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                                            <Calendar className="h-3 w-3 mr-1.5" />
                                                            {format(parseISO(activePet.medical_receipts[0].receipt_date), 'yyyy/MM/dd')}
                                                        </div>
                                                        <div className="text-xs font-black text-indigo-600">
                                                            ¥{Math.floor(Number(activePet.medical_receipts[0].total_amount) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                        </div>
                                                    </div>
                                                    <p className="text-[11px] text-slate-700 font-bold truncate">
                                                        {activePet.medical_receipts[0].clinic_name || '名称未設定'}
                                                    </p>
                                                    <Link 
                                                        href={`/pets/${activePet.id}/medical-receipts/history`}
                                                        className="mt-3 text-[10px] font-black text-indigo-600 hover:text-indigo-700 flex items-center justify-end group transition-all"
                                                    >
                                                        履歴を表示 <span className="ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
                                                    </Link>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center py-6 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                                    <p className="text-xs text-slate-400 font-medium italic mb-4 tracking-tight">まだ明細記録がありません</p>
                                                    <button 
                                                        onClick={() => setSelectedPetForReceipt(activePet)}
                                                        className="px-4 py-2 text-[11px] bg-white text-indigo-600 rounded-xl font-black transition-all shadow-sm border border-indigo-100 hover:shadow-md hover:-translate-y-0.5"
                                                    >
                                                        AIで取り込む
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white/70 backdrop-blur-lg p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-white flex flex-col">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-black flex items-center text-slate-800 tracking-tight">
                                                <ClipboardList className="h-4 w-4 mr-2 text-emerald-500" />
                                                最新の健康診断
                                            </h3>
                                            <button
                                                onClick={() => setSelectedPetForHealthCheckup(activePet)}
                                                className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black hover:bg-emerald-100 transition-colors border border-emerald-100/50 flex items-center gap-1.5"
                                            >
                                                <PlusCircle className="h-3 w-3" />
                                                結果を取り込む
                                            </button>
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            {activePet.health_checkup_results && activePet.health_checkup_results.length > 0 ? (
                                                <div className="p-4 bg-emerald-50/50 backdrop-blur-sm rounded-2xl border border-emerald-100/50 flex-1 flex flex-col shadow-sm">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                                            <Calendar className="h-3 w-3 mr-1.5" />
                                                            {format(parseISO(activePet.health_checkup_results[0].checkup_date), 'yyyy/MM/dd')}
                                                        </div>
                                                        <div className="text-[10px] font-black text-emerald-600">
                                                            {activePet.health_checkup_results[0].results?.length || 0}項目
                                                        </div>
                                                    </div>
                                                    <p className="text-[11px] text-slate-700 font-bold truncate">
                                                        {activePet.health_checkup_results[0].clinic_name || '名称未設定'}
                                                    </p>
                                                    <div className="mt-3 text-[10px] font-black text-emerald-600 flex items-center justify-end">
                                                        <span>詳細表示は準備中</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center py-6 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                                    <p className="text-xs text-slate-400 font-medium italic mb-4 tracking-tight">健康診断の記録がありません</p>
                                                    <button 
                                                        onClick={() => setSelectedPetForHealthCheckup(activePet)}
                                                        className="px-4 py-2 text-[11px] bg-white text-emerald-600 rounded-xl font-black transition-all shadow-sm border border-emerald-100 hover:shadow-md hover:-translate-y-0.5"
                                                    >
                                                        AIで取り込む
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 最近の健康記録 */}
                                <div className="lg:col-span-2">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-black flex items-center text-slate-800 tracking-tight">
                                            <ClipboardList className={`h-4 w-4 mr-2 ${theme.text}`} />
                                            最近の健康記録
                                        </h3>
                                        <button 
                                            onClick={() => setSelectedPetForLog(activePet)}
                                            className={`px-3 py-1 ${theme.light} ${theme.text} rounded-lg text-[10px] font-black hover:opacity-80 transition-all border ${theme.border} shadow-sm flex items-center gap-1.5`}
                                        >
                                            <PlusCircle className="h-3 w-3" />
                                            記録する
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {activePet.health_logs && activePet.health_logs.length > 0 ? (
                                                activePet.health_logs.slice(0, 5).map((log: any) => (
                                                    <button 
                                                        key={log.id} 
                                                        onClick={() => {
                                                            setSelectedPetForLog(activePet);
                                                            setEditingLog(log);
                                                        }}
                                                        className="p-4 bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg shadow-slate-200/50 border border-white hover:bg-white hover:scale-[1.02] transition-all group text-left w-full flex flex-col items-stretch"
                                                    >
                                                        <div className="text-[10px] font-black text-slate-400 mb-3 border-b border-slate-100/50 pb-2 uppercase tracking-widest group-hover:text-slate-500 transition-colors">
                                                            {format(parseISO(log.logged_at), 'yyyy/MM/dd')}
                                                        </div>
                                                        <div className="space-y-2.5">
                                                            {log.meal_amount && (
                                                                <div className="flex items-center text-xs font-black text-slate-700 tracking-tight">
                                                                    <div className="h-6 w-6 rounded-lg bg-orange-50 flex items-center justify-center mr-2 shadow-sm">
                                                                        <Utensils className="h-3 w-3 text-orange-400" />
                                                                    </div>
                                                                    {log.meal_amount}g
                                                                </div>
                                                            )}
                                                            {log.weight && (
                                                                <div className="flex items-center text-xs font-black text-slate-700 tracking-tight">
                                                                    <div className="h-6 w-6 rounded-lg bg-blue-50 flex items-center justify-center mr-2 shadow-sm">
                                                                        <Scale className="h-3 w-3 text-blue-400" />
                                                                    </div>
                                                                    {log.weight}kg
                                                                </div>
                                                            )}
                                                            <div className="flex flex-wrap gap-1.5 mt-2 pt-1">
                                                                <span className="px-2 py-0.5 rounded-lg text-[9px] font-black shadow-sm bg-emerald-50 text-emerald-600">
                                                                    状態:{conditions.find(c => c.value === log.condition)?.label || '不明'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="col-span-full py-12 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-200/50 text-center flex flex-col items-center justify-center shadow-inner">
                                                    <ClipboardList className="h-8 w-8 text-slate-300 mb-2" />
                                                    <p className="text-xs text-slate-400 font-bold tracking-tight">健康記録がまだありません</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 天気予報セクション */}
                                    {dashboardData.weather && (
                                        <div className="lg:col-span-2 mt-2">
                                            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl shadow-slate-200/50 border border-white overflow-hidden group">
                                                <button 
                                                    onClick={() => setIsWeatherExpanded(!isWeatherExpanded)}
                                                    className={`w-full flex items-center justify-between p-5 transition-all ${isWeatherExpanded ? 'bg-blue-50/50' : 'hover:bg-white'}`}
                                                >
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shadow-sm transition-all ${isWeatherExpanded ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                                            <CloudSun className="h-6 w-6" />
                                                        </div>
                                                        <div className="text-left flex-1 mr-4 flex flex-col justify-center">
                                                            <h3 className="text-sm font-black text-slate-800 flex items-baseline justify-between tracking-tight">
                                                                <span>お散歩のお天気</span>
                                                                <span className="inline-flex items-center justify-center text-[10px] font-black bg-white/80 px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-sm text-slate-500 self-center">
                                                                    {dashboardData.weather.location}
                                                                </span>
                                                            </h3>
                                                            <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                                                                {isWeatherExpanded ? '詳細な予報を表示中' : '今日の天気とお散歩のアドバイスを確認する'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className={`p-2 rounded-xl transition-all shadow-sm ${isWeatherExpanded ? 'bg-blue-100 text-blue-600 rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                                                        <ChevronDown className="h-4 w-4" />
                                                    </div>
                                                </button>

                                                {isWeatherExpanded && (
                                                    <div className="p-6 bg-white/50 border-t border-slate-100/50 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <div className="flex flex-col gap-4">
                                                            {/* 今日 */}
                                                            {dashboardData.weather.forecast.slice(0, 1).map((f: any) => {
                                                                const advice = getWeatherAdvice(f.weather_code, f.temp_max);
                                                                const date = parseISO(f.date);
                                                                return (
                                                                    <div key={f.date} className="p-4 rounded-2xl border bg-white/70 border-slate-200/50 shadow-sm w-full">
                                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                                                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                                                                今日
                                                                                <span className="ml-2 font-bold tracking-tight text-slate-500">{format(date, 'MM/dd(E)', { locale: ja })}</span>
                                                                            </span>
                                                                            <div className="flex items-center space-x-3">
                                                                                <span className={`text-xs leading-tight font-black sm:block hidden ${advice.color}`}>
                                                                                    {advice.text}
                                                                                </span>
                                                                                <span className="text-4xl drop-shadow-sm">{getWeatherIcon(f.weather_code)}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-baseline space-x-2 mb-3">
                                                                            <span className="text-3xl font-black text-slate-800 tracking-tighter">{f.temp_max}°</span>
                                                                            <span className="text-sm font-bold text-slate-400 tracking-tight">{f.temp_min}°</span>
                                                                            <div className="ml-auto flex items-center text-xs font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100/50">
                                                                                <Navigation className="h-3 w-3 mr-1 rotate-180" />
                                                                                {f.precipitation_probability}%
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {/* 今日の時間別予報 */}
                                                                        {f.hourly && (
                                                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                                                <div className="flex items-center justify-between mb-3">
                                                                                    <span className="text-[10px] font-black text-slate-500 flex items-center uppercase tracking-widest">
                                                                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 shadow-sm shadow-emerald-200"></span>
                                                                                        お散歩最適ゾーン
                                                                                    </span>
                                                                                </div>
                                                                                <div className="overflow-x-auto scrollbar-hide -mx-1">
                                                                                    <div className="flex pb-2 gap-0">
                                                                                        {f.hourly.map((h: any, idx: number) => {
                                                                                            const isOptimal = h.temp <= 25 && h.weather_code <= 3;
                                                                                            const prevOptimal = idx > 0 && f.hourly[idx - 1].temp <= 25 && f.hourly[idx - 1].weather_code <= 3;
                                                                                            const nextOptimal = idx < f.hourly.length - 1 && f.hourly[idx + 1].temp <= 25 && f.hourly[idx + 1].weather_code <= 3;

                                                                                            return (
                                                                                                <div 
                                                                                                    key={h.time} 
                                                                                                    className={`flex flex-col items-center space-y-1 px-1 py-2 transition-all flex-1 min-w-[2rem] ${
                                                                                                        isOptimal 
                                                                                                            ? 'bg-emerald-50/80 border-y-2 border-emerald-500/50 relative z-10' 
                                                                                                            : 'opacity-40'
                                                                                                    } ${
                                                                                                        isOptimal && !prevOptimal ? 'border-l-2 rounded-l-xl' : ''
                                                                                                    } ${
                                                                                                        isOptimal && !nextOptimal ? 'border-r-2 rounded-r-xl' : ''
                                                                                                    }`}
                                                                                                >
                                                                                                    <span className="text-[10px] text-slate-400 font-black">
                                                                                                       {format(parseISO(h.time), 'H')}
                                                                                                    </span>
                                                                                                    <span className="text-xl leading-none">
                                                                                                       {getWeatherIcon(h.weather_code)}
                                                                                                    </span>
                                                                                                    <span className={`text-[11px] font-black leading-none ${h.temp > 25 ? 'text-orange-500' : 'text-slate-800'}`}>
                                                                                                       {Math.round(h.temp)}°
                                                                                                    </span>
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        <p className={`text-[11px] leading-tight font-black ${advice.color} sm:hidden block mt-2 pt-2 border-t border-slate-50`}>
                                                                            {advice.text}
                                                                        </p>
                                                                    </div>
                                                                );
                                                            })}

                                                            {/* 明日以降 */}
                                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                                {dashboardData.weather.forecast.slice(1).map((f: any, i: number) => {
                                                                    const advice = getWeatherAdvice(f.weather_code, f.temp_max);
                                                                    const date = parseISO(f.date);
                                                                    const dayLabel = i === 0 ? '明日' : i === 1 ? '明後日' : '明々後日';
                                                                    
                                                                    return (
                                                                        <div key={f.date} className="p-4 rounded-2xl border bg-white/70 border-slate-200/50 shadow-sm flex flex-col">
                                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                                                                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                                                                    {dayLabel}
                                                                                    <span className="ml-2 font-bold tracking-tight text-slate-500">{format(date, 'MM/dd(E)', { locale: ja })}</span>
                                                                                </span>
                                                                                <div className="flex items-center mt-1 sm:mt-0">
                                                                                    <span className="text-3xl drop-shadow-sm">{getWeatherIcon(f.weather_code)}</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-baseline space-x-2 mb-3">
                                                                                <span className="text-3xl font-black text-slate-800 tracking-tighter">{f.temp_max}°</span>
                                                                                <span className="text-sm font-bold text-slate-400 tracking-tight">{f.temp_min}°</span>
                                                                                <div className="ml-auto flex items-center text-xs font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100/50">
                                                                                    {f.precipitation_probability}%
                                                                                </div>
                                                                            </div>
                                                                            <p className={`text-[11px] leading-tight font-black ${advice.color} mt-auto pt-2 border-t border-slate-50`}>
                                                                                {advice.text}
                                                                            </p>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* 近くの動物病院 */}
                                    {dashboardData.hospitals && dashboardData.hospitals.length > 0 && (
                                        <div className="lg:col-span-2">
                                            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl shadow-slate-200/50 border border-white overflow-hidden group">
                                                <button 
                                                    onClick={() => setIsHospitalsExpanded(!isHospitalsExpanded)}
                                                    className={`w-full flex items-center justify-between p-5 transition-all ${isHospitalsExpanded ? 'bg-emerald-50/50' : 'hover:bg-white'}`}
                                                >
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shadow-sm transition-all ${isHospitalsExpanded ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                                            <MapPin className="h-6 w-6" />
                                                        </div>
                                                        <div className="text-left flex-1 mr-4 flex flex-col justify-center">
                                                            <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center justify-between">
                                                                <span>近くの動物病院</span>
                                                                <span className="inline-flex items-center justify-center text-[10px] font-black bg-white/80 px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-sm text-slate-500 self-center uppercase tracking-widest">
                                                                    {dashboardData.hospitals.length}件
                                                                </span>
                                                            </h3>
                                                            <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                                                                {isHospitalsExpanded ? '詳細な情報を表示中' : '現在地周辺の病院を確認する'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className={`p-2 rounded-xl transition-all shadow-sm ${isHospitalsExpanded ? 'bg-emerald-100 text-emerald-600 rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                                                        <ChevronDown className="h-4 w-4" />
                                                    </div>
                                                </button>
                                                
                                                {isHospitalsExpanded && (
                                                    <div className="p-6 bg-white/50 border-t border-slate-100/50 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {dashboardData.hospitals.map((hospital: any, idx: number) => (
                                                                <a 
                                                                    key={idx}
                                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name)}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 hover:border-emerald-200 hover:bg-white transition-all flex flex-col group shadow-sm"
                                                                >
                                                                    <div className="flex items-start justify-between mb-3">
                                                                        <div className="flex flex-col min-w-0 pr-2">
                                                                            <span className="text-[13px] font-black text-slate-800 line-clamp-1 group-hover:text-emerald-700 transition-colors tracking-tight">
                                                                                {hospital.name}
                                                                            </span>
                                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                                {hospital.rating ? (
                                                                                    <div className="flex items-center bg-white px-2 py-0.5 rounded-lg border border-amber-100 shadow-sm">
                                                                                        <Star 
                                                                                            className="h-2.5 w-2.5 text-amber-500 fill-amber-500 mr-1" 
                                                                                        />
                                                                                        <span className="text-[10px] font-black text-amber-700">{hospital.rating}</span>
                                                                                        {hospital.user_ratings_total && (
                                                                                            <span className="text-[9px] text-slate-400 ml-1 font-bold">({hospital.user_ratings_total})</span>
                                                                                        )}
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className="text-[9px] text-slate-400 font-bold italic">評価なし</span>
                                                                                )}
                                                                                <div className="flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/50">
                                                                                    <Navigation className="h-2.5 w-2.5 mr-1" />
                                                                                    {hospital.distance}km
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        {hospital.open_now !== null && (
                                                                            <div className={`shrink-0 text-[10px] px-2.5 py-1 rounded-xl font-black shadow-sm ${hospital.open_now ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-slate-200 text-slate-500'}`}>
                                                                                {hospital.open_now ? '営業中' : '時間外'}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    <div className="text-[11px] text-slate-500 font-bold flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                                                                        <span className="truncate mr-4 flex items-center text-slate-400">
                                                                            <MapPin className="h-3 w-3 mr-1.5" />
                                                                            {hospital.display_name}
                                                                        </span>
                                                                        {hospital.phone_number && (
                                                                            <span className="shrink-0 flex items-center text-blue-600 font-black">
                                                                                <Phone className="h-3 w-3 mr-1" />
                                                                                {hospital.phone_number}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {hospital.opening_hours && (
                                                                        <div className="mt-3 pt-3 border-t border-slate-100/50">
                                                                            <div className="flex items-center text-[10px] font-black text-slate-400 mb-2">
                                                                                <Clock className="h-3 w-3 mr-1" />
                                                                                営業時間
                                                                            </div>
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
                                                                                {hospital.opening_hours.map((text: string, i: number) => {
                                                                                    const days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
                                                                                    const todayName = days[new Date().getDay()];
                                                                                    const isToday = text.startsWith(todayName);
                                                                                    
                                                                                    return (
                                                                                        <div key={i} className={`text-[10px] leading-tight flex justify-between ${isToday ? 'font-black text-slate-800' : 'font-medium text-slate-400'}`}>
                                                                                            <span className="shrink-0 mr-2">{text.split(': ')[0] || text}</span>
                                                                                            <span className="truncate">{text.split(': ')[1] || ''}</span>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </a>
                                                            ))}
                                                        </div>
                                                        <div className="mt-8 text-center">
                                                            <a 
                                                                href={`https://www.google.com/maps/search/動物病院/@${dashboardData.weather?.lat},${dashboardData.weather?.lon},14z`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center text-xs font-black text-slate-500 hover:text-slate-800 transition-all py-2.5 px-6 rounded-xl border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-md hover:-translate-y-0.5"
                                                            >
                                                                他の病院を検索する
                                                                <ExternalLink className="ml-2 h-4 w-4" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </main>
            </div>

            {/* モーダル */}
            {selectedPetForLog && (
                <HealthLogModal 
                    pet={selectedPetForLog} 
                    editingLog={editingLog}
                    onClose={() => {
                        setSelectedPetForLog(null);
                        setEditingLog(null);
                    }} 
                    onSuccess={() => mutate()}
                />
            )}

            {selectedPetForExercise && (
                <ExerciseLogModal 
                    pet={selectedPetForExercise} 
                    editingLog={editingExerciseLog}
                    onClose={() => {
                        setSelectedPetForExercise(null);
                        setEditingExerciseLog(null);
                    }} 
                    onSuccess={() => mutate()}
                />
            )}

            {selectedPetForCertificate && (
                <VaccinationCertificateModal
                    pet={selectedPetForCertificate}
                    isOpen={!!selectedPetForCertificate}
                    onClose={() => setSelectedPetForCertificate(null)}
                    onSuccess={() => mutate()}
                />
            )}

            {selectedPetForReceipt && (
                <MedicalReceiptUploadModal
                    pet={selectedPetForReceipt}
                    isOpen={!!selectedPetForReceipt}
                    onClose={() => setSelectedPetForReceipt(null)}
                    onSuccess={() => mutate()}
                />
            )}

            {selectedPetForHealthCheckup && (
                <HealthCheckupResultUploadModal
                    pet={selectedPetForHealthCheckup}
                    isOpen={!!selectedPetForHealthCheckup}
                    onClose={() => setSelectedPetForHealthCheckup(null)}
                    onSuccess={() => mutate()}
                />
            )}

            {/* 証明書表示モーダル */}
            {viewingCertificate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md transition-all duration-300">
                    <div 
                        className="absolute inset-0" 
                        onClick={() => setViewingCertificate(null)}
                    />
                    <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300">
                        <div className="absolute top-4 right-4 z-10">
                            <button
                                onClick={() => setViewingCertificate(null)}
                                className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 sm:p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm ${viewingCertificate.vaccine_type === 'rabies' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">{viewingCertificate.title} 接種証明書</h3>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                        <p className="text-sm text-slate-400 font-bold">
                                            {format(new Date(viewingCertificate.event_date), 'yyyy年MM月dd日')} 接種
                                        </p>
                                        {viewingCertificate.clinic_name && (
                                            <p className="text-sm text-indigo-500 font-bold">
                                                {viewingCertificate.clinic_name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="relative aspect-[3/4] sm:aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                                <img
                                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${viewingCertificate.certificate_path}`}
                                    alt="接種証明書"
                                    className="w-full h-full object-contain"
                                />
                            </div>


                            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">次回の予定</p>
                                    <p className="text-sm font-black text-indigo-600">
                                        {viewingCertificate.next_event_date ? format(new Date(viewingCertificate.next_event_date), 'yyyy年MM月dd日') : '未定'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setViewingCertificate(null)}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 text-white text-xs font-black rounded-xl hover:bg-slate-700 transition-all shadow-md shadow-slate-200"
                                >
                                    閉じる
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
