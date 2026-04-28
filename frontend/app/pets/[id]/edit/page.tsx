'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/hooks/auth';
import axios from '@/lib/axios';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ChevronLeft, Trash2 } from 'lucide-react';

const PetEdit = ({ params }: { params: Promise<{ id: string }> }) => {
    const { id: petId } = use(params);
    const router = useRouter();
    const { user } = useAuth({ middleware: 'auth' });
    
    const [name, setName] = useState('');
    const [species, setSpecies] = useState('dog');
    const [breedId, setBreedId] = useState('');
    const [birthday, setBirthday] = useState('');
    const [targetWeight, setTargetWeight] = useState('');
    const [themeColor, setThemeColor] = useState('indigo');
    const [errors, setErrors] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const { data: pet } = useSWR(petId ? `/api/pets/${petId}` : null, () =>
        axios.get(`/api/pets/${petId}`).then(res => res.data)
    );

    const { data: breeds } = useSWR('/api/breeds', () =>
        axios.get('/api/breeds').then(res => res.data)
    );

    useEffect(() => {
        if (pet) {
            setName(pet.name);
            setSpecies(pet.species);
            setBreedId(pet.breed_id?.toString() || '');
            setBirthday(pet.birthday || '');
            setTargetWeight(pet.target_weight?.toString() || '');
            setThemeColor(pet.theme_color || 'indigo');
        }
    }, [pet]);

    const filteredBreeds = breeds?.filter((b: any) => b.species === species) || [];

    const themeColors = [
        { name: 'indigo', bg: 'bg-indigo-600' },
        { name: 'rose', bg: 'bg-rose-500' },
        { name: 'amber', bg: 'bg-amber-500' },
        { name: 'emerald', bg: 'bg-emerald-500' },
        { name: 'blue', bg: 'bg-blue-500' },
    ];

    if (!user || !pet) return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            await axios.put(`/api/pets/${petId}`, {
                name,
                species,
                breed_id: breedId || null,
                birthday: birthday || null,
                target_weight: targetWeight || null,
                theme_color: themeColor,
            });
            router.push('/dashboard');
        } catch (error: any) {
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('このペットを削除してもよろしいですか？この操作は取り消せません。')) return;
        
        try {
            await axios.delete(`/api/pets/${petId}`);
            router.push('/dashboard');
        } catch (error) {
            console.error('Delete error:', error);
            alert('削除に失敗しました。');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronLeft className="h-6 w-6 text-gray-500" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">プロフィール編集</h2>
                    <button onClick={handleDelete} className="p-2 hover:bg-red-50 rounded-full transition-colors group">
                        <Trash2 className="h-5 w-5 text-gray-400 group-hover:text-red-500" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">お名前</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            required
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">種類</label>
                        <select
                            value={species}
                            onChange={(e) => setSpecies(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                        >
                            <option value="dog">犬</option>
                            <option value="cat">猫</option>
                            <option value="other">その他</option>
                        </select>
                        {errors.species && <p className="mt-1 text-sm text-red-600">{errors.species[0]}</p>}
                    </div>

                    {(species === 'dog' || species === 'cat') && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                {species === 'dog' ? '犬種' : '猫種'}
                            </label>
                            <select
                                value={breedId}
                                onChange={(e) => setBreedId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                            >
                                <option value="">選択してください</option>
                                {filteredBreeds.map((breed: any) => (
                                    <option key={breed.id} value={breed.id}>
                                        {breed.name}
                                    </option>
                                ))}
                            </select>
                            {errors.breed_id && <p className="mt-1 text-sm text-red-600">{errors.breed_id[0]}</p>}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">誕生日</label>
                        <input
                            type="date"
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                        {errors.birthday && <p className="mt-1 text-sm text-red-600">{errors.birthday[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">目標体重 (kg)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={targetWeight}
                            onChange={(e) => setTargetWeight(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                        {errors.target_weight && <p className="mt-1 text-sm text-red-600">{errors.target_weight[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">テーマカラー</label>
                        <div className="flex space-x-3">
                            {themeColors.map((color) => (
                                <button
                                    key={color.name}
                                    type="button"
                                    onClick={() => setThemeColor(color.name)}
                                    className={`h-10 w-10 rounded-full ${color.bg} transition-all ${
                                        themeColor === color.name 
                                            ? 'ring-4 ring-gray-200 scale-110 shadow-sm' 
                                            : 'opacity-40 hover:opacity-100'
                                    }`}
                                />
                            ))}
                        </div>
                        {errors.theme_color && <p className="mt-1 text-sm text-red-600">{errors.theme_color[0]}</p>}
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 rounded-2xl text-white font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
                        >
                            {loading ? '保存中...' : '変更を保存する'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PetEdit;
