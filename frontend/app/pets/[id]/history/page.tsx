'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/hooks/auth';
import axios from '@/lib/axios';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Calendar,
    FileText,
    ChevronRight,
    Trash2,
    CheckSquare,
    Square,
    AlertTriangle,
    ClipboardList,
    Activity,
    Utensils,
    Scale,
    Trash2 as TrashIcon,
    Edit2,
    Droplets,
    Plus,
    Clipboard
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import HealthLogModal from '@/components/HealthLogModal';

export default function PetHistoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: petId } = use(params);
    const router = useRouter();
    const { user } = useAuth({ middleware: 'auth' });

    const [activeTab, setActiveTab] = useState<'ai' | 'health'>('ai');
    const [pet, setPet] = useState<any>(null);
    const [aiHistory, setAiHistory] = useState<any[]>([]);
    const [healthLogs, setHealthLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // AI診断用状態
    const [selectedDiagnosis, setSelectedDiagnosis] = useState<any>(null);
    const [isAiEditMode, setIsAiEditMode] = useState(false);
    const [selectedAiIds, setSelectedAiIds] = useState<number[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showAiDeleteConfirm, setShowAiDeleteConfirm] = useState(false);

    // 健康記録用状態
    const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState<any>(null);

    const fetchData = async () => {
        if (!petId) return;
        try {
            const [petRes, logsRes] = await Promise.all([
                axios.get(`/api/pets/${petId}`),
                axios.get(`/api/pets/${petId}/health-logs`)
            ]);

            setPet(petRes.data);
            const sortedAiHistory = petRes.data.ai_diagnoses ? [...petRes.data.ai_diagnoses].sort((a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ) : [];
            setAiHistory(sortedAiHistory);
            setHealthLogs(logsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [petId]);

    if (!user || loading) {
        return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
    }

    if (!pet) {
        return <div className="min-h-screen flex items-center justify-center">ペットが見つかりませんでした。</div>;
    }

    // AI診断関連のハンドラー
    const toggleAiSelect = (id: number) => {
        setSelectedAiIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAiSelectAll = () => {
        if (selectedAiIds.length === aiHistory.length) {
            setSelectedAiIds([]);
        } else {
            setSelectedAiIds(aiHistory.map(item => item.id));
        }
    };

    const handleAiDelete = async () => {
        if (selectedAiIds.length === 0) return;

        setIsDeleting(true);
        try {
            await axios.delete(`/api/pets/${petId}/ai-diagnoses`, {
                data: { ids: selectedAiIds }
            });

            await fetchData();
            setSelectedAiIds([]);
            setIsAiEditMode(false);
            setShowAiDeleteConfirm(false);
            setSelectedDiagnosis(null);
        } catch (err) {
            console.error(err);
            alert('削除に失敗しました。');
        } finally {
            setIsDeleting(false);
        }
    };

    // 健康記録関連のハンドラー
    const handleHealthEdit = (log: any) => {
        setEditingLog(log);
        setIsHealthModalOpen(true);
    };

    const handleHealthAdd = () => {
        setEditingLog(null);
        setIsHealthModalOpen(true);
    };

    const handleBack = () => {
        if (selectedDiagnosis) {
            setSelectedDiagnosis(null);
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* ヘッダー */}
            <div className="bg-white border-b sticky top-0 z-20">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center">
                        <button
                            onClick={handleBack}
                            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ChevronLeft className="h-6 w-6 text-gray-600" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">
                            {selectedDiagnosis ? '診断詳細' : `${pet.name} の履歴`}
                        </h1>
                    </div>
                    {!selectedDiagnosis && activeTab === 'ai' && aiHistory.length > 0 && (
                        <button
                            onClick={() => isAiEditMode ? setIsAiEditMode(false) : setIsAiEditMode(true)}
                            className={`text-sm font-medium ${isAiEditMode ? 'text-gray-600' : 'text-indigo-600'} hover:opacity-80 flex items-center`}
                        >
                            {isAiEditMode ? 'キャンセル' : (
                                <><Trash2 className="h-4 w-4 mr-1" />整理する</>
                            )}
                        </button>
                    )}
                    {!selectedDiagnosis && activeTab === 'health' && (
                        <button
                            onClick={handleHealthAdd}
                            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* タブ切り替え (詳細表示時は隠す) */}
                {!selectedDiagnosis && (
                    <div className="max-w-3xl mx-auto px-4 flex border-b border-gray-100">
                        <button
                            onClick={() => setActiveTab('ai')}
                            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                                activeTab === 'ai'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Activity className="h-4 w-4" />
                            AI診断
                        </button>
                        <button
                            onClick={() => setActiveTab('health')}
                            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                                activeTab === 'health'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <ClipboardList className="h-4 w-4" />
                            健康記録
                        </button>
                    </div>
                )}
            </div>

            <main className="max-w-3xl mx-auto px-4 py-6">
                {selectedDiagnosis ? (
                    /* AI診断詳細 */
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
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
                                            setSelectedAiIds([selectedDiagnosis.id]);
                                            setShowAiDeleteConfirm(true);
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
                ) : activeTab === 'ai' ? (
                    /* AI診断一覧 */
                    <div className="space-y-4">
                        {isAiEditMode && aiHistory.length > 0 && (
                            <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
                                <button
                                    onClick={toggleAiSelectAll}
                                    className="flex items-center text-sm font-medium text-indigo-700"
                                >
                                    {selectedAiIds.length === aiHistory.length ? (
                                        <CheckSquare className="h-5 w-5 mr-2" />
                                    ) : (
                                        <Square className="h-5 w-5 mr-2" />
                                    )}
                                    すべて選択 ({selectedAiIds.length})
                                </button>
                                <button
                                    onClick={() => setShowAiDeleteConfirm(true)}
                                    disabled={selectedAiIds.length === 0}
                                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-bold shadow-sm"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    一括削除
                                </button>
                            </div>
                        )}

                        {aiHistory.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">まだ診断履歴がありません。</p>
                            </div>
                        ) : (
                            aiHistory.map((item) => (
                                <div key={item.id} className="relative flex items-center group w-full overflow-hidden">
                                    {isAiEditMode && (
                                        <button
                                            onClick={() => toggleAiSelect(item.id)}
                                            className="mr-3 p-1 text-indigo-600 flex-shrink-0"
                                        >
                                            {selectedAiIds.includes(item.id) ? (
                                                <CheckSquare className="h-6 w-6" />
                                            ) : (
                                                <Square className="h-6 w-6" />
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => isAiEditMode ? toggleAiSelect(item.id) : setSelectedDiagnosis(item)}
                                        className={`flex-grow min-w-0 bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all flex items-center space-x-4 text-left ${
                                            isAiEditMode
                                                ? (selectedAiIds.includes(item.id) ? 'border-indigo-300 bg-indigo-50/30' : 'hover:border-gray-300')
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
                                            <p className="text-gray-900 font-bold truncate">
                                                {item.result_text.split('\n').find(line => line.trim().length > 0)?.replace(/#|【|】/g, '') || '診断結果'}
                                            </p>
                                            <p className="text-gray-500 text-sm line-clamp-1 mt-1 leading-relaxed">
                                                {item.result_text.replace(/#|【|】/g, '').split('\n').filter(line => line.trim().length > 0).slice(1).join(' ')}
                                            </p>
                                        </div>
                                        {!isAiEditMode && <ChevronRight className="h-5 w-5 text-gray-400" />}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    /* 健康記録一覧 */
                    <div className="space-y-4">
                        {healthLogs.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">記録がまだありません</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {healthLogs.map((log) => (
                                    <div key={log.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                            <span className="font-bold text-gray-700 flex items-center">
                                                <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
                                                {format(parseISO(log.logged_at), 'yyyy年MM月dd日(E)', { locale: ja })}
                                            </span>
                                            <button
                                                onClick={() => handleHealthEdit(log)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="p-4">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {log.weight && (
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Scale className="h-4 w-4 mr-2 text-blue-500" />
                                                        <span>{log.weight}kg</span>
                                                    </div>
                                                )}
                                                {log.meal_amount && (
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Utensils className="h-4 w-4 mr-2 text-orange-500" />
                                                        <span>{log.meal_amount}</span>
                                                    </div>
                                                )}
                                                {log.exercise_duration > 0 && (
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Activity className="h-4 w-4 mr-2 text-green-500" />
                                                        <span>{log.exercise_duration}分</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <TrashIcon className="h-4 w-4 mr-2 text-amber-600" />
                                                    <span>便: {log.stool_status}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Droplets className="h-4 w-4 mr-2 text-blue-400" />
                                                    <span>尿: {log.urine_status}</span>
                                                </div>
                                            </div>
                                            {log.memo && (
                                                <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600 flex items-start border border-gray-100">
                                                    <Clipboard className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                                                    <p className="whitespace-pre-wrap">{log.memo}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* AI削除確認モーダル */}
            {showAiDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">削除の確認</h3>
                            <p className="text-gray-600 mb-6">
                                選択した {selectedAiIds.length} 件の履歴を削除しますか？<br />
                                この操作は取り消せません。
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => {
                                        setShowAiDeleteConfirm(false);
                                        // 1件削除（詳細画面から）の場合は選択をクリア
                                        if (selectedDiagnosis) setSelectedAiIds([]);
                                    }}
                                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleAiDelete}
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

            {/* 健康記録用モーダル */}
            {isHealthModalOpen && (
                <HealthLogModal
                    pet={pet}
                    editingLog={editingLog}
                    onClose={() => setIsHealthModalOpen(false)}
                    onSuccess={fetchData}
                />
            )}
        </div>
    );
}
