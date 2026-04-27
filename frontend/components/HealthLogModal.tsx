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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900">{pet.name} の記録を{editingLog ? '編集' : '追加'}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-6 w-6 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">日付</label>
                        <input
                            type="date"
                            required
                            value={formData.logged_at}
                            onChange={e => setFormData({ ...formData, logged_at: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                                <Utensils className="h-4 w-4 mr-1 text-orange-500" /> 食事(g)
                            </label>
                            <input
                                type="number"
                                placeholder="50"
                                value={formData.meal_amount}
                                onChange={e => setFormData({ ...formData, meal_amount: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                                <Scale className="h-4 w-4 mr-1 text-blue-500" /> 体重(kg)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="5.5"
                                value={formData.weight}
                                onChange={e => setFormData({ ...formData, weight: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                            <Activity className="h-4 w-4 mr-1 text-green-500" /> 運動(分)
                        </label>
                        <input
                            type="number"
                            placeholder="30"
                            value={formData.exercise_duration}
                            onChange={e => setFormData({ ...formData, exercise_duration: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">便の状態</label>
                            <select
                                value={formData.stool_status}
                                onChange={e => setFormData({ ...formData, stool_status: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                            >
                                <option>普通</option>
                                <option>硬め</option>
                                <option>軟便</option>
                                <option>下痢</option>
                                <option>なし</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">尿の状態</label>
                            <select
                                value={formData.urine_status}
                                onChange={e => setFormData({ ...formData, urine_status: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
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
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                            <Clipboard className="h-4 w-4 mr-1 text-gray-500" /> メモ
                        </label>
                        <textarea
                            rows={3}
                            placeholder="気になることがあれば入力してください"
                            value={formData.memo}
                            onChange={e => setFormData({ ...formData, memo: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                        ></textarea>
                    </div>

                    <div className="pt-4 flex gap-3">
                        {editingLog ? (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                            >
                                キャンセル
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                            {loading ? '保存中...' : (
                                <>
                                    <Save className="h-5 w-5 mr-2" />
                                    {editingLog ? '変更を保存' : '記録を保存'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HealthLogModal;
