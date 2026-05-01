'use client';

import { useState } from 'react';
import { X, Save, Utensils, Activity, Trash2, Clipboard, Scale } from 'lucide-react';
import axios from '@/lib/axios';
import { format } from 'date-fns';

interface HealthLogModalProps {
    pet: any;
    editingLog?: any;
    onClose: () => void;
    onSuccess: () => void;
}

const HealthLogModal = ({ pet, editingLog, onClose, onSuccess }: HealthLogModalProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        meal_amount: editingLog?.meal_amount || '',
        stool_status: editingLog?.stool_status || '普通',
        urine_status: editingLog?.urine_status || '普通',
        exercise_duration: editingLog?.exercise_duration?.toString() || '',
        weight: editingLog?.weight?.toString() || '',
        memo: editingLog?.memo || '',
        logged_at: editingLog?.logged_at || format(new Date(), 'yyyy-MM-dd'),
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingLog) {
                await axios.put(`/api/pets/${pet.id}/health-logs/${editingLog.id}`, {
                    ...formData,
                    meal_amount: formData.meal_amount ? parseInt(formData.meal_amount) : null,
                    exercise_duration: formData.exercise_duration ? parseInt(formData.exercise_duration) : null,
                    weight: formData.weight ? parseFloat(formData.weight) : null,
                });
            } else {
                await axios.post(`/api/pets/${pet.id}/health-logs`, {
                    ...formData,
                    meal_amount: formData.meal_amount ? parseInt(formData.meal_amount) : null,
                    exercise_duration: formData.exercise_duration ? parseInt(formData.exercise_duration) : null,
                    weight: formData.weight ? parseFloat(formData.weight) : null,
                });
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
        if (!confirm('この記録を削除してもよろしいですか？')) return;
        setLoading(true);

        try {
            await axios.delete(`/api/pets/${pet.id}/health-logs/${editingLog.id}`);
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
                        {pet.name} の記録を{editingLog ? '編集' : '追加'}
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

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 flex items-center">
                                    <Utensils className="h-4 w-4 mr-2 text-orange-400" />
                                    食事 (g)
                                </label>
                                <input
                                    type="number"
                                    placeholder="50"
                                    value={formData.meal_amount}
                                    onChange={e => setFormData({ ...formData, meal_amount: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-slate-400 focus:ring focus:ring-slate-200 focus:ring-opacity-50 outline-none transition-all font-bold text-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 flex items-center">
                                    <Scale className="h-4 w-4 mr-2 text-blue-400" />
                                    体重 (kg)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="5.5"
                                    value={formData.weight}
                                    onChange={e => setFormData({ ...formData, weight: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-slate-400 focus:ring focus:ring-slate-200 focus:ring-opacity-50 outline-none transition-all font-bold text-slate-700"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 flex items-center">
                                <Activity className="h-4 w-4 mr-2 text-emerald-400" />
                                運動 (分)
                            </label>
                            <input
                                type="number"
                                placeholder="30"
                                value={formData.exercise_duration}
                                onChange={e => setFormData({ ...formData, exercise_duration: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-slate-400 focus:ring focus:ring-slate-200/50 outline-none transition-all font-bold text-slate-700"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">便の状態</label>
                                <select
                                    value={formData.stool_status}
                                    onChange={e => setFormData({ ...formData, stool_status: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-slate-400 focus:ring focus:ring-slate-200/50 outline-none transition-all font-bold text-slate-700 text-xs"
                                >
                                    <option>普通</option>
                                    <option>硬め</option>
                                    <option>軟便</option>
                                    <option>下痢</option>
                                    <option>なし</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">尿の状態</label>
                                <select
                                    value={formData.urine_status}
                                    onChange={e => setFormData({ ...formData, urine_status: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-slate-400 focus:ring focus:ring-slate-200/50 outline-none transition-all font-bold text-slate-700 text-xs"
                                >
                                    <option>普通</option>
                                    <option>濃い</option>
                                    <option>薄い</option>
                                    <option>血尿</option>
                                    <option>なし</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 flex items-center">
                                <Clipboard className="h-4 w-4 mr-2 text-slate-400" />
                                メモ
                            </label>
                            <textarea
                                rows={3}
                                placeholder="気になることがあれば入力してください"
                                value={formData.memo}
                                onChange={e => setFormData({ ...formData, memo: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-slate-400 focus:ring focus:ring-slate-200 focus:ring-opacity-50 outline-none transition-all font-medium text-slate-700 min-h-[100px] resize-none"
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

export default HealthLogModal;
