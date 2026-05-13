'use client';

import { useAuth } from '@/hooks/auth';
import useSWR from 'swr';
import axios from '@/lib/axios';
import { CloudSun, MapPin, Navigation, Loader2, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useEffect, useState } from 'react';

const getWeatherAdvice = (code: number, tempMax: number) => {
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

// 時間毎のお散歩スコアを算出 (0〜100)
const getWalkScore = (code: number, temp: number, precipitationProbability: number) => {
    let score = 100;
    // 天気コードによる減点
    if (code >= 95) score -= 90;        // 雷雨
    else if (code >= 80) score -= 60;   // にわか雨
    else if (code >= 61) score -= 50;   // 雨
    else if (code >= 51) score -= 30;   // 小雨
    else if (code >= 71) score -= 60;   // 雪
    else if (code >= 45) score -= 20;   // 霧
    else if (code >= 2) score -= 5;     // 曇り

    // 降水確率による減点
    score -= Math.round(precipitationProbability * 0.4);

    // 気温による減点 (15〜22度が理想)
    if (temp >= 35) score -= 60;
    else if (temp >= 30) score -= 35;
    else if (temp >= 27) score -= 15;
    else if (temp <= -5) score -= 50;
    else if (temp <= 0) score -= 30;
    else if (temp <= 5) score -= 15;

    return Math.max(0, Math.min(100, score));
};

const getWalkRating = (score: number) => {
    if (score >= 80) return { label: '◎', text: '最適', badge: 'bg-emerald-500 text-white', tile: 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-300', dot: 'bg-emerald-500' };
    if (score >= 60) return { label: '○', text: '良好', badge: 'bg-sky-500 text-white', tile: 'bg-sky-50 border-sky-200', dot: 'bg-sky-500' };
    if (score >= 40) return { label: '△', text: '注意', badge: 'bg-amber-500 text-white', tile: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' };
    return { label: '✕', text: '不向き', badge: 'bg-rose-500 text-white', tile: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500' };
};

// 現在時刻以降の中で最もスコアが高い時間帯を抽出
const findBestWalkHours = (hourly: any[]) => {
    const nowHour = new Date().getHours();
    const future = hourly
        .map((h, i) => ({ ...h, index: i, hour: new Date(h.time).getHours(), score: getWalkScore(h.weather_code, h.temp, h.precipitation_probability) }))
        .filter((h) => h.hour >= nowHour);
    if (future.length === 0) return { bestIndices: new Set<number>(), bestScore: 0 };
    const bestScore = Math.max(...future.map((h) => h.score));
    const bestIndices = new Set(future.filter((h) => h.score === bestScore && bestScore >= 40).map((h) => h.index));
    return { bestIndices, bestScore };
};

const WeatherPage = () => {
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
        user && hasLocation ? ['/api/weather', location] : null,
        () => {
            const params = location ? `?lat=${location!.lat}&lon=${location!.lon}` : '';
            return axios.get(`/api/weather${params}`).then((res) => res.data);
        }
    );

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
    }

    const weather = data?.weather;

    return (
        <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                        <CloudSun className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black bg-gradient-to-r from-slate-800 to-slate-500 bg-clip-text text-transparent tracking-tight">
                            お散歩のお天気
                        </h1>
                        <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                            お住まいの地域の天気予報とお散歩のアドバイス
                        </p>
                    </div>
                </div>

                {!hasLocation && (
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] p-6 shadow-xl shadow-blue-200 text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <MapPin className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                                <MapPin className="w-6 h-6" />
                                位置情報の利用について
                            </h3>
                            <p className="text-blue-50/90 text-sm font-medium mb-6 leading-relaxed">
                                お住まいの地域の天気予報を表示するために位置情報を使用します。<br />
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

                {hasLocation && !data && !error && (
                    <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl shadow-slate-200/50 border border-white p-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
                        <p className="mt-4 text-sm font-bold text-slate-500">天気情報を取得中...</p>
                    </div>
                )}

                {hasLocation && data && !weather && (
                    <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl shadow-slate-200/50 border border-white p-12 text-center">
                        <p className="text-sm font-bold text-slate-500">天気情報を取得できませんでした。</p>
                    </div>
                )}

                {weather && (
                    <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl shadow-slate-200/50 border border-white overflow-hidden">
                        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                            <h2 className="text-sm font-black text-slate-800 tracking-tight">天気予報</h2>
                            <span className="inline-flex items-center justify-center text-[10px] font-black bg-white/80 px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-sm text-slate-500">
                                {weather.location}
                            </span>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* 今日 */}
                            {weather.forecast.slice(0, 1).map((f: any) => {
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
                                                降水確率 {f.precipitation_probability}%
                                            </div>
                                        </div>
                                        <p className={`text-[12px] leading-tight font-black ${advice.color} sm:hidden pt-2 border-t border-slate-50`}>
                                            {advice.text}
                                        </p>
                                        {f.hourly && (() => {
                                            const { bestIndices } = findBestWalkHours(f.hourly);
                                            const nowHour = new Date().getHours();
                                            return (
                                                <div className="mt-4 pt-4 border-t border-slate-100/50">
                                                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] font-black text-slate-700 tracking-tight">時間ごとのお散歩おすすめ度</span>
                                                            {bestIndices.size > 0 && (
                                                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                                                    本日のベストタイム ✨
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>最適</span>
                                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500"></span>良好</span>
                                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>注意</span>
                                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span>不向き</span>
                                                        </div>
                                                    </div>
                                                    <div className="rounded-2xl border border-slate-200/70 bg-white/80 px-2 py-3 shadow-sm">
                                                        <div className="overflow-x-auto sm:overflow-visible -mx-2 px-2">
                                                            <div
                                                                className="grid gap-0 min-w-[640px] sm:min-w-0"
                                                                style={{ gridTemplateColumns: `repeat(${f.hourly.length}, minmax(0, 1fr))` }}
                                                            >
                                                            {f.hourly.map((h: any, i: number) => {
                                                                const hourNum = new Date(h.time).getHours();
                                                                const isPast = hourNum < nowHour;
                                                                const score = getWalkScore(h.weather_code, h.temp, h.precipitation_probability);
                                                                const rating = getWalkRating(score);
                                                                return (
                                                                    <div
                                                                        key={i}
                                                                        className={`flex flex-col items-center justify-between px-0.5 py-1 min-w-0 transition-all ${isPast ? 'opacity-40' : ''}`}
                                                                    >
                                                                        <span className="text-[9px] sm:text-[10px] font-black text-slate-500 leading-none">{hourNum}</span>
                                                                        <span className="text-sm sm:text-lg my-0.5 leading-none">{getWeatherIcon(h.weather_code)}</span>
                                                                        <span className="text-[9px] sm:text-[11px] font-black text-slate-700 leading-none">{h.temp}°</span>
                                                                        <span className="hidden sm:inline text-[9px] font-bold text-blue-500 mt-0.5 leading-none">{h.precipitation_probability}%</span>
                                                                        <span className={`mt-1 text-[8px] sm:text-[10px] font-black w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center leading-none ${rating.badge}`} title={rating.text}>
                                                                            {rating.label}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                );
                            })}

                            {/* 明日以降 */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {weather.forecast.slice(1).map((f: any, i: number) => {
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
    );
};

export default WeatherPage;
