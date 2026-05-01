'use client';

import { useState, useRef } from 'react';
import { X, Upload, Camera, Loader2, CheckCircle2, AlertCircle, FileText, Calendar, Building2, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import axios from '@/lib/axios';

interface HealthCheckupResultUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    pet: any;
    onSuccess?: () => void;
}

const HealthCheckupResultUploadModal = ({ isOpen, onClose, pet, onSuccess }: HealthCheckupResultUploadModalProps) => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const [showConfirmName, setShowConfirmName] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const processFile = (file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            setError('ファイルサイズは10MB以下にしてください。');
            return;
        }
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
        setError(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedImage) {
            setError('画像を選択してください。');
            return;
        }

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('image', selectedImage);

        try {
            const response = await axios.post(`/api/pets/${pet.id}/health-checkup-results/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setResult(response.data);
        } catch (err: any) {
            console.error('Analysis error:', err);
            setError(err.response?.data?.message || 'アップロードまたは解析に失敗しました。');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async (bypassNameCheck = false) => {
        if (!result) return;

        // 名前チェック
        if (!bypassNameCheck && result.pet_name && pet.name) {
            const normalizedPetName = pet.name.trim().toLowerCase();
            const normalizedResultName = result.pet_name.trim().toLowerCase();
            
            if (!normalizedResultName.includes(normalizedPetName) && !normalizedPetName.includes(normalizedResultName)) {
                setShowConfirmName(true);
                return;
            }
        }

        setIsSaving(true);
        setError(null);
        setShowConfirmName(false);

        try {
            await axios.put(`/api/pets/${pet.id}/health-checkup-results/${result.id}`, {
                clinic_name: result.clinic_name,
                checkup_date: result.checkup_date,
                results: result.results,
            });

            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Save error:', err);
            setError(err.response?.data?.message || '保存に失敗しました。');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">健康診断を解析</h2>
                        <p className="text-xs text-slate-400 font-bold mt-0.5">結果表を撮って数値を自動入力</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                        <X className="h-6 w-6 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {!result ? (
                        <div className="space-y-6">
                                <div 
                                    className={`relative group cursor-pointer border-2 border-dashed rounded-[2rem] transition-all duration-300 min-h-[200px] flex flex-col items-center justify-center p-6 ${
                                        isDragging
                                            ? 'border-indigo-500 bg-indigo-50 shadow-inner scale-[0.98]'
                                            : previewUrl 
                                                ? 'border-indigo-200 bg-indigo-50/30' 
                                                : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
                                    }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        accept="image/*" 
                                        className="hidden" 
                                    />
                                    {previewUrl ? (
                                        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <Camera className="h-10 w-10 text-white drop-shadow-md" />
                                            </div>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedImage(null);
                                                    setPreviewUrl(null);
                                                }}
                                                className="absolute top-4 right-4 p-2 bg-slate-900/50 hover:bg-slate-900/70 text-white rounded-full backdrop-blur-md transition-all z-10"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <Upload className="h-8 w-8 text-indigo-500" />
                                            </div>
                                            <p className="text-slate-600 font-bold mb-1">結果表をアップロード</p>
                                            <p className="text-slate-400 text-xs text-center px-4">
                                                写真を撮るか、ライブラリから選択してください。<br />AIが自動で数値を読み取ります。
                                            </p>
                                        </>
                                    )}
                                </div>

                            {error && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                                    <p className="text-xs font-bold text-rose-600 leading-relaxed">{error}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={handleAnalyze}
                                    disabled={!selectedImage || isUploading}
                                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>AIが解析中...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-5 w-5" />
                                            <span>この写真を解析する</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            {showConfirmName && (
                                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 space-y-3 animate-in fade-in zoom-in duration-300">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-amber-800 font-bold">
                                                別のペットの結果の可能性があります
                                            </p>
                                            <p className="text-xs text-amber-700 mt-1">
                                                解析された名前: <span className="font-bold">{result.pet_name}</span><br />
                                                現在のうちの子: <span className="font-bold">{pet.name}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowConfirmName(false)}
                                            className="flex-1 py-2 bg-white text-slate-600 rounded-xl text-xs font-bold border border-amber-200 hover:bg-amber-100 transition-colors"
                                        >
                                            修正する
                                        </button>
                                        <button
                                            onClick={() => handleSave(true)}
                                            className="flex-1 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm"
                                        >
                                            このまま登録
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                <div className="h-8 w-8 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-emerald-800">解析が完了しました</p>
                                    <p className="text-[10px] font-bold text-emerald-600/80">内容を確認して保存してください</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
                                        病院名
                                    </label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input 
                                            type="text"
                                            value={result.clinic_name || ''}
                                            onChange={(e) => setResult({...result, clinic_name: e.target.value})}
                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl text-sm font-bold text-slate-700 transition-all outline-none"
                                            placeholder="病院名"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
                                        検査日
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input 
                                            type="date"
                                            value={result.checkup_date || ''}
                                            onChange={(e) => setResult({...result, checkup_date: e.target.value})}
                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl text-sm font-bold text-slate-700 transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
                                        検査結果 ({result.results?.length || 0}項目)
                                    </label>
                                    <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                                        {result.results && result.results.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-[10px] font-bold text-slate-600">
                                                    <thead>
                                                        <tr className="border-b border-slate-200">
                                                            <th className="text-left py-2">項目</th>
                                                            <th className="text-right py-2">数値</th>
                                                            <th className="text-right py-2">基準値</th>
                                                            <th className="text-center py-2">判定</th>
                                                            <th className="text-center py-2">範囲外</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {result.results.map((item: any, idx: number) => (
                                                            <tr key={idx}>
                                                                <td className="py-2">{item.item_name}</td>
                                                                <td className="text-right py-2 font-mono">
                                                                    {item.value}{item.unit}
                                                                </td>
                                                                <td className="text-right py-2 font-mono text-slate-400">
                                                                    {item.reference_range}
                                                                </td>
                                                                <td className="text-center py-2">
                                                                    <span className={`px-1.5 py-0.5 rounded-md ${
                                                                        item.evaluation === '正常' || item.evaluation === 'A'
                                                                            ? 'bg-emerald-100 text-emerald-700'
                                                                            : 'bg-rose-100 text-rose-700'
                                                                    }`}>
                                                                        {item.evaluation}
                                                                    </span>
                                                                </td>
                                                                <td className="text-center py-2">
                                                                    {item.is_out_of_range && (
                                                                        <span className="text-rose-600 font-black animate-pulse">
                                                                            ▲
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] text-slate-400 italic text-center py-2">検査結果はありません</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                                    <p className="text-xs font-bold text-rose-600 leading-relaxed">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setResult(null)}
                                    className="flex-1 h-14 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all"
                                >
                                    やり直す
                                </button>
                                <button
                                    onClick={() => handleSave(false)}
                                    disabled={isSaving || showConfirmName}
                                    className={`flex-[2] h-14 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${
                                        isSaving || showConfirmName
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
                                    }`}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>保存中...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-5 w-5" />
                                            <span>記録を保存する</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HealthCheckupResultUploadModal;
