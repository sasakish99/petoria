'use client';

import { useAuth } from '@/hooks/auth';
import useSWR from 'swr';
import axios from '@/lib/axios';
import { MapPin, Navigation, Star, Phone, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';

const ClinicsPage = () => {
    const { user } = useAuth({ middleware: 'auth' });
    const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isRequestingLocation, setIsRequestingLocation] = useState(false);

    const handleRequestLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('お使いのブラウザは位置情報に対応していません。');
            return;
        }
        setIsRequestingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const newLocation = { lat: position.coords.latitude, lon: position.coords.longitude };
                setLocation(newLocation);
                setIsRequestingLocation(false);
                try {
                    await axios.put('/api/user', { latitude: newLocation.lat, longitude: newLocation.lon });
                } catch (e) {
                    console.error(e);
                }
            },
            (error) => {
                setIsRequestingLocation(false);
                if (error.code === error.PERMISSION_DENIED) {
                    setLocationError('位置情報の利用が許可されませんでした。');
                } else {
                    setLocationError('位置情報の取得に失敗しました。');
                }
            }
        );
    };

    const hasLocation = !!(location || (user && user.latitude && user.longitude));

    const { data, error } = useSWR(
        user && hasLocation ? ['/api/hospitals', location] : null,
        () => {
            const params = location ? `?lat=${location!.lat}&lon=${location!.lon}` : '';
            return axios.get(`/api/hospitals${params}`).then((res) => res.data);
        }
    );

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
    }

    const hospitals = data?.hospitals;

    return (
        <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                        <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black bg-gradient-to-r from-slate-800 to-slate-500 bg-clip-text text-transparent tracking-tight">
                            近くの動物病院
                        </h1>
                        <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                            現在地周辺の動物病院一覧
                        </p>
                    </div>
                </div>

                {!hasLocation && (
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] p-6 shadow-xl shadow-emerald-200 text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <MapPin className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                                <MapPin className="w-6 h-6" />
                                位置情報の利用について
                            </h3>
                            <p className="text-emerald-50/90 text-sm font-medium mb-6 leading-relaxed">
                                近くの動物病院を表示するために位置情報を使用します。<br />
                                設定はいつでもプロフィール画面から変更できます。
                            </p>
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <button
                                    onClick={handleRequestLocation}
                                    disabled={isRequestingLocation}
                                    className="w-full sm:w-auto px-8 py-3.5 bg-white text-emerald-600 rounded-2xl font-black text-sm shadow-lg shadow-emerald-700/20 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {isRequestingLocation ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Navigation className="w-4 h-4" />
                                    )}
                                    現在地を取得して利用する
                                </button>
                                {locationError && (
                                    <span className="text-[11px] font-bold text-emerald-100 bg-emerald-700/30 px-3 py-2 rounded-xl">
                                        {locationError}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {hasLocation && !data && !error && (
                    <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl shadow-slate-200/50 border border-white p-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
                        <p className="mt-4 text-sm font-bold text-slate-500">動物病院を検索中...</p>
                    </div>
                )}

                {hasLocation && data && (!hospitals || hospitals.length === 0) && (
                    <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl shadow-slate-200/50 border border-white p-12 text-center">
                        <p className="text-sm font-bold text-slate-500">近くの動物病院が見つかりませんでした。</p>
                    </div>
                )}

                {hospitals && hospitals.length > 0 && (
                    <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl shadow-slate-200/50 border border-white overflow-hidden">
                        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                            <h2 className="text-sm font-black text-slate-800 tracking-tight">病院一覧</h2>
                            <span className="inline-flex items-center justify-center text-[10px] font-black bg-white/80 px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-sm text-slate-500 uppercase tracking-widest">
                                {hospitals.length}件
                            </span>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {hospitals.map((hospital: any, idx: number) => (
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
                                                            <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500 mr-1" />
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
                                    href={`https://www.google.com/maps/search/動物病院/@${data?.lat},${data?.lon},14z`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-xs font-black text-slate-500 hover:text-slate-800 transition-all py-2.5 px-6 rounded-xl border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-md hover:-translate-y-0.5"
                                >
                                    他の病院を検索する
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClinicsPage;
