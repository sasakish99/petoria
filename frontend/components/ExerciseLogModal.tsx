'use client';

import { useState, useEffect } from 'react';
import { X, Save, Activity, Trash2, Clipboard, Calendar, Loader2 } from 'lucide-react';
import axios from '@/lib/axios';
import { format, parseISO } from 'date-fns';

interface ExerciseLogModalProps {
    pet: any;
    editingLog?: any;
    onClose: () => void;
    onSuccess: () => void;
}

const ExerciseLogModal = ({ pet, editingLog, onClose, onSuccess }: ExerciseLogModalProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        duration_minutes: '',
        memo: '',
        logged_at: format(new Date(), 'yyyy-MM-dd'),
    });

    useEffect(() => {
        if (editingLog) {
            setFormData({
                duration_minutes: editingLog.duration_minutes?.toString() || '',
                memo: editingLog.memo || '',
                logged_at: editingLog.logged_at ? format(parseISO(editingLog.logged_at), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
            });
        } else {
            setFormData({
                duration_minutes: '',
                memo: '',
                logged_at: format(new Date(), 'yyyy-MM-dd'),
            });
        }
    }, [editingLog]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = {
                ...formData,
                duration_minutes: parseInt(formData.duration_minutes) || 0,
            };

            if (editingLog) {
                await axios.put(`/api/pets/${pet.id}/exercise-logs/${editingLog.id}`, data);
            } else {
                await axios.post(`/api/pets/${pet.id}/exercise-logs`, data);
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('保存に失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('この運動記録を削除してもよろしいですか？')) return;
        setLoading(true);

        try {
            await axios.delete(`/api/pets/${pet.id}/exercise-logs/${editingLog.id}`);
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('削除に失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl shadow-slate-900/20 border border-white animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between p-8 border-b border-slate-100/50 bg-white/50">
                    <h3 className="text-xl font-black bg-gradient-to-r from-slate-800 to-slate-500 bg-clip-text text-transparent tracking-tight">
                        {pet.name} の運動記録を{editingLog ? '編集' : '追加'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                                日付
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.logged_at}
                                onChange={e => setFormData({ ...formData, logged_at: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-slate-400 focus:ring focus:ring-slate-200/50 outline-none transition-all font-bold text-slate-700"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 flex items-center">
                                <Activity className="h-4 w-4 mr-2 text-emerald-400" />
                                運動時間 (分)
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                placeholder="30"
                                value={formData.duration_minutes}
                                onChange={e => setFormData({ ...formData, duration_minutes: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-slate-400 focus:ring focus:ring-slate-200/50 outline-none transition-all font-bold text-slate-700"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 flex items-center">
                                <Clipboard className="h-4 w-4 mr-2 text-slate-400" />
                                メモ
                            </label>
                            <textarea
                                rows={3}
                                placeholder="散歩の様子など"
                                value={formData.memo}
                                onChange={e => setFormData({ ...formData, memo: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-slate-400 focus:ring focus:ring-slate-200/50 outline-none transition-all font-medium text-slate-700 min-h-[100px] resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-4">
                        <div className="flex gap-4">
                            {editingLog ? (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="px-6 py-4 bg-rose-50 text-rose-500 rounded-xl font-bold hover:bg-rose-100 transition-all flex items-center justify-center border border-rose-100/50"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    キャンセル
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-4 bg-slate-800 text-white rounded-xl font-black hover:bg-slate-700 active:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200 transition-all shadow-xl shadow-slate-200 flex items-center justify-center"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                    <>
                                        <Save className="h-5 w-5 mr-2" />
                                        {editingLog ? '変更を保存' : '記録を保存'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExerciseLogModal;
