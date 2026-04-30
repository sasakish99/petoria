'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth';
import axios from '@/lib/axios';
import { useRouter, useParams } from 'next/navigation';
import { Camera, Upload, ChevronLeft, Loader2, AlertCircle, MapPin, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const AiDiagnose = () => {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth({ middleware: 'auth' });
    const petId = params.id;
    
    const [pet, setPet] = useState<any>(null);
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [targetPart, setTargetPart] = useState('overall');
    const [result, setResult] = useState<any>(null);
    const [nearbyHospitals, setNearbyHospitals] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (petId) {
            axios.get(`/api/pets/${petId}`)
                .then(res => setPet(res.data))
                .catch(err => console.error(err));
        }
    }, [petId]);

    if (!user || !pet) {
        return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setResult(null);
            setError(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setResult(null);
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!image) return;

        setLoading(true);
        setError(null);
        
        const formData = new FormData();
        formData.append('image', image);
        formData.append('target_part', targetPart);

        try {
            const response = await axios.post(`/api/pets/${petId}/ai-diagnose`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // レスポンス形式の変更に対応
            if (response.data.diagnosis) {
                setResult(response.data.diagnosis);
                setNearbyHospitals(response.data.nearby_hospitals || []);
            } else {
                setResult(response.data);
                setNearbyHospitals([]);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || '解析中にエラーが発生しました。OpenAI APIキーが正しく設定されているか確認してください。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
                    <button onClick={() => router.back()} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
                        <ChevronLeft className="h-6 w-6 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">{pet.name} のAI健康診断</h1>
                    <div className="ml-auto">
                        <Link 
                            href={`/pets/${petId}/history`}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                            履歴を見る
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {!result ? (
                        <div className="p-6 md:p-8">
                            <div className="mb-8 text-center">
                                <p className="text-gray-600">
                                    うちの子の気になる箇所（皮膚、目、口など）の写真をアップロードしてください。<br />
                                    AIが健康状態に関するアドバイスを生成します。
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="target_part" className="block text-sm font-medium text-gray-700">
                                        重点的に診断したい箇所
                                    </label>
                                    <select
                                        id="target_part"
                                        value={targetPart}
                                        onChange={(e) => setTargetPart(e.target.value)}
                                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-3"
                                    >
                                        <option value="overall">全体（おまかせ）</option>
                                        <option value="eyes">目・瞳（充血、にごりなど）</option>
                                        <option value="teeth">歯・口内（歯石、赤みなど）</option>
                                        <option value="ears">耳（汚れ、赤みなど）</option>
                                        <option value="skin">皮膚・被毛（赤み、つやなど）</option>
                                        <option value="physique">体格・姿勢（太り過ぎ、痩せ過ぎなど）</option>
                                    </select>
                                </div>

                                <div 
                                    className="relative"
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    {preview ? (
                                        <div className="relative aspect-square w-full max-w-sm mx-auto rounded-2xl overflow-hidden border-2 border-dashed border-gray-200">
                                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                            <button 
                                                type="button"
                                                onClick={() => { setImage(null); setPreview(null); }}
                                                className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                                            >
                                                <PlusCircle className="h-5 w-5 rotate-45" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className={`flex flex-col items-center justify-center aspect-square w-full max-w-sm mx-auto rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                                            isDragging 
                                                ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' 
                                                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                                        }`}>
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Camera className={`h-12 w-12 mb-3 transition-colors ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`} />
                                                <p className={`mb-2 text-sm font-semibold transition-colors ${isDragging ? 'text-indigo-600' : 'text-gray-500'}`}>
                                                    {isDragging ? 'ここにドロップしてアップロード' : 'タップして写真を撮影・選択'}
                                                </p>
                                                <p className="text-xs text-gray-400">または画像をドラッグ＆ドロップ</p>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                        </label>
                                    )}
                                </div>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start">
                                        <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={!image || loading}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg shadow-indigo-100"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                                            AIが解析中...
                                        </>
                                    ) : (
                                        'AI健康診断を開始する'
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="aspect-video w-full bg-gray-100">
                                <img src={`http://localhost:8000/storage/${result.image_path}`} alt="Diagnosed" className="w-full h-full object-contain" />
                            </div>
                            <div className="p-6 md:p-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                    <Activity className="h-6 w-6 mr-2 text-green-500" />
                                    AI解析結果
                                </h3>
                                <div className="prose prose-indigo max-w-none text-gray-700 bg-gray-50 p-6 rounded-2xl whitespace-pre-wrap leading-relaxed">
                                    {result.result_text}
                                </div>

                                {/* 近隣の病院情報 */}
                                {nearbyHospitals.length > 0 ? (
                                    <div className="mt-8 pt-8 border-t border-gray-100">
                                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                            <MapPin className="h-5 w-5 mr-2 text-rose-500" />
                                            近隣の動物病院
                                        </h4>
                                        <div className="space-y-3">
                                            {nearbyHospitals.map((hospital, idx) => (
                                                <a 
                                                    key={idx}
                                                    href={hospital.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition-colors group"
                                                >
                                                    <span className="font-medium text-rose-900">{hospital.name}</span>
                                                    <ExternalLink className="h-4 w-4 text-rose-400 group-hover:text-rose-600 transition-colors" />
                                                </a>
                                            ))}
                                        </div>
                                        <p className="mt-3 text-[12px] text-gray-400 ml-1">
                                            ※ご登録の住所（{user.address}）の周辺にある動物病院を検索しています。
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-8 pt-8 border-t border-gray-100">
                                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start">
                                            <MapPin className="h-5 w-5 mr-3 mt-0.5 text-amber-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-amber-900">
                                                    住所を登録すると周辺の病院が表示されます
                                                </p>
                                                <p className="text-xs text-amber-700 mt-1">
                                                    プロフィール画面から住所を設定すると、診断後に近隣の動物病院を自動でご案内できるようになります。
                                                </p>
                                                <Link 
                                                    href="/profile"
                                                    className="inline-block mt-2 text-xs font-bold text-amber-800 hover:underline"
                                                >
                                                    住所を登録しに行く
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                                    <button 
                                        onClick={() => setResult(null)}
                                        className="flex-1 py-3 px-6 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        別の写真を診断する
                                    </button>
                                    <button 
                                        onClick={() => router.push('/dashboard')}
                                        className="flex-1 py-3 px-6 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                                    >
                                        ダッシュボードに戻る
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

const PlusCircle = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
);

const Activity = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
);

export default AiDiagnose;
