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
    Clipboard,
    History,
    Smile,
    Frown,
    Meh,
    Laugh,
    Angry
} from 'lucide-react';

const conditionIcons: Record<number, any> = {
    1: { icon: Angry, color: 'text-rose-500', bg: 'bg-rose-50', label: '最悪' },
    2: { icon: Frown, color: 'text-orange-500', bg: 'bg-orange-50', label: '悪い' },
    3: { icon: Meh, color: 'text-amber-500', bg: 'bg-amber-50', label: '普通' },
    4: { icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-50', label: '良い' },
    5: { icon: Laugh, color: 'text-sky-500', bg: 'bg-sky-50', label: '最高' },
};
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import HealthLogModal from '@/components/HealthLogModal';
import ExerciseLogModal from '@/components/ExerciseLogModal';

export default function PetHistoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: petId } = use(params);
    const router = useRouter();
    const { user } = useAuth({ middleware: 'auth' });

    const [activeTab, setActiveTab] = useState<'ai' | 'health' | 'exercise' | 'vaccine'>('ai');
    const [pet, setPet] = useState<any>(null);
    const [aiHistory, setAiHistory] = useState<any[]>([]);
    const [healthLogs, setHealthLogs] = useState<any[]>([]);
    const [exerciseLogs, setExerciseLogs] = useState<any[]>([]);
    const [vaccineHistory, setVaccineHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // 詳細表示用状態
    const [selectedDiagnosis, setSelectedDiagnosis] = useState<any>(null);
    const [selectedVaccine, setSelectedVaccine] = useState<any>(null);

    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // 健康記録用状態
    const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState<any>(null);

    // 運動記録用状態
    const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
    const [editingExerciseLog, setEditingExerciseLog] = useState<any>(null);

    const fetchData = async () => {
        if (!petId) return;
        try {
            const [petRes, logsRes, exerciseRes] = await Promise.all([
                axios.get(`/api/pets/${petId}`),
                axios.get(`/api/pets/${petId}/health-logs`),
                axios.get(`/api/pets/${petId}/exercise-logs`)
            ]);

            setPet(petRes.data);
            const sortedAiHistory = petRes.data.ai_diagnoses ? [...petRes.data.ai_diagnoses].sort((a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ) : [];
            setAiHistory(sortedAiHistory);
            setHealthLogs(logsRes.data);
            setExerciseLogs(exerciseRes.data);

            const vaccines = petRes.data.medical_events ? petRes.data.medical_events.filter((e: any) => e.vaccine_type !== null).sort((a: any, b: any) =>
                new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
            ) : [];
            setVaccineHistory(vaccines);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [petId]);

    useEffect(() => {
        setIsEditMode(false);
        setSelectedIds([]);
    }, [activeTab]);

    if (!user || loading) {
        return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
    }

    if (!pet) {
        return <div className="min-h-screen flex items-center justify-center">うちの子が見つかりませんでした。</div>;
    }

    // 選択関連のハンドラー
    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        let currentHistory: any[] = [];
        if (activeTab === 'ai') currentHistory = aiHistory;
        else if (activeTab === 'health') currentHistory = healthLogs;
        else if (activeTab === 'exercise') currentHistory = exerciseLogs;
        else if (activeTab === 'vaccine') currentHistory = vaccineHistory;

        if (selectedIds.length === currentHistory.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(currentHistory.map(item => item.id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        setIsDeleting(true);
        try {
            let endpoint = '';
            let payload = { ids: selectedIds };
            
            if (activeTab === 'ai') endpoint = `/api/pets/${petId}/ai-diagnoses`;
            else if (activeTab === 'health') endpoint = `/api/pets/${petId}/health-logs/bulk`;
            else if (activeTab === 'exercise') endpoint = `/api/pets/${petId}/exercise-logs/bulk`;
            else if (activeTab === 'vaccine') endpoint = `/api/pets/${petId}/medical-events/bulk`;

            await axios.delete(endpoint, {
                data: payload
            });

            await fetchData();
            setSelectedIds([]);
            setIsEditMode(false);
            setShowDeleteConfirm(false);
            // 詳細表示中なら閉じる
            setSelectedDiagnosis(null);
            setSelectedVaccine(null);
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

    const handleExerciseEdit = (log: any) => {
        setEditingExerciseLog(log);
        setIsExerciseModalOpen(true);
    };

    const handleBack = () => {
        if (selectedDiagnosis || selectedVaccine) {
            setSelectedDiagnosis(null);
            setSelectedVaccine(null);
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
                            {selectedDiagnosis || selectedVaccine ? '詳細' : `${pet.name} の履歴`}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {!selectedDiagnosis && !selectedVaccine && (
                            <button
                                onClick={() => setIsEditMode(!isEditMode)}
                                className={`text-sm font-medium ${isEditMode ? 'text-gray-600' : 'text-indigo-600'} hover:opacity-80 flex items-center`}
                            >
                                {isEditMode ? 'キャンセル' : (
                                    <><Trash2 className="h-4 w-4 mr-1" />整理する</>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                    {!selectedDiagnosis && !selectedVaccine && (
                        <div className="max-w-3xl mx-auto px-4 flex border-b border-gray-100 overflow-x-auto scrollbar-hide">
                            <button
                                onClick={() => setActiveTab('ai')}
                                className={`flex-shrink-0 px-4 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                                    activeTab === 'ai'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Activity className="h-4 w-4" />
                                AI健康診断
                            </button>
                            <button
                                onClick={() => setActiveTab('health')}
                                className={`flex-shrink-0 px-4 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                                    activeTab === 'health'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <ClipboardList className="h-4 w-4" />
                                健康記録
                            </button>
                            <button
                                onClick={() => setActiveTab('exercise')}
                                className={`flex-shrink-0 px-4 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                                    activeTab === 'exercise'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Activity className="h-4 w-4" />
                                運動記録
                            </button>
                            <button
                                onClick={() => setActiveTab('vaccine')}
                                className={`flex-shrink-0 px-4 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                                    activeTab === 'vaccine'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <CheckSquare className="h-4 w-4" />
                                ワクチン
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
                ) : selectedVaccine ? (
                    /* ワクチン詳細 */
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {selectedVaccine.certificate_path && (
                                <div className="aspect-video w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${selectedVaccine.certificate_path}`}
                                        alt="証明書画像"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            )}
                            <div className="p-6 md:p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{selectedVaccine.title}</h2>
                                        <div className="flex items-center text-sm text-gray-500 mt-1">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            接種日: {format(new Date(selectedVaccine.event_date), 'yyyy年MM月dd日', { locale: ja })}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedIds([selectedVaccine.id]);
                                            setShowDeleteConfirm(true);
                                        }}
                                        className="text-red-500 hover:text-red-700 p-2"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                        <span className="text-gray-500 text-sm">病院名</span>
                                        <span className="text-gray-900 font-medium">{selectedVaccine.clinic_name || '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                        <span className="text-gray-500 text-sm">次回の予定</span>
                                        <span className="text-indigo-600 font-bold">{selectedVaccine.next_event_date ? format(new Date(selectedVaccine.next_event_date), 'yyyy年MM月dd日') : '-'}</span>
                                    </div>
                                    {selectedVaccine.notes && (
                                        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedVaccine.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'ai' ? (
                    /* AI診断一覧 */
                    <div className="space-y-4">
                        {isEditMode && aiHistory.length > 0 && (
                            <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
                                <button
                                    onClick={toggleSelectAll}
                                    className="flex items-center text-sm font-medium text-indigo-700"
                                >
                                    {selectedIds.length === aiHistory.length ? (
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

                        {aiHistory.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">まだ診断履歴がありません。</p>
                            </div>
                        ) : (
                            aiHistory.map((item) => (
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
                                            <p className="text-gray-900 font-bold truncate">
                                                {item.result_text.split('\n').find((line: string) => line.trim().length > 0)?.replace(/#|【|】/g, '') || '診断結果'}
                                            </p>
                                            <p className="text-gray-500 text-sm line-clamp-1 mt-1 leading-relaxed">
                                                {item.result_text.replace(/#|【|】/g, '').split('\n').filter((line: string) => line.trim().length > 0).slice(1).join(' ')}
                                            </p>
                                        </div>
                                        {!isEditMode && <ChevronRight className="h-5 w-5 text-gray-400" />}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                ) : activeTab === 'exercise' ? (
                    /* 運動記録一覧 */
                    <div className="space-y-4">
                        {isEditMode && exerciseLogs.length > 0 && (
                            <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
                                <button
                                    onClick={toggleSelectAll}
                                    className="flex items-center text-sm font-medium text-indigo-700"
                                >
                                    {selectedIds.length === exerciseLogs.length ? (
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

                        {exerciseLogs.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">運動記録がまだありません</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {exerciseLogs.map((log) => (
                                    <div key={log.id} className="relative flex items-center group w-full overflow-hidden">
                                        {isEditMode && (
                                            <button
                                                onClick={() => toggleSelect(log.id)}
                                                className="mr-3 p-1 text-indigo-600 flex-shrink-0"
                                            >
                                                {selectedIds.includes(log.id) ? (
                                                    <CheckSquare className="h-6 w-6" />
                                                ) : (
                                                    <Square className="h-6 w-6" />
                                                )}
                                            </button>
                                        )}
                                        <div 
                                            onClick={() => isEditMode && toggleSelect(log.id)}
                                            className={`flex-grow bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all ${
                                                isEditMode
                                                    ? (selectedIds.includes(log.id) ? 'border-indigo-300 bg-indigo-50/30' : 'hover:border-gray-300')
                                                    : 'hover:shadow-md'
                                            }`}
                                        >
                                            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                                <span className="font-bold text-gray-700 flex items-center">
                                                    <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
                                                    {format(parseISO(log.logged_at), 'yyyy年MM月dd日(E)', { locale: ja })}
                                                </span>
                                                {!isEditMode && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleExerciseEdit(log);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <div className="flex flex-wrap gap-4">
                                                    <div className="flex items-center text-sm text-gray-600 bg-emerald-50/50 px-3 py-1.5 rounded-full border border-emerald-100/50">
                                                        <Activity className="h-4 w-4 mr-2 text-emerald-500" />
                                                        <span className="font-medium">{log.duration_minutes}分</span>
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
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : activeTab === 'vaccine' ? (
                    /* ワクチン一覧 */
                    <div className="space-y-4">
                        {isEditMode && vaccineHistory.length > 0 && (
                            <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
                                <button
                                    onClick={toggleSelectAll}
                                    className="flex items-center text-sm font-medium text-indigo-700"
                                >
                                    {selectedIds.length === vaccineHistory.length ? (
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

                        {vaccineHistory.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                                <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">まだワクチンの記録がありません。</p>
                            </div>
                        ) : (
                            vaccineHistory.map((item) => (
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
                                        onClick={() => isEditMode ? toggleSelect(item.id) : setSelectedVaccine(item)}
                                        className={`flex-grow min-w-0 bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all flex items-center space-x-4 text-left ${
                                            isEditMode
                                                ? (selectedIds.includes(item.id) ? 'border-indigo-300 bg-indigo-50/30' : 'hover:border-gray-300')
                                                : 'hover:border-indigo-300 hover:shadow-md'
                                        }`}
                                    >
                                        <div className="h-12 w-12 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <CheckSquare className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center text-sm text-gray-500 mb-1">
                                                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                                {format(new Date(item.event_date), 'yyyy/MM/dd')}
                                            </div>
                                            <p className="text-gray-900 font-bold truncate">
                                                {item.title}
                                            </p>
                                            <p className="text-gray-500 text-sm truncate">
                                                {item.clinic_name || '病院名不明'}
                                            </p>
                                        </div>
                                        {!isEditMode && <ChevronRight className="h-5 w-5 text-gray-400" />}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                ) : activeTab === 'receipt' ? (
                    /* 診療明細一覧 */
                    <div className="space-y-4">
                        {isEditMode && receiptHistory.length > 0 && (
                            <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
                                <button
                                    onClick={toggleSelectAll}
                                    className="flex items-center text-sm font-medium text-indigo-700"
                                >
                                    {selectedIds.length === receiptHistory.length ? (
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

                        {receiptHistory.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                                <Scale className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">まだ診療明細の記録がありません。</p>
                            </div>
                        ) : (
                            receiptHistory.map((item) => (
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
                                        onClick={() => isEditMode ? toggleSelect(item.id) : setSelectedReceipt(item)}
                                        className={`flex-grow min-w-0 bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all flex items-center space-x-4 text-left ${
                                            isEditMode
                                                ? (selectedIds.includes(item.id) ? 'border-indigo-300 bg-indigo-50/30' : 'hover:border-gray-300')
                                                : 'hover:border-indigo-300 hover:shadow-md'
                                        }`}
                                    >
                                        <div className="h-12 w-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                                src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${item.image_path}`}
                                                alt="サムネイル"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center text-sm text-gray-500 mb-1">
                                                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                                {format(new Date(item.receipt_date), 'yyyy/MM/dd')}
                                            </div>
                                            <p className="text-gray-900 font-bold truncate">
                                                {item.clinic_name || '病院名不明'}
                                            </p>
                                            <p className="text-indigo-600 font-bold text-sm">
                                                ¥{Math.floor(item.total_amount ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </p>
                                        </div>
                                        {!isEditMode && <ChevronRight className="h-5 w-5 text-gray-400" />}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                ) : activeTab === 'checkup' ? (
                    /* 健康診断一覧 */
                    <div className="space-y-4">
                        {isEditMode && checkupHistory.length > 0 && (
                            <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
                                <button
                                    onClick={toggleSelectAll}
                                    className="flex items-center text-sm font-medium text-indigo-700"
                                >
                                    {selectedIds.length === checkupHistory.length ? (
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

                        {checkupHistory.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                                <Clipboard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">まだ健康診断の記録がありません。</p>
                            </div>
                        ) : (
                            checkupHistory.map((item) => (
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
                                        onClick={() => isEditMode ? toggleSelect(item.id) : setSelectedCheckup(item)}
                                        className={`flex-grow min-w-0 bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all flex items-center space-x-4 text-left ${
                                            isEditMode
                                                ? (selectedIds.includes(item.id) ? 'border-indigo-300 bg-indigo-50/30' : 'hover:border-gray-300')
                                                : 'hover:border-indigo-300 hover:shadow-md'
                                        }`}
                                    >
                                        <div className="h-12 w-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                                src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${item.image_path}`}
                                                alt="サムネイル"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center text-sm text-gray-500 mb-1">
                                                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                                {format(new Date(item.checkup_date), 'yyyy/MM/dd')}
                                            </div>
                                            <p className="text-gray-900 font-bold truncate">
                                                {item.clinic_name || '病院名不明'}
                                            </p>
                                            <p className="text-gray-500 text-sm">
                                                検査項目: {Array.isArray(item.results) ? item.results.length : (typeof item.results === 'string' ? JSON.parse(item.results).length : 0)}件
                                            </p>
                                        </div>
                                        {!isEditMode && <ChevronRight className="h-5 w-5 text-gray-400" />}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    /* 健康記録一覧 */
                    <div className="space-y-4">
                        {isEditMode && healthLogs.length > 0 && (
                            <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
                                <button
                                    onClick={toggleSelectAll}
                                    className="flex items-center text-sm font-medium text-indigo-700"
                                >
                                    {selectedIds.length === healthLogs.length ? (
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

                        {healthLogs.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">記録がまだありません</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {healthLogs.map((log) => (
                                    <div key={log.id} className="relative flex items-center group w-full overflow-hidden">
                                        {isEditMode && (
                                            <button
                                                onClick={() => toggleSelect(log.id)}
                                                className="mr-3 p-1 text-indigo-600 flex-shrink-0"
                                            >
                                                {selectedIds.includes(log.id) ? (
                                                    <CheckSquare className="h-6 w-6" />
                                                ) : (
                                                    <Square className="h-6 w-6" />
                                                )}
                                            </button>
                                        )}
                                        <div 
                                            onClick={() => isEditMode && toggleSelect(log.id)}
                                            className={`flex-grow bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all ${
                                                isEditMode
                                                    ? (selectedIds.includes(log.id) ? 'border-indigo-300 bg-indigo-50/30' : 'hover:border-gray-300')
                                                    : 'hover:shadow-md'
                                            }`}
                                        >
                                            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                                <span className="font-bold text-gray-700 flex items-center">
                                                    <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
                                                    {format(parseISO(log.logged_at), 'yyyy年MM月dd日(E)', { locale: ja })}
                                                </span>
                                                {!isEditMode && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleHealthEdit(log);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <div className="flex flex-wrap gap-4">
                                                    {log.condition && (
                                                        <div className={`flex items-center px-3 py-1.5 rounded-full ${conditionIcons[log.condition]?.bg || 'bg-gray-50'} border border-transparent`}>
                                                            {(() => {
                                                                const Icon = conditionIcons[log.condition]?.icon || Meh;
                                                                return <Icon className={`h-4 w-4 mr-2 ${conditionIcons[log.condition]?.color || 'text-gray-400'}`} />;
                                                            })()}
                                                            <span className={`text-sm font-bold ${conditionIcons[log.condition]?.color || 'text-gray-600'}`}>
                                                                {conditionIcons[log.condition]?.label || '普通'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {log.weight && (
                                                        <div className="flex items-center text-sm text-gray-600 bg-blue-50/50 px-3 py-1.5 rounded-full border border-blue-100/50">
                                                            <Scale className="h-4 w-4 mr-2 text-blue-500" />
                                                            <span className="font-medium">{log.weight}kg</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {log.memo && (
                                                    <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600 flex items-start border border-gray-100">
                                                        <Clipboard className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                                                        <p className="whitespace-pre-wrap">{log.memo}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                        // 1件削除（詳細画面から）の場合は選択をクリア
                                        if (selectedDiagnosis || selectedReceipt || selectedCheckup || selectedVaccine) {
                                            setSelectedIds([]);
                                        }
                                    }}
                                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleBulkDelete}
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
            {/* 運動記録用モーダル */}
            {isExerciseModalOpen && (
                <ExerciseLogModal
                    pet={pet}
                    editingLog={editingExerciseLog}
                    onClose={() => setIsExerciseModalOpen(false)}
                    onSuccess={fetchData}
                />
            )}
        </div>
    );
}
