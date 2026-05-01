'use client';

import { useState, useRef } from 'react';
import { X, Upload, Camera, Loader2, CheckCircle2, AlertCircle, FileText, Calendar, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import axios from '@/lib/axios';

interface VaccinationCertificateModalProps {
    isOpen: boolean;
    onClose: () => void;
    pet: any;
    onSuccess?: () => void;
}

const VaccinationCertificateModal = ({ isOpen, onClose, pet, onSuccess }: VaccinationCertificateModalProps) => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<{
        vaccine_type: 'mixed' | 'rabies';
        event_date: string | null;
        clinic_name: string | null;
        certificate_path: string;
    } | null>(null);
    const [successData, setSuccessData] = useState<any>(null);
    const [editedDate, setEditedDate] = useState<string>('');
    const [editedType, setEditedType] = useState<'mixed' | 'rabies'>('mixed');
    const [editedClinic, setEditedClinic] = useState<string>('');
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
            const response = await axios.post(`/api/pets/${pet.id}/vaccination-certificates/analyze`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const result = response.data.analysis;
            setAnalysisResult(result);
            setEditedDate(result.event_date || format(new Date(), 'yyyy-MM-dd'));
            setEditedType(result.vaccine_type);
            setEditedClinic(result.clinic_name || '');
        } catch (err: any) {
            console.error('Analysis error:', err);
            setError(err.response?.data?.message || 'アップロードまたは解析に失敗しました。');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        if (!analysisResult) return;

        setIsSaving(true);
        setError(null);

        try {
            const response = await axios.post(`/api/pets/${pet.id}/vaccination-certificates`, {
                vaccine_type: editedType,
                event_date: editedDate,
                clinic_name: editedClinic,
                certificate_path: analysisResult.certificate_path,
            });

            setSuccessData(response.data.medical_event);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error('Save error:', err);
            setError(err.response?.data?.message || '保存に失敗しました。');
        } finally {
            setIsSaving(false);
        }
    };

    const resetState = () => {
        setSelectedImage(null);
        setPreviewUrl(null);
        setError(null);
        setAnalysisResult(null);
        setSuccessData(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white">
                <div className="px-8 pt-8 pb-4 flex justify-between items-center">
                    <h2 className="text-2xl font-black text-slate-800">
                        ワクチンの記録
                    </h2>
                    <button 
                        onClick={resetState}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="h-6 w-6 text-slate-400" />
                    </button>
                </div>

                <div className="px-8 pb-8 space-y-6">
                    {successData ? (
                        <div className="text-center py-4 space-y-6 animate-in fade-in zoom-in duration-300">
                            <div className="flex flex-col items-center">
                                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800">登録完了！</h3>
                                <p className="text-slate-500 font-medium">ワクチンの記録を保存しました</p>
                            </div>

                            <div className="bg-slate-50 rounded-3xl p-6 text-left space-y-4 border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                        <FileText className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">種類</p>
                                        <p className="font-bold text-slate-700">{successData.title}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                        <Calendar className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">接種日</p>
                                        <p className="font-bold text-slate-700">
                                            {successData.event_date ? format(new Date(successData.event_date), 'yyyy年MM月dd日', { locale: ja }) : '不明'}
                                        </p>
                                    </div>
                                </div>
                                {successData.clinic_name && (
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                            <div className="text-xs font-black text-slate-400">院</div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">動物病院</p>
                                            <p className="font-bold text-slate-700">{successData.clinic_name}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={resetState}
                                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg shadow-slate-200"
                            >
                                閉じる
                            </button>
                        </div>
                    ) : analysisResult ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center">
                                <h3 className="text-xl font-black text-slate-800">内容を確認してください</h3>
                                <p className="text-slate-500 font-medium">AIが読み取った内容です。修正も可能です。</p>
                            </div>

                            <div className="bg-slate-50 rounded-[2rem] p-6 space-y-5 border border-slate-100">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">ワクチンの種類</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setEditedType('mixed')}
                                            className={`py-3 rounded-xl font-bold text-sm transition-all ${
                                                editedType === 'mixed'
                                                    ? 'bg-indigo-600 text-white shadow-md'
                                                    : 'bg-white text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            混合ワクチン
                                        </button>
                                        <button
                                            onClick={() => setEditedType('rabies')}
                                            className={`py-3 rounded-xl font-bold text-sm transition-all ${
                                                editedType === 'rabies'
                                                    ? 'bg-indigo-600 text-white shadow-md'
                                                    : 'bg-white text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            狂犬病ワクチン
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">接種日</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={editedDate}
                                            onChange={(e) => setEditedDate(e.target.value)}
                                            className="w-full bg-white border-0 rounded-xl py-3 px-4 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">動物病院名</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={editedClinic}
                                            onChange={(e) => setEditedClinic(e.target.value)}
                                            placeholder="病院名が分かれば入力してください"
                                            className="w-full bg-white border-0 rounded-xl py-3 px-4 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 shadow-sm placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-rose-600 font-medium">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setAnalysisResult(null)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    やり直す
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-[2] py-4 bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-700 hover:-translate-y-1 hover:shadow-xl active:bg-slate-900 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        'この内容で登録する'
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`relative group cursor-pointer border-2 border-dashed rounded-[2rem] transition-all duration-300 min-h-[200px] flex flex-col items-center justify-center p-6 ${
                                    isDragging
                                        ? 'border-indigo-500 bg-indigo-50 shadow-inner scale-[0.98]'
                                        : previewUrl 
                                            ? 'border-indigo-200 bg-indigo-50/30' 
                                            : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
                                }`}
                            >
                                {previewUrl ? (
                                    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <Camera className="h-10 w-10 text-white drop-shadow-md" />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Upload className="h-8 w-8 text-indigo-500" />
                                        </div>
                                        <p className="text-slate-600 font-bold mb-1">証明書をアップロード</p>
                                        <p className="text-slate-400 text-xs text-center px-4">
                                            写真を撮るか、ライブラリから選択してください。<br />AIが自動で日付を読み取ります。
                                        </p>
                                    </>
                                )}
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden" 
                                    accept="image/*"
                                />
                            </div>

                            {error && (
                                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-rose-600 font-medium">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={handleAnalyze}
                                disabled={isUploading || !selectedImage}
                                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all duration-300 ${
                                    isUploading || !selectedImage
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-slate-800 text-white hover:bg-slate-700 hover:-translate-y-1 hover:shadow-xl active:bg-slate-900'
                                }`}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        解析中...
                                    </>
                                ) : (
                                    <>
                                        AIで読み取り
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VaccinationCertificateModal;
