'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth';
import axios from '@/lib/axios';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

const PetCreate = () => {
    const router = useRouter();
    const { user } = useAuth({ middleware: 'auth' });
    
    const [name, setName] = useState('');
    const [species, setSpecies] = useState('dog');
    const [breedId, setBreedId] = useState('');
    const [birthday, setBirthday] = useState('');
    const [targetWeight, setTargetWeight] = useState('');
    const [errors, setErrors] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const { data: breeds } = useSWR('/api/breeds', () =>
        axios.get('/api/breeds').then(res => res.data)
    );

    const filteredBreeds = breeds?.filter((b: any) => b.species === species) || [];

    useEffect(() => {
        setBreedId('');
    }, [species]);

    if (!user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            console.log('Submitting pet data:', {
                name,
                species,
                breed_id: breedId || null,
                birthday: birthday || null,
                target_weight: targetWeight || null,
            });
            const response = await axios.post('/api/pets', {
                name,
                species,
                breed_id: breedId || null,
                birthday: birthday || null,
                target_weight: targetWeight || null,
            });
            console.log('Response:', response.data);
            router.push('/dashboard');
        } catch (error: any) {
            console.error('Submit error:', error);
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm overflow-hidden p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">ペットを登録する</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">お名前</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">種類</label>
                        <select
                            value={species}
                            onChange={(e) => setSpecies(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="dog">犬</option>
                            <option value="cat">猫</option>
                            <option value="other">その他</option>
                        </select>
                        {errors.species && <p className="mt-1 text-sm text-red-600">{errors.species[0]}</p>}
                    </div>

                    {(species === 'dog' || species === 'cat') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                {species === 'dog' ? '犬種' : '猫種'}
                            </label>
                            <select
                                value={breedId}
                                onChange={(e) => setBreedId(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                        <label className="block text-sm font-medium text-gray-700">誕生日 (任意)</label>
                        <input
                            type="date"
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {errors.birthday && <p className="mt-1 text-sm text-red-600">{errors.birthday[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">目標体重 (kg, 任意)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={targetWeight}
                            onChange={(e) => setTargetWeight(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {errors.target_weight && <p className="mt-1 text-sm text-red-600">{errors.target_weight[0]}</p>}
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="text-sm font-medium text-gray-600 hover:text-gray-900"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? '登録中...' : '登録する'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PetCreate;
