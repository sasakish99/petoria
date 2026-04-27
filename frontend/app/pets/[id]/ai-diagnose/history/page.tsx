'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth';
import axios from '@/lib/axios';
import { useRouter, useParams } from 'next/navigation';
import { 
    ChevronLeft, 
    Calendar, 
    FileText, 
    ChevronRight, 
    Trash2, 
    CheckSquare, 
    Square, 
    X,
    AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

const AiDiagnoseHistory = () => {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth({ middleware: 'auth' });
    const petId = params.id;
    
    const [pet, setPet] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDiagnosis, setSelectedDiagnosis] = useState<any>(null);
    
    // 削除機能用の状態
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const fetchPetData = async () => {
        if (!petId) return;
        try {
            const res = await axios.get(`/api/pets/${petId}`);
            setPet(res.data);
            const sortedHistory = res.data.ai_diagnoses ? [...res.data.ai_diagnoses].sort((a: any, b: any) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ) : [];
            setHistory(sortedHistory);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPetData();
    }, [petId]);

    if (!user || loading) {
        return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
    }

    if (!pet) {
        return <div className="min-h-screen flex items-center justify-center">ペットが見つかりませんでした。</div>;
    }

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === history.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(history.map(item => item.id));
        }
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) return;
        
        setIsDeleting(true);
        try {
            await axios.delete(`/api/pets/${petId}/ai-diagnoses`, {
                data: { ids: selectedIds }
            });
            
            // 削除成功後、データを再取得
            await fetchPetData();
            setSelectedIds([]);
            setIsEditMode(false);
            setShowDeleteConfirm(false);
        } catch (err) {
            console.error(err);
            alert('削除に失敗しました。');
        } finally {
            setIsDeleting(false);
        }
    };

    const enterEditMode = () => {
        setIsEditMode(true);
        setSelectedIds([]);
    };

    const exitEditMode = () => {
        setIsEditMode(false);
        setSelectedIds([]);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center">
                        <button 
                            onClick={() => selectedDiagnosis ? setSelectedDiagnosis(null) : router.back()} 
                            className="mr-4 p-2 hover:bg-gray-100 rounded-full"
                        >
                            <ChevronLeft className="h-6 w-6 text-gray-600" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">
                            {selectedDiagnosis ? '診断詳細' : `${pet.name} のAI診断履歴`}
                        </h1>
                    </div>
                    {!selectedDiagnosis && history.length > 0 && (
                        <div>
                            {isEditMode ? (
                                <button 
                                    onClick={exitEditMode}
                                    className="text-sm font-medium text-gray-600 hover:text-gray-800"
                                >
                                    キャンセル
                                </button>
                            ) : (
                                <button 
                                    onClick={enterEditMode}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    整理する
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-4 py-8">
                {selectedDiagnosis ? (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="aspect-video w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                <img 
                                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${selectedDiagnosis.image_path}`} 
                                    alt="診断画像" 
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="p-6 md:p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        {format(new Date(selectedDiagnosis.created_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setSelectedIds([selectedDiagnosis.id]);
                                            setShowDeleteConfirm(true);
                                        }}
                                        className="text-red-500 hover:text-red-700 p-2"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="prose prose-indigo max-w-none">
                                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                                        {selectedDiagnosis.result_text}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {isEditMode && history.length > 0 && (
                            <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
                                <button 
                                    onClick={toggleSelectAll}
                                    className="flex items-center text-sm font-medium text-indigo-700"
                                >
                                    {selectedIds.length === history.length ? (
                                        <CheckSquare className="h-5 w-5 mr-2" />
                                    ) : (
                                        <Square className="h-5 w-5 mr-2" />
                                    )}
                                    すべて選択 ({selectedIds.length})
                                </button>
                                <button 
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={selectedIds.length === 0}
                                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-bold shadow-sm"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    一括削除
                                </button>
                            </div>
                        )}

                        {history.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">まだ診断履歴がありません。</p>
                            </div>
                        ) : (
                            history.map((item) => (
                                <div key={item.id} className="relative flex items-center group w-full overflow-hidden">
                                    {isEditMode && (
                                        <button 
                                            onClick={() => toggleSelect(item.id)}
                                            className="mr-3 p-1 text-indigo-600 flex-shrink-0"
                                        >
                                            {selectedIds.includes(item.id) ? (
                                                <CheckSquare className="h-6 w-6" />
                                            ) : (
                                                <Square className="h-6 w-6" />
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => isEditMode ? toggleSelect(item.id) : setSelectedDiagnosis(item)}
                                        className={`flex-grow min-w-0 bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all flex items-center space-x-4 text-left ${
                                            isEditMode 
                                                ? (selectedIds.includes(item.id) ? 'border-indigo-300 bg-indigo-50/30' : 'hover:border-gray-300') 
                                                : 'hover:border-indigo-300 hover:shadow-md'
                                        }`}
                                    >
                                        <div className="h-16 w-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            <img 
                                                src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${item.image_path}`} 
                                                alt="サムネイル" 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center text-sm text-gray-500 mb-1">
                                                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                                {format(new Date(item.created_at), 'yyyy/MM/dd HH:mm')}
                                            </div>
                                            <p className="text-gray-900 font-medium truncate">
                                                {item.result_text.split('\n').find(line => line.trim().length > 0)?.replace(/#|【|】/g, '') || '診断結果'}
                                            </p>
                                            <p className="text-gray-500 text-sm line-clamp-2 mt-1">
                                                {item.result_text.replace(/#|【|】/g, '').split('\n').filter(line => line.trim().length > 0).slice(1).join(' ')}
                                            </p>
                                        </div>
                                        {!isEditMode && <ChevronRight className="h-5 w-5 text-gray-400" />}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            {/* 削除確認モーダル */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">削除の確認</h3>
                            <p className="text-gray-600 mb-6">
                                選択した {selectedIds.length} 件の履歴を削除しますか？<br />
                                この操作は取り消せません。
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        if (selectedDiagnosis) setSelectedDiagnosis(null);
                                    }}
                                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isDeleting ? '削除中...' : '削除する'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiDiagnoseHistory;
